export type StoreType = 'supermercado' | 'acougue' | 'mercearia' | 'atacarejo';

export type LocutionTone =
  | 'varejao_energico'
  | 'acougue_especial'
  | 'amigavel_acolhedor'
  | 'festa_aniversario'
  | 'oferta_relampago'
  | 'final_de_semana'
  | 'fechamento_loja';

export type TargetDuration = 'curta' | 'media' | 'longa' | '15s' | '30s' | '45s' | '60s';

export interface ProductItem {
  id: string;
  name: string;
  regularPrice?: string;
  promoPrice: string;
  unit: string;
  details?: string;
  limit?: string;
}

export interface StoreProfile {
  name: string;
  type: StoreType;
  slogan: string;
  location: string;
  paymentMethods: string;
  openingGreeting: string;
  closingPhrase: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'masculino' | 'feminino';
  provider: 'gemini' | 'browser';
  voiceName: string; // 'Fenrir', 'Puck', 'Charon', 'Kore', 'Zephyr'
  description: string;
  tag: string;
}

export type ChimeSoundType = 'none' | 'supermarket_bell' | 'chime_tri' | 'alert_beep' | 'party_fanfare';

export interface SavedLocution {
  id: string;
  createdAt: string;
  storeName: string;
  headline: string;
  script: string;
  tone: LocutionTone;
  targetDuration: TargetDuration;
  voiceName: string;
  voiceGender: 'masculino' | 'feminino';
  products: ProductItem[];
  chimeSound: ChimeSoundType;
  isFavorite: boolean;
  audioBase64?: string;
  audioMimeType?: string;
  tags?: string[];
}

export interface SeasonalTemplate {
  id: string;
  title: string;
  category: 'acougue' | 'supermercado' | 'sazonal' | 'datas_comemorativas' | 'urgencia';
  icon: string;
  badge: string;
  tone: LocutionTone;
  suggestedDuration: TargetDuration;
  description: string;
  sampleStoreType: StoreType;
  products: Array<{
    name: string;
    regularPrice?: string;
    promoPrice: string;
    unit: string;
    details?: string;
  }>;
  baseScript: string;
  tags: string[];
}
