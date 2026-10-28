import React, { useEffect, useRef, useState } from 'react';
import { StoreProfile, StoreType } from '../types';
import { X } from 'lucide-react';
import { Button, IconButton, Label } from './ui';
import { useToast } from './Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: StoreProfile;
  onSave: (profile: StoreProfile) => void;
}

const STORE_TYPES: { id: StoreType; label: string }[] = [
  { id: 'acougue', label: 'Açougue e casa de carnes' },
  { id: 'supermercado', label: 'Supermercado' },
  { id: 'mercearia', label: 'Mercearia e empório' },
  { id: 'atacarejo', label: 'Atacarejo e distribuidora' },
];

export const StoreSettingsModal: React.FC<Props> = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formData, setFormData] = useState<StoreProfile>({ ...profile });
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      setFormData({ ...profile });
      setNameError(false);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const set = (field: keyof StoreProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((d) => ({ ...d, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNameError(true);
      document.getElementById('store-form-name')?.focus();
      return;
    }
    onSave({ ...formData, name: formData.name.trim() });
    toast.show('success', 'Dados da loja salvos', { description: 'Vão entrar nas próximas locuções.' });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="store-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] rounded-2xl border border-line bg-surface text-fg p-0 shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:animate-toast-in"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col max-h-[calc(100dvh-2rem)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 id="store-dialog-title" className="text-lg font-semibold text-fg">
              Dados da loja
            </h2>
            <p className="text-sm text-muted mt-0.5">Usados automaticamente em todas as locuções.</p>
          </div>
          <IconButton label="Fechar" onClick={onClose} className="-mr-2 -mt-1">
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="store-form-name">Nome da loja</Label>
            <input
              id="store-form-name"
              type="text"
              placeholder="Ex.: Açougue Boi de Ouro"
              value={formData.name}
              onChange={(e) => {
                set('name')(e);
                if (e.target.value.trim()) setNameError(false);
              }}
              aria-invalid={nameError || undefined}
              aria-describedby="store-form-name-hint"
              className="field"
            />
            <p id="store-form-name-hint" className={`text-sm mt-1.5 ${nameError ? 'text-danger' : 'text-muted'}`}>
              {nameError ? 'Informe o nome da loja.' : 'O locutor fala esse nome na abertura e no encerramento.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store-form-type">Ramo</Label>
              <select id="store-form-type" value={formData.type} onChange={set('type')} className="field">
                {STORE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="store-form-slogan">Slogan</Label>
              <input
                id="store-form-slogan"
                type="text"
                placeholder="Ex.: Tradição em carnes nobres"
                value={formData.slogan}
                onChange={set('slogan')}
                className="field"
              />
            </div>
            <div>
              <Label htmlFor="store-form-location">Endereço ou referência</Label>
              <input
                id="store-form-location"
                type="text"
                placeholder="Ex.: No Centro, ao lado da praça"
                value={formData.location}
                onChange={set('location')}
                className="field"
              />
            </div>
            <div>
              <Label htmlFor="store-form-payment">Formas de pagamento</Label>
              <input
                id="store-form-payment"
                type="text"
                placeholder="Ex.: Pix, cartões e vale"
                value={formData.paymentMethods}
                onChange={set('paymentMethods')}
                className="field"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="store-form-opening">
              Frase de abertura <span className="font-normal text-muted">(opcional)</span>
            </Label>
            <input
              id="store-form-opening"
              type="text"
              placeholder="Ex.: Atenção clientes e amigos do Boi de Ouro!"
              value={formData.openingGreeting}
              onChange={set('openingGreeting')}
              className="field"
            />
          </div>

          <div>
            <Label htmlFor="store-form-closing">
              Frase de encerramento <span className="font-normal text-muted">(opcional)</span>
            </Label>
            <input
              id="store-form-closing"
              type="text"
              placeholder="Ex.: Vem pro Boi de Ouro, aqui a qualidade é sagrada!"
              value={formData.closingPhrase}
              onChange={set('closingPhrase')}
              className="field"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t border-line">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Salvar dados
          </Button>
        </div>
      </form>
    </dialog>
  );
};
