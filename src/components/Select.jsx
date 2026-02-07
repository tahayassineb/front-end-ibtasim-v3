import React, { useState, useRef, useEffect, forwardRef } from 'react';

// ============================================
// SELECT COMPONENT - Dropdown select
// ============================================

const Select = forwardRef(({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  icon = null,
  fullWidth = true,
  disabled = false,
  searchable = false,
  clearable = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options for search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const containerClasses = `
    relative
    ${fullWidth ? 'w-full' : ''}
    ${containerClassName}
  `.trim();

  const triggerClasses = `
    w-full h-14 px-4
    bg-white dark:bg-bg-dark-card
    border border-border-default dark:border-white/10
    rounded-xl
    flex items-center justify-between gap-3
    text-text-primary dark:text-white
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
    ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
    ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={ref}
        type="button"
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        {...props}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && !selectedOption?.icon && (
            <span className="material-symbols-outlined text-text-muted">{icon}</span>
          )}
          {selectedOption?.icon && (
            <span className="material-symbols-outlined text-text-muted">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${!selectedOption ? 'text-text-muted' : ''}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-black/5 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
          <span className={`material-symbols-outlined text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-bg-dark-card rounded-xl border border-border-light dark:border-white/10 shadow-xl animate-scale-in">
          {/* Search Input */}
          {searchable && (
            <div className="px-3 pb-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-10 pl-10 pr-4 bg-bg-teal-wash dark:bg-bg-dark rounded-lg text-sm text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 text-left
                    transition-colors duration-150
                    ${value === option.value 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-text-primary dark:text-white hover:bg-bg-teal-wash dark:hover:bg-bg-dark'
                    }
                  `}
                >
                  {option.icon && (
                    <span className={`material-symbols-outlined ${value === option.value ? 'text-primary' : 'text-text-muted'}`}>
                      {option.icon}
                    </span>
                  )}
                  <span className="flex-1">{option.label}</span>
                  {value === option.value && (
                    <span className="material-symbols-outlined text-primary">check</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// ============================================
// MULTI SELECT - Multiple selection dropdown
// ============================================

export const MultiSelect = forwardRef(({
  label,
  options,
  value = [],
  onChange,
  placeholder = 'Select options',
  error,
  helperText,
  fullWidth = true,
  disabled = false,
  maxDisplay = 3,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (e, optionValue) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(opt => value.includes(opt.value));
  const displayCount = Math.min(selectedOptions.length, maxDisplay);
  const remainingCount = selectedOptions.length - displayCount;

  const containerClasses = `
    relative
    ${fullWidth ? 'w-full' : ''}
  `.trim();

  const triggerClasses = `
    w-full min-h-14 px-4 py-2
    bg-white dark:bg-bg-dark-card
    border border-border-default dark:border-white/10
    rounded-xl
    flex items-center justify-between gap-3
    text-text-primary dark:text-white
    transition-all duration-200
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
    ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
    ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-2">
          {label}
        </label>
      )}

      <button
        ref={ref}
        type="button"
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        {...props}
      >
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, option.value)}
                    className="p-0.5 rounded-full hover:bg-primary/20"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-sm text-text-muted">+{remainingCount} more</span>
              )}
            </>
          )}
        </div>
        <span className={`material-symbols-outlined text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-bg-dark-card rounded-xl border border-border-light dark:border-white/10 shadow-xl animate-scale-in max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 text-left
                  transition-colors duration-150
                  ${isSelected 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-primary dark:text-white hover:bg-bg-teal-wash dark:hover:bg-bg-dark'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-primary border-primary' : 'border-border-default'}
                `}>
                  {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                </div>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {(helperText || error) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-text-muted'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

MultiSelect.displayName = 'MultiSelect';

// ============================================
// COUNTRY SELECT - Country selection with flags
// ============================================

export const CountrySelect = forwardRef(({
  value,
  onChange,
  label,
  error,
  fullWidth = true,
  ...props
}, ref) => {
  const countries = [
    { value: 'MA', label: 'Morocco (+212)', code: '+212', flag: '🇲🇦' },
    { value: 'DZ', label: 'Algeria (+213)', code: '+213', flag: '🇩🇿' },
    { value: 'TN', label: 'Tunisia (+216)', code: '+216', flag: '🇹🇳' },
    { value: 'FR', label: 'France (+33)', code: '+33', flag: '🇫🇷' },
    { value: 'ES', label: 'Spain (+34)', code: '+34', flag: '🇪🇸' },
    { value: 'US', label: 'USA (+1)', code: '+1', flag: '🇺🇸' },
    { value: 'GB', label: 'UK (+44)', code: '+44', flag: '🇬🇧' },
    { value: 'CA', label: 'Canada (+1)', code: '+1', flag: '🇨🇦' },
  ];

  return (
    <Select
      ref={ref}
      label={label}
      options={countries}
      value={value}
      onChange={onChange}
      error={error}
      fullWidth={fullWidth}
      {...props}
    />
  );
});

CountrySelect.displayName = 'CountrySelect';

export default Select;
