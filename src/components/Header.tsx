import React from 'react';
import { StoreProfile } from '../types';
import { Mic, Radio, BookOpen, History, Store, Sun, Moon } from 'lucide-react';

interface Props {
  activeTab: 'studio' | 'templates' | 'radio' | 'history';
  setActiveTab: (tab: 'studio' | 'templates' | 'radio' | 'history') => void;
  storeProfile: StoreProfile;
  onOpenStoreModal: () => void;
  savedCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  storeProfile,
  onOpenStoreModal,
  savedCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                VozVarejo
              </span>
            </div>

            {/* Divisor */}
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

            {/* Store Breadcrumb */}
            <button
              onClick={onOpenStoreModal}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
              title="Configurar dados da sua loja"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="max-w-[160px] truncate">{storeProfile.name || 'Definir Loja'}</span>
            </button>
          </div>

          {/* Navigation Tabs & Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <nav className="flex items-center gap-0.5 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl">
              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'studio'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Estúdio</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'templates'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => setActiveTab('radio')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'radio'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Rádio</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico</span>
                {savedCount > 0 && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Theme Toggle (Day/Night) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition shadow-xs"
              title={theme === 'light' ? 'Mudar para Modo Noturno' : 'Mudar para Modo Diurno'}
              aria-label="Alternar tema"
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="hidden sm:inline">Diurno</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                  <span className="hidden sm:inline">Noturno</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
