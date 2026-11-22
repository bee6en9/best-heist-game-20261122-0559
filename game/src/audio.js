// Sound, Web Audio only — no files. Soft footsteps, a camera hum, an alarm beep that
// rises as the meter fills, a loot chime and a getaway fanfare. Everything is guarded:
// audio only starts after the first user gesture, and a missing AudioContext is fine.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let humNodes = null;
  let lastStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }

  function tone(freq, duration, type, volume, when = 0, slideTo = null) {
    const audio = ensure();
    if (!audio || muted) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audio.currentTime + when);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + when + duration);
      gain.gain.setValueAtTime(0.0001, audio.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + when + duration);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + when);
      osc.stop(audio.currentTime + when + duration + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    /** Call from a user gesture (start key / click) so the browser unlocks audio. */
    unlock() {
      const audio = ensure();
      if (audio && audio.state === 'suspended') {
        audio.resume().catch(() => {});
      }
    },

    toggleMute() {
      muted = !muted;
      if (muted) this.stopHum();
      return muted;
    },
    get isMuted() {
      return muted;
    },

    step() {
      const now = performance.now();
      if (now - lastStep < 340) return;
      lastStep = now;
      tone(140 + Math.random() * 40, 0.07, 'sine', 0.05);
    },

    beep(alarmValue) {
      // The beep climbs in pitch as the meter fills: tension you can hear.
      tone(420 + alarmValue * 6, 0.12, 'square', 0.045);
    },

    chime() {
      tone(523.25, 0.25, 'sine', 0.12);
      tone(659.25, 0.3, 'sine', 0.12, 0.09);
      tone(783.99, 0.5, 'sine', 0.12, 0.18);
    },

    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => tone(freq, 0.35, 'triangle', 0.12, i * 0.13));
    },

    caught() {
      tone(220, 0.5, 'sawtooth', 0.09, 0, 110);
    },

    smoke() {
      tone(300, 0.3, 'sine', 0.07, 0, 90);
    },

    jam() {
      tone(880, 0.08, 'square', 0.05);
      tone(880, 0.08, 'square', 0.05, 0.12);
    },

    startHum() {
      const audio = ensure();
      if (!audio || muted || humNodes) return;
      try {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = 52;
        gain.gain.value = 0.018;
        osc.connect(gain).connect(audio.destination);
        osc.start();
        humNodes = { osc, gain };
      } catch {
        humNodes = null;
      }
    },

    stopHum() {
      if (!humNodes) return;
      try {
        humNodes.osc.stop();
      } catch {
        // Already stopped.
      }
      humNodes = null;
    },
  };
}
