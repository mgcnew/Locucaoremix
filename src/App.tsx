import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, AppTab, StudioStep, AiStatus } from './components/Sidebar';
import { useToast } from './components/Toast';
import { putAudio, pruneAudio } from './utils/audioStore';
import { LocutionStudio } from './components/LocutionStudio';
import { TemplatesView } from './components/TemplatesView';
import { HistoryView } from './components/HistoryView';
import { RadioView } from './components/RadioView';
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
      { id: 'p1', name: 'Picanha Maturada', promoPrice: '49,90', unit: 'kg' },
      { id: 'p2', name: 'Fraldinha Especial', promoPrice: '32,90', unit: 'kg' },
      { id: 'p3', name: 'Linguiça Toscana', promoPrice: '18,90', unit: 'kg' },
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
      { id: 'p4', name: 'Alcatra com Maminha', promoPrice: '34,90', unit: 'kg' },
      { id: 'p5', name: 'Coxão Mole', promoPrice: '29,90', unit: 'kg' },
      { id: 'p6', name: 'Acém Moído', promoPrice: '22,90', unit: 'kg' },
    ],
    chimeSound: 'supermarket_bell',
    isFavorite: false,
  },
];

export default function App() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AppTab>('studio');
  const [studioStep, setStudioStep] = useState<StudioStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<StudioStep, boolean>>({ 1: false, 2: false, 3: false });
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>('checking');
  const [radioOnAir, setRadioOnAir] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('vozvarejo_theme', next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setAiStatus(d.ai ? 'online' : 'offline'))
      .catch(() => setAiStatus('offline'));
  }, []);

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_store_profile');
      return saved ? JSON.parse(saved) : DEFAULT_STORE_PROFILE;
    } catch {
      return DEFAULT_STORE_PROFILE;
    }
  });

  const [savedLocutions, setSavedLocutions] = useState<SavedLocution[]>(() => {
    try {
      const saved = localStorage.getItem('vozvarejo_saved_locutions');
      return saved ? JSON.parse(saved) : INITIAL_SAVED_LOCUTIONS;
    } catch {
      return INITIAL_SAVED_LOCUTIONS;
    }
  });

  const [templateToLoad, setTemplateToLoad] = useState<SeasonalTemplate | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('vozvarejo_store_profile', JSON.stringify(storeProfile));
    } catch (e) {
      console.error(e);
    }
  }, [storeProfile]);

  useEffect(() => {
    try {
      // O áudio vive no IndexedDB; aqui fica só o texto e os metadados
      localStorage.setItem(
        'vozvarejo_saved_locutions',
        JSON.stringify(savedLocutions.map(({ audioBase64, ...rest }) => rest))
      );
    } catch (e) {
      console.error(e);
      toast.show('error', 'O histórico não pôde ser salvo', {
        description: 'O armazenamento do navegador está cheio ou bloqueado.',
      });
    }
  }, [savedLocutions]);

  // Migra áudios antigos do localStorage para o IndexedDB e limpa áudios órfãos
  useEffect(() => {
    (async () => {
      const withAudio = savedLocutions.filter((l) => l.audioBase64);
      await Promise.all(withAudio.map((l) => putAudio(l.id, l.audioBase64!)));
      if (withAudio.length) setSavedLocutions((list) => list.map(({ audioBase64, ...rest }) => rest));
      await pruneAudio(savedLocutions.map((l) => l.id));
    })();
  }, []);

  const handleSaveLocution = ({ audioBase64, ...newLocution }: SavedLocution) => {
    if (audioBase64) putAudio(newLocution.id, audioBase64);
    setSavedLocutions((list) => [newLocution, ...list]);
  };

  const handleToggleFavorite = (id: string) => {
    setSavedLocutions((list) => list.map((loc) => (loc.id === id ? { ...loc, isFavorite: !loc.isFavorite } : loc)));
  };

  const handleDeleteLocution = (id: string) => {
    const index = savedLocutions.findIndex((loc) => loc.id === id);
    const removed = savedLocutions[index];
    if (!removed) return;
    setSavedLocutions((list) => list.filter((loc) => loc.id !== id));
    toast.show('info', 'Locução excluída', {
      description: removed.headline,
      action: {
        label: 'Desfazer',
        onClick: () =>
          setSavedLocutions((list) => {
            const next = [...list];
            next.splice(index, 0, removed);
            return next;
          }),
      },
    });
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

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const handleProgress = useCallback((c: Record<StudioStep, boolean>) => setCompletedSteps(c), []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-ink focus:text-on-ink"
      >
        Pular para o conteúdo
      </a>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        studioStep={studioStep}
        setStudioStep={setStudioStep}
        completedSteps={completedSteps}
        savedCount={savedLocutions.length}
        radioOnAir={radioOnAir}
        storeName={storeProfile.name}
        storeIsExample={storeProfile.name === DEFAULT_STORE_PROFILE.name}
        onEditStore={() => setStoreModalOpen(true)}
        aiStatus={aiStatus}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main id="conteudo" className="lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10">
          {/* O estúdio fica montado para não perder o que está sendo editado ao trocar de aba */}
          <div hidden={activeTab !== 'studio'}>
            <LocutionStudio
              storeProfile={storeProfile}
              onUpdateStoreProfile={setStoreProfile}
              onOpenStoreModal={() => setStoreModalOpen(true)}
              onSaveLocution={handleSaveLocution}
              activeTemplateToLoad={templateToLoad}
              onClearTemplateToLoad={() => setTemplateToLoad(null)}
              step={studioStep}
              setStep={setStudioStep}
              onProgress={handleProgress}
              aiStatus={aiStatus}
            />
          </div>

          {/* A rádio também fica montada para continuar tocando em outras abas */}
          <div hidden={activeTab !== 'radio'}>
            <RadioView
              savedList={savedLocutions}
              onAirChange={setRadioOnAir}
              onGoToStudio={() => handleTabChange('studio')}
              onGoToHistory={() => handleTabChange('history')}
            />
          </div>

          {activeTab === 'templates' && <TemplatesView storeProfile={storeProfile} onSelectTemplate={handleSelectTemplate} />}

          {activeTab === 'history' && (
            <HistoryView
              savedList={savedLocutions}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteLocution}
              onLoadIntoStudio={handleLoadIntoStudio}
              onGoToStudio={() => handleTabChange('studio')}
              aiStatus={aiStatus}
            />
          )}
        </div>
      </main>

      <StoreSettingsModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        profile={storeProfile}
        onSave={(updated) => setStoreProfile(updated)}
      />
    </div>
  );
}
