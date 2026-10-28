import { Mp3Encoder } from '@breezystack/lamejs';
import { ChimeSoundType } from '../types';

let audioContextInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContextInstance || audioContextInstance.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextInstance = new AudioCtx();
  }
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(() => {});
  }
  return audioContextInstance;
}

/**
 * Cria o áudio do sino/chime característico de supermercado via síntese Web Audio API
 */
export function generateChimeBuffer(
  ctx: AudioContext,
  type: ChimeSoundType,
  targetSampleRate?: number
): AudioBuffer | null {
  if (type === 'none') return null;

  const sampleRate = targetSampleRate || ctx.sampleRate || 24000;

  if (type === 'supermarket_bell') {
    const duration = 1.35;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    const dingTime = 0.0;
    const dongTime = 0.42;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (t >= dingTime && t < 1.15) {
        const decay = Math.exp(-(t - dingTime) * 3.5);
        sample += 0.38 * Math.sin(2 * Math.PI * 698.46 * (t - dingTime)) * decay;
        sample += 0.14 * Math.sin(2 * Math.PI * 1396.9 * (t - dingTime)) * decay;
      }

      if (t >= dongTime) {
        const decay = Math.exp(-(t - dongTime) * 2.8);
        sample += 0.42 * Math.sin(2 * Math.PI * 523.25 * (t - dongTime)) * decay;
        sample += 0.18 * Math.sin(2 * Math.PI * 1046.5 * (t - dongTime)) * decay;
      }

      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'chime_tri') {
    const duration = 1.4;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    const tones = [
      { time: 0.0, freq: 523.25 },
      { time: 0.28, freq: 659.25 },
      { time: 0.56, freq: 783.99 },
    ];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      tones.forEach((tone) => {
        if (t >= tone.time) {
          const dt = t - tone.time;
          const decay = Math.exp(-dt * 4.0);
          sample += 0.34 * Math.sin(2 * Math.PI * tone.freq * dt) * decay;
        }
      });
      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'alert_beep') {
    const duration = 0.9;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      if (t >= 0.0 && t <= 0.18) {
        sample += 0.38 * Math.sin(2 * Math.PI * 880 * t);
      }
      if (t >= 0.28 && t <= 0.48) {
        sample += 0.42 * Math.sin(2 * Math.PI * 987.77 * (t - 0.28));
      }
      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'party_fanfare') {
    const duration = 1.5;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    const chords = [
      { t: 0.0, f1: 523.25, f2: 659.25 },
      { t: 0.25, f1: 659.25, f2: 783.99 },
      { t: 0.5, f1: 783.99, f2: 1046.5 },
    ];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      chords.forEach((c) => {
        if (t >= c.t) {
          const dt = t - c.t;
          const decay = Math.exp(-dt * 3.2);
          sample +=
            0.24 *
            (Math.sin(2 * Math.PI * c.f1 * dt) + Math.sin(2 * Math.PI * c.f2 * dt)) *
            decay;
        }
      });
      data[i] = sample;
    }
    return buffer;
  }

  return null;
}

/**
 * Toca o sino de prévia
 */
export function playChimePreview(type: ChimeSoundType) {
  if (type === 'none') return;
  const ctx = getAudioContext();
  const chimeBuf = generateChimeBuffer(ctx, type);
  if (!chimeBuf) return;

  const source = ctx.createBufferSource();
  source.buffer = chimeBuf;
  source.connect(ctx.destination);
  source.start();
}

/**
 * Converte base64 para ArrayBuffer de forma segura
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanBase64 = base64.replace(/^data:audio\/\w+;base64,/, '').trim();
  const binaryString = window.atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Parser direto de WAV RIFF (16-bit PCM) para garantir leitura mesmo com metadados C2PA no final do arquivo
 */
