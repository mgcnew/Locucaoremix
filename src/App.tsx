import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LocutionStudio } from './components/LocutionStudio';
import { TemplatesView } from './components/TemplatesView';
import { HistoryView } from './components/HistoryView';
import { StoreRadioPlayer } from './components/StoreRadioPlayer';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { StoreProfile, SavedLocution, SeasonalTemplate } from './types';

const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: 'Açougue & Casa de Carnes Boi de Ouro',
  type: 'acougue',
  slogan: 'Tradição em carnes nobres e procedência garantida',
  location: 'Av. Brasil, 1500 - Centro',
  paymentMethods: 'Aceitamos dinheiro, cartões de crédito, débito e Pix!',
  openingGreeting: 'Atenção clientes e amigos do Boi de Ouro!',
  closingPhrase: 'Vem pro Boi de Ouro, aqui a qualidade é sagrada!',
};

const INITIAL_SAVED_LOCUTIONS: SavedLocution[] = [
  {
    id: 'starter_1',
    createdAt: new Date().toISOString(),
    storeName: 'Açougue & Casa de Carnes Boi de Ouro',
    headline: 'Sextou do Churrasco & Carnes Nobres',
    script:
      'Atenção churrasqueiros de plantão! O fim de semana chegou e o Açougue Boi de Ouro preparou o verdadeiro festival da brasa! Picanha maturada com capa de gordura perfeita por apenas quarenta e nove e noventa o quilo! Tem também fraldinha suculenta a trinta e dois e noventa, e linguiça toscana de primeira por apenas dezoito e noventa! Acenda a churrasqueira e garanta a carne mais fresca da cidade no Açougue Boi de Ouro!',
    tone: 'acougue_especial',
    targetDuration: 'media',
    voiceName: 'Fenrir (Voz Grave & Varejão)',
    voiceGender: 'masculino',
    products: [
      { id: 'p1', name: 'Picanha Maturada', promoPrice: '49.90', unit: 'kg' },
      { id: 'p2', name: 'Fraldinha Especial', promoPrice: '32.90', unit: 'kg' },
      { id: 'p3', name: 'Linguiça Toscana', promoPrice: '18.90', unit: 'kg' },
    ],
    chimeSound: 'supermarket_bell',
    isFavorite: true,
  },
  {
    id: 'starter_2',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    storeName: 'Açougue & Casa de Carnes Boi de Ouro',
    headline: 'Quarta e Quinta da Carne & Desconto Especial',
    script:
      'Atenção dona de casa, parou tudo! É a grande Quarta e Quinta da Carne do Açougue Boi de Ouro! Alcatra com maminha fresquinha por apenas trinta e quatro e noventa o quilo! Coxão mole macio a vinte e nove e noventa, e acém moído na hora por apenas vinte e dois e noventa! É economia de verdade no balcão do Boi de Ouro!',
    tone: 'varejao_energico',
    targetDuration: 'media',
    voiceName: 'Puck (Voz Jovem & Dinâmica)',
    voiceGender: 'masculino',
    products: [
      { id: 'p4', name: 'Alcatra com Maminha', promoPrice: '34.90', unit: 'kg' },
      { id: 'p5', name: 'Coxão Mole', promoPrice: '29.90', unit: 'kg' },
      { id: 'p6', name: 'Acém Moído', promoPrice: '22.90', unit: 'kg' },
    ],
    chimeSound: 'supermarket_bell',
    isFavorite: false,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'templates' | 'radio' | 'history'>('studio');
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  // Tema: 'light' (diurno) por padrão, persistido no localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Atualiza classe 'dark' e colorScheme no html root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('vozvarejo_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Perfil da Loja em LocalStorage
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_store_profile');
      return saved ? JSON.parse(saved) : DEFAULT_STORE_PROFILE;
    } catch {
      return DEFAULT_STORE_PROFILE;
    }
  });

  // Lista de Locuções Salvas em LocalStorage
  const [savedLocutions, setSavedLocutions] = useState<SavedLocution[]>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_saved_locutions');
      return saved ? JSON.parse(saved) : INITIAL_SAVED_LOCUTIONS;
    } catch {
      return INITIAL_SAVED_LOCUTIONS;
    }
  });

  // Template selecionado para carregar no estúdio
  const [templateToLoad, setTemplateToLoad] = useState<SeasonalTemplate | null>(null);

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem('vozvarejo_store_profile', JSON.stringify(storeProfile));
    } catch (e) {
      console.error(e);
    }
  }, [storeProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('vozvarejo_saved_locutions', JSON.stringify(savedLocutions));
    } catch (e) {
      console.error(e);
    }
  }, [savedLocutions]);

  const handleSaveLocution = (newLocution: SavedLocution) => {
    setSavedLocutions([newLocution, ...savedLocutions]);
  };

  const handleToggleFavorite = (id: string) => {
    setSavedLocutions(
      savedLocutions.map((loc) =>
        loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc
      )
    );
  };

  const handleDeleteLocution = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta locução do histórico?')) {
      setSavedLocutions(savedLocutions.filter((loc) => loc.id !== id));
    }
  };

  const handleLoadIntoStudio = (item: SavedLocution) => {
    setTemplateToLoad({
      id: item.id,
      title: item.headline,
      category: 'acougue',
      icon: 'Beef',
      badge: 'Personalizado',
      tone: item.tone,
      suggestedDuration: item.targetDuration,
      sampleStoreType: storeProfile.type,
      description: 'Carregado do histórico',
      products: item.products,
      baseScript: item.script,
      tags: [],
    });
    setActiveTab('studio');
  };

  const handleSelectTemplate = (template: SeasonalTemplate) => {
    setTemplateToLoad(template);
    setActiveTab('studio');
  };

  const handleImportBackup = (items: SavedLocution[]) => {
    setSavedLocutions(items);
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeProfile={storeProfile}
        onOpenStoreModal={() => setStoreModalOpen(true)}
        savedCount={savedLocutions.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'studio' && (
          <LocutionStudio
            storeProfile={storeProfile}
            onOpenStoreModal={() => setStoreModalOpen(true)}
            onSaveLocution={handleSaveLocution}
            activeTemplateToLoad={templateToLoad}
            onClearTemplateToLoad={() => setTemplateToLoad(null)}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            storeProfile={storeProfile}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {activeTab === 'radio' && (
          <StoreRadioPlayer
            savedList={savedLocutions}
            activeStoreName={storeProfile.name}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            savedList={savedLocutions}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteLocution}
            onLoadIntoStudio={handleLoadIntoStudio}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Modal de Configuração do Estabelecimento */}
      <StoreSettingsModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        profile={storeProfile}
        onSave={(updated) => setStoreProfile(updated)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-4 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            VozVarejo Studio &bull; Locução Comercial para Açougues & Supermercados
          </div>
          <div className="flex items-center gap-2">
            <span>Síntese de Voz Gemini & Web Audio</span>
            <span>&bull;</span>
            <span>Exportação MP3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
