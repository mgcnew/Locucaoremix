import React, { useState, useEffect, useRef } from 'react';
import {
  StoreProfile,
  LocutionTone,
  TargetDuration,
  ProductItem,
  ChimeSoundType,
  SavedLocution,
  SeasonalTemplate,
} from '../types';
import { GEMINI_VOICES } from '../data/voices';
import { SUGGESTED_PRODUCTS } from '../data/popularProducts';
import {
  Mic,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Star,
  Volume2,
  Clock,
  Store,
  Bell,
  Wand2,
  FileAudio,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  createMixedAudioBuffer,
  audioBufferToMp3Blob,
  audioBufferToWavBlob,
  triggerFileDownload,
  playChimePreview,
} from '../utils/audioExporter';

interface Props {
  storeProfile: StoreProfile;
  onOpenStoreModal: () => void;
  onSaveLocution: (locution: SavedLocution) => void;
  activeTemplateToLoad?: SeasonalTemplate | null;
  onClearTemplateToLoad?: () => void;
}

export const LocutionStudio: React.FC<Props> = ({
  storeProfile,
  onOpenStoreModal,
  onSaveLocution,
  activeTemplateToLoad,
  onClearTemplateToLoad,
}) => {
  // Aba interna ativa (1. Ofertas, 2. Roteiro, 3. Gravação)
  const [studioStep, setStudioStep] = useState<'offers' | 'script' | 'audio'>('offers');

  // Configurações da Campanha
  const [tone, setTone] = useState<LocutionTone>('varejao_energico');
  const [targetDuration, setTargetDuration] = useState<TargetDuration>('media');
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: '1',
      name: 'Picanha Bovina Friboi Maturada',
      regularPrice: '69.90',
      promoPrice: '49.90',
      unit: 'kg',
      details: 'Capa uniforme',
      limit: '5kg/cliente',
    },
    {
      id: '2',
      name: 'Linguiça Toscana Perdigão',
      regularPrice: '26.90',
      promoPrice: '18.90',
      unit: 'kg',
    },
    {
      id: '3',
      name: 'Carvão Vegetal 3kg',
      regularPrice: '18.50',
      promoPrice: '13.90',
      unit: 'pacote',
    },
  ]);
  const [customOfferText, setCustomOfferText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Voz & Efeitos
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [chimeSound, setChimeSound] = useState<ChimeSoundType>('supermarket_bell');

  // Roteiro
  const [headline, setHeadline] = useState('Sextou com Picanha e Churrasco');
  const [scriptText, setScriptText] = useState(
    `Atenção clientes amigos do ${storeProfile.name || 'nosso estabelecimento'}! Parou tudo para ouvir as melhores ofertas da semana! Tem Picanha bovina maturada de primeira, de sessenta e nove e noventa por APENAS quarenta e nove e noventa o quilo! E não para por aí: tem linguiça toscana a dezoito e noventa o quilo, e carvão vegetal saco de três quilos a treze e noventa! Acenda a brasa e venha economizar no ${storeProfile.name || 'nosso estabelecimento'}!`
  );
  const [audioTips, setAudioTips] = useState('Entonação animada e ritmo comercial de rádio popular.');

  // Refinamento com IA
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Estados de Carregamento
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);

  // Áudio Gerado
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Carregar template externo
  useEffect(() => {
    if (activeTemplateToLoad) {
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
      const replacedScript = activeTemplateToLoad.baseScript.replace(
        /\[NOME\]/g,
        storeProfile.name || 'Nosso Estabelecimento'
      );
      setHeadline(activeTemplateToLoad.title);
      setScriptText(replacedScript);
      setGeneratedAudioBase64(null);
      setStudioStep('script');
      if (onClearTemplateToLoad) onClearTemplateToLoad();
    }
  }, [activeTemplateToLoad, storeProfile.name]);

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round(wordCount / 2.3);

  // Manipulação de Produtos
  const handleAddProduct = () => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        name: '',
        promoPrice: '',
        unit: 'kg',
      },
    ]);
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleUpdateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddQuickProduct = (item: typeof SUGGESTED_PRODUCTS[0]) => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        name: item.name,
        regularPrice: item.defaultPrice,
        promoPrice: item.defaultPromo,
        unit: item.unit,
      },
    ]);
  };

  // Gerar Roteiro com IA
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setGeneratedAudioBase64(null);
    setIsSaved(false);

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
          products: products.filter((p) => p.name.trim() !== ''),
          customOfferText,
          additionalNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setScriptText(data.script);
        setHeadline(data.headline);
        if (data.audioTips) setAudioTips(data.audioTips);
        setStudioStep('script');
      } else {
        alert(data.error || 'Erro ao gerar texto promocional.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao gerar roteiro.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Refinar Roteiro com IA
  const handleRefineScript = async (customText?: string) => {
    const instruction = customText || refineInstruction;
    if (!instruction.trim()) return;

    setIsRefining(true);
    try {
      const response = await fetch('/api/refine-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalScript: scriptText,
          instruction,
          storeName: storeProfile.name,
        }),
      });

      const data = await response.json();
      if (data.success && data.script) {
        setScriptText(data.script);
        setRefineInstruction('');
        setGeneratedAudioBase64(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  // Sintetizar Áudio com Gemini TTS
  const handleSynthesizeAudio = async () => {
    if (!scriptText.trim()) return;
    setIsSynthesizingAudio(true);

    try {
      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voiceName: selectedVoice,
          tone,
        }),
      });

      const data = await response.json();
      if (data.success && data.audioBase64) {
        setGeneratedAudioBase64(data.audioBase64);
        playGeneratedAudio(data.audioBase64);
      } else if (data.fallbackToWebSpeech) {
        playWebSpeechSynthesis();
      } else {
        alert(data.error || 'Erro ao sintetizar áudio.');
      }
    } catch (err: any) {
      console.error(err);
      playWebSpeechSynthesis();
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Prévia Nativa Web Speech
  const playWebSpeechSynthesis = () => {
    if (!('speechSynthesis' in window)) {
      alert('Navegador sem suporte a síntese de voz.');
      return;
    }

    window.speechSynthesis.cancel();
    if (chimeSound !== 'none') {
      playChimePreview(chimeSound);
    }

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.lang = 'pt-BR';
      utterance.rate = tone === 'varejao_energico' || tone === 'oferta_relampago' ? 1.15 : 1.0;
      utterance.pitch = selectedVoice === 'Kore' || selectedVoice === 'Zephyr' ? 1.1 : 0.95;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
      if (ptVoice) utterance.voice = ptVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    }, chimeSound !== 'none' ? 1200 : 50);
  };

  // Tocar Áudio
  const playGeneratedAudio = async (base64Override?: string) => {
    const base64 = base64Override || generatedAudioBase64;
    if (!base64) return;

    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      if (chimeSound !== 'none') {
        const mixedBuffer = await createMixedAudioBuffer(base64, chimeSound);
        const wavBlob = audioBufferToWavBlob(mixedBuffer);
        const audioUrl = URL.createObjectURL(wavBlob);

        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        audio.playbackRate = playbackSpeed;

        audio.onloadedmetadata = () => setAudioDuration(audio.duration);
        audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioCurrentTime(0);
        };

        await audio.play();
        setIsPlayingAudio(true);
      } else {
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        audioElementRef.current = audio;
        audio.playbackRate = playbackSpeed;

        audio.onloadedmetadata = () => setAudioDuration(audio.duration);
        audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioCurrentTime(0);
        };

        await audio.play();
        setIsPlayingAudio(true);
      }
    } catch (e) {
      console.error('Erro na reprodução:', e);
    }
  };

  const handleDownloadMp3 = async () => {
    if (!generatedAudioBase64) {
      alert('Sintetize o áudio primeiro.');
      return;
    }
    try {
      const mixedBuffer = await createMixedAudioBuffer(generatedAudioBase64, chimeSound);
      const mp3Blob = audioBufferToMp3Blob(mixedBuffer);
      const safeHeadline = (headline || 'locucao_varejo')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_');
      triggerFileDownload(mp3Blob, `${safeHeadline}_${storeProfile.name || 'loja'}.mp3`);
    } catch (err) {
      console.error(err);
      alert('Erro ao converter para MP3.');
    }
  };

  const handleDownloadWav = async () => {
    if (!generatedAudioBase64) {
      alert('Sintetize o áudio primeiro.');
      return;
    }
    try {
      const mixedBuffer = await createMixedAudioBuffer(generatedAudioBase64, chimeSound);
      const wavBlob = audioBufferToWavBlob(mixedBuffer);
      const safeHeadline = (headline || 'locucao_varejo')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_');
      triggerFileDownload(wavBlob, `${safeHeadline}_${storeProfile.name || 'loja'}.wav`);
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar WAV.');
    }
  };

  const handleSaveToHistory = () => {
    const activeVoiceObj = GEMINI_VOICES.find((v) => v.voiceName === selectedVoice);
    const newLocution: SavedLocution = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      storeName: storeProfile.name || 'Nosso Estabelecimento',
      headline: headline || 'Ofertas da Semana',
      script: scriptText,
      tone,
      targetDuration,
      voiceName: activeVoiceObj?.name || selectedVoice,
      voiceGender: activeVoiceObj?.gender || 'masculino',
      products,
      chimeSound,
      isFavorite: false,
      audioBase64: generatedAudioBase64 || undefined,
      audioMimeType: 'audio/wav',
    };

    onSaveLocution(newLocution);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(scriptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ============================================================ */}
      {/* NAVEGAÇÃO DE ETAPAS ELEGANTE E LEVE (SEM CAIXAS PESADAS)     */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'offers', step: '1', label: 'Ofertas & Perfil' },
            { id: 'script', step: '2', label: 'Roteiro & Ajustes' },
            { id: 'audio', step: '3', label: 'Gravação & Áudio' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStudioStep(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                studioStep === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                studioStep === tab.id
                  ? 'bg-white/20 text-white dark:bg-black/10 dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.step}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loja ativa em texto sutil */}
        <button
          onClick={onOpenStoreModal}
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">{storeProfile.name || 'Sua Loja'}</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 underline">Editar</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* ETAPA 1: OFERTAS & PERFIL (LEVE, AIRY, SEM CARTÕES DENTRO)   */}
      {/* ============================================================ */}
      {studioStep === 'offers' && (
        <div className="space-y-6">
          {/* Tom da Locução em Pills Elegantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Perfil de Voz & Clima do Anúncio
              </label>
              <span className="text-[11px] text-slate-400">
                Selecione o estilo de comunicação da loja
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'varejao_energico', label: 'Varejão Enérgico', hint: 'Popular & Alta Energia', emoji: '📢' },
                { id: 'acougue_especial', label: 'Açougue & Churrasco', hint: 'Carnes Nobres & Maciez', emoji: '🥩' },
                { id: 'amigavel_acolhedor', label: 'Amigável & Familiar', hint: 'Vizinhança & Lar', emoji: '🌿' },
                { id: 'festa_aniversario', label: 'Festa & Aniversário', hint: 'Sorteios & Prêmios', emoji: '🎉' },
                { id: 'oferta_relampago', label: 'Oferta Relâmpago', hint: 'Urgente nos 30 Minutos', emoji: '⚡' },
                { id: 'final_de_semana', label: 'Sextou Fim de Semana', hint: 'Churrasco & Bebida', emoji: '🏖️' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as LocutionTone)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition text-xs ${
                    tone === t.id
                      ? 'bg-amber-500/10 border-amber-500/80 text-amber-900 dark:text-amber-300 font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <div className="min-w-0 flex-1 truncate">
                    <div className="truncate">{t.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">{t.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duração Desejada em Segmento Minimalista */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Duração da Fala
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'curta', label: 'Curta (15s a 20s)', sub: '35–50 palavras · Flash' },
                { id: 'media', label: 'Média (30s a 40s)', sub: '75–95 palavras · Padrão' },
                { id: 'longa', label: 'Longa (60s a 90s)', sub: '145–195 palavras · Encarte' },
              ].map((d) => {
                const isSelected =
                  targetDuration === d.id ||
                  (d.id === 'curta' && targetDuration === '15s') ||
                  (d.id === 'media' && (targetDuration === '30s' || targetDuration === '45s')) ||
                  (d.id === 'longa' && targetDuration === '60s');

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setTargetDuration(d.id as TargetDuration)}
                    className={`py-2 px-3 rounded-xl text-center border transition ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-xs">{d.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{d.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Produtos em Linhas Limpas (Sem cartões pesados aninhados) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ofertas em Destaque
                </h3>
                <p className="text-[11px] text-slate-400">
                  Preencha os produtos e preços que o locutor vai anunciar
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddProduct}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </button>
            </div>

            {/* Chips rápidos de sugestão discretos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 shrink-0">Inserir rápido:</span>
              {SUGGESTED_PRODUCTS.slice(0, 8).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddQuickProduct(sug)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] shrink-0 transition"
                >
                  + {sug.name}
                </button>
              ))}
            </div>

            {/* Tabela / Linhas limpas de produtos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs"
                >
                  <span className="text-[11px] font-bold text-slate-400 shrink-0 sm:w-6">
                    #{idx + 1}
                  </span>

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Ex: Picanha Bovina Maturada..."
                      value={p.name}
                      onChange={(e) => handleUpdateProduct(p.id, 'name', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* De (Normal) */}
                  <div className="w-full sm:w-24">
                    <input
                      type="text"
                      placeholder="De R$ 0,00"
                      value={p.regularPrice || ''}
                      onChange={(e) => handleUpdateProduct(p.id, 'regularPrice', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-500 dark:text-slate-400 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Por (Oferta) */}
                  <div className="w-full sm:w-28">
                    <input
                      type="text"
                      required
                      placeholder="Por R$ 0,00*"
                      value={p.promoPrice}
                      onChange={(e) => handleUpdateProduct(p.id, 'promoPrice', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/60 rounded-lg px-2.5 py-1.5 font-bold text-amber-700 dark:text-amber-400 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  {/* Unidade */}
                  <div className="w-full sm:w-28">
                    <select
                      value={p.unit}
                      onChange={(e) => handleUpdateProduct(p.id, 'unit', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                      <option value="kg">o Quilo (kg)</option>
                      <option value="100g">100 gramas</option>
                      <option value="un">a Unidade</option>
                      <option value="bandeja">a Bandeja</option>
                      <option value="pacote">o Pacote</option>
                      <option value="peça">a Peça</option>
                      <option value="litro">o Litro</option>
                      <option value="fardo">o Fardo/Pack</option>
                    </select>
                  </div>

                  {/* Excluir */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(p.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition self-end sm:self-center"
                    title="Excluir item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Ação Primária Limpo */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={isGeneratingScript}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
            >
              {isGeneratingScript ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Escrevendo Roteiro com IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Gerar Roteiro Promocional →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ETAPA 2: ROTEIRO & AJUSTES (ESTILO EDITORIAL LIMPO)           */}
      {/* ============================================================ */}
      {studioStep === 'script' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            {/* Título & Teleprompter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden p-0"
                placeholder="Título do anúncio..."
              />

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{wordCount} palavras</span>
                <span>·</span>
                <span>~{estimatedSeconds}s de locução</span>
              </div>
            </div>

            {/* Caixa de Texto do Roteiro */}
            <div>
              <textarea
                rows={8}
                value={scriptText}
                onChange={(e) => {
                  setScriptText(e.target.value);
                  setGeneratedAudioBase64(null);
                }}
                className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:border-amber-500 font-sans resize-y"
                placeholder="O texto do locutor aparecerá aqui..."
              />
            </div>

            {/* Dica de Locução Sutil */}
            {audioTips && (
              <div className="text-xs text-amber-800 dark:text-amber-300/90 flex items-center gap-2 pt-1">
                <Bell className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Dica de Locutor:</strong> {audioTips}
                </span>
              </div>
            )}

            {/* Refinamento com IA */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ajustar Roteiro com IA:</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  '⚡ Encurtar fala',
                  '🔥 Mais energia de varejão',
                  '🥩 Enfatizar carne e brasa',
                  '💳 Mencionar Pix e cartões',
                  '🌿 Tornar mais acolhedor',
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRefineScript(sug)}
                    disabled={isRefining}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Instrução personalizada (ex: adicione que abrimos domingo até às 13h)..."
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRefineScript();
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleRefineScript()}
                  disabled={isRefining || !refineInstruction.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold transition disabled:opacity-40"
                >
                  {isRefining ? 'Ajustando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            {/* Navegação */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStudioStep('offers')}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Ofertas
              </button>

              <button
                type="button"
                onClick={() => setStudioStep('audio')}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Avançar para Gravação & Áudio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ETAPA 3: GRAVAÇÃO, VOZ & DOWNLOAD DO MP3                     */}
      {/* ============================================================ */}
      {studioStep === 'audio' && (
        <div className="space-y-5">
          {/* Seleção de Vozes & Vinheta */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Voz do Locutor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o locutor ideal para o estilo da sua loja
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {GEMINI_VOICES.map((v) => (
                <button
                  key={v.voiceName}
                  type="button"
                  onClick={() => {
                    setSelectedVoice(v.voiceName);
                    setGeneratedAudioBase64(null);
                  }}
                  className={`p-3 rounded-xl text-left border transition ${
                    selectedVoice === v.voiceName
                      ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{v.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {v.gender === 'masculino' ? '♂ Masc' : '♀ Fem'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {v.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Vinheta de Sino */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Sino de Abertura (Vinheta tocada antes do locutor falar):
                </span>
                <button
                  type="button"
                  onClick={() => playChimePreview(chimeSound)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Ouvir Sino
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'supermarket_bell', label: '🔔 Ding-Dong Clássico' },
                  { id: 'chime_tri', label: '✨ Atenção Tri-Tom' },
                  { id: 'alert_beep', label: '⚡ Alerta Urgente' },
                  { id: 'none', label: 'Sem Vinheta' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChimeSound(c.id as ChimeSoundType)}
                    className={`py-1.5 px-2 rounded-lg text-center border transition ${
                      chimeSound === c.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Console de Áudio e Download */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Gravar Locução & Gerar MP3
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ouça a prévia mixada com a vinheta e baixe o arquivo final
                </p>
              </div>

              {generatedAudioBase64 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Áudio Pronto
                </span>
              )}
            </div>

            {/* Ações de Síntese */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSynthesizeAudio}
                disabled={isSynthesizingAudio}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                {isSynthesizingAudio ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Sintetizando Voz Comercial...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Sintetizar Voz Comercial (Gemini)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={playWebSpeechSynthesis}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Prévia no Navegador</span>
              </button>
            </div>

            {/* Player de Áudio Moderno */}
            {generatedAudioBase64 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playGeneratedAudio()}
                      className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-xs transition"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Locução Comercial Mixada
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Sino + Voz {selectedVoice}
                      </div>
                    </div>
                  </div>

                  {/* Controle de Velocidade */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 px-1">Velocidade:</span>
                    {[1.0, 1.1, 1.2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => {
                          setPlaybackSpeed(spd);
                          if (audioElementRef.current) {
                            audioElementRef.current.playbackRate = spd;
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded-sm font-semibold transition ${
                          playbackSpeed === spd
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linha de Progresso */}
                {audioDuration > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-100"
                        style={{
                          width: `${(audioCurrentTime / audioDuration) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{Math.floor(audioCurrentTime)}s</span>
                      <span>{Math.floor(audioDuration)}s</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ações Finais: Download MP3 / WAV e Salvar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMp3}
                  disabled={!generatedAudioBase64}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar MP3
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWav}
                  disabled={!generatedAudioBase64}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FileAudio className="w-3.5 h-3.5" /> WAV
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Texto
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Salvo!
                    </>
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5" /> Salvar no Histórico
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Navegação de Volta */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setStudioStep('script')}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Roteiro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
