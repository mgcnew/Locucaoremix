import React, { useState } from 'react';
import { StoreProfile } from '../types';
import { Store, MapPin, Tag, CreditCard, Sparkles, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: StoreProfile;
  onSave: (profile: StoreProfile) => void;
}

export const StoreSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = useState<StoreProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-slate-900 dark:text-white my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Identidade do Estabelecimento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estes dados serão automaticamente anexados em todas as locuções e anúncios.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Açougue & Casa de Carnes Boi de Ouro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              O locutor falará este nome na abertura e encerramento do anúncio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ramo de Atuação
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
              >
                <option value="acougue">🥩 Açougue & Casa de Carnes</option>
                <option value="supermercado">🛒 Supermercado & Hipermercado</option>
                <option value="mercearia">🏪 Mercearia & Empório</option>
                <option value="atacarejo">📦 Atacarejo & Distribuidora</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-500" /> Slogan / Diferencial
              </label>
              <input
                type="text"
                placeholder="Ex: Tradição em carnes nobres"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Bairro / Cidade / Referência
              </label>
              <input
                type="text"
                placeholder="Ex: No Centro, próximo à praça"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Formas de Pagamento
              </label>
              <input
                type="text"
                placeholder="Ex: Cartões, Pix e Vales"
                value={formData.paymentMethods}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethods: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Chamada de Abertura Fixa (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Atenção clientes e amigos do Boi de Ouro!"
              value={formData.openingGreeting}
              onChange={(e) =>
                setFormData({ ...formData, openingGreeting: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Assinatura / Encerramento Fixo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Vem pro Boi de Ouro, aqui a qualidade é sagrada!"
              value={formData.closingPhrase}
              onChange={(e) =>
                setFormData({ ...formData, closingPhrase: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
