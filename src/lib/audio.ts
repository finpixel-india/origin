/**
 * Synthesised, very subtle "paper turn" rustle using the Web Audio API.
 * No external asset required. Kept intentionally quiet and soft.
 */
export class PaperAudio {
  private ctx: AudioContext | null = null;

  ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** intensity 0..1 controls brightness + volume. */
  rustle(intensity = 0.5): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const i = Math.max(0.1, Math.min(1, intensity));
    const dur = 0.16 + i * 0.12;

    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let f = 0; f < frames; f++) {
      // decaying noise with a little crackle texture
      const env = 1 - f / frames;
      data[f] = (Math.random() * 2 - 1) * env * (0.6 + Math.random() * 0.4);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200 + i * 1400;
    bp.Q.value = 0.8;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 700;

    const gain = ctx.createGain();
    const peak = 0.018 + i * 0.03;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  }
}

export const paperAudio = new PaperAudio();
