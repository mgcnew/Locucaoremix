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
  FileDown,
  Upload,
  Calendar,
} from 'lucide-react';
import {
  triggerFileDownload,
  base64ToArrayBuffer,
  getAudioContext,
  audioBufferToMp3Blob,
} from '../utils/audioExporter';

interface Props {
  savedList: SavedLocution[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onLoadIntoStudio: (item: SavedLocution) => void;
  onImportBackup: (items: SavedLocution[]) => void;
}

export const HistoryView: React.FC<Props> = ({
  savedList,
  onToggleFavorite,
  onDelete,
  onLoadIntoStudio,
  onImportBackup,
}) => {
  const [search, setSearch] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredList = savedList.filter((item) => {
    const matchesFav = !filterFavorites || item.isFavorite;
    const matchesSearch =
      item.headline.toLowerCase().includes(search.toLowerCase()) ||
      item.script.toLowerCase().includes(search.toLowerCase()) ||
      item.storeName.toLowerCase().includes(search.toLowerCase()) ||
      item.products.some((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFav && matchesSearch;
  });

  const handlePlayAudio = (item: SavedLocution) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (item.audioBase64) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${item.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.play().catch((err) => console.error('Erro ao tocar áudio:', err));
      setPlayingId(item.id);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.script);
        utterance.lang = 'pt-BR';
        utterance.onend = () => setPlayingId(null);
        window.speechSynthesis.speak(utterance);
        setPlayingId(item.id);
      }
    }
  };

  const handleDownloadMp3 = async (item: SavedLocution) => {
    if (!item.audioBase64) {
      alert('Esta gravação antiga não possui o arquivo de áudio em cache. Carregue-a no estúdio para sintetizar o MP3.');
      return;
    }
    try {
      const ctx = getAudioContext();
      const arrayBuf = base64ToArrayBuffer(item.audioBase64);
      const audioBuffer = await ctx.decodeAudioData(arrayBuf);
      const mp3Blob = audioBufferToMp3Blob(audioBuffer);
      const safeTitle = (item.headline || 'locucao_varejo')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      triggerFileDownload(mp3Blob, `${safeTitle}.mp3`);
    } catch (e) {
      console.error(e);
      alert('Erro ao converter áudio para MP3.');
    }
  };

  const handleCopyText = (item: SavedLocution) => {
    navigator.clipboard.writeText(item.script);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedList, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `backup_locucoes_vozvarejo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          alert(`Backup importado com sucesso! ${parsed.length} locuções carregadas.`);
        }
      } catch (err) {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Banner and Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            Histórico de Locuções Salvas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Todas as suas locuções gravadas ficam salvas localmente no navegador. Você pode reouvir, baixar o MP3 ou reabrir no estúdio para atualizar os preços da próxima semana.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            title="Importar arquivo de backup"
          >
            <Upload className="w-3.5 h-3.5" /> Importar
          </button>
          <button
            onClick={handleExportBackup}
            disabled={savedList.length === 0}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            title="Exportar todas as locuções"
          >
            <FileDown className="w-3.5 h-3.5" /> Exportar Backup
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por produto, texto ou loja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              filterFavorites
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorites ? 'fill-white' : ''}`} />
            Favoritos
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {filteredList.length} de {savedList.length} gravações
        </div>
      </div>

      {/* List */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhuma locução encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {savedList.length === 0
              ? 'Você ainda não salvou nenhuma locução. Crie sua oferta no Estúdio e clique em Salvar no Histórico!'
              : 'Nenhum resultado corresponde à sua busca ou filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      {item.storeName || 'Loja'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.headline || 'Locução Comercial'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className={`p-1.5 rounded-lg transition ${
                        item.isFavorite
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={item.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Date & Meta */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>·</span>
                  <span>Voz: {item.voiceName || 'Padrão'}</span>
                  <span>·</span>
                  <span>
                    {item.targetDuration === 'curta' || item.targetDuration === '15s'
                      ? 'Curta (15s-20s)'
                      : item.targetDuration === 'longa' || item.targetDuration === '60s'
                      ? 'Longa (60s-90s)'
                      : 'Média (30s-40s)'}
                  </span>
                </div>

                {/* Script text snippet */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-32 overflow-y-auto mb-3 select-all">
                  "{item.script}"
                </div>

                {/* Products listed */}
                {item.products && item.products.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.products.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {p.name}: <strong className="text-slate-900 dark:text-white">R$ {p.promoPrice}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePlayAudio(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
                  >
                    {playingId === item.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Ouvir Prévia
                      </>
                    )}
                  </button>

                  {item.audioBase64 && (
                    <button
                      onClick={() => handleDownloadMp3(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Baixar MP3"
                    >
                      <Download className="w-3.5 h-3.5" /> MP3
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(item)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs"
                    title="Copiar texto"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onLoadIntoStudio(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                    title="Editar no Estúdio"
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
