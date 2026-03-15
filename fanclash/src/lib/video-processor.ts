import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export async function extractClip(
  videoFile: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();

  if (onProgress) {
    ff.on('progress', ({ progress }) => {
      onProgress(Math.min(Math.round(progress * 100), 100));
    });
  }

  // Write input file
  await ff.writeFile('input.mp4', await fetchFile(videoFile));

  // Extract clip with re-encoding for accuracy
  const duration = endTime - startTime;
  await ff.exec([
    '-ss', startTime.toString(),
    '-i', 'input.mp4',
    '-t', duration.toString(),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  // Read output
  const data = await ff.readFile('output.mp4');
  // Copy into a fresh ArrayBuffer to avoid SharedArrayBuffer type issues
  const uint8 = data as Uint8Array;
  const copy = new Uint8Array(uint8.length);
  copy.set(uint8);
  const blob = new Blob([copy.buffer as ArrayBuffer], { type: 'video/mp4' });

  // Cleanup
  await ff.deleteFile('input.mp4');
  await ff.deleteFile('output.mp4');

  return blob;
}
