"use client";

let context: AudioContext | null = null;
let lastPlayed = 0;

/**
 * Short two-note "ding" for a new chat message, synthesised with Web Audio (no audio file to load).
 * Silent until the visitor has interacted with the page (browser autoplay rules) and at most once per second.
 */
export function playMessageSound() {
  if (typeof window === "undefined" || Date.now() - lastPlayed < 1000) return;

  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    [880, 1320].forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.11);
      oscillator.connect(gain);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + 0.45);
    });

    lastPlayed = Date.now();
  } catch {
    // No audio on this device — the badge is enough.
  }
}
