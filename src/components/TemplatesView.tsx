import React, { useState } from 'react';
import { SEASONAL_TEMPLATES } from '../data/templates';
import { SeasonalTemplate, StoreProfile } from '../types';
import {
  Flame,
  Beef,
  Zap,
  PartyPopper,
  Crown,
  HeartHandshake,
  Sparkles,
  Sun,
  Gift,
  Moon,
  ArrowRight,
  Search,
} from 'lucide-react';

interface Props {
  storeProfile: StoreProfile;
  onSelectTemplate: (template: SeasonalTemplate) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame className="w-5 h-5 text-orange-500" />,
  Beef: <Beef className="w-5 h-5 text-red-500" />,
  Zap: <Zap className="w-5 h-5 text-amber-500" />,
  PartyPopper: <PartyPopper className="w-5 h-5 text-pink-500" />,
  Crown: <Crown className="w-5 h-5 text-amber-500" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5 text-emerald-500" />,
  Sparkles: <Sparkles className="w-5 h-5 text-purple-500" />,
  Sun: <Sun className="w-5 h-5 text-amber-500" />,
  Gift: <Gift className="w-5 h-5 text-red-500" />,
  Moon: <Moon className="w-5 h-5 text-indigo-500" />,
};

export const TemplatesView: React.FC<Props> = ({
  storeProfile,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTemplates = SEASONAL_TEMPLATES.filter((tpl) => {
    const matchesCategory =
      selectedCategory === 'todos' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 inline-block mb-1.5">
            Modelos Sazonais & Açougue
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Templates Prontos para Mercados & Açougues
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Escolha uma campanha sazonal pronta. Ao clicar, o nome da sua loja (
            <strong className="text-slate-800 dark:text-slate-200">{storeProfile.name || 'Sua Loja'}</strong>
            ) e os produtos sugeridos serão carregados diretamente no estúdio.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
          {filteredTemplates.length} templates disponíveis
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'acougue', label: '🥩 Açougue' },
            { id: 'urgencia', label: '⚡ Relâmpago' },
            { id: 'datas_comemorativas', label: '🎉 Festas & Datas' },
            { id: 'sazonal', label: '📅 Fim de Semana' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por carne, data ou evento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const previewScript = template.baseScript.replace(
            /\[NOME\]/g,
            storeProfile.name || 'Nosso Estabelecimento'
          );

          return (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ICON_MAP[template.icon] || <Sparkles className="w-5 h-5 text-amber-500" />}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {template.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {template.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>

                {/* Products list preview */}
                <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Ofertas Inclusas</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{template.products.length} itens</span>
                  </div>
                  {template.products.slice(0, 3).map((prod, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate pr-2">• {prod.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        R$ {prod.promoPrice} <span className="text-[10px] font-normal text-slate-500">/{prod.unit}</span>
                      </span>
                    </div>
                  ))}
                  {template.products.length > 3 && (
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      + mais {template.products.length - 3} itens inclusos
                    </div>
                  )}
                </div>

                {/* Base Script snippet */}
                <div className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-3 mb-4 leading-relaxed">
                  "{previewScript}"
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectTemplate(template)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 dark:hover:bg-amber-500 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white font-semibold text-xs transition duration-200 flex items-center justify-center gap-1.5"
              >
                <span>Usar Este Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