function parsePcmWavToAudioBuffer(ctx: AudioContext, arrayBuffer: ArrayBuffer): AudioBuffer {
  const view = new DataView(arrayBuffer);
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataByteLength = arrayBuffer.byteLength - 44;

  // Verifica cabeçalho "RIFF"
  if (view.byteLength > 44 && view.getUint32(0, false) === 0x52494646) {
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
      const chunkId = view.getUint32(offset, false);
      const chunkSize = view.getUint32(offset + 4, true);

      // "fmt "
      if (chunkId === 0x666d7420 && offset + 24 <= view.byteLength) {
        numChannels = view.getUint16(offset + 10, true) || 1;
        sampleRate = view.getUint32(offset + 12, true) || 24000;
        bitsPerSample = view.getUint16(offset + 22, true) || 16;
      }
      // "data"
      else if (chunkId === 0x64617461) {
        dataOffset = offset + 8;
        dataByteLength = Math.min(chunkSize, view.byteLength - dataOffset);
        break;
      }

      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }

  const bytesPerSample = Math.max(2, Math.floor(bitsPerSample / 8));
  const totalSamples = Math.floor(dataByteLength / (bytesPerSample * numChannels));
  const audioBuffer = ctx.createBuffer(1, Math.max(1, totalSamples), sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  let ptr = dataOffset;
  for (let i = 0; i < totalSamples; i++) {
    if (ptr + 2 <= view.byteLength) {
      const int16 = view.getInt16(ptr, true);
      channelData[i] = int16 / 32768.0;
    }
    ptr += bytesPerSample * numChannels;
  }

  return audioBuffer;
}

/**
 * Decodifica áudio (WAV) retornado pelo Gemini e opcionalmente adiciona a vinheta de sino antes
 */
export async function createMixedAudioBuffer(
  base64Audio: string,
  chimeType: ChimeSoundType = 'supermarket_bell'
): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuf = base64ToArrayBuffer(base64Audio);

  let voiceBuffer: AudioBuffer;
  try {
    // Clona o buffer pois decodeAudioData pode destacá-lo (detach)
    voiceBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
  } catch {
    voiceBuffer = parsePcmWavToAudioBuffer(ctx, arrayBuf);
  }

  if (chimeType === 'none') {
    return voiceBuffer;
  }

  const sampleRate = voiceBuffer.sampleRate || 24000;
  const chimeBuffer = generateChimeBuffer(ctx, chimeType, sampleRate);
  if (!chimeBuffer) {
    return voiceBuffer;
  }

  const pauseDuration = 0.25;
  const totalSamples =
    chimeBuffer.length + Math.floor(sampleRate * pauseDuration) + voiceBuffer.length;

  const mixedBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const channelData = mixedBuffer.getChannelData(0);

  const chimeData = chimeBuffer.getChannelData(0);
  channelData.set(chimeData, 0);

  const voiceOffset = chimeBuffer.length + Math.floor(sampleRate * pauseDuration);
  const voiceData = voiceBuffer.getChannelData(0);
  channelData.set(voiceData, voiceOffset);

  return mixedBuffer;
}

/**
 * Converte AudioBuffer em arquivo WAV (Blob)
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = 1;
  const length = buffer.length * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let offset = 0; offset < buffer.length; offset++) {
    let sample = Math.max(-1, Math.min(1, channel[offset]));
    sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
    out.setInt16(pos, sample, true);
    pos += 2;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Codifica AudioBuffer diretamente para MP3 usando @breezystack/lamejs (compatível com Vite ESM)
 */
export function audioBufferToMp3Blob(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate || 24000;
  const mp3encoder = new Mp3Encoder(1, sampleRate, 128);
  const mp3Data: Uint8Array[] = [];

  const leftChannel = buffer.getChannelData(0);
  const sampleBlockSize = 1152;
  const length = leftChannel.length;
  const samples = new Int16Array(length);

  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, leftChannel[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  for (let i = 0; i < length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf && endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  return new Blob(mp3Data as BlobPart[], { type: 'audio/mpeg' });
}

/**
 * Baixa arquivo no navegador do cliente
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 500);
}

/**
 * Compartilha o MP3 pelo menu nativo do aparelho (WhatsApp, etc.).
 * Retorna 'shared', 'cancelled' ou 'downloaded' (quando o navegador não compartilha arquivos).
 */
export async function shareAudioFile(
  blob: Blob,
  filename: string,
  title: string
): Promise<'shared' | 'cancelled' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'audio/mpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      throw err;
    }
  }
  triggerFileDownload(blob, filename);
  return 'downloaded';
}
