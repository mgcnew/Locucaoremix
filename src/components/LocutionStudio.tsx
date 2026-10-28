import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StoreProfile,
  LocutionTone,
  TargetDuration,
  ProductItem,
  ChimeSoundType,
  SavedLocution,
  SeasonalTemplate,
  ScriptMode,
  RadioFormat,
} from '../types';
import { GEMINI_VOICES } from '../data/voices';
import { SUGGESTED_PRODUCTS } from '../data/popularProducts';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  Check,
  Copy,
  Download,
  Mic,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  Share2,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  Users,
  Volume2,
  Wand2,
} from 'lucide-react';
import {
  createMixedAudioBuffer,
  audioBufferToMp3Blob,
  audioBufferToWavBlob,
  triggerFileDownload,
  playChimePreview,
  shareAudioFile,
} from '../utils/audioExporter';
import { Button, IconButton, Label, Spinner, formatSeconds, slugify } from './ui';
import { useToast } from './Toast';
import { AiStatus, STUDIO_STEPS, StudioStep } from './Sidebar';

interface Props {
  storeProfile: StoreProfile;
  onUpdateStoreProfile: (updated: StoreProfile) => void;
  onOpenStoreModal: () => void;
  onSaveLocution: (locution: SavedLocution) => void;
  activeTemplateToLoad?: SeasonalTemplate | null;
  onClearTemplateToLoad?: () => void;
  step: StudioStep;
  setStep: (step: StudioStep) => void;
  onProgress: (completed: Record<StudioStep, boolean>) => void;
  aiStatus: AiStatus;
}

const TONES: { id: LocutionTone; label: string; hint: string }[] = [
  { id: 'varejao_energico', label: 'Varejão animado', hint: 'Rápido, alto e empolgado' },
  { id: 'acougue_especial', label: 'Açougue e churrasco', hint: 'Apetitoso, valoriza os cortes' },
  { id: 'amigavel_acolhedor', label: 'Amigável', hint: 'Caloroso, de vizinhança' },
  { id: 'oferta_relampago', label: 'Oferta relâmpago', hint: 'Urgente, só enquanto durar' },
  { id: 'final_de_semana', label: 'Fim de semana', hint: 'Sextou, churrasco e família' },
  { id: 'festa_aniversario', label: 'Festa e aniversário', hint: 'Clima de comemoração' },
  { id: 'fechamento_loja', label: 'Fechamento da loja', hint: 'Última chamada do dia' },
];

const SCRIPT_MODES: { id: ScriptMode; label: string; hint: string }[] = [
  {
    id: 'comercial',
    label: 'Comercial tradicional',
    hint: 'Chamada direta das ofertas para o som da loja',
  },
  {
    id: 'radio',
    label: 'Modo Rádio Interna',
    hint: 'Interrompe a programação e volta para a rádio no final',
  },
];

const RADIO_FORMATS: { id: RadioFormat; label: string; hint: string }[] = [
  {
    id: 'flash_interrupcao',
    label: 'Interrupção da programação',
    hint: '“E paramos a nossa programação…” com volta musical no final',
  },
  {
    id: 'dupla_locutores',
    label: 'Dupla de locutores',
    hint: 'Locutor e locutora conversando estilo programa de rádio ao vivo',
  },
];

const DURATIONS = [
  { id: 'curta', label: 'Curta', seconds: 15 },
  { id: 'media', label: 'Média', seconds: 30 },
  { id: 'longa', label: 'Longa', seconds: 60 },
] as const;

const normalizeDuration = (d: TargetDuration): 'curta' | 'media' | 'longa' =>
  d === '15s' || d === 'curta' ? 'curta' : d === '60s' || d === 'longa' ? 'longa' : 'media';

const CHIMES: { id: ChimeSoundType; label: string }[] = [
  { id: 'supermarket_bell', label: 'Ding-dong de supermercado' },
  { id: 'radio_jingle', label: 'Vinheta Rádio FM (Sintonia)' },
  { id: 'chime_tri', label: 'Sino tri-tom' },
  { id: 'alert_beep', label: 'Alerta de oferta relâmpago' },
  { id: 'party_fanfare', label: 'Vinheta de festa' },
  { id: 'none', label: 'Sem sino' },
];

const QUICK_TWEAKS = [
  { label: 'Mais curto', prompt: 'Deixe o texto mais curto e direto' },
  { label: 'Mais energia', prompt: 'Coloque muito mais energia de locutor de varejão' },
  { label: 'Destacar as carnes', prompt: 'Destaque a maciez e frescor das carnes para churrasco' },
  { label: 'Incluir Pix e cartão', prompt: 'Inclua no final que aceitamos Pix e cartões' },
  {
    label: 'Estilo Rádio FM',
    prompt: 'Transforme em estilo locutor de rádio interrompendo a programação e voltando para a rádio no final',
  },
];

const UNITS = [
  { id: 'kg', label: 'kg' },
  { id: 'un', label: 'unid.' },
  { id: 'pacote', label: 'pacote' },
  { id: 'bandeja', label: 'bandeja' },
  { id: 'litro', label: 'litro' },
];

const voiceShortName = (name: string) => name.split(' (')[0];
const voiceHint = (name: string) => name.match(/\((.*)\)/)?.[1] ?? '';

