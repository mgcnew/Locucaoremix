import React, { useState } from 'react';
import { SEASONAL_TEMPLATES } from '../data/templates';
import { SeasonalTemplate, StoreProfile } from '../types';
import {
  ArrowRight,
  Beef,
  Crown,
  Flame,
  Gift,
  HeartHandshake,
  Moon,
  PartyPopper,
  Search,
  SearchX,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { Button } from './ui';

interface Props {
  storeProfile: StoreProfile;
  onSelectTemplate: (template: SeasonalTemplate) => void;
}

const ICONS: Record<string, React.ElementType> = {
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
};

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'acougue', label: 'Açougue' },
  { id: 'urgencia', label: 'Relâmpago' },
  { id: 'datas_comemorativas', label: 'Festas e datas' },
  { id: 'sazonal', label: 'Fim de semana' },
];

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const formatPrice = (p: string) => p.replace('.', ',');

export const TemplatesView: React.FC<Props> = ({ storeProfile, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const q = normalize(searchQuery.trim());
  const filteredTemplates = SEASONAL_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'todos' || tpl.category === selectedCategory;
    const matchesSearch =
      !q ||
      normalize(tpl.title).includes(q) ||
      normalize(tpl.description).includes(q) ||
      tpl.products.some((p) => normalize(p.name).includes(q)) ||
      tpl.tags.some((t) => normalize(t).includes(q));
    return matchesCategory && matchesSearch;
  });

  const storeName = storeProfile.name || 'Nosso Estabelecimento';

  return (
    <div className="pb-24 lg:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-fg">Modelos prontos</h1>
        <p className="text-[0.9375rem] text-muted mt-1 max-w-2xl">
          Campanhas sazonais com produtos e texto prontos. Ao usar um modelo, o nome{' '}
          <span className="font-medium text-fg">{storeName}</span> entra no roteiro automaticamente.
        </p>
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div
          role="radiogroup"
          aria-label="Categoria"
          className="flex gap-1 p-1 rounded-[10px] bg-sunken border border-line overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1 [scrollbar-width:none]"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-9 px-3.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative md:ml-auto md:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <label htmlFor="template-search" className="sr-only">
            Buscar modelos
          </label>
          <input
            id="template-search"
            type="search"
            placeholder="Buscar por carne, data ou evento"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pl-9"
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {filteredTemplates.length} modelos encontrados
      </p>

      {filteredTemplates.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl px-6 py-14 text-center">
          <SearchX className="w-8 h-8 text-subtle mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-fg">Nenhum modelo encontrado</p>
          <p className="text-sm text-muted mt-1 mb-5">Tente outra palavra ou veja todas as categorias.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('todos');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = ICONS[template.icon] || Sparkles;
            const preview = template.baseScript.replace(/\[NOME\]/g, storeName);
            return (
              <li
                key={template.id}
                className="group flex flex-col bg-surface border border-line rounded-xl p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-sunken border border-line shrink-0" aria-hidden="true">
                    <Icon className="w-[18px] h-[18px] text-fg" />
                  </span>
                  <span className="text-sm text-muted">{template.badge}</span>
                </div>

                <h2 className="text-base font-semibold text-fg leading-snug">{template.title}</h2>
                <p className="text-sm text-muted mt-1 line-clamp-2">{template.description}</p>

                <ul className="mt-4 space-y-1.5 text-sm" aria-label="Ofertas incluídas">
                  {template.products.slice(0, 3).map((prod) => (
                    <li key={prod.name} className="flex items-baseline gap-3">
                      <span className="flex-1 min-w-0 truncate text-fg">{prod.name}</span>
                      <span className="font-semibold text-fg tabular-nums shrink-0">
                        R$ {formatPrice(prod.promoPrice)}
                        <span className="font-normal text-muted">/{prod.unit}</span>
                      </span>
                    </li>
                  ))}
                  {template.products.length > 3 && (
                    <li className="text-muted">
                      + {template.products.length - 3} {template.products.length - 3 === 1 ? 'produto' : 'produtos'}
                    </li>
                  )}
                </ul>

                <blockquote className="mt-4 pt-4 border-t border-line text-sm text-muted leading-relaxed line-clamp-3">
                  {preview}
                </blockquote>

                <Button
                  variant="secondary"
                  className="w-full mt-5 group-hover:bg-ink group-hover:text-on-ink group-hover:border-ink"
                  onClick={() => onSelectTemplate(template)}
                  aria-label={`Usar o modelo ${template.title}`}
                >
                  Usar este modelo <ArrowRight className="w-4 h-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
