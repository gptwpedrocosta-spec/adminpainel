import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-200 select-none';
  
  const variantStyles = {
    primary: 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 shadow-xs border border-amber-400/10 hover:border-amber-400/20',
    secondary: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs',
    outline: 'border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 active:bg-slate-100',
    danger: 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-100 active:bg-rose-200/50',
    ghost: 'hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 active:bg-slate-200/40'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-xs rounded-xl',
    lg: 'px-5 py-2.5 text-sm rounded-xl'
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
