// Original background track for the NearSoul promo (no samples, no third-party audio): warm soul-pop at 96 BPM.
// node music.mjs out.wav seconds dropAt
import { writeFileSync } from 'node:fs';
const [, , out = 'music.wav', secArg = '29', dropArg = '2.5', bpmArg = '96', style = 'pop'] = process.argv;
const SR = 44100, DUR = +secArg, N = Math.floor(SR * DUR), DROP = +dropArg;
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = +bpmArg, BEAT = 60 / BPM, BAR = BEAT * 4;
// Shift the musical grid so the drop lands exactly on a downbeat.
const PHASE = DROP % BAR;
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
// Am – F – C – G (one chord per bar), voiced around middle C
// pop: Am – F – C – G · rnb: Am7 – Fmaj7 – Dm7 – Em7 (smoother, more sensual)
const CHORDS = style === 'rnb' ? [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 55, 59, 62]] : [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]];
const BASS = style === 'rnb' ? [45, 41, 38, 40] : [45, 41, 48, 43];
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const add = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };
const env = (t, a, d, s, rel, len) => (t < a ? t / a : t < a + d ? 1 - (1 - s) * ((t - a) / d) : t < len ? s : Math.max(0, s * (1 - (t - len) / rel)));

// 1) Pad: detuned saw-ish (sum of sines) through a slow low-pass that opens after the drop
for (let bar = 0; PHASE + (bar - 1) * BAR < DUR; bar++) {
  const ch = CHORDS[bar % 4], start = PHASE + (bar - 1) * BAR;
  for (const [vi, m] of ch.entries()) {
    for (const det of [-0.08, 0.08]) {
      const f = midi(m + det);
      const s0 = Math.floor(start * SR), len = BAR + 0.6;
      let lp = 0;
      for (let k = 0; k < len * SR; k++) {
        const t = k / SR, gt = start + t;
        let v = 0;
        for (let h = 1; h <= 6; h++) v += Math.sin(2 * Math.PI * f * h * gt) / h;
        const cutoff = gt < DROP ? 0.03 : 0.03 + Math.min(0.09, (gt - DROP) * 0.03);
        lp += cutoff * (v - lp);
        const e = env(t, 0.5, 0.3, 0.85, 0.6, BAR);
        const pan = (vi / 3 - 0.5) * 0.6 + det * 2;
        const a = 0.028 * e * lp;
        add(s0 + k, a * (1 - pan), a * (1 + pan));
      }
    }
  }
}
// 2) After the drop: sub bass, soft kick, snap, shaker, sparkly arpeggio
const beats = Math.ceil((DUR - PHASE) / BEAT) + 4;
for (let b = 0; b < beats; b++) {
  const t0 = PHASE - BAR + b * BEAT; if (t0 < DROP - 0.01 || t0 > DUR) continue;
  const bar = b >> 2, inBar = b % 4;
  // kick on 1 and 3
  if (inBar === 0 || inBar === 2) for (let k = 0; k < 0.35 * SR; k++) { const t = k / SR; const f = 50 + 90 * Math.exp(-t * 30); const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) * 0.32; add(Math.floor(t0 * SR) + k, v, v); }
  // snap/clap on 2 and 4
  if (inBar === 1 || inBar === 3) for (let k = 0; k < 0.18 * SR; k++) { const t = k / SR; const v = rnd() * Math.exp(-t * 28) * 0.11; add(Math.floor(t0 * SR) + k, v * 0.9, v); }
  // shaker on off-beats
  for (const off of [0.5]) { const s0 = Math.floor((t0 + off * BEAT) * SR); for (let k = 0; k < 0.06 * SR; k++) { const v = rnd() * Math.exp(-(k / SR) * 60) * 0.035; add(s0 + k, v, v * 0.7); } }
  // bass: root on every beat, short and round
  { const f = midi(BASS[bar % 4]); const s0 = Math.floor(t0 * SR); for (let k = 0; k < BEAT * 0.9 * SR; k++) { const t = k / SR; const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env(t, 0.01, 0.15, 0.6, 0.08, BEAT * 0.75) * 0.13; add(s0 + k, v, v); } }
  // arpeggio: 8th notes, bell-like
  for (let e8 = 0; e8 < 2; e8++) {
    const ch = CHORDS[bar % 4]; const m = ch[(b * 2 + e8) % 4] + 12; const f = midi(m);
    const s0 = Math.floor((t0 + e8 * BEAT / 2) * SR); const pan = e8 ? 0.35 : -0.35;
    for (let k = 0; k < 0.5 * SR; k++) { const t = k / SR; const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 3.01 * t) * Math.exp(-t * 12)) * Math.exp(-t * 6) * 0.045; add(s0 + k, v * (1 - pan), v * (1 + pan)); }
  }
}
// 3) Soft riser into the drop + "sparkle" hit at the drop
for (let k = 0; k < 1.2 * SR; k++) { const t = k / SR, gi = Math.floor((DROP - 1.2) * SR) + k; const v = rnd() * (t / 1.2) ** 2 * 0.05; add(gi, v, v); }
for (let k = 0; k < 1.5 * SR; k++) { const t = k / SR; const v = (Math.sin(2 * Math.PI * 1760 * t) + Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-t * 4) * 0.025; add(Math.floor(DROP * SR) + k, v, v); }
// 4) Simple stereo reverb (comb + allpass), wet 22%
function reverb(x, delays) {
  const y = new Float32Array(x.length);
  for (const d of delays) { const buf = new Float32Array(d); let i = 0; for (let n = 0; n < x.length; n++) { const o = buf[i]; buf[i] = x[n] + o * 0.78; i = (i + 1) % d; y[n] += o / delays.length; } }
  const ap = new Float32Array(556); let j = 0; for (let n = 0; n < y.length; n++) { const o = ap[j]; const v = y[n] + o * 0.5; ap[j] = v; y[n] = o - v * 0.5; j = (j + 1) % 556; }
  return y;
}
const wl = reverb(L, [1557, 1617, 1491, 1422]), wr = reverb(R, [1277, 1356, 1188, 1116]);
// 5) Mix, fades, soft limiter
const out16 = Buffer.alloc(44 + N * 4);
let peak = 0; for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(L[n] + 0.22 * wl[n]), Math.abs(R[n] + 0.22 * wr[n]));
const gain = 0.85 / Math.max(peak, 1e-6);
for (let n = 0; n < N; n++) {
  const t = n / SR; const fade = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 2.0);
  const sl = Math.tanh((L[n] + 0.22 * wl[n]) * gain * 1.1) * fade, sr = Math.tanh((R[n] + 0.22 * wr[n]) * gain * 1.1) * fade;
  out16.writeInt16LE(Math.round(sl * 32000), 44 + n * 4); out16.writeInt16LE(Math.round(sr * 32000), 46 + n * 4);
}
out16.write('RIFF', 0); out16.writeUInt32LE(36 + N * 4, 4); out16.write('WAVEfmt ', 8); out16.writeUInt32LE(16, 16); out16.writeUInt16LE(1, 20); out16.writeUInt16LE(2, 22);
out16.writeUInt32LE(SR, 24); out16.writeUInt32LE(SR * 4, 28); out16.writeUInt16LE(4, 32); out16.writeUInt16LE(16, 34); out16.write('data', 36); out16.writeUInt32LE(N * 4, 40);
writeFileSync(out, out16);
console.log('ok', DUR, 's');
