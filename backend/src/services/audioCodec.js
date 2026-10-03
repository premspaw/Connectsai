// G.711 A-law (PCMA) <-> Linear PCM 16-bit codec and resampler.
// VoiceLink telephony uses G.711 A-law @ 8000 Hz (8-bit samples).
// Gemini Live API uses 16-bit PCM @ 16000 Hz / 24000 Hz.

// Standard ITU-T G.711 A-law decode lookup table (8-bit A-law -> 16-bit signed PCM)
const ALAW_DECODE_TABLE = new Int16Array(256);

(function initAlawTable() {
  for (let i = 0; i < 256; i++) {
    let input = i ^ 0x55;
    let mantissa = (input & 0x0f) << 4;
    let segment = (input & 0x70) >> 4;
    let value = 0;

    if (segment === 0) {
      value = mantissa + 8;
    } else {
      value = (mantissa + 0x108) << (segment - 1);
    }
    ALAW_DECODE_TABLE[i] = (input & 0x80) !== 0 ? value : -value;
  }
})();

// Fast A-law encode table (16-bit PCM sample -> 8-bit A-law)
function pcmSampleToAlaw(sample) {
  let sign = (sample < 0) ? 0 : 0x80;
  if (sign === 0) sample = -sample;
  if (sample > 32767) sample = 32767;

  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }

  let mantissa = (sample >> ((exponent === 0) ? 4 : (exponent + 3))) & 0x0f;
  return (sign | (exponent << 4) | mantissa) ^ 0x55;
}

/**
 * Decodes G.711 A-law 8kHz buffer into 16-bit Linear PCM (Int16Array or Buffer).
 * @param {Buffer|Uint8Array} alawBuf
 * @returns {Buffer} 16-bit PCM buffer (8kHz)
 */
function alawToPcm(alawBuf) {
  const pcmBuf = Buffer.alloc(alawBuf.length * 2);
  for (let i = 0; i < alawBuf.length; i++) {
    const val = ALAW_DECODE_TABLE[alawBuf[i]];
    pcmBuf.writeInt16LE(val, i * 2);
  }
  return pcmBuf;
}

/**
 * Encodes 16-bit Linear PCM buffer into G.711 A-law 8kHz.
 * @param {Buffer} pcmBuf (16-bit LE PCM)
 * @returns {Buffer} G.711 A-law buffer
 */
function pcmToAlaw(pcmBuf) {
  const numSamples = Math.floor(pcmBuf.length / 2);
  const alawBuf = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuf.readInt16LE(i * 2);
    alawBuf[i] = pcmSampleToAlaw(sample);
  }
  return alawBuf;
}

/**
 * Simple linear resampler for 16-bit PCM.
 * @param {Buffer} inputBuffer 16-bit PCM buffer
 * @param {number} fromRate e.g. 8000 or 24000
 * @param {number} toRate e.g. 16000 or 8000
 * @returns {Buffer} Resampled 16-bit PCM buffer
 */
function resamplePcm(inputBuffer, fromRate, toRate) {
  if (fromRate === toRate) return inputBuffer;
  const inSamples = Math.floor(inputBuffer.length / 2);
  const ratio = toRate / fromRate;
  const outSamples = Math.floor(inSamples * ratio);
  const outBuf = Buffer.alloc(outSamples * 2);

  for (let i = 0; i < outSamples; i++) {
    const srcIdx = i / ratio;
    const idx0 = Math.floor(srcIdx);
    const idx1 = Math.min(idx0 + 1, inSamples - 1);
    const frac = srcIdx - idx0;

    const s0 = inputBuffer.readInt16LE(idx0 * 2);
    const s1 = inputBuffer.readInt16LE(idx1 * 2);
    const interpolated = Math.round(s0 + frac * (s1 - s0));
    outBuf.writeInt16LE(Math.max(-32768, Math.min(32767, interpolated)), i * 2);
  }

  return outBuf;
}

module.exports = {
  alawToPcm,
  pcmToAlaw,
  resamplePcm,
};
