import React from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink-hover',
  accent: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-line-strong hover:bg-sunken',
  ghost: 'text-muted hover:text-fg hover:bg-sunken',
  danger: 'text-danger border border-line-strong hover:bg-danger-soft hover:border-danger',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-[0.9375rem] gap-2 rounded-[10px]',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon, className = '', children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <LoaderCircle className={`${className} animate-spin shrink-0`} aria-hidden="true" />
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }
> = ({ label, tone = 'default', className = '', children, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-grid place-items-center w-10 h-10 rounded-lg text-muted transition-colors disabled:opacity-40 ${
      tone === 'danger' ? 'hover:text-danger hover:bg-danger-soft' : 'hover:text-fg hover:bg-sunken'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...rest }) => (
  <label className={`block text-sm font-medium text-fg mb-1.5 ${className}`} {...rest} />
);

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
