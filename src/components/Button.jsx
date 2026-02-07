import React from 'react';

// ============================================
// BUTTON COMPONENT - All button variants
// ============================================

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-semibold transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  // Variant classes
  const variantClasses = {
    primary: `
      bg-primary text-white
      shadow-primary
      hover:bg-primary-dark hover:shadow-lg
      focus:ring-primary/30
    `,
    secondary: `
      bg-white text-primary
      border-2 border-primary
      hover:bg-primary/5
      focus:ring-primary/30
    `,
    outline: `
      bg-transparent text-primary
      border-2 border-primary
      hover:bg-primary hover:text-white
      focus:ring-primary/30
    `,
    ghost: `
      bg-transparent text-text-secondary
      hover:bg-bg-teal-wash hover:text-primary
      focus:ring-primary/20
    `,
    danger: `
      bg-error text-white
      shadow-md shadow-error/20
      hover:bg-error-600 hover:shadow-lg
      focus:ring-error/30
    `,
    success: `
      bg-success text-white
      shadow-md shadow-success/20
      hover:bg-success-600 hover:shadow-lg
      focus:ring-success/30
    `,
    warning: `
      bg-warning text-white
      shadow-md shadow-warning/20
      hover:bg-warning-600 hover:shadow-lg
      focus:ring-warning/30
    `,
    soft: `
      bg-primary/10 text-primary
      hover:bg-primary/20
      focus:ring-primary/30
    `,
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm rounded-lg',
    md: 'h-12 px-6 text-base rounded-xl',
    lg: 'h-14 px-8 text-lg rounded-xl',
    xl: 'h-16 px-10 text-lg rounded-2xl',
    icon: 'h-10 w-10 p-0 rounded-full',
    'icon-sm': 'h-8 w-8 p-0 rounded-full',
    'icon-lg': 'h-12 w-12 p-0 rounded-full',
  };

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${widthClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render icon helper
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="material-symbols-outlined text-current">{icon}</span>;
    }
    return icon;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon()}
          {children}
          {icon && iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
};

// ============================================
// ICON BUTTON - Circular button with icon only
// ============================================

export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  title,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    rounded-full transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/30 shadow-primary',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary/5 focus:ring-primary/30',
    ghost: 'bg-transparent text-text-secondary hover:bg-primary/10 hover:text-primary focus:ring-primary/20',
    filled: 'bg-primary/10 text-primary hover:bg-primary/20 focus:ring-primary/30',
    danger: 'bg-error/10 text-error hover:bg-error/20 focus:ring-error/30',
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.ghost}
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <span className={`material-symbols-outlined ${iconSizes[size] || iconSizes.md}`}>
          {icon}
        </span>
      )}
    </button>
  );
};

// ============================================
// CHIP BUTTON - Pill-shaped filter/toggle button
// ============================================

export const Chip = ({
  children,
  active = false,
  onClick,
  disabled = false,
  className = '',
  icon = null,
  ...props
}) => {
  const chipClasses = `
    inline-flex items-center gap-2 px-5 h-10
    rounded-full text-sm font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary/30
    disabled:opacity-50 disabled:cursor-not-allowed
    ${active
      ? 'bg-primary text-white shadow-primary'
      : 'bg-white text-text-secondary border border-border-light hover:border-primary/30 hover:text-primary'
    }
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={chipClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      {children}
    </button>
  );
};

// ============================================
// FLOATING ACTION BUTTON - Fixed position FAB
// ============================================

export const FloatingActionButton = ({
  icon = 'add',
  onClick,
  position = 'bottom-right',
  color = 'primary',
  size = 'lg',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
  };

  const colorClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-primary',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary/5',
    danger: 'bg-error text-white hover:bg-error-600 shadow-lg shadow-error/30',
  };

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const fabClasses = `
    ${positionClasses[position] || positionClasses['bottom-right']}
    ${colorClasses[color] || colorClasses.primary}
    ${sizeClasses[size] || sizeClasses.lg}
    rounded-full flex items-center justify-center
    transition-all duration-300 ease-out
    hover:shadow-lg hover:scale-105
    active:scale-95
    focus:outline-none focus:ring-4 focus:ring-primary/30
    z-40
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={fabClasses}
      onClick={onClick}
      {...props}
    >
      <span className={`material-symbols-outlined ${iconSizes[size] || iconSizes.lg}`}>
        {icon}
      </span>
    </button>
  );
};

export default Button;
