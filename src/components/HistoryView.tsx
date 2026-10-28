import React, { useState, useRef } from 'react';
import { SavedLocution } from '../types';
import {
  History,
  Star,
  Play,
  Pause,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  triggerFileDownload,
  createMixedAudioBuffer,
  audioBufferToMp3Blob,
  audioBufferToWavBlob,
} from '../utils/audioExporter';

interface Props {
  savedList: SavedLocution[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onLoadIntoStudio: (item: SavedLocution) => void;
}

export const HistoryView: React.FC<Props> = ({
  savedList,
  onToggleFavorite,
  onDelete,
  onLoadIntoStudio,
}) => {
  const [search, setSearch] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredList = savedList.filter((item) => {
    const matchesFav = !filterFavorites || item.isFavorite;
    const matchesSearch =
      item.headline.toLowerCase().includes(search.toLowerCase()) ||
      item.script.toLowerCase().includes(search.toLowerCase()) ||
      item.storeName.toLowerCase().includes(search.toLowerCase());
    return matchesFav && matchesSearch;
  });

  const synthesizeAudioForItem = async (item: SavedLocution): Promise<string | null> => {
    if (item.audioBase64) return item.audioBase64;
    try {
      const voiceKey = item.voiceName.split(' ')[0] || 'Fenrir';
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.script,
          voiceName: voiceKey,
          tone: item.tone,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        item.audioBase64 = data.audioBase64;
        return data.audioBase64;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handlePlayAudio = async (item: SavedLocution) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);
    const base64 = await synthesizeAudioForItem(item);
    if (base64) {
      try {
        const mixed = await createMixedAudioBuffer(base64, item.chimeSound || 'supermarket_bell');
        const wavBlob = audioBufferToWavBlob(mixed);
        const url = URL.createObjectURL(wavBlob);
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(url);
        };
        await audio.play();
        return;
      } catch (e) {
        console.error(e);
      }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.script);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  const handleDownloadMp3 = async (item: SavedLocution) => {
    setDownloadingId(item.id);
    try {
      const base64 = await synthesizeAudioForItem(item);
      if (!base64) {
        setDownloadingId(null);
        return;
      }
      const mixedBuffer = await createMixedAudioBuffer(
        base64,
        item.chimeSound || 'supermarket_bell'
      );
      const mp3Blob = audioBufferToMp3Blob(mixedBuffer);
      const safeTitle = (item.headline || 'locucao_varejo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      triggerFileDownload(mp3Blob, `${safeTitle || 'locucao'}.mp3`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyText = (item: SavedLocution) => {
    navigator.clipboard.writeText(item.script);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Barra de Busca e Filtro Simples */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            Locuções Salvas ({filteredList.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ouça, baixe em MP3 ou reabra qualquer texto no estúdio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar no histórico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              filterFavorites
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-current' : ''}`} />
            <span>Favoritos</span>
          </button>
        </div>
      </div>

      {/* Lista de Locuções */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nenhuma locução encontrada
          </p>
          <p className="text-xs text-slate-400">
            Crie uma locução na aba "Criar Locução" e clique em "Salvar no Histórico".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.headline}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {item.storeName} &bull; Voz {item.voiceName}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id)}
                    className={`p-1.5 rounded-lg transition ${
                      item.isFavorite
                        ? 'text-amber-500'
                        : 'text-slate-400 hover:text-amber-500'
                    }`}
                    title="Favoritar"
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                "{item.script}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {playingId === item.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Ouvir
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMp3(item)}
                    disabled={downloadingId === item.id}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {downloadingId === item.id ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Gerando MP3...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Baixar MP3
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(item)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadIntoStudio(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Editar no Estúdio
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
