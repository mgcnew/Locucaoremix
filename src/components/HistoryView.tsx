import React, { useEffect, useRef, useState } from 'react';
import { SavedLocution } from '../types';
import { GEMINI_VOICES } from '../data/voices';
import { Check, Copy, Download, History, Pause, PenLine, Play, Search, SearchX, Share2, Star, Trash2 } from 'lucide-react';
import {
  triggerFileDownload,
  createMixedAudioBuffer,
  audioBufferToMp3Blob,
  audioBufferToWavBlob,
  shareAudioFile,
} from '../utils/audioExporter';
import { getAudio, putAudio } from '../utils/audioStore';
import { Button, IconButton, slugify } from './ui';
import { useToast } from './Toast';
import { AiStatus } from './Sidebar';

interface Props {
  savedList: SavedLocution[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onLoadIntoStudio: (item: SavedLocution) => void;
  onGoToStudio: () => void;
  aiStatus: AiStatus;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const HistoryView: React.FC<Props> = ({
  savedList,
  onToggleFavorite,
  onDelete,
  onLoadIntoStudio,
  onGoToStudio,
  aiStatus,
}) => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef(new Map<string, string>());

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    []
  );

  const q = normalize(search.trim());
  const filteredList = savedList.filter(
    (item) =>
      (!filterFavorites || item.isFavorite) &&
      (!q || [item.headline, item.script, item.storeName].some((f) => normalize(f).includes(q)))
  );
  const favoritesCount = savedList.filter((i) => i.isFavorite).length;

