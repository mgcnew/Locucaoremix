import React from 'react';
import { AudioLines, BookOpen, Check, History, Moon, PenLine, Radio, Store, Sun } from 'lucide-react';

export type AppTab = 'studio' | 'templates' | 'history' | 'radio';
export type StudioStep = 1 | 2 | 3;
export type AiStatus = 'checking' | 'online' | 'offline';

export const STUDIO_STEPS: { id: StudioStep; label: string; hint: string }[] = [
  { id: 1, label: 'Ofertas', hint: 'Loja e produtos' },
  { id: 2, label: 'Roteiro', hint: 'Texto do locutor' },
  { id: 3, label: 'Voz e MP3', hint: 'Ouvir e baixar' },
];

interface Props {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  studioStep: StudioStep;
  setStudioStep: (step: StudioStep) => void;
  completedSteps: Record<StudioStep, boolean>;
  savedCount: number;
  radioOnAir: boolean;
  storeName: string;
  storeIsExample: boolean;
  onEditStore: () => void;
  aiStatus: AiStatus;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <span className="grid place-items-center w-8 h-8 rounded-lg bg-ink text-on-ink" aria-hidden="true">
      <AudioLines className="w-[18px] h-[18px]" />
    </span>
    <span className="text-[17px] font-semibold tracking-tight text-fg">VozVarejo</span>
  </div>
);

export const AiBadge: React.FC<{ status: AiStatus; compact?: boolean }> = ({ status, compact }) => {
  const map = {
    checking: { dot: 'bg-subtle', text: 'Verificando IA…', title: 'Verificando conexão com a IA' },
    online: { dot: 'bg-success', text: 'IA conectada', title: 'Roteiros e vozes profissionais com Gemini' },
    offline: {
      dot: 'bg-warning',
      text: 'Modo sem IA',
      title: 'Roteiro automático e voz do próprio aparelho. MP3 com voz profissional indisponível.',
    },
  }[status];
  if (compact) {
    if (status !== 'offline') return <span className="sr-only">{map.text}</span>;
    return (
      <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-warning-soft text-xs font-semibold text-warning">
        <span className={`w-1.5 h-1.5 rounded-full ${map.dot}`} aria-hidden="true" />
        Sem IA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" title={map.title}>
      <span className={`w-2 h-2 rounded-full ${map.dot}`} aria-hidden="true" />
      {map.text}
    </span>
  );
};

const ThemeButton: React.FC<{ theme: 'light' | 'dark'; onToggle: () => void; withLabel?: boolean }> = ({
  theme,
  onToggle,
  withLabel,
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
    className={`inline-flex items-center gap-2 rounded-lg text-sm text-muted hover:text-fg hover:bg-sunken transition-colors ${
      withLabel ? 'h-9 px-2.5' : 'w-10 h-10 justify-center'
    }`}
  >
    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    {withLabel && <span>{theme === 'light' ? 'Tema escuro' : 'Tema claro'}</span>}
  </button>
);

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  studioStep,
  setStudioStep,
  completedSteps,
  savedCount,
  radioOnAir,
  storeName,
  storeIsExample,
  onEditStore,
  aiStatus,
  theme,
  onToggleTheme,
}) => {
  const navItem = (active: boolean) =>
    `w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[0.9375rem] font-medium transition-colors ${
      active ? 'bg-sunken text-fg' : 'text-muted hover:text-fg hover:bg-sunken/70'
    }`;

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-surface z-30">
        <div className="h-16 flex items-center px-5">
          <Logo />
        </div>

        <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 pt-2 space-y-6">
          <div>
            <p className="px-3 mb-2 text-xs font-medium text-muted">Criar locução</p>
            <ol className="space-y-0.5">
              {STUDIO_STEPS.map((s) => {
                const active = activeTab === 'studio' && studioStep === s.id;
                const done = completedSteps[s.id];
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => {
                        setActiveTab('studio');
                        setStudioStep(s.id);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        active ? 'bg-accent-soft' : 'hover:bg-sunken'
                      }`}
                    >
                      <span
                        className={`grid place-items-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                          active
                            ? 'bg-accent text-on-accent'
                            : done
                            ? 'bg-success-soft text-success'
                            : 'bg-sunken text-muted border border-line'
                        }`}
                      >
                        {done && !active ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.id}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[0.9375rem] font-medium ${active ? 'text-accent-fg' : 'text-fg'}`}>
                          {s.label}
                        </span>
                        <span className="block text-xs text-muted">{s.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="space-y-0.5 border-t border-line pt-4">
            <button
              type="button"
              aria-current={activeTab === 'templates' ? 'page' : undefined}
              onClick={() => setActiveTab('templates')}
              className={navItem(activeTab === 'templates')}
            >
              <BookOpen className="w-[18px] h-[18px]" /> Modelos prontos
            </button>
            <button
              type="button"
              aria-current={activeTab === 'history' ? 'page' : undefined}
              onClick={() => setActiveTab('history')}
              className={navItem(activeTab === 'history')}
            >
              <History className="w-[18px] h-[18px]" /> Histórico
              {savedCount > 0 && (
                <span className="ml-auto min-w-6 h-5 px-1.5 rounded-full bg-sunken border border-line text-xs font-semibold text-muted grid place-items-center tabular-nums">
                  {savedCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-current={activeTab === 'radio' ? 'page' : undefined}
              onClick={() => setActiveTab('radio')}
              className={navItem(activeTab === 'radio')}
            >
              <Radio className="w-[18px] h-[18px]" /> Rádio da loja
              {radioOnAir && (
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-accent-fg">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                  No ar
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-line space-y-2">
          <button
            type="button"
            onClick={onEditStore}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-sunken transition-colors"
          >
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-sunken border border-line shrink-0">
              <Store className="w-4 h-4 text-muted" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg truncate">{storeName || 'Sua loja'}</span>
              <span className="block text-xs text-muted">
                {storeIsExample ? 'Loja de exemplo · editar' : 'Editar dados da loja'}
              </span>
            </span>
          </button>
          <div className="flex items-center justify-between pl-2.5">
            <AiBadge status={aiStatus} />
            <ThemeButton theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </aside>

      {/* Mobile: barra superior */}
      <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between gap-2 px-4 bg-surface/95 backdrop-blur border-b border-line">
        <Logo />
        <div className="flex items-center gap-1">
          <AiBadge status={aiStatus} compact />
          <button
            type="button"
            onClick={onEditStore}
            aria-label="Editar dados da loja"
            className="grid place-items-center w-10 h-10 rounded-lg text-muted hover:text-fg hover:bg-sunken"
          >
            <Store className="w-[18px] h-[18px]" />
          </button>
          <ThemeButton theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      {/* Mobile: navegação inferior */}
      <nav
        aria-label="Principal"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 bg-surface border-t border-line pb-[env(safe-area-inset-bottom)]"
      >
        {(
          [
            { id: 'studio', label: 'Criar', icon: PenLine },
            { id: 'templates', label: 'Modelos', icon: BookOpen },
            { id: 'history', label: 'Histórico', icon: History },
            { id: 'radio', label: 'Rádio', icon: Radio },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-medium transition-colors ${
                active ? 'text-accent-fg' : 'text-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === 'radio' && radioOnAir && (
                <span className="absolute top-2.5 left-1/2 ml-2.5 w-2 h-2 rounded-full bg-accent animate-pulse" aria-label="No ar" />
              )}
              {id === 'history' && savedCount > 0 && (
                <span className="absolute top-2 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-on-accent text-[11px] font-semibold grid place-items-center tabular-nums">
                  {savedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
