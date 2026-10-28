import React from 'react';
import { Mic, BookOpen, History, Sun, Moon } from 'lucide-react';

interface Props {
  activeTab: 'studio' | 'templates' | 'history';
  setActiveTab: (tab: 'studio' | 'templates' | 'history') => void;
  savedCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  savedCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                VozVarejo
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Locução para Mercados & Açougues
              </span>
            </div>
          </div>

          {/* Navegação Simples (3 Abas) & Modo Diurno/Noturno */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'studio'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4 text-amber-500" />
                <span>Criar Locução</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'templates'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Modelos Prontos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Histórico</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Botão Diurno / Noturno */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title={theme === 'light' ? 'Ativar Modo Noturno' : 'Ativar Modo Diurno'}
              aria-label="Alternar tema"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
