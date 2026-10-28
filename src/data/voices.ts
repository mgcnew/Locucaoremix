import { VoiceOption } from '../types';

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Fenrir',
    name: 'Fenrir (Voz Grave & Varejão)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Fenrir',
    description: 'Timbre encorpado, imponente e comercial. Perfeito para açougue, ofertas de impacto e carro de som.',
    tag: 'Recomendado Açougue',
  },
  {
    id: 'Puck',
    name: 'Puck (Voz Jovem & Dinâmica)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Puck',
    description: 'Ritmo acelerado, entusiasmado e vendedor. Ideal para supermercado movimentado e ofertas relâmpago.',
    tag: 'Recomendado Supermercado',
  },
  {
    id: 'Kore',
    name: 'Kore (Voz Calorosa & Alegre)',
    gender: 'feminino',
    provider: 'gemini',
    voiceName: 'Kore',
    description: 'Tom acolhedor, vibrante e comunicativo. Excelente para datas comemorativas, ofertas da semana e família.',
    tag: 'Voz Feminina Top',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Voz Clara & Moderna)',
    gender: 'feminino',
    provider: 'gemini',
    voiceName: 'Zephyr',
    description: 'Dicção cristalina, elegante e comercial. Ótima para hortifrúti, empórios e anúncios institucionais.',
    tag: 'Clara & Elegante',
  },
  {
    id: 'Charon',
    name: 'Charon (Voz Sóbria & Firme)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Charon',
    description: 'Tom institucional, maduro e seguro. Recomendado para festivais de carnes nobres e atacados.',
    tag: 'Institucional',
  },
];
