import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SavedLocution } from '../types';
import { History, PenLine, Radio, SkipForward, Square, Volume1, Volume2 } from 'lucide-react';
import { audioBufferToWavBlob, createMixedAudioBuffer, playChimePreview } from '../utils/audioExporter';
import { getAudio } from '../utils/audioStore';
import { Button, formatSeconds } from './ui';
import { useToast } from './Toast';

interface Props {
  savedList: SavedLocution[];
  onAirChange: (onAir: boolean) => void;
  onGoToStudio: () => void;
  onGoToHistory: () => void;
}

const INTERVALS = [3, 5, 10, 15, 30];
const SETTINGS_KEY = 'vozvarejo_radio';

interface LogEntry {
  key: number;
  time: string;
  title: string;
  browserVoice: boolean;
}

const loadSettings = (): { ids: string[] | null; interval: number; volume: number } => {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      ids: Array.isArray(saved.ids) ? saved.ids : null,
      interval: INTERVALS.includes(saved.interval) ? saved.interval : 5,
      volume: typeof saved.volume === 'number' ? saved.volume : 1,
    };
  } catch {
    return { ids: null, interval: 5, volume: 1 };
  }
};

export const RadioView: React.FC<Props> = ({ savedList, onAirChange, onGoToStudio, onGoToHistory }) => {
  const toast = useToast();
  const initial = useMemo(loadSettings, []);
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.ids ?? savedList.map((l) => l.id));
  const [intervalMin, setIntervalMin] = useState(initial.interval);
  const [volume, setVolume] = useState(initial.volume);
  const [onAir, setOnAir] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<SavedLocution | null>(null);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [withAudio, setWithAudio] = useState<Set<string>>(new Set());

  const onAirRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cursorRef = useRef(0);
  const wakeLockRef = useRef<any>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  // Temporizadores sempre leem os valores mais recentes
  const intervalRef = useRef(intervalMin);
  intervalRef.current = intervalMin;
  const savedListRef = useRef(savedList);
  savedListRef.current = savedList;

  const playlist = savedList.filter((l) => selectedIds.includes(l.id));

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ids: selectedIds, interval: intervalMin, volume }));
    } catch {}
  }, [selectedIds, intervalMin, volume]);

  // Descarta da seleção locuções que foram excluídas do histórico
  useEffect(() => {
    setSelectedIds((ids) => ids.filter((id) => savedList.some((l) => l.id === id)));
    Promise.all(savedList.map(async (l) => ((l.audioBase64 || (await getAudio(l.id))) ? l.id : null))).then((ids) =>
      setWithAudio(new Set(ids.filter(Boolean) as string[]))
    );
  }, [savedList]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!onAir) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [onAir]);

  useEffect(() => {
    onAirChange(onAir);
  }, [onAir]);

  useEffect(() => () => stopRadio(), []);

  // Mantém a tela acesa enquanto a rádio está no ar
  useEffect(() => {
    if (!onAir) return;
    const lock = async () => {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock?.request('screen');
      } catch {}
    };
    lock();
    const onVisible = () => document.visibilityState === 'visible' && lock();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [onAir]);

  const scheduleNext = () => {
    if (!onAirRef.current) return;
    const at = Date.now() + intervalRef.current * 60_000;
    setNextAt(at);
    setNow(Date.now());
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(playNext, at - Date.now());
  };

  const finishItem = () => {
    setNowPlaying(null);
    scheduleNext();
  };

  const playItem = async (item: SavedLocution) => {
    setNextAt(null);
    setPreparingId(item.id);
    const base64 = item.audioBase64 || (await getAudio(item.id));
    setPreparingId(null);
    if (!onAirRef.current) return;
    setNowPlaying(item);
    setLog((l) => [
      {
        key: Date.now(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        title: item.headline,
        browserVoice: !base64,
      },
      ...l.slice(0, 7),
    ]);

    if (base64) {
      try {
        const mixed = await createMixedAudioBuffer(base64, item.chimeSound || 'supermarket_bell');
        const url = URL.createObjectURL(audioBufferToWavBlob(mixed));
        const audio = new Audio(url);
        audio.volume = volumeRef.current;
        audioRef.current = audio;
        audio.onended = audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) finishItem();
        };
        await audio.play();
        return;
      } catch (e) {
        console.error(e);
      }
    }

    if (!('speechSynthesis' in window)) {
      finishItem();
      return;
    }
    if (item.chimeSound && item.chimeSound !== 'none') playChimePreview(item.chimeSound);
    setTimeout(
      () => {
        if (!onAirRef.current) return;
        const utterance = new SpeechSynthesisUtterance(item.script);
        utterance.lang = 'pt-BR';
        utterance.volume = volumeRef.current;
        const ptVoice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
        utterance.onend = utterance.onerror = () => finishItem();
        window.speechSynthesis.speak(utterance);
      },
      item.chimeSound !== 'none' ? 1100 : 50
    );
  };

  function playNext() {
    const list = savedListRef.current.filter((l) => selectedIdsRef.current.includes(l.id));
    if (!onAirRef.current || list.length === 0) {
      stopRadio();
      return;
    }
    const item = list[cursorRef.current % list.length];
    cursorRef.current = (cursorRef.current + 1) % list.length;
    playItem(item);
  }

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  function stopRadio() {
    onAirRef.current = false;
    clearTimeout(timeoutRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setOnAir(false);
    setNowPlaying(null);
    setPreparingId(null);
    setNextAt(null);
  }

  const startRadio = () => {
    if (playlist.length === 0) {
      toast.show('error', 'Escolha pelo menos uma locução', { description: 'Marque na lista o que deve tocar na loja.' });
      return;
    }
    onAirRef.current = true;
    setOnAir(true);
    toast.show('success', 'Rádio no ar', {
      description: `${playlist.length} ${playlist.length === 1 ? 'locução' : 'locuções'}, a cada ${intervalMin} min.`,
    });
    playNext();
  };

  const playNowSkip = () => {
    clearTimeout(timeoutRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setNowPlaying(null);
    playNext();
  };

  const toggle = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const remaining = nextAt ? Math.max(0, Math.round((nextAt - now) / 1000)) : 0;
  const browserCount = playlist.filter((l) => !withAudio.has(l.id)).length;

  if (savedList.length === 0) {
    return (
      <div className="pb-24 lg:pb-8">
        <Header />
        <div className="bg-surface border border-line rounded-xl px-6 py-14 text-center">
          <Radio className="w-8 h-8 text-subtle mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-fg">Nenhuma locução para tocar</p>
          <p className="text-sm text-muted mt-1 mb-5 max-w-sm mx-auto">
            Crie uma locução e salve no histórico. Ela aparece aqui para tocar no som da loja.
          </p>
          <Button variant="primary" size="sm" onClick={onGoToStudio} icon={<PenLine className="w-4 h-4" />}>
            Criar locução
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8">
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-5 items-start">
        {/* Controle da rádio */}
        <section
          aria-label="Controle da rádio"
          className={`lg:sticky lg:top-10 rounded-xl border p-5 sm:p-6 transition-colors ${
            onAir ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <div className="flex items-center gap-2.5" aria-live="polite">
            <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
              {onAir && <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />}
              <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${onAir ? 'bg-accent' : 'bg-subtle'}`} />
            </span>
            <span className={`text-sm font-semibold ${onAir ? 'text-accent-fg' : 'text-muted'}`}>
              {onAir ? 'No ar' : 'Rádio parada'}
            </span>
          </div>

          <div className="mt-4 min-h-[4.5rem]">
            {preparingId ? (
              <p className="text-base font-semibold text-fg">Preparando a próxima…</p>
            ) : nowPlaying ? (
              <>
                <p className="text-sm text-muted">Tocando agora</p>
                <p className="text-lg font-semibold text-fg leading-snug flex items-center gap-2">
                  <span className="flex items-end gap-[3px] h-4 shrink-0" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-accent animate-[eq_0.9s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
                      />
                    ))}
                  </span>
                  <span className="truncate">{nowPlaying.headline}</span>
                </p>
              </>
            ) : onAir && nextAt ? (
              <>
                <p className="text-sm text-muted">Próxima locução em</p>
                <p className="text-4xl font-semibold text-fg tabular-nums tracking-tight">{formatSeconds(remaining)}</p>
              </>
            ) : (
              <p className="text-sm text-muted leading-relaxed">
                Deixe esta tela aberta no aparelho ligado ao som da loja. As locuções marcadas tocam uma de cada vez, no
                intervalo escolhido.
              </p>
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-fg mb-2">Tocar a cada</legend>
            <div className="grid grid-cols-5 p-1 rounded-[10px] bg-sunken border border-line">
              {INTERVALS.map((m) => {
                const checked = intervalMin === m;
                return (
                  <label
                    key={m}
                    className={`flex items-center justify-center h-9 rounded-lg text-sm font-medium tabular-nums transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                      checked ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                    }`}
                  >
                    <input
                      type="radio"
                      name="radio-interval"
                      checked={checked}
                      onChange={() => setIntervalMin(m)}
                      className="sr-only"
                    />
                    {m} min
                  </label>
                );
              })}
            </div>
            {onAir && <p className="text-xs text-muted mt-1.5">O novo intervalo vale a partir da próxima locução.</p>}
          </fieldset>

          <div className="mt-5">
            <label htmlFor="radio-volume" className="text-sm font-medium text-fg">
              Volume
            </label>
            <div className="flex items-center gap-3 mt-2">
              <Volume1 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
              <input
                id="radio-volume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                className="flex-1 accent-[var(--accent)]"
              />
              <Volume2 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {onAir ? (
              <>
                <Button variant="primary" size="lg" onClick={stopRadio} icon={<Square className="w-4 h-4 fill-current" />}>
                  Parar rádio
                </Button>
                <Button
                  variant="secondary"
                  onClick={playNowSkip}
                  disabled={!!preparingId}
                  icon={<SkipForward className="w-4 h-4" />}
                >
                  {nowPlaying ? 'Pular para a próxima' : 'Tocar agora'}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={startRadio}
                disabled={playlist.length === 0}
                icon={<Radio className="w-4 h-4" />}
              >
                Colocar no ar
              </Button>
            )}
          </div>

          {browserCount > 0 && (
            <p className="text-sm text-muted mt-4 leading-snug">
              {browserCount === 1 ? '1 locução vai tocar' : `${browserCount} locuções vão tocar`} com a voz do aparelho.
              Ouça ou baixe no histórico com a IA ativa para guardar a voz profissional.
            </p>
          )}
        </section>

        <div className="space-y-5">
          {/* Seleção */}
          <section className="bg-surface border border-line rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-fg">O que toca na loja</h2>
                <p className="text-sm text-muted mt-0.5 tabular-nums">
                  {playlist.length} de {savedList.length} selecionadas, tocam nesta ordem
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedIds(playlist.length === savedList.length ? [] : savedList.map((l) => l.id))
                }
              >
                {playlist.length === savedList.length ? 'Desmarcar todas' : 'Marcar todas'}
              </Button>
            </div>
            <ul className="divide-y divide-line border border-line rounded-[10px]">
              {savedList.map((item) => {
                const checked = selectedIds.includes(item.id);
                const playing = nowPlaying?.id === item.id;
                return (
                  <li key={item.id}>
                    <label className="flex items-start gap-3 px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent rounded-[10px]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.id)}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="flex-1 min-w-0">
                        <span className={`block text-[0.9375rem] ${playing ? 'font-semibold text-accent-fg' : 'text-fg'}`}>
                          {item.headline}
                          {playing && <span className="sr-only"> (tocando agora)</span>}
                        </span>
                        <span className="block text-sm text-muted">
                          {withAudio.has(item.id) ? 'Voz profissional' : 'Voz do aparelho'} · {item.voiceName.split(' (')[0]}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={onGoToHistory} icon={<History className="w-4 h-4" />}>
              Gerenciar no histórico
            </Button>
          </section>

          {/* Registro */}
          <section className="bg-surface border border-line rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-fg mb-3">Tocou hoje</h2>
            {log.length === 0 ? (
              <p className="text-sm text-muted">Nada tocou ainda nesta sessão.</p>
            ) : (
              <ol className="space-y-2">
                {log.map((entry) => (
                  <li key={entry.key} className="flex items-baseline gap-3 text-sm">
                    <span className="text-muted tabular-nums w-11 shrink-0">{entry.time}</span>
                    <span className="text-fg flex-1 min-w-0 truncate">{entry.title}</span>
                    {entry.browserVoice && <span className="text-xs text-muted shrink-0">voz do aparelho</span>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const Header = () => (
  <header className="mb-6">
    <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-fg">Rádio da loja</h1>
    <p className="text-[0.9375rem] text-muted mt-1 max-w-2xl">
      Toque as locuções salvas no som da loja, uma de cada vez, no intervalo que você escolher.
    </p>
  </header>
);
