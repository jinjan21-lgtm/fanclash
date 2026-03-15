let audioContext: AudioContext | null = null;

export function playSound(url?: string) {
  if (!url) return;
  try {
    if (!audioContext) audioContext = new AudioContext();
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {
    // Silent fail — OBS browser source may block audio
  }
}

/** Play a beep using Web Audio API (no sound file needed) */
export function playBeep(type: 'default' | 'fanfare' = 'default') {
  try {
    if (!audioContext) audioContext = new AudioContext();
    const ctx = audioContext;

    if (type === 'fanfare') {
      // Short fanfare: three ascending tones
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } else {
      // Default: single notification beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Silent fail — OBS browser source may block audio
  }
}
