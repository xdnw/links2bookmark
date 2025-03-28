import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xs';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant controlling color scheme */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether to round the button corners */
  rounded?: boolean;
  /** Optional icon to display before the text */
  startIcon?: React.ReactNode;
  /** Optional icon to display after the text */
  endIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Optional additional className */
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = true,
  startIcon,
  endIcon,
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';

  // Size classes
  const sizeClasses = {
    xs: 'px-1 p-0.5 text-xs',
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'border inset-shadow-sm bg-slate-400/50 hover:bg-slate-500/50 active:bg-slate-600/50 dark:bg-slate-600/50 dark:hover:bg-slate-700/50 dark:active:bg-slate-800/50 text-slate-800 dark:text-slate-100 dark:border-slate-200/25 border-slate-800/25 focus:ring-slate-500',
    secondary: 'border bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-gray-500 dark:border-slate-200/25 border-slate-800/25',
    danger: 'border bg-red-400/50 hover:bg-red-500/50 active:bg-red-600/50 dark:bg-red-600/50 dark:hover:bg-red-700/50 dark:active:bg-red-800/50 text-red-800 dark:text-red-100 dark:border-slate-200/25 border-slate-800/25 focus:ring-red-500',
    success: 'border bg-emerald-400/50 hover:bg-emerald-500/50 active:bg-emerald-600/50 dark:bg-emerald-600/50 dark:hover:bg-emerald-700/50 dark:active:bg-emerald-800/50 text-emerald-800 dark:text-emerald-100 dark:border-slate-200/25 border-slate-800/25 focus:ring-emerald-500',
    ghost: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-gray-400',
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Disabled state
  const disabledClasses = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${rounded ? "rounded-sm" : ""} ${widthClasses} ${disabledClasses} flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {!isLoading && startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
      {!isLoading && endIcon && <span className="flex-shrink-0">{endIcon}</span>}
    </button>
  );
};

export default React.memo(Button);