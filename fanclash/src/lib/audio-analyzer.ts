export interface AudioHighlight {
  startTime: number;
  endTime: number;
  peakVolume: number;
  reason: string;
}

export async function analyzeAudio(
  file: File,
  onProgress?: (progress: number) => void
): Promise<AudioHighlight[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(10);

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  onProgress?.(30);

  // Calculate RMS volume for each 1-second window
  const windowSize = sampleRate;
  const volumes: number[] = [];

  for (let i = 0; i < channelData.length; i += windowSize) {
    const end = Math.min(i + windowSize, channelData.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    volumes.push(rms);
  }

  onProgress?.(60);

  // Find average and threshold
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const threshold = avgVolume * 2.0;

  // Find highlight regions (consecutive loud sections)
  const highlights: AudioHighlight[] = [];
  let inPeak = false;
  let peakStart = 0;
  let maxVol = 0;

  for (let i = 0; i < volumes.length; i++) {
    if (volumes[i] > threshold) {
      if (!inPeak) {
        peakStart = Math.max(0, i - 3);
        inPeak = true;
        maxVol = volumes[i];
      }
      maxVol = Math.max(maxVol, volumes[i]);
    } else if (inPeak) {
      const peakEnd = Math.min(i + 5, volumes.length);

      if (peakEnd - peakStart >= 5) {
        let reason = '볼륨 피크 감지';
        if (maxVol > avgVolume * 4) reason = '큰 리액션 감지';
        else if (maxVol > avgVolume * 3) reason = '흥미로운 구간';

        // Merge with previous if close (within 10 seconds)
        const lastHighlight = highlights[highlights.length - 1];
        if (lastHighlight && peakStart - lastHighlight.endTime < 10) {
          lastHighlight.endTime = peakEnd;
          lastHighlight.peakVolume = Math.max(lastHighlight.peakVolume, maxVol);
        } else {
          highlights.push({
            startTime: peakStart,
            endTime: Math.min(peakEnd, Math.floor(duration)),
            peakVolume: maxVol,
            reason,
          });
        }
      }

      inPeak = false;
      maxVol = 0;
    }
  }

  onProgress?.(90);

  // Cap at max 10 highlights, sorted by peak volume
  highlights.sort((a, b) => b.peakVolume - a.peakVolume);
  const topHighlights = highlights.slice(0, 10);
  topHighlights.sort((a, b) => a.startTime - b.startTime);

  onProgress?.(100);

  await audioContext.close();
  return topHighlights;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
