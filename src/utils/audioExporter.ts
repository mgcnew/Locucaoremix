import lamejs from 'lamejs';
import { ChimeSoundType } from '../types';

let audioContextInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContextInstance || audioContextInstance.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContextInstance = new AudioCtx();
  }
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume();
  }
  return audioContextInstance;
}

/**
 * Cria o áudio do sino/chime característico de supermercado via síntese Web Audio API
 */
export function generateChimeBuffer(
  ctx: AudioContext,
  type: ChimeSoundType
): AudioBuffer | null {
  if (type === 'none') return null;

  const sampleRate = ctx.sampleRate;

  if (type === 'supermarket_bell') {
    // Sino clássico de supermercado: Ding-Dong (F5 = 698.46Hz, depois C5 = 523.25Hz)
    const duration = 1.4;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    const dingTime = 0.0;
    const dongTime = 0.45;

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Primeiro tom (Ding)
      if (t >= dingTime && t < 1.2) {
        const decay = Math.exp(-(t - dingTime) * 3.5);
        sample += 0.4 * Math.sin(2 * Math.PI * 698.46 * (t - dingTime)) * decay;
        sample += 0.15 * Math.sin(2 * Math.PI * 1396.9 * (t - dingTime)) * decay;
      }

      // Segundo tom (Dong)
      if (t >= dongTime) {
        const decay = Math.exp(-(t - dongTime) * 2.8);
        sample += 0.45 * Math.sin(2 * Math.PI * 523.25 * (t - dongTime)) * decay;
        sample += 0.2 * Math.sin(2 * Math.PI * 1046.5 * (t - dongTime)) * decay;
      }

      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'chime_tri') {
    // Atenção Tri-tom: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    const duration = 1.5;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    const tones = [
      { time: 0.0, freq: 523.25 },
      { time: 0.3, freq: 659.25 },
      { time: 0.6, freq: 783.99 },
    ];

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      tones.forEach((tone) => {
        if (t >= tone.time) {
          const dt = t - tone.time;
          const decay = Math.exp(-dt * 4.0);
          sample += 0.35 * Math.sin(2 * Math.PI * tone.freq * dt) * decay;
        }
      });
      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'alert_beep') {
    // Alerta de oferta urgente: duplo beep agudo
    const duration = 1.0;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      // Beep 1: 0 a 0.2s
      if (t >= 0.0 && t <= 0.2) {
        sample += 0.4 * Math.sin(2 * Math.PI * 880 * t);
      }
      // Beep 2: 0.3 a 0.5s
      if (t >= 0.3 && t <= 0.5) {
        sample += 0.45 * Math.sin(2 * Math.PI * 987.77 * (t - 0.3));
      }
      data[i] = sample;
    }
    return buffer;
  }

  if (type === 'party_fanfare') {
    // Fanfarra alegre de festa
    const duration = 1.6;
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
          sample += 0.25 * (Math.sin(2 * Math.PI * c.f1 * dt) + Math.sin(2 * Math.PI * c.f2 * dt)) * decay;
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
 * Converte base64 para ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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
  const voiceBuffer = await ctx.decodeAudioData(arrayBuf);

  if (chimeType === 'none') {
    return voiceBuffer;
  }

  const chimeBuffer = generateChimeBuffer(ctx, chimeType);
  if (!chimeBuffer) {
    return voiceBuffer;
  }

  // Combina Chime + Pausa de 0.3s + Voz
  const pauseDuration = 0.3;
  const totalDuration = chimeBuffer.duration + pauseDuration + voiceBuffer.duration;
  const sampleRate = ctx.sampleRate;

  const mixedBuffer = ctx.createBuffer(1, Math.floor(sampleRate * totalDuration), sampleRate);
  const channelData = mixedBuffer.getChannelData(0);

  // Copia Chime
  const chimeData = chimeBuffer.getChannelData(0);
  for (let i = 0; i < chimeData.length; i++) {
    channelData[i] = chimeData[i];
  }

  // Copia Voz com offset
  const voiceOffset = Math.floor(sampleRate * (chimeBuffer.duration + pauseDuration));
  const voiceData = voiceBuffer.getChannelData(0);
  for (let i = 0; i < voiceData.length; i++) {
    if (voiceOffset + i < channelData.length) {
      channelData[voiceOffset + i] = voiceData[i];
    }
  }

  return mixedBuffer;
}

/**
 * Converte AudioBuffer em arquivo WAV (Blob)
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audio format (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // Data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Codifica AudioBuffer diretamente para MP3 usando lamejs
 */
export function audioBufferToMp3Blob(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // 128 kbps mono comercial
  const mp3Data: Int8Array[] = [];

  const leftChannel = buffer.getChannelData(0);
  const sampleBlockSize = 1152;
  const length = leftChannel.length;
  const samples = new Int16Array(length);

  // Converte Float32 para Int16
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, leftChannel[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  for (let i = 0; i < length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data as any, { type: 'audio/mp3' });
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
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
