// Ember Pact — all sound is synthesized with WebAudio. No audio files, no network.
let ctx = null;
let muted = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, when = 0, low = 400) {
  const ac = audioCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = low;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  draw() { noise(0.12, 0.10, 0, 2400); },
  playCard() { noise(0.18, 0.16, 0, 1800); tone(392, 0.12, 'sine', 0.10, 0.02); },
  hit() { tone(140, 0.22, 'sawtooth', 0.22, 0, 55); noise(0.15, 0.18, 0, 700); },
  block() { tone(220, 0.12, 'square', 0.10, 0, 180); },
  heal() { tone(523, 0.14, 'sine', 0.12); tone(784, 0.2, 'sine', 0.10, 0.09); },
  burn() { noise(0.3, 0.14, 0, 900); tone(180, 0.3, 'sawtooth', 0.08, 0, 90); },
  turn() { tone(440, 0.09, 'triangle', 0.10); tone(587, 0.12, 'triangle', 0.10, 0.08); },
  draft() { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.08); tone(784, 0.16, 'triangle', 0.12, 0.16); },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.13));
    noise(0.5, 0.06, 0.1, 3000);
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.13, i * 0.17));
  },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}
export function isMuted() { return muted; }
