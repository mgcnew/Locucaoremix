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
  CheckCircle2,
  Settings2,
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
  onUpdateStoreProfile: (updated: StoreProfile) => void;
  onOpenStoreModal: () => void;
  onSaveLocution: (locution: SavedLocution) => void;
  activeTemplateToLoad?: SeasonalTemplate | null;
  onClearTemplateToLoad?: () => void;
}

export const LocutionStudio: React.FC<Props> = ({
  storeProfile,
  onUpdateStoreProfile,
  onOpenStoreModal,
  onSaveLocution,
  activeTemplateToLoad,
  onClearTemplateToLoad,
}) => {
  // Configurações da Campanha
  const [tone, setTone] = useState<LocutionTone>('varejao_energico');
  const [targetDuration, setTargetDuration] = useState<TargetDuration>('media');
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: '1',
      name: 'Picanha Bovina Maturada',
      promoPrice: '49,90',
      unit: 'kg',
    },
    {
      id: '2',
      name: 'Linguiça Toscana Especial',
      promoPrice: '18,90',
      unit: 'kg',
    },
    {
      id: '3',
      name: 'Carvão Vegetal 3kg',
      promoPrice: '13,90',
      unit: 'pacote',
    },
  ]);

  // Voz & Vinheta
  const [selectedVoice, setSelectedVoice] = useState('Fenrir');
  const [chimeSound, setChimeSound] = useState<ChimeSoundType>('supermarket_bell');

  // Roteiro
  const [headline, setHeadline] = useState('Ofertas da Semana');
  const [scriptText, setScriptText] = useState(
    `Atenção clientes amigos do ${storeProfile.name || 'nosso estabelecimento'}! Parou tudo para ouvir as melhores ofertas de hoje! Tem Picanha Bovina Maturada de primeira por apenas quarenta e nove e noventa o quilo! Linguiça Toscana Especial fresquinha a dezoito e noventa o quilo, e Carvão Vegetal pacote de três quilos por apenas treze e noventa! Qualidade garantida e economia de verdade para sua família! Vem aproveitar no ${storeProfile.name || 'nosso estabelecimento'}!`
  );

  // Refinamento com IA
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineSuccessMessage, setRefineSuccessMessage] = useState<string | null>(null);

  // Estados de Carregamento e Feedback
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Áudio Gerado
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Carregar template externo quando selecionado na aba de Modelos Prontos ou Histórico
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
      showToast(`Modelo "${activeTemplateToLoad.title}" carregado!`, 'success');
      if (onClearTemplateToLoad) onClearTemplateToLoad();
    }
  }, [activeTemplateToLoad, storeProfile.name]);

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.max(5, Math.round(wordCount / 2.3));

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
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddQuickProduct = (item: (typeof SUGGESTED_PRODUCTS)[0]) => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        name: item.name,
        promoPrice: item.defaultPromo,
        unit: item.unit,
      },
    ]);
  };

  // 1. Gerar Roteiro com IA
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
        }),
      });

      const data = await response.json();
      if (data.success && data.script) {
        setScriptText(data.script);
        if (data.headline) setHeadline(data.headline);
        showToast('Texto promocional criado com sucesso!', 'success');
      } else {
        showToast(data.error || 'Não foi possível gerar o texto.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao gerar roteiro.', 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 2. Ajustar Roteiro com IA
  const handleRefineScript = async (customText?: string) => {
    const instruction = (customText || refineInstruction).trim();
    if (!instruction || !scriptText.trim()) return;

    setIsRefining(true);
    setRefineSuccessMessage(null);

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
        setRefineSuccessMessage('Roteiro ajustado com sucesso!');
        setTimeout(() => setRefineSuccessMessage(null), 3500);
      } else {
        showToast(data.error || 'Não foi possível ajustar o roteiro.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao ajustar o roteiro.', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  // Helper interno: solicita síntese de voz no servidor e retorna base64 WAV
  const requestAudioSynthesis = async (): Promise<string | null> => {
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
      return data.audioBase64;
    }
    return null;
  };

  // 3. Ouvir Prévia
  const handleListenPreview = async () => {
    if (!scriptText.trim()) return;

    // Se já estiver tocando, pausa
    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    // Se já temos o áudio gerado para este texto/voz, toca imediatamente
    if (generatedAudioBase64) {
      await playGeneratedAudio(generatedAudioBase64);
      return;
    }

    // Caso contrário, sintetiza com Gemini TTS e toca
    setIsSynthesizingAudio(true);
    try {
      const base64 = await requestAudioSynthesis();
      if (base64) {
        await playGeneratedAudio(base64);
      } else {
        playWebSpeechSynthesis();
      }
    } catch (err) {
      console.error(err);
      playWebSpeechSynthesis();
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // Prévia de contingência no navegador
  const playWebSpeechSynthesis = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Seu navegador não suporta síntese de voz.', 'error');
      return;
    }

    window.speechSynthesis.cancel();
    if (chimeSound !== 'none') {
      playChimePreview(chimeSound);
    }

    setTimeout(
      () => {
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = 'pt-BR';
        utterance.rate = tone === 'varejao_energico' || tone === 'oferta_relampago' ? 1.12 : 1.0;
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find((v) => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;

        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
      },
      chimeSound !== 'none' ? 1100 : 50
    );
  };

  // Toca o buffer mixado (Sino + Voz)
  const playGeneratedAudio = async (base64: string) => {
    try {
      const mixedBuffer = await createMixedAudioBuffer(base64, chimeSound);
      const wavBlob = audioBufferToWavBlob(mixedBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);

      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setIsPlayingAudio(true);
    } catch (e) {
      console.error('Erro na reprodução:', e);
      playWebSpeechSynthesis();
    }
  };

  // 4. Baixar MP3 (em 1 clique: sintetiza automaticamente se ainda não tiver gerado!)
  const handleDownloadMp3 = async () => {
    if (!scriptText.trim()) {
      showToast('Escreva ou gere um roteiro antes de baixar o MP3.', 'error');
      return;
    }

    setIsDownloadingMp3(true);
    try {
      let base64 = generatedAudioBase64;
      if (!base64) {
        showToast('Gerando voz profissional e preparando seu MP3...', 'info');
        base64 = await requestAudioSynthesis();
      }

      if (!base64) {
        showToast('Serviço de voz ocupado. Tente novamente em alguns segundos.', 'error');
        return;
      }

      const mixedBuffer = await createMixedAudioBuffer(base64, chimeSound);
      const mp3Blob = audioBufferToMp3Blob(mixedBuffer);
      const safeHeadline = (headline || 'locucao_varejo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      const safeStore = (storeProfile.name || 'loja')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      triggerFileDownload(mp3Blob, `${safeHeadline || 'locucao'}_${safeStore || 'mercado'}.mp3`);
      showToast('Download do MP3 concluído!', 'success');
    } catch (err) {
      console.error('Erro ao exportar MP3:', err);
      showToast('Erro ao gerar o arquivo MP3.', 'error');
    } finally {
      setIsDownloadingMp3(false);
    }
  };

  // Salvar no Histórico
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
    showToast('Locução salva no histórico!', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(scriptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Notificação Flutuante Sutil */}
      {statusMessage && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between border transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
              : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* LAYOUT EM 2 COLUNAS AMIGÁVEL E DIRETO AO PONTO                    */}
      {/* Coluna 1: Loja + Ofertas | Coluna 2: Roteiro + Voz + Baixar MP3   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA (5 cols): DADOS DO ANÚNCIO E PRODUTOS */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
          {/* 1. Nome do Estabelecimento */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-500" />
                Nome do Mercado ou Açougue
              </label>
              <button
                type="button"
                onClick={onOpenStoreModal}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Settings2 className="w-3 h-3" /> Mais detalhes
              </button>
            </div>
            <input
              type="text"
              value={storeProfile.name}
              onChange={(e) =>
                onUpdateStoreProfile({ ...storeProfile, name: e.target.value })
              }
              placeholder="Ex: Açougue Boi de Ouro / Supermercado Família"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* 2. Estilo e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                Estilo da Locução
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as LocutionTone)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
              >
                <option value="varejao_energico">📢 Varejão Animado</option>
                <option value="acougue_especial">🥩 Açougue & Churrasco</option>
                <option value="amigavel_acolhedor">🌿 Amigável & Familiar</option>
                <option value="festa_aniversario">🎉 Festa & Aniversário</option>
                <option value="oferta_relampago">⚡ Oferta Relâmpago</option>
                <option value="final_de_semana">🏖️ Especial Fim de Semana</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                Duração do Áudio
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'curta', label: 'Curta', sub: '15s' },
                  { id: 'media', label: 'Média', sub: '30s' },
                  { id: 'longa', label: 'Longa', sub: '60s' },
                ].map((d) => {
                  const active =
                    targetDuration === d.id ||
                    (d.id === 'curta' && targetDuration === '15s') ||
                    (d.id === 'media' && (targetDuration === '30s' || targetDuration === '45s')) ||
                    (d.id === 'longa' && targetDuration === '60s');
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setTargetDuration(d.id as TargetDuration)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {d.label} <span className="text-[10px] opacity-70">({d.sub})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Produtos e Ofertas Simplificados */}
          <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Produtos em Oferta
              </label>
              <button
                type="button"
                onClick={handleAddProduct}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar produto
              </button>
            </div>

            {/* Sugestões rápidas em 1 clique */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PRODUCTS.slice(0, 5).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddQuickProduct(sug)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition"
                >
                  + {sug.name}
                </button>
              ))}
            </div>

            {/* Linhas simples: Produto | Preço | Unidade */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Produto (ex: Picanha)"
                    value={p.name}
                    onChange={(e) => handleUpdateProduct(p.id, 'name', e.target.value)}
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="R$ 49,90"
                    value={p.promoPrice}
                    onChange={(e) => handleUpdateProduct(p.id, 'promoPrice', e.target.value)}
                    className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                  <select
                    value={p.unit}
                    onChange={(e) => handleUpdateProduct(p.id, 'unit', e.target.value)}
                    className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden"
                  >
                    <option value="kg">kg</option>
                    <option value="un">unid.</option>
                    <option value="pacote">pct</option>
                    <option value="bandeja">band.</option>
                    <option value="litro">litro</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(p.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition"
                    title="Remover item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Gerar Texto */}
          <button
            type="button"
            onClick={handleGenerateScript}
            disabled={isGeneratingScript}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isGeneratingScript ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Criando Texto Promocional...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Criar Texto com IA</span>
              </>
            )}
          </button>
        </div>

        {/* COLUNA DIREITA (7 cols): ROTEIRO + AJUSTE IA + VOZ E DOWNLOAD MP3 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
          {/* Cabeçalho do Roteiro */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="text-base font-bold text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden p-0 flex-1"
              placeholder="Título da locução..."
            />
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{wordCount} palavras (~{estimatedSeconds}s)</span>
            </div>
          </div>

          {/* Editor do Texto da Locução */}
          <div>
            <textarea
              rows={6}
              value={scriptText}
              onChange={(e) => {
                setScriptText(e.target.value);
                setGeneratedAudioBase64(null);
              }}
              className="w-full bg-slate-50/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:border-amber-500 resize-y"
              placeholder="O texto da locução aparecerá aqui. Você também pode digitar ou editar livremente..."
            />
          </div>

          {/* Ajustar Roteiro com IA (Simples e Funcional) */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ajustar Roteiro com IA
              </span>
              {refineSuccessMessage && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {refineSuccessMessage}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '⚡ Deixar mais curto', prompt: 'Deixe o texto mais curto e direto' },
                { label: '🔥 Mais energia de varejão', prompt: 'Coloque muito mais energia de locutor de varejão' },
                { label: '🥩 Destacar carnes e churrasco', prompt: 'Destaque a maciez e frescor das carnes para churrasco' },
                { label: '💳 Incluir Pix e Cartão', prompt: 'Inclua no final que aceitamos Pix e cartões' },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRefineScript(btn.prompt)}
                  disabled={isRefining}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-200 transition disabled:opacity-50"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ou digite o que mudar (ex: fale que abrimos domingo até 13h)..."
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRefineScript();
                }}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleRefineScript()}
                disabled={isRefining || !refineInstruction.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition disabled:opacity-40 shrink-0"
              >
                {isRefining ? 'Ajustando...' : 'Aplicar'}
              </button>
            </div>
          </div>

          {/* Seleção de Voz & Sino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                Voz do Locutor (Masculina / Feminina)
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  setGeneratedAudioBase64(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
              >
                {GEMINI_VOICES.map((v) => (
                  <option key={v.voiceName} value={v.voiceName}>
                    {v.gender === 'masculino' ? '♂ ' : '♀ '}
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  Sino de Abertura
                </label>
                {chimeSound !== 'none' && (
                  <button
                    type="button"
                    onClick={() => playChimePreview(chimeSound)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Testar som
                  </button>
                )}
              </div>
              <select
                value={chimeSound}
                onChange={(e) => setChimeSound(e.target.value as ChimeSoundType)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
              >
                <option value="supermarket_bell">🔔 Ding-Dong de Supermercado</option>
                <option value="chime_tri">✨ Sino Tri-Tom Comercial</option>
                <option value="alert_beep">⚡ Alerta Oferta Relâmpago</option>
                <option value="party_fanfare">🎉 Vinheta de Festa</option>
                <option value="none">🔇 Sem sino de abertura</option>
              </select>
            </div>
          </div>

          {/* BOTÕES PRINCIPAIS DE ÁUDIO: OUVIR PRÉVIA E BAIXAR MP3 */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleListenPreview}
              disabled={isSynthesizingAudio || isDownloadingMp3}
              className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {isSynthesizingAudio ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Gerando Voz...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar Prévia</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ouvir Prévia da Locução</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMp3}
              disabled={isDownloadingMp3 || isSynthesizingAudio}
              className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {isDownloadingMp3 ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Preparando MP3...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Locução em MP3</span>
                </>
              )}
            </button>
          </div>

          {/* Ações Secundárias (Salvar no Histórico & Copiar Texto) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={playWebSpeechSynthesis}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Teste rápido (voz local)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
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
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Salvo!
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
      </div>
    </div>
  );
};
