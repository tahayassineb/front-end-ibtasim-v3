import React, { useState, forwardRef } from 'react';

// ============================================
// INPUT COMPONENT - Form inputs with icons
// ============================================

const Input = forwardRef(({
  label,
  helperText,
  error,
  icon = null,
  iconPosition = 'left',
  rightElement = null,
  fullWidth = false,
  size = 'md',
  variant = 'default',
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Container classes
  const containerClasses = `
    ${fullWidth ? 'w-full' : ''}
    ${containerClassName}
  `.trim();

  // Input size classes
  const sizeClasses = {
    sm: 'h-11 px-3 text-sm',
    md: 'h-14 px-4 text-base',
    lg: 'h-16 px-5 text-lg',
  };

  // Input variant classes
  const variantClasses = {
    default: `
      bg-white dark:bg-bg-dark-card
      border border-border-default dark:border-white/10
      rounded-xl
      text-text-primary dark:text-white
      placeholder:text-text-muted
      focus:border-primary focus:ring-2 focus:ring-primary/20
    `,
    filled: `
      bg-bg-teal-wash dark:bg-bg-dark
      border border-transparent
      rounded-xl
      text-text-primary dark:text-white
      placeholder:text-text-muted
      focus:bg-white dark:focus:bg-bg-dark-card
      focus:border-primary focus:ring-2 focus:ring-primary/20
    `,
    outlined: `
      bg-transparent
      border-2 border-border-default dark:border-white/10
      rounded-xl
      text-text-primary dark:text-white
      placeholder:text-text-muted
      focus:border-primary focus:ring-0
    `,
    ghost: `
      bg-transparent
      border-0 border-b-2 border-border-default
      rounded-none
      text-text-primary dark:text-white
      placeholder:text-text-muted
      focus:border-primary focus:ring-0
      px-0
    `,
  };

  // Icon padding classes
  const iconPaddingClasses = {
    sm: { left: 'pl-10', right: 'pr-10' },
    md: { left: 'pl-12', right: 'pr-12' },
    lg: { left: 'pl-14', right: 'pr-14' },
  };

  // Base input classes
  const inputClasses = `
    w-full
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.default}
    ${icon && iconPosition === 'left' ? (iconPaddingClasses[size]?.left || 'pl-12') : ''}
    ${(icon && iconPosition === 'right') || rightElement ? (iconPaddingClasses[size]?.right || 'pr-12') : ''}
    transition-all duration-200
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-4 h-4 left-3',
    md: 'w-5 h-5 left-4',
    lg: 'w-6 h-6 left-5',
  };

  const iconRightSizeClasses = {
    sm: 'right-3',
    md: 'right-4',
    lg: 'right-5',
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`block text-sm font-medium text-text-secondary dark:text-text-muted mb-2 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${iconSizeClasses[size]} text-text-muted pointer-events-none`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={inputClasses}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {/* Right Icon */}
        {icon && iconPosition === 'right' && !rightElement && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${iconRightSizeClasses[size]} text-text-muted pointer-events-none`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}

        {/* Right Element */}
        {rightElement && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${iconRightSizeClasses[size]}`}>
            {rightElement}
          </div>
        )}
      </div>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================
// TEXTAREA COMPONENT - Multi-line text input
// ============================================

export const Textarea = forwardRef(({
  label,
  helperText,
  error,
  rows = 4,
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const textareaClasses = `
    w-full px-4 py-3
    bg-white dark:bg-bg-dark-card
    border border-border-default dark:border-white/10
    rounded-xl
    text-text-primary dark:text-white
    placeholder:text-text-muted
    resize-none
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// ============================================
// SEARCH INPUT - Search-specific input
// ============================================

export const SearchInput = forwardRef(({
  placeholder = 'Search...',
  fullWidth = true,
  onClear,
  value,
  className = '',
  ...props
}, ref) => {
  const hasValue = value && value.length > 0;

  return (
    <Input
      ref={ref}
      type="search"
      icon="search"
      placeholder={placeholder}
      fullWidth={fullWidth}
      value={value}
      className={`bg-bg-teal-wash dark:bg-bg-dark border-0 focus:bg-white ${className}`}
      rightElement={hasValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      ) : null}
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

// ============================================
// PHONE INPUT - Phone number with country code
// ============================================

export const PhoneInput = forwardRef(({
  label,
  error,
  countryCode = '+212',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
          {label}
        </label>
      )}
      <div className="flex">
        <div className="flex items-center px-4 bg-bg-teal-wash dark:bg-bg-dark rounded-l-xl border border-r-0 border-border-default dark:border-white/10 text-text-secondary">
          <span className="material-symbols-outlined text-text-muted mr-2">phone</span>
          <span className="text-sm font-medium">{countryCode}</span>
        </div>
        <input
          ref={ref}
          type="tel"
          className={`
            flex-1 h-14 px-4
            bg-white dark:bg-bg-dark-card
            border border-border-default dark:border-white/10
            rounded-r-xl
            text-text-primary dark:text-white
            placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';

// ============================================
// OTP INPUT - One-time password input
// ============================================

export const OTPInput = ({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}) => {
  const values = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index, digit) => {
    if (!/^\d*$/.test(digit)) return;
    
    const newValue = values.map((v, i) => i === index ? digit : v).join('');
    onChange(newValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
  };

  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={values[index] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`
            w-12 h-14 text-center text-xl font-bold
            bg-white dark:bg-bg-dark-card
            border-2 ${error ? 'border-error' : 'border-border-default dark:border-white/10'}
            rounded-xl
            text-text-primary dark:text-white
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50
          `.trim().replace(/\s+/g, ' ')}
        />
      ))}
    </div>
  );
};

// ============================================
// PASSWORD INPUT - Password with toggle visibility
// ============================================

export const PasswordInput = forwardRef(({
  label,
  error,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={error}
      icon="lock"
      fullWidth={fullWidth}
      className={className}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

// ============================================
// AMOUNT INPUT - Currency amount input
// ============================================

export const AmountInput = forwardRef(({
  label,
  error,
  currency = 'MAD',
  min,
  max,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type="number"
          min={min}
          max={max}
          className={`
            w-full h-14 px-4 pr-16
            bg-white dark:bg-bg-dark-card
            border border-border-default dark:border-white/10
            rounded-xl
            text-text-primary dark:text-white text-lg font-semibold
            placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">
          {currency}
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
});

AmountInput.displayName = 'AmountInput';

export default Input;