  /** Busca ou gera a voz profissional do item. Lança Error com mensagem amigável. */
  const synthesizeAudioForItem = async (item: SavedLocution): Promise<string> => {
    const cached = item.audioBase64 || audioCache.current.get(item.id) || (await getAudio(item.id));
    if (cached) return cached;
    if (aiStatus === 'offline') throw new Error('A voz profissional ainda não está ativada. Peça a quem instalou o VozVarejo para ativar a IA.');
    const matchedVoice =
      GEMINI_VOICES.find(
        (v) =>
          v.id === item.voiceId ||
          v.name === item.voiceName ||
          v.voiceName === item.voiceName.split(' ')[0]
      ) || GEMINI_VOICES[0];
    let data: any;
    try {
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.script,
          voiceName: matchedVoice.voiceName,
          tone: item.tone,
          styleInstruction: matchedVoice.styleInstruction,
          isMultiSpeaker: Boolean(matchedVoice.isMultiSpeaker),
        }),
      });
      data = await res.json();
    } catch {
      throw new Error('Sem conexão com o servidor.');
    }
    if (data.success && data.audioBase64) {
      audioCache.current.set(item.id, data.audioBase64);
      putAudio(item.id, data.audioBase64);
      return data.audioBase64;
    }
    throw new Error(data.error || 'O serviço de voz não respondeu.');
  };

  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlayingId(null);
  };

  const playBrowserVoice = (item: SavedLocution) => {
    if (!('speechSynthesis' in window)) {
      setPlayingId(null);
      toast.show('error', 'Seu navegador não tem voz sintetizada', { description: 'Tente pelo Chrome ou Edge.' });
      return;
    }
    const utterance = new SpeechSynthesisUtterance(item.script);
    utterance.lang = 'pt-BR';
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    setPlayingId(item.id);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayAudio = async (item: SavedLocution) => {
    if (playingId === item.id) {
      stopAll();
      return;
    }
    stopAll();
    setLoadingAudioId(item.id);
    try {
      const base64 = await synthesizeAudioForItem(item);
      const mixed = await createMixedAudioBuffer(base64, item.chimeSound || 'supermarket_bell');
      const url = URL.createObjectURL(audioBufferToWavBlob(mixed));
      const audio = new Audio(url);
      audioRef.current = audio;
      const finish = () => {
        setPlayingId((id) => (id === item.id ? null : id));
        URL.revokeObjectURL(url);
      };
      audio.onended = finish;
      audio.onerror = finish;
      await audio.play();
      setPlayingId(item.id);
    } catch (err) {
      if (aiStatus !== 'offline') {
        toast.show('info', 'Tocando com a voz do navegador', {
          description: err instanceof Error ? err.message : undefined,
        });
      }
      playBrowserVoice(item);
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleDownloadMp3 = async (item: SavedLocution) => {
    setDownloadingId(item.id);
    const toastId = toast.show('loading', 'Preparando o MP3…', { description: item.headline });
    try {
      const base64 = await synthesizeAudioForItem(item);
      const mixed = await createMixedAudioBuffer(base64, item.chimeSound || 'supermarket_bell');
      const fileName = `${slugify(item.headline) || 'locucao'}.mp3`;
      triggerFileDownload(audioBufferToMp3Blob(mixed), fileName);
      toast.update(toastId, 'success', 'MP3 baixado', { description: fileName });
    } catch (err) {
      toast.update(toastId, 'error', 'Não foi possível gerar o MP3', {
        description: err instanceof Error ? err.message : 'Tente de novo em alguns segundos.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (item: SavedLocution) => {
    setSharingId(item.id);
    try {
      const base64 = await synthesizeAudioForItem(item);
      const mixed = await createMixedAudioBuffer(base64, item.chimeSound || 'supermarket_bell');
      const fileName = `${slugify(item.headline) || 'locucao'}.mp3`;
      const result = await shareAudioFile(audioBufferToMp3Blob(mixed), fileName, item.headline);
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
      setSharingId(null);
    }
  };

  const handleCopyText = async (item: SavedLocution) => {
    try {
      await navigator.clipboard.writeText(item.script);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.show('error', 'Não foi possível copiar', { description: 'Abra o texto e copie manualmente.' });
    }
  };

  const handleDelete = (item: SavedLocution) => {
    if (playingId === item.id) stopAll();
    onDelete(item.id);
  };

  return (
    <div className="pb-24 lg:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-fg">Histórico</h1>
        <p className="text-[0.9375rem] text-muted mt-1">Ouça de novo, baixe o MP3 ou reabra qualquer locução no estúdio.</p>
      </header>

      {aiStatus === 'offline' && savedList.length > 0 && (
        <p className="text-sm text-muted mb-4" role="note">
          Modo sem IA: as prévias tocam com a voz do próprio aparelho e o download de MP3 fica indisponível.
        </p>
      )}

      {savedList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <label htmlFor="history-search" className="sr-only">
              Buscar no histórico
            </label>
            <input
              id="history-search"
              type="search"
              placeholder="Buscar por título ou texto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-9"
            />
          </div>
          <Button
            variant="secondary"
            aria-pressed={filterFavorites}
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={filterFavorites ? 'border-accent bg-accent-soft text-accent-fg hover:bg-accent-soft' : ''}
            icon={<Star className={`w-4 h-4 ${filterFavorites ? 'fill-current' : ''}`} />}
          >
            Favoritos <span className="tabular-nums text-muted font-normal">{favoritesCount}</span>
          </Button>
          <p className="text-sm text-muted sm:ml-auto tabular-nums" aria-live="polite">
            {filteredList.length} de {savedList.length}
          </p>
        </div>
      )}

      {savedList.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl px-6 py-14 text-center">
          <History className="w-8 h-8 text-subtle mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-fg">Nenhuma locução salva ainda</p>
          <p className="text-sm text-muted mt-1 mb-5 max-w-sm mx-auto">
            No último passo do estúdio, toque em “Salvar no histórico” para guardar a locução aqui.
          </p>
          <Button variant="primary" size="sm" onClick={onGoToStudio} icon={<PenLine className="w-4 h-4" />}>
            Criar locução
          </Button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl px-6 py-14 text-center">
          <SearchX className="w-8 h-8 text-subtle mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-fg">Nada encontrado</p>
          <p className="text-sm text-muted mt-1 mb-5">
            {filterFavorites && !q ? 'Você ainda não marcou nenhuma favorita.' : 'Tente outra palavra ou limpe os filtros.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setFilterFavorites(false);
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredList.map((item) => {
            const isPlaying = playingId === item.id;
            const isLoading = loadingAudioId === item.id;
            const expanded = expandedId === item.id;
            return (
              <li key={item.id} className="bg-surface border border-line rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-fg leading-snug">
                      {item.headline}
                      {item.id.startsWith('starter_') && (
                        <span className="ml-2 align-middle text-xs font-medium text-muted px-1.5 py-0.5 rounded bg-sunken border border-line">
                          Exemplo
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-muted mt-0.5">
                      {formatDate(item.createdAt)} · Voz {item.voiceName.split(' (')[0]}
                      <span className="hidden sm:inline"> · {item.storeName}</span>
                    </p>
                  </div>
                  <IconButton
                    label={item.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorita'}
                    aria-pressed={item.isFavorite}
                    onClick={() => onToggleFavorite(item.id)}
                    className={item.isFavorite ? 'text-warning hover:text-warning' : ''}
                  >
                    <Star className={`w-[18px] h-[18px] ${item.isFavorite ? 'fill-current' : ''}`} />
                  </IconButton>
                </div>

                <p className={`mt-3 text-[0.9375rem] text-fg/85 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{item.script}</p>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  aria-expanded={expanded}
                  className="mt-1 text-sm font-medium text-accent-fg hover:underline"
                >
                  {expanded ? 'Mostrar menos' : 'Ver texto completo'}
                </button>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePlayAudio(item)}
                    loading={isLoading}
                    icon={isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  >
                    {isLoading ? 'Gerando voz…' : isPlaying ? 'Parar' : 'Ouvir'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadMp3(item)}
                    disabled={aiStatus === 'offline'}
                    title={aiStatus === 'offline' ? 'MP3 indisponível no modo sem IA' : undefined}
                    loading={downloadingId === item.id}
                    icon={<Download className="w-4 h-4" />}
                  >
                    Baixar MP3
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShare(item)}
                    disabled={aiStatus === 'offline'}
                    title={aiStatus === 'offline' ? 'Compartilhar MP3 indisponível no modo sem IA' : undefined}
                    loading={sharingId === item.id}
                    icon={<Share2 className="w-4 h-4" />}
                  >
                    Compartilhar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyText(item)}
                    icon={copiedId === item.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  >
                    {copiedId === item.id ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onLoadIntoStudio(item)} icon={<PenLine className="w-4 h-4" />}>
                    Editar no estúdio
                  </Button>
                  <IconButton label={`Excluir “${item.headline}”`} tone="danger" onClick={() => handleDelete(item)} className="ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