const Card: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, action, children, className = '' }) => (
  <section className={`bg-surface border border-line rounded-xl p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {title && <h2 className="text-base font-semibold text-fg">{title}</h2>}
          {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const LocutionStudio: React.FC<Props> = ({
  storeProfile,
  onUpdateStoreProfile,
  onOpenStoreModal,
  onSaveLocution,
  activeTemplateToLoad,
  onClearTemplateToLoad,
  step,
  setStep,
  onProgress,
  aiStatus,
}) => {
  const toast = useToast();

  const [tone, setTone] = useState<LocutionTone>('varejao_energico');
  const [targetDuration, setTargetDuration] = useState<TargetDuration>('media');
  const [scriptMode, setScriptMode] = useState<ScriptMode>('comercial');
  const [radioFormat, setRadioFormat] = useState<RadioFormat>('flash_interrupcao');
  const [radioStationName, setRadioStationName] = useState('');

  const [products, setProducts] = useState<ProductItem[]>([
    { id: '1', name: 'Picanha Bovina Maturada', promoPrice: '49,90', unit: 'kg' },
    { id: '2', name: 'Linguiça Toscana Especial', promoPrice: '18,90', unit: 'kg' },
    { id: '3', name: 'Carvão Vegetal 3kg', promoPrice: '13,90', unit: 'pacote' },
  ]);
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [chimeSound, setChimeSound] = useState<ChimeSoundType>('supermarket_bell');

  const [headline, setHeadline] = useState('Ofertas da Semana');
  const [scriptText, setScriptText] = useState(
    `Atenção clientes amigos do ${storeProfile.name || 'nosso estabelecimento'}! Parou tudo para ouvir as melhores ofertas de hoje! Tem Picanha Bovina Maturada de primeira por apenas quarenta e nove e noventa o quilo! Linguiça Toscana Especial fresquinha a dezoito e noventa o quilo, e Carvão Vegetal pacote de três quilos por apenas treze e noventa! Qualidade garantida e economia de verdade para sua família! Vem aproveitar no ${storeProfile.name || 'nosso estabelecimento'}!`
  );

  const [refineInstruction, setRefineInstruction] = useState('');
  const [refiningPrompt, setRefiningPrompt] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [playback, setPlayback] = useState<'idle' | 'audio' | 'browser'>('idle');
  const [progress, setProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [productError, setProductError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sampleVoice, setSampleVoice] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const sampleCache = useRef(new Map<string, string>());
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const stepToastRef = useRef<number | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStepRender = useRef(true);

  const effectiveRadioName = useMemo(() => {
    const custom = radioStationName.trim();
    if (custom) return custom;
    const baseStore = (storeProfile.name || '').trim() || 'Nossa Loja';
    if (/^r[áa]dio\b/i.test(baseStore)) return baseStore;
    return `Rádio ${baseStore}`;
  }, [radioStationName, storeProfile.name]);

  const isRefining = refiningPrompt !== null;
  const scriptBusy = isGeneratingScript || isRefining;
  const isPlaying = playback !== 'idle';
  const namedProducts = products.filter((p) => p.name.trim() !== '');
  const wordCount = scriptText
    .replace(/^(locutora|locutor)\s*:\s*/gim, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedSeconds = Math.max(3, Math.round(wordCount / 2.3));
  const durationKey = normalizeDuration(targetDuration);
  const targetSeconds = DURATIONS.find((d) => d.id === durationKey)!.seconds;
  const budgetRatio = estimatedSeconds / targetSeconds;
  const budgetState = budgetRatio > 1.2 ? 'over' : budgetRatio < 0.6 ? 'under' : 'ok';
  const voiceObj =
    GEMINI_VOICES.find((v) => v.id === selectedVoice || v.voiceName === selectedVoice) || GEMINI_VOICES[0];
  const snapshotKey = `${headline}|${scriptText}|${selectedVoice}|${chimeSound}|${scriptMode}|${radioFormat}`;
  const isSaved = savedSnapshot === snapshotKey;
  const mp3Blocked = aiStatus === 'offline';

  useEffect(() => {
    onProgress({ 1: namedProducts.length > 0, 2: scriptText.trim().length > 0, 3: exported || isSaved });
  }, [namedProducts.length, scriptText, exported, isSaved]);

  // Leva o foco ao título do passo ao trocar de passo (leitores de tela e teclado)
  useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    if (stepToastRef.current) toast.dismiss(stepToastRef.current);
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => () => stopPlayback(), []);

  useEffect(() => {
    if (!activeTemplateToLoad) return;
    stopPlayback();
    setTone(activeTemplateToLoad.tone);
    setTargetDuration(activeTemplateToLoad.suggestedDuration);
    setProducts(
      activeTemplateToLoad.products.map((p, idx) => ({
        id: `${Date.now()}_${idx}`,
        name: p.name,
        regularPrice: p.regularPrice,
        promoPrice: p.promoPrice,
        unit: p.unit,
        details: p.details,
      }))
    );
    setHeadline(activeTemplateToLoad.title);
    setScriptText(
      activeTemplateToLoad.baseScript.replace(/\[NOME\]/g, storeProfile.name || 'Nosso Estabelecimento')
    );
    setGeneratedAudioBase64(null);
    setExported(false);
    setStep(2);
    toast.show('success', `Modelo “${activeTemplateToLoad.title}” carregado`, {
      description: 'Revise o texto e siga para a voz quando estiver pronto.',
    });
    onClearTemplateToLoad?.();
  }, [activeTemplateToLoad]);

  const invalidateAudio = () => {
    stopPlayback();
    setGeneratedAudioBase64(null);
  };

  const handleSelectScriptMode = (nextMode: ScriptMode) => {
    setScriptMode(nextMode);
    invalidateAudio();
    if (nextMode === 'radio') {
      if (chimeSound === 'supermarket_bell') {
        setChimeSound('radio_jingle');
      }
      if (radioFormat === 'dupla_locutores') {
        setSelectedVoice('Dupla_Radio');
      } else if (selectedVoice === 'Fenrir') {
        setSelectedVoice('RadioFM_M');
      }
    } else if (selectedVoice === 'Dupla_Radio') {
      setSelectedVoice('Fenrir');
    }
  };

  const handleSelectRadioFormat = (nextFormat: RadioFormat) => {
    setRadioFormat(nextFormat);
    invalidateAudio();
    if (nextFormat === 'dupla_locutores') {
      setSelectedVoice('Dupla_Radio');
    } else if (selectedVoice === 'Dupla_Radio') {
      setSelectedVoice('RadioFM_M');
    }
  };

  // ---------- Produtos ----------
  const handleAddProduct = (preset?: Partial<ProductItem>) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setProducts((list) => [...list, { id, name: '', promoPrice: '', unit: 'kg', ...preset }]);
    setProductError(false);
    if (!preset) requestAnimationFrame(() => document.getElementById(`product-name-${id}`)?.focus());
  };

  const handleRemoveProduct = (id: string) => {
    const index = products.findIndex((p) => p.id === id);
    const removed = products[index];
    setProducts((list) => list.filter((p) => p.id !== id));
    if (removed?.name.trim()) {
      toast.show('info', `“${removed.name}” removido`, {
        action: {
          label: 'Desfazer',
          onClick: () =>
            setProducts((list) => {
              const next = [...list];
              next.splice(index, 0, removed);
              return next;
            }),
        },
      });
    }
  };

  const handleUpdateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    if (field === 'name' && value.trim()) setProductError(false);
  };

  const suggestions = useMemo(
    () =>
      SUGGESTED_PRODUCTS.filter(
        (s) => !products.some((p) => p.name.trim().toLowerCase() === s.name.toLowerCase())
      ).slice(0, 6),
    [products]
  );

  // ---------- Roteiro ----------
  const handleGenerateScript = async () => {
    if (namedProducts.length === 0) {
      setProductError(true);
      toast.show('error', 'Adicione pelo menos um produto', {
        description: 'O locutor precisa saber o que anunciar.',
      });
      return;
    }
    const previous = { headline, scriptText };
    setIsGeneratingScript(true);
    setStep(2);
    invalidateAudio();

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeProfile.name,
          storeType: storeProfile.type,
          slogan: storeProfile.slogan,
          location: storeProfile.location,
          paymentMethods: storeProfile.paymentMethods,
          openingGreeting: storeProfile.openingGreeting,
          closingPhrase: storeProfile.closingPhrase,
          tone,
          targetDuration,
          products: namedProducts,
          scriptMode,
          radioFormat,
          radioStationName: radioStationName.trim(),
        }),
      });
      const data = await response.json();
      if (data.success && data.script) {
        setScriptText(data.script);
        if (data.headline) setHeadline(data.headline);
        stepToastRef.current = toast.show('success', 'Roteiro pronto', {
          description:
            aiStatus === 'offline'
              ? 'Gerado pelo modo automático (sem IA). Revise antes de gravar.'
              : scriptMode === 'radio'
              ? `Formato ${effectiveRadioName} pronto para locução.`
              : 'Revise e ajuste o que quiser.',
          action: {
            label: 'Voltar ao texto anterior',
            onClick: () => {
              setHeadline(previous.headline);
              setScriptText(previous.scriptText);
            },
          },
        });
      } else {
        toast.show('error', 'Não foi possível escrever o roteiro', {
          description: data.error || 'Tente de novo em alguns segundos.',
        });
      }
    } catch {
      toast.show('error', 'Sem conexão com o servidor', {
        description: 'Verifique se o VozVarejo está rodando e tente de novo.',
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRefineScript = async (customText?: string) => {
    const instruction = (customText || refineInstruction).trim();
    if (!instruction || !scriptText.trim() || scriptBusy) return;
    const previous = scriptText;
    setRefiningPrompt(instruction);

    try {
      const response = await fetch('/api/refine-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalScript: scriptText,
          instruction,
          storeName: storeProfile.name,
          scriptMode,
          radioFormat,
          radioStationName: radioStationName.trim(),
        }),
      });
      const data = await response.json();
      if (data.success && data.script) {
        setScriptText(data.script);
        setRefineInstruction('');
        invalidateAudio();
        toast.show('success', 'Roteiro ajustado', {
          action: { label: 'Desfazer ajuste', onClick: () => setScriptText(previous) },
        });
      } else {
        toast.show('error', 'Não foi possível ajustar o roteiro', {
          description: data.error || 'Tente de novo.',
        });
      }
    } catch {
      toast.show('error', 'Sem conexão com o servidor', { description: 'O ajuste não foi aplicado.' });
    } finally {
      setRefiningPrompt(null);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(scriptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.show('error', 'Não foi possível copiar', { description: 'Selecione o texto e copie manualmente.' });
    }
  };

  // ---------- Áudio ----------
  function stopPlayback() {
    sampleAudioRef.current?.pause();
    sampleAudioRef.current = null;
    setSampleVoice(null);
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayback('idle');
    setProgress(0);
  }

  /** Pede a voz ao servidor. Lança Error com mensagem amigável quando falha. */
  const requestAudioSynthesis = async (): Promise<string> => {
    if (generatedAudioBase64) return generatedAudioBase64;
    let data: any;
    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voiceName: voiceObj.voiceName,
          tone,
          styleInstruction: voiceObj.styleInstruction,
          isMultiSpeaker: Boolean(voiceObj.isMultiSpeaker),
        }),
      });
      data = await response.json();
    } catch {
      throw new Error('Sem conexão com o servidor.');
    }
    if (data.success && data.audioBase64) {
      setGeneratedAudioBase64(data.audioBase64);
      return data.audioBase64;
    }
    throw new Error(
      aiStatus === 'offline'
        ? 'A voz profissional ainda não está ativada. Peça a quem instalou o VozVarejo para ativar a IA.'
        : data.error || 'O serviço de voz não respondeu.'
    );
  };

  const playWebSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.show('error', 'Seu navegador não tem voz sintetizada', { description: 'Tente pelo Chrome ou Edge.' });
      return;
    }
    stopPlayback();
    if (chimeSound !== 'none') playChimePreview(chimeSound);
    setPlayback('browser');
    setTimeout(
      () => {
        const cleanSpoken = scriptText.replace(/^(locutora|locutor)\s*:\s*/gim, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpoken);
        utterance.lang = 'pt-BR';
        utterance.rate = tone === 'varejao_energico' || tone === 'oferta_relampago' ? 1.12 : 1.0;
        const ptVoice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
        utterance.onend = () => setPlayback('idle');
        utterance.onerror = () => setPlayback('idle');
        window.speechSynthesis.speak(utterance);
      },
      chimeSound !== 'none' ? 1100 : 50
    );
  };

  const playGeneratedAudio = async (base64: string) => {
    const mixedBuffer = await createMixedAudioBuffer(base64, chimeSound);
    const url = URL.createObjectURL(audioBufferToWavBlob(mixedBuffer));
    stopPlayback();
    const audio = new Audio(url);
    audioElementRef.current = audio;
    const finish = () => {
      setPlayback('idle');
      setProgress(0);
      URL.revokeObjectURL(url);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => audio.duration && setProgress(audio.currentTime / audio.duration);
    audio.onended = finish;
    audio.onerror = finish;
    await audio.play();
    setPlayback('audio');
  };

  const handleListenPreview = async () => {
    if (!scriptText.trim()) {
      toast.show('error', 'O roteiro está vazio', { description: 'Escreva ou gere um texto antes de ouvir.' });
      return;
    }
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (aiStatus === 'offline') {
      playWebSpeech();
      return;
    }
    setIsSynthesizingAudio(true);
    try {
      const base64 = await requestAudioSynthesis();
      await playGeneratedAudio(base64);
    } catch (err) {
      toast.show('info', 'Tocando com a voz do navegador', {
        description: err instanceof Error ? err.message : undefined,
      });
      playWebSpeech();
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  const handleVoiceSample = async (voiceId: string) => {
    if (sampleVoice === voiceId) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setSampleLoading(voiceId);
    const targetVoice = GEMINI_VOICES.find((v) => v.id === voiceId || v.voiceName === voiceId) || GEMINI_VOICES[0];

    try {
      let base64 = sampleCache.current.get(targetVoice.id);
      if (!base64) {
        const shortName = voiceShortName(targetVoice.name);
        const sampleText = targetVoice.isMultiSpeaker
          ? `Locutor: E paramos a nossa programação aqui na ${effectiveRadioName}!\nLocutora: É isso aí! As melhores ofertas do ${storeProfile.name || 'seu mercado'} estão no ar!`
          : `Olá! Eu sou ${shortName}, e posso anunciar as ofertas do ${storeProfile.name || 'seu mercado'}!`;

        const res = await fetch('/api/generate-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sampleText,
            voiceName: targetVoice.voiceName,
            tone,
            styleInstruction: targetVoice.styleInstruction,
            isMultiSpeaker: Boolean(targetVoice.isMultiSpeaker),
          }),
        });
        const data = await res.json();
        if (!data.success || !data.audioBase64) throw new Error(data.error);
        base64 = data.audioBase64 as string;
        sampleCache.current.set(targetVoice.id, base64);
      }
      const url = URL.createObjectURL(audioBufferToWavBlob(await createMixedAudioBuffer(base64, 'none')));
      const audio = new Audio(url);
      sampleAudioRef.current = audio;
      audio.onended = audio.onerror = () => {
        setSampleVoice(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setSampleVoice(voiceId);
    } catch {
      toast.show('error', 'Não foi possível tocar a amostra', { description: 'Tente de novo em alguns segundos.' });
    } finally {
      setSampleLoading(null);
    }
  };

  const handleDownloadMp3 = async () => {
    if (mp3Blocked) {
      toast.show('error', 'MP3 indisponível no modo sem IA', {
        description: 'A voz profissional ainda não está ativada. Peça a quem instalou o VozVarejo para ativar a IA.',
      });
      return;
    }
    if (!scriptText.trim()) {
      toast.show('error', 'O roteiro está vazio', { description: 'Escreva ou gere um texto antes de baixar.' });
      return;
    }
    setIsDownloadingMp3(true);
    const toastId = toast.show(
      'loading',
      generatedAudioBase64 ? 'Preparando o MP3…' : 'Gravando a voz e preparando o MP3…',
      {
        description: 'Isso pode levar alguns segundos.',
      }
    );
    try {
      const base64 = await requestAudioSynthesis();
      const mixedBuffer = await createMixedAudioBuffer(base64, chimeSound);
      const mp3Blob = audioBufferToMp3Blob(mixedBuffer);
      const fileName = `${slugify(headline) || 'locucao'}_${slugify(storeProfile.name) || 'loja'}.mp3`;
      triggerFileDownload(mp3Blob, fileName);
      setExported(true);
      toast.update(toastId, 'success', 'MP3 baixado', { description: fileName });
    } catch (err) {
      toast.update(toastId, 'error', 'Não foi possível gerar o MP3', {
        description: err instanceof Error ? err.message : 'Tente de novo em alguns segundos.',
      });
    } finally {
      setIsDownloadingMp3(false);
    }
  };

  const handleShare = async () => {
    if (mp3Blocked || !scriptText.trim()) return;
    setIsSharing(true);
    try {
      const base64 = await requestAudioSynthesis();
      const mp3Blob = audioBufferToMp3Blob(await createMixedAudioBuffer(base64, chimeSound));
      const fileName = `${slugify(headline) || 'locucao'}_${slugify(storeProfile.name) || 'loja'}.mp3`;
      const result = await shareAudioFile(mp3Blob, fileName, headline || 'Locução');
      if (result !== 'cancelled') setExported(true);
      if (result === 'downloaded') {
        toast.show('info', 'MP3 baixado para enviar', {
          description: 'Este navegador não compartilha arquivos direto. Anexe o MP3 baixado no WhatsApp.',
        });
      }
    } catch (err) {
      toast.show('error', 'Não foi possível compartilhar', {
        description: err instanceof Error ? err.message : 'Tente de novo em alguns segundos.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!scriptText.trim()) {
      toast.show('error', 'Nada para salvar', { description: 'O roteiro está vazio.' });
      return;
    }
    onSaveLocution({
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      storeName: storeProfile.name || 'Nosso Estabelecimento',
      headline: headline || 'Ofertas da Semana',
      script: scriptText,
      tone,
      targetDuration,
      voiceName: voiceObj.name,
      voiceId: voiceObj.id,
      voiceGender: voiceObj.gender,
      products,
      chimeSound,
      isFavorite: false,
      audioBase64: generatedAudioBase64 || undefined,
      audioMimeType: 'audio/wav',
      scriptMode,
      radioFormat,
      radioStationName: radioStationName.trim() || undefined,
    });
    setSavedSnapshot(snapshotKey);
    toast.show('success', 'Salvo no histórico', { description: headline || 'Ofertas da Semana' });
  };

  const stepTitles: Record<StudioStep, { title: string; text: string }> = {
    1: { title: 'O que vamos anunciar?', text: 'Confira a loja, escolha o formato e liste as ofertas.' },
    2: { title: 'Revise o roteiro', text: 'É isso que o locutor vai falar. Edite à vontade ou peça ajustes.' },
    3: { title: 'Escolha a voz e baixe', text: 'Ouça a prévia, troque a voz se quiser e baixe o MP3.' },
  };

  return (
    <div className="pb-48 lg:pb-32">
      {/* Stepper mobile */}
      <ol className="lg:hidden grid grid-cols-3 gap-1.5 mb-5" aria-label="Etapas">
        {STUDIO_STEPS.map((s) => {
          const active = s.id === step;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => setStep(s.id)}
                className="w-full text-left"
              >
                <span
                  className={`block h-1 rounded-full mb-2 transition-colors ${s.id <= step ? 'bg-accent' : 'bg-line'}`}
                />
                <span className={`block text-xs font-medium ${active ? 'text-accent-fg' : 'text-muted'}`}>
                  {s.id}. {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <header className="mb-6">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-fg outline-none"
        >
          {stepTitles[step].title}
        </h1>
        <p className="text-[0.9375rem] text-muted mt-1">{stepTitles[step].text}</p>
      </header>

      <div key={step} className="animate-fade-up space-y-5">
        {/* ================= PASSO 1 ================= */}
        {step === 1 && (
          <>
            <Card
              title="Loja"
              action={
                <Button variant="ghost" size="sm" icon={<Settings2 className="w-4 h-4" />} onClick={onOpenStoreModal}>
                  Mais dados
                </Button>
              }
            >
              <Label htmlFor="store-name">Nome do mercado ou açougue</Label>
              <input
                id="store-name"
                type="text"
                value={storeProfile.name}
                onChange={(e) => onUpdateStoreProfile({ ...storeProfile, name: e.target.value })}
                placeholder="Ex.: Novo Boi João Dias"
                autoComplete="organization"
                className="field"
              />
              <p className="text-sm text-muted mt-1.5">O locutor fala esse nome na abertura e no encerramento.</p>
            </Card>

            <Card title="Formato, estilo e duração">
              {/* Seletor: Comercial Tradicional vs Modo Rádio Interna */}
              <fieldset>
                <legend className="text-sm font-medium text-fg mb-2">Formato do roteiro</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SCRIPT_MODES.map((m) => {
                    const checked = scriptMode === m.id;
                    return (
                      <label
                        key={m.id}
                        className={`relative flex items-start gap-3 rounded-[10px] border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2 ${
                          checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <input
                          type="radio"
                          name="script-mode"
                          value={m.id}
                          checked={checked}
                          onChange={() => handleSelectScriptMode(m.id)}
                          className="sr-only"
                        />
                        {m.id === 'radio' ? (
                          <Radio
                            className={`w-4 h-4 mt-0.5 shrink-0 ${checked ? 'text-accent' : 'text-muted'}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <Mic
                            className={`w-4 h-4 mt-0.5 shrink-0 ${checked ? 'text-accent' : 'text-muted'}`}
                            aria-hidden="true"
                          />
                        )}
                        <span className="flex-1 min-w-0 pr-5">
                          <span className={`block text-[0.9375rem] font-medium ${checked ? 'text-accent-fg' : 'text-fg'}`}>
                            {m.label}
                          </span>
                          <span className="block text-sm text-muted mt-0.5">{m.hint}</span>
                        </span>
                        {checked && <Check className="absolute top-3 right-3 w-4 h-4 text-accent" aria-hidden="true" />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Opções contextuais do Modo Rádio Interna */}
              {scriptMode === 'radio' && (
                <div className="mt-4 pt-4 border-t border-line space-y-4">
                  <fieldset>
                    <legend className="text-sm font-medium text-fg mb-2">Formato do programa de rádio</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {RADIO_FORMATS.map((rf) => {
                        const checked = radioFormat === rf.id;
                        return (
                          <label
                            key={rf.id}
                            className={`relative flex flex-col gap-0.5 rounded-[10px] border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2 ${
                              checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                            }`}
                          >
                            <input
                              type="radio"
                              name="radio-format"
                              value={rf.id}
                              checked={checked}
                              onChange={() => handleSelectRadioFormat(rf.id)}
                              className="sr-only"
                            />
                            <span
                              className={`text-[0.9375rem] font-medium pr-5 ${checked ? 'text-accent-fg' : 'text-fg'}`}
                            >
                              {rf.label}
                            </span>
                            <span className="text-sm text-muted">{rf.hint}</span>
                            {checked && (
                              <Check className="absolute top-3 right-3 w-4 h-4 text-accent" aria-hidden="true" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <Label htmlFor="radio-station-name">
                      Nome da rádio <span className="text-muted font-normal">(opcional)</span>
                    </Label>
                    <input
                      id="radio-station-name"
                      type="text"
                      value={radioStationName}
                      onChange={(e) => {
                        setRadioStationName(e.target.value);
                        invalidateAudio();
                      }}
                      placeholder={`Rádio ${storeProfile.name || 'Novo Boi João Dias'}`}
                      className="field"
                    />
                    <p className="text-sm text-muted mt-1.5">
                      Se deixar em branco, o locutor falará automaticamente{' '}
                      <strong className="font-medium text-fg">“{effectiveRadioName}”</strong>.
                    </p>
                  </div>
                </div>
              )}

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-fg mb-2">Estilo da locução</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {TONES.map((t) => {
                    const checked = tone === t.id;
                    return (
                      <label
                        key={t.id}
                        className={`relative flex flex-col gap-0.5 rounded-[10px] border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2 ${
                          checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tone"
                          value={t.id}
                          checked={checked}
                          onChange={() => {
                            setTone(t.id);
                            invalidateAudio();
                          }}
                          className="sr-only"
                        />
                        <span className={`text-[0.9375rem] font-medium ${checked ? 'text-accent-fg' : 'text-fg'}`}>
                          {t.label}
                        </span>
                        <span className="text-sm text-muted">{t.hint}</span>
                        {checked && <Check className="absolute top-3 right-3 w-4 h-4 text-accent" aria-hidden="true" />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-fg mb-2">Duração do áudio</legend>
                <div className="inline-grid grid-cols-3 p-1 rounded-[10px] bg-sunken border border-line w-full sm:w-auto">
                  {DURATIONS.map((d) => {
                    const checked = durationKey === d.id;
                    return (
                      <label
                        key={d.id}
                        className={`flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                          checked ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                        }`}
                      >
                        <input
                          type="radio"
                          name="duration"
                          value={d.id}
                          checked={checked}
                          onChange={() => setTargetDuration(d.id)}
                          className="sr-only"
                        />
                        {d.label} <span className="text-muted font-normal tabular-nums">{d.seconds}s</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </Card>

            <Card
              title="Produtos em oferta"
              description={`${namedProducts.length} ${namedProducts.length === 1 ? 'produto' : 'produtos'} na locução`}
            >
              {products.length === 0 ? (
                <div
                  className={`rounded-[10px] border border-dashed px-4 py-8 text-center ${
                    productError ? 'border-danger' : 'border-line-strong'
                  }`}
                >
                  <p className="text-[0.9375rem] font-medium text-fg">Nenhum produto ainda</p>
                  <p className="text-sm text-muted mt-1 mb-4">
                    Adicione o que está em promoção ou escolha uma sugestão abaixo.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => handleAddProduct()}
                  >
                    Adicionar produto
                  </Button>
                </div>
              ) : (
                <div>
                  <div
                    className="hidden sm:grid grid-cols-[minmax(0,1fr)_8rem_7rem_2.5rem] gap-2 px-0.5 pb-2 text-sm font-medium text-muted"
                    aria-hidden="true"
                  >
                    <span>Produto</span>
                    <span>Preço</span>
                    <span>Unidade</span>
                    <span />
                  </div>
                  <ul className="space-y-3 sm:space-y-2">
                    {products.map((p, i) => {
                      const invalid = productError && !p.name.trim();
                      return (
                        <li
                          key={p.id}
                          className="grid grid-cols-[1fr_1fr_auto] sm:grid-cols-[minmax(0,1fr)_8rem_7rem_2.5rem] gap-2 items-center pb-3 sm:pb-0 border-b border-line sm:border-0 last:border-0"
                        >
                          <input
                            id={`product-name-${p.id}`}
                            type="text"
                            aria-label={`Produto ${i + 1}`}
                            aria-invalid={invalid || undefined}
                            placeholder="Ex.: Picanha bovina"
                            value={p.name}
                            onChange={(e) => handleUpdateProduct(p.id, 'name', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && i === products.length - 1 && p.name.trim()) handleAddProduct();
                            }}
                            className="field col-span-3 sm:col-span-1"
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Preço do produto ${i + 1}`}
                              placeholder="0,00"
                              value={p.promoPrice}
                              onChange={(e) =>
                                handleUpdateProduct(p.id, 'promoPrice', e.target.value.replace(/[^\d.,]/g, ''))
                              }
                              className="field pl-9 font-semibold tabular-nums"
                            />
                          </div>
                          <select
                            aria-label={`Unidade do produto ${i + 1}`}
                            value={p.unit}
                            onChange={(e) => handleUpdateProduct(p.id, 'unit', e.target.value)}
                            className="field"
                          >
                            {UNITS.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                          <IconButton
                            label={`Remover ${p.name || `produto ${i + 1}`}`}
                            tone="danger"
                            onClick={() => handleRemoveProduct(p.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => handleAddProduct()}
                    className="mt-3 -ml-2 text-accent-fg hover:text-accent-fg"
                  >
                    Adicionar produto
                  </Button>
                </div>
              )}

              {productError && products.length > 0 && (
                <p className="text-sm text-danger mt-2" role="alert">
                  Preencha o nome de pelo menos um produto.
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="mt-5 pt-5 border-t border-line">
                  <p className="text-sm font-medium text-fg mb-2">Sugestões rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() =>
                          handleAddProduct({
                            name: sug.name,
                            promoPrice: sug.defaultPromo.replace('.', ','),
                            unit: sug.unit,
                          })
                        }
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-line text-sm text-fg hover:border-line-strong hover:bg-sunken transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted" />
                        {sug.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(2)} icon={<ArrowRight className="w-4 h-4" />}>
                Já tenho o texto
              </Button>
              <Button
                variant="accent"
                size="lg"
                onClick={handleGenerateScript}
                loading={isGeneratingScript}
                icon={<Wand2 className="w-4 h-4" />}
              >
                {aiStatus === 'offline' ? 'Escrever roteiro automático' : 'Escrever roteiro com IA'}
              </Button>
            </div>
          </>
        )}

        {/* ================= PASSO 2 ================= */}
        {step === 2 && (
          <>
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="headline">Título da locução</Label>
                  <input
                    id="headline"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex.: Sextou do churrasco"
                    className="field font-medium"
                  />
                </div>
                <div className="sm:w-56" aria-live="polite">
                  <div className="flex items-baseline justify-between text-sm mb-1.5">
                    <span className="text-muted">Tempo estimado</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        budgetState === 'over' ? 'text-warning' : budgetState === 'ok' ? 'text-success' : 'text-fg'
                      }`}
                    >
                      ~{estimatedSeconds}s de {targetSeconds}s
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-sunken overflow-hidden" aria-hidden="true">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${
                        budgetState === 'over' ? 'bg-warning' : budgetState === 'ok' ? 'bg-success' : 'bg-subtle'
                      }`}
                      style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
                    />
                  </div>
                  {budgetState === 'over' && (
                    <p className="text-xs text-warning mt-1">Passa do tempo escolhido. Tente “Mais curto”.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label htmlFor="script" className="text-sm font-medium text-fg">
                  Texto do locutor
                </label>
                {scriptMode === 'radio' && (
                  <span className="text-xs text-muted">
                    {radioFormat === 'dupla_locutores' ? 'Dupla ao vivo' : 'Interrupção da programação'} ·{' '}
                    {effectiveRadioName}
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="script"
                  rows={9}
                  value={scriptText}
                  aria-busy={scriptBusy}
                  disabled={scriptBusy}
                  onChange={(e) => {
                    setScriptText(e.target.value);
                    invalidateAudio();
                  }}
                  placeholder="Digite aqui o que o locutor vai falar, ou volte ao passo 1 e gere com IA."
                  className={`field text-base leading-relaxed resize-y min-h-52 ${scriptBusy ? 'opacity-0' : ''}`}
                />
                {scriptBusy && (
                  <div className="absolute inset-0 rounded-[10px] border border-line bg-surface p-4" role="status">
                    <div className="flex items-center gap-2 text-sm font-medium text-accent-fg mb-4">
                      <Spinner />
                      {isGeneratingScript ? 'Escrevendo o roteiro…' : `Ajustando: “${refiningPrompt}”…`}
                    </div>
                    <div className="space-y-2.5" aria-hidden="true">
                      {[100, 96, 92, 98, 70].map((w, i) => (
                        <div key={i} className="skeleton h-3.5" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                <span className="text-sm text-muted tabular-nums">{wordCount} palavras</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopyText}
                    disabled={!scriptText.trim()}
                  >
                    {isCopied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleGenerateScript}
                    disabled={scriptBusy}
                  >
                    Gerar outro
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Ajustar com IA" description="Peça uma mudança e o texto é reescrito.">
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_TWEAKS.map((btn) => (
                  <Button
                    key={btn.label}
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleRefineScript(btn.prompt)}
                    disabled={scriptBusy || !scriptText.trim()}
                    loading={refiningPrompt === btn.prompt}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRefineScript();
                }}
              >
                <label htmlFor="refine" className="sr-only">
                  O que mudar no roteiro
                </label>
                <input
                  id="refine"
                  type="text"
                  placeholder="Ex.: diga que abrimos domingo até 13h"
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  className="field flex-1"
                />
                <Button
                  type="submit"
                  variant="accent"
                  disabled={!refineInstruction.trim() || scriptBusy || !scriptText.trim()}
                  loading={isRefining && refiningPrompt === refineInstruction.trim()}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Aplicar
                </Button>
              </form>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button variant="ghost" size="lg" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(1)}>
                Voltar às ofertas
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                disabled={!scriptText.trim() || scriptBusy}
              >
                Escolher a voz <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* ================= PASSO 3 ================= */}
        {step === 3 && (
          <>
            {aiStatus === 'offline' && (
              <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3.5" role="note">
                <TriangleAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-semibold text-fg">Modo sem IA</p>
                  <p className="text-muted mt-0.5">
                    A prévia toca com a voz do próprio computador ou celular. Para baixar o MP3 com voz profissional,
                    peça a quem instalou o VozVarejo para ativar a IA.
                  </p>
                </div>
              </div>
            )}

            <Card
              title="Voz do locutor"
              description="Escolha entre vozes tradicionais de varejo, locutores estilo Rádio FM, Sertanejo & Bairro ou Dupla ao vivo."
            >
              <fieldset>
                <legend className="sr-only">Voz do locutor</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {GEMINI_VOICES.map((v) => {
                    const checked = voiceObj.id === v.id;
                    const genderLabel =
                      v.gender === 'dupla' ? 'Dupla (M + F)' : v.gender === 'masculino' ? 'Masculina' : 'Feminina';
                    return (
                      <label
                        key={v.id}
                        className={`relative flex flex-col rounded-[10px] border px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2 ${
                          checked ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <input
                          type="radio"
                          name="voice"
                          value={v.id}
                          checked={checked}
                          onChange={() => {
                            setSelectedVoice(v.id);
                            invalidateAudio();
                          }}
                          className="sr-only"
                        />
                        <span className="flex items-center gap-2 pr-5">
                          {v.isMultiSpeaker && (
                            <Users className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                          )}
                          <span className={`text-[0.9375rem] font-semibold ${checked ? 'text-accent-fg' : 'text-fg'}`}>
                            {voiceShortName(v.name)}
                          </span>
                          <span className="text-xs text-muted px-1.5 py-0.5 rounded bg-sunken border border-line">
                            {genderLabel}
                          </span>
                        </span>
                        <span className="text-sm text-fg mt-1">{voiceHint(v.name)}</span>
                        <span className="text-sm text-muted mt-1 leading-snug">{v.description}</span>
                        {aiStatus !== 'offline' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="self-start mt-2 -ml-2"
                            loading={sampleLoading === v.id}
                            icon={
                              sampleVoice === v.id ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current" />
                              )
                            }
                            aria-label={`${sampleVoice === v.id ? 'Parar' : 'Ouvir'} amostra da voz ${voiceShortName(v.name)}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVoiceSample(v.id);
                            }}
                          >
                            {sampleVoice === v.id ? 'Parar' : 'Ouvir amostra'}
                          </Button>
                        )}
                        {checked && <Check className="absolute top-3.5 right-3.5 w-4 h-4 text-accent" aria-hidden="true" />}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </Card>

            <Card title="Sino ou vinheta de abertura" description="Toca antes da voz para chamar a atenção dos clientes.">
              <fieldset>
                <legend className="sr-only">Sino ou vinheta de abertura</legend>
                <ul className="divide-y divide-line border border-line rounded-[10px]">
                  {CHIMES.map((c) => {
                    const checked = chimeSound === c.id;
                    return (
                      <li key={c.id} className="flex items-center gap-3 pr-2">
                        <label className="flex-1 flex items-center gap-3 px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent rounded-[10px]">
                          <input
                            type="radio"
                            name="chime"
                            value={c.id}
                            checked={checked}
                            onChange={() => setChimeSound(c.id)}
                            className="w-4 h-4 shrink-0 accent-[var(--accent)]"
                          />
                          {c.id === 'none' ? (
                            <BellOff className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                          ) : c.id === 'radio_jingle' ? (
                            <Radio className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                          ) : (
                            <Bell className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />
                          )}
                          <span className={`text-[0.9375rem] ${checked ? 'font-semibold text-fg' : 'text-fg'}`}>
                            {c.label}
                          </span>
                        </label>
                        {c.id !== 'none' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Volume2 className="w-4 h-4" />}
                            onClick={() => playChimePreview(c.id)}
                            aria-label={`Testar ${c.label}`}
                          >
                            Testar
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button variant="ghost" size="lg" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setStep(2)}>
                Voltar ao roteiro
              </Button>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-muted sm:text-right">
                  {mp3Blocked ? 'MP3 indisponível no modo sem IA.' : 'Ouça e baixe pela barra abaixo.'}
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSaveToHistory}
                  icon={isSaved ? <Check className="w-4 h-4 text-success" /> : <Star className="w-4 h-4" />}
                >
                  {isSaved ? 'Salvo no histórico' : 'Salvar no histórico'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= BARRA DO PLAYER ================= */}
      <div className="fixed z-20 inset-x-0 bottom-16 lg:bottom-0 lg:left-64 pb-0 lg:pb-[env(safe-area-inset-bottom)]">
        <div className="relative bg-surface/95 backdrop-blur border-t border-line">
          {playback === 'audio' && duration > 0 ? (
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={progress * duration}
              onChange={(e) => {
                if (audioElementRef.current) audioElementRef.current.currentTime = Number(e.target.value);
              }}
              aria-label="Posição da prévia"
              aria-valuetext={`${formatSeconds(progress * duration)} de ${formatSeconds(duration)}`}
              className="absolute -top-2 inset-x-0 w-full h-4 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-line [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-line [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:bg-accent [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent"
              style={{
                background: `linear-gradient(to right, var(--accent) ${progress * 100}%, transparent ${
                  progress * 100
                }%) center / 100% 4px no-repeat`,
              }}
            />
          ) : (
            playback === 'browser' && (
              <div className="absolute top-0 inset-x-0 h-1 overflow-hidden" aria-hidden="true">
                <div className="skeleton h-full rounded-none" />
              </div>
            )
          )}
          <div className="max-w-5xl mx-auto px-4 sm:px-8 h-[72px] flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleListenPreview}
              loading={isSynthesizingAudio}
              disabled={isDownloadingMp3 || scriptBusy}
              aria-label={isPlaying ? 'Parar prévia' : 'Ouvir prévia'}
              className="w-12 h-12 px-0 rounded-full shrink-0"
              icon={
                isSynthesizingAudio ? undefined : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-px" />
                )
              }
            />
            <div className="flex-1 min-w-0">
              <p className="text-[0.9375rem] font-semibold text-fg truncate">{headline || 'Sem título'}</p>
              <p className="text-sm text-muted truncate tabular-nums">
                {isSynthesizingAudio
                  ? 'Gerando a voz…'
                  : playback === 'browser'
                  ? 'Tocando com a voz do navegador'
                  : playback === 'audio'
                  ? `${formatSeconds(progress * duration)} / ${formatSeconds(duration)} · ${voiceShortName(voiceObj.name)}`
                  : mp3Blocked
                  ? `~${formatSeconds(estimatedSeconds)} · Sem IA: prévia com a voz do aparelho, sem MP3`
                  : `~${formatSeconds(estimatedSeconds)} · ${voiceShortName(voiceObj.name)} · ${
                      CHIMES.find((c) => c.id === chimeSound)?.label
                    }`}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleShare}
              loading={isSharing}
              disabled={isSynthesizingAudio || isDownloadingMp3 || scriptBusy || !scriptText.trim() || mp3Blocked}
              aria-describedby={mp3Blocked ? 'mp3-blocked-reason' : undefined}
              icon={<Share2 className="w-4 h-4" />}
              aria-label="Compartilhar MP3 (WhatsApp)"
              title="Enviar pelo WhatsApp e outros apps"
              className="shrink-0 w-11 px-0 md:w-auto md:px-4"
            >
              <span className="hidden md:inline">Compartilhar</span>
            </Button>
            <span id="mp3-blocked-reason" className="sr-only">
              {mp3Blocked ? 'MP3 indisponível no modo sem IA.' : ''}
            </span>
            <Button
              variant="primary"
              onClick={handleDownloadMp3}
              loading={isDownloadingMp3}
              disabled={isSynthesizingAudio || scriptBusy || !scriptText.trim() || mp3Blocked}
              aria-describedby={mp3Blocked ? 'mp3-blocked-reason' : undefined}
              title={
                mp3Blocked ? 'MP3 indisponível no modo sem IA' : !scriptText.trim() ? 'Escreva o roteiro primeiro' : undefined
              }
              icon={<Download className="w-4 h-4" />}
              aria-label="Baixar MP3"
              className="shrink-0 w-11 px-0 sm:w-auto sm:px-4"
            >
              <span className="hidden sm:inline">Baixar MP3</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
