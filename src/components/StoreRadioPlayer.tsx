import React, { useState, useEffect, useRef } from 'react';
import { SavedLocution } from '../types';
import {
  Radio,
  Play,
  Pause,
  Clock,
  Volume2,
  Bell,
  CheckCircle2,
  AlertCircle,
  ListMusic,
} from 'lucide-react';
import { playChimePreview } from '../utils/audioExporter';

interface Props {
  savedList: SavedLocution[];
  activeStoreName: string;
}

export const StoreRadioPlayer: React.FC<Props> = ({ savedList, activeStoreName }) => {
  const [isPlayingAutomation, setIsPlayingAutomation] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5);
  const [selectedLocutionIds, setSelectedLocutionIds] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(intervalMinutes * 60);
  const [playHistoryLog, setPlayHistoryLog] = useState<
    Array<{ id: string; time: string; title: string }>
  >([]);
  const [currentlyPlayingItem, setCurrentlyPlayingItem] = useState<SavedLocution | null>(null);

  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedLocutionIds.length === 0 && savedList.length > 0) {
      setSelectedLocutionIds(savedList.slice(0, 3).map((s) => s.id));
    }
  }, [savedList]);

  useEffect(() => {
    if (!isPlayingAutomation) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerNextBroadcast();
          return intervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingAutomation, intervalMinutes, selectedLocutionIds]);

  const triggerNextBroadcast = () => {
    if (selectedLocutionIds.length === 0) return;
    const chosenId =
      selectedLocutionIds[Math.floor(Math.random() * selectedLocutionIds.length)];
    const item = savedList.find((s) => s.id === chosenId);
    if (!item) return;

    playLocutionItem(item);
  };

  const playLocutionItem = (item: SavedLocution) => {
    setCurrentlyPlayingItem(item);

    if (item.chimeSound && item.chimeSound !== 'none') {
      playChimePreview(item.chimeSound);
    }

    const now = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setPlayHistoryLog((prev) => [
      { id: Date.now().toString(), time: now, title: item.headline || 'Anúncio de Ofertas' },
      ...prev.slice(0, 9),
    ]);

    setTimeout(() => {
      if (item.audioBase64) {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        const audio = new Audio(`data:audio/wav;base64,${item.audioBase64}`);
        audioPlayerRef.current = audio;
        audio.onended = () => setCurrentlyPlayingItem(null);
        audio.play().catch((err) => console.error(err));
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.script);
        utterance.lang = 'pt-BR';
        utterance.onend = () => setCurrentlyPlayingItem(null);
        window.speechSynthesis.speak(utterance);
      }
    }, item.chimeSound !== 'none' ? 1400 : 100);
  };

  const toggleSelectLocution = (id: string) => {
    if (selectedLocutionIds.includes(id)) {
      setSelectedLocutionIds(selectedLocutionIds.filter((item) => item !== id));
    } else {
      setSelectedLocutionIds([...selectedLocutionIds, id]);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 inline-block mb-1.5">
            Automação de Rádio Interna
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Programador Automático de Locuções
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Conecte este dispositivo na caixa de som do{' '}
            <strong className="text-slate-800 dark:text-slate-200">{activeStoreName || 'Mercado'}</strong>. O
            sistema tocará o sino e as ofertas selecionadas nos intervalos programados,
            sem precisar interromper o atendimento.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedLocutionIds.length > 0) {
              triggerNextBroadcast();
            } else if (savedList.length > 0) {
              playLocutionItem(savedList[0]);
            }
          }}
          disabled={savedList.length === 0}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center gap-2 shrink-0"
        >
          <Bell className="w-4 h-4 fill-white" />
          Tocar Anúncio Agora no Som
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Painel de Transmissão
            </h3>

            {/* Contador */}
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                {isPlayingAutomation ? 'Próximo Anúncio em' : 'Automação Desligada'}
              </div>
              <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {formatCountdown(secondsRemaining)}
              </div>
              {currentlyPlayingItem && (
                <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> Tocando: {currentlyPlayingItem.headline}
                </div>
              )}
            </div>

            {/* Botão de Ligar / Desligar */}
            <button
              onClick={() => {
                if (savedList.length === 0) {
                  alert('Salve pelo menos uma locução no estúdio antes de ativar a rádio da loja.');
                  return;
                }
                setIsPlayingAutomation(!isPlayingAutomation);
                if (!isPlayingAutomation) {
                  setSecondsRemaining(intervalMinutes * 60);
                }
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs ${
                isPlayingAutomation
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlayingAutomation ? (
                <>
                  <Pause className="w-4 h-4 fill-white" /> Pausar Rádio da Loja
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Iniciar Rádio Automática
                </>
              )}
            </button>

            {/* Intervalo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Intervalo entre os Anúncios:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setIntervalMinutes(mins);
                      setSecondsRemaining(mins * 60);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium transition ${
                      intervalMinutes === mins
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Histórico de Execuções */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Registro de Veiculações
            </h4>
            {playHistoryLog.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-2">
                Nenhum anúncio veiculado nesta sessão ainda.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {playHistoryLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800"
                  >
                    <span className="truncate pr-2 text-slate-700 dark:text-slate-300">{log.title}</span>
                    <span className="font-mono text-slate-500 text-[11px] shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fila de Transmissão */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-amber-500" /> Fila de Ofertas para Transmissão
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecione os anúncios que devem entrar no rodízio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedLocutionIds(savedList.map((s) => s.id))}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Marcar Todos
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  onClick={() => setSelectedLocutionIds([])}
                  className="text-xs font-medium text-slate-500 hover:underline"
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {savedList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhuma locução gravada no histórico
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Crie seus comerciais no Estúdio e clique em "Salvar no Histórico" para adicioná-los à rádio da loja.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {savedList.map((item) => {
                  const isChecked = selectedLocutionIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                        isChecked
                          ? 'bg-slate-50 dark:bg-slate-950 border-amber-400/80 dark:border-amber-500/40 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectLocution(item.id)}
                          className="mt-1 w-4 h-4 rounded-sm text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.headline || 'Locução Comercial'}
                            </h4>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {item.targetDuration === 'curta' || item.targetDuration === '15s'
                                ? 'Curta (15s-20s)'
                                : item.targetDuration === 'longa' || item.targetDuration === '60s'
                                ? 'Longa (60s-90s)'
                                : 'Média (30s-40s)'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            "{item.script}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => playLocutionItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                      >
                        <Play className="w-3 h-3 fill-current" /> Tocar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
