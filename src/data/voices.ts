import { VoiceOption } from '../types';

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Fenrir',
    name: 'Fenrir (Voz Grave & Varejão)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Fenrir',
    description: 'Timbre encorpado, imponente e comercial. Perfeito para açougue, ofertas de impacto e carro de som.',
    tag: 'Clássico Açougue',
    styleInstruction:
      'Locutor comercial de varejo e açougue brasileiro com voz grave, firme, encorpada e muito confiante.',
  },
  {
    id: 'Puck',
    name: 'Puck (Voz Jovem & Dinâmica)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Puck',
    description: 'Ritmo acelerado, entusiasmado e vendedor. Ideal para supermercado movimentado e ofertas relâmpago.',
    tag: 'Varejo Ágil',
    styleInstruction:
      'Locutor comercial brasileiro jovem, ritmo ágil, vibrante, muito entusiasmado e vendedor.',
  },
  {
    id: 'Kore',
    name: 'Kore (Voz Calorosa & Alegre)',
    gender: 'feminino',
    provider: 'gemini',
    voiceName: 'Kore',
    description: 'Tom acolhedor, vibrante e comunicativo. Excelente para datas comemorativas, ofertas da semana e família.',
    tag: 'Voz Feminina',
    styleInstruction:
      'Locutora comercial brasileira calorosa, simpática, alegre e muito comunicativa.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Voz Clara & Moderna)',
    gender: 'feminino',
    provider: 'gemini',
    voiceName: 'Zephyr',
    description: 'Dicção cristalina, elegante e comercial. Ótima para hortifrúti, empórios e anúncios institucionais.',
    tag: 'Clara & Elegante',
    styleInstruction:
      'Locutora brasileira de voz clara, moderna, dicção impecável e tom comercial confiante.',
  },
  {
    id: 'RadioFM_M',
    name: 'Léo FM (Locutor Rádio FM Comercial)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Orus',
    description: 'Estilo apresentador de rádio FM comercial: sorriso na voz, alto astral e cadência autêntica de emissora.',
    tag: 'Rádio FM',
    styleInstruction:
      'Apresentador de rádio FM comercial brasileira no ar, com sorriso na voz, alto astral, cadência envolvente de emissora de rádio e muita simpatia.',
  },
  {
    id: 'RadioFM_F',
    name: 'Bia FM (Locutora Rádio FM Comercial)',
    gender: 'feminino',
    provider: 'gemini',
    voiceName: 'Aoede',
    description: 'Locutora estilo programa de rádio FM, super carismática, expressiva e próxima dos ouvintes da loja.',
    tag: 'Rádio FM',
    styleInstruction:
      'Locutora apresentadora de rádio FM comercial brasileira, super carismática, vibrante, com sorriso na voz e ritmo de programa ao vivo.',
  },
  {
    id: 'Sertanejo_M',
    name: 'Zé Renato (Locutor Popular Sertanejo & Bairro)',
    gender: 'masculino',
    provider: 'gemini',
    voiceName: 'Charon',
    description: 'Locutor popular carismático estilo rádio sertaneja e comércio de bairro, falando de amigo para amigo.',
    tag: 'Sertanejo & Bairro',
    styleInstruction:
      'Locutor popular brasileiro estilo rádio sertaneja e comércio de bairro, voz calorosa, carismática, acolhedora e bem próxima do povo.',
  },
  {
    id: 'Dupla_Radio',
    name: 'Dupla FM (Locutor & Locutora no Ar)',
    gender: 'dupla',
    provider: 'gemini',
    voiceName: 'DUPLA_FM',
    description: 'Dois locutores (masculino e feminino) interagindo em clima de programa de rádio ao vivo.',
    tag: 'Dupla de Rádio',
    isMultiSpeaker: true,
    styleInstruction:
      'Dupla de apresentadores de rádio FM brasileira conversando com entusiasmo, dinamismo e alegria sobre as ofertas.',
  },
];
