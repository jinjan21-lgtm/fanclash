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
