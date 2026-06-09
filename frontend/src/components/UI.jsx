import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const DoubleBezel = ({ children, className }) => {
  return (
    <div className={cn("double-bezel", className)}>
      <div className="double-bezel-inner">
        {children}
      </div>
    </div>
  );
};

export const Card = ({ children, className, title }) => {
  return (
    <div className={cn("glass-card p-6", className)}>
      {title && <h3 className="text-lg font-semibold mb-4 text-slate-800">{title}</h3>}
      {children}
    </div>
  );
};

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-pharmacy-600 to-pharmacy-500 text-white hover:from-pharmacy-700 hover:to-pharmacy-600 shadow-md shadow-pharmacy-600/25 hover:shadow-lg hover:shadow-pharmacy-600/30',
    secondary: 'bg-gradient-to-r from-medical-600 to-medical-500 text-white hover:from-medical-700 hover:to-medical-600 shadow-md shadow-medical-600/25',
    outline: 'border border-slate-200 text-slate-700 hover:bg-pharmacy-50 hover:border-pharmacy-200 hover:text-pharmacy-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
  };

  return (
    <button 
      className={cn(
        "group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {Icon && (
        <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-[1px]">
          <Icon size={14} />
        </div>
      )}
    </button>
  );
};

export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn('bg-white rounded-3xl shadow-2xl w-full overflow-hidden', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xl text-slate-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Input = ({ label, className, ...props }) => (
  <div>
    {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">{label}</label>}
    <input className={cn('input-field', className)} {...props} />
  </div>
);

export const Select = ({ label, children, className, ...props }) => (
  <div>
    {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">{label}</label>}
    <select className={cn('input-field cursor-pointer', className)} {...props}>{children}</select>
  </div>
);

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-pharmacy-100 text-pharmacy-700',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold uppercase', variants[variant], className)}>
      {children}
    </span>
  );
};
