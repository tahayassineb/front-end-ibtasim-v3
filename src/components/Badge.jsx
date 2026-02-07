import React from 'react';

// ============================================
// BADGE COMPONENT - Status indicators
// ============================================

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  dot = false,
  pulse = false,
  className = '',
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-white text-text-secondary border-border-light',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    info: 'bg-info/10 text-info border-info/20',
    neutral: 'bg-bg-teal-wash text-text-secondary border-border-light',
    outline: 'bg-transparent text-primary border-primary',
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const badgeClasses = `
    inline-flex items-center justify-center
    font-semibold rounded-full border
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${pulse ? 'animate-pulse' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Dot color classes
  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-text-muted',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-text-muted',
    outline: 'bg-primary',
  };

  return (
    <span className={badgeClasses} {...props}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.primary}`} />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[1.1em]">{icon}</span>
      )}
      {children}
    </span>
  );
};

// ============================================
// STATUS BADGE - Pre-configured status badges
// ============================================

export const StatusBadge = ({
  status,
  size = 'md',
  className = '',
}) => {
  const statusConfig = {
    // General statuses
    active: { variant: 'success', icon: 'check_circle', label: 'Active' },
    inactive: { variant: 'neutral', icon: 'cancel', label: 'Inactive' },
    pending: { variant: 'warning', icon: 'schedule', label: 'Pending' },
    completed: { variant: 'success', icon: 'task_alt', label: 'Completed' },
    cancelled: { variant: 'error', icon: 'cancel', label: 'Cancelled' },
    
    // Donation statuses
    verified: { variant: 'success', icon: 'verified', label: 'Verified' },
    rejected: { variant: 'error', icon: 'error', label: 'Rejected' },
    processing: { variant: 'info', icon: 'sync', label: 'Processing' },
    
    // Payment statuses
    paid: { variant: 'success', icon: 'payments', label: 'Paid' },
    unpaid: { variant: 'error', icon: 'money_off', label: 'Unpaid' },
    refunded: { variant: 'warning', icon: 'replay', label: 'Refunded' },
    
    // Project statuses
    ongoing: { variant: 'info', icon: 'play_circle', label: 'Ongoing' },
    finished: { variant: 'success', icon: 'check_circle', label: 'Finished' },
    draft: { variant: 'neutral', icon: 'edit_note', label: 'Draft' },
    
    // User tiers
    gold: { variant: 'warning', icon: 'stars', label: 'Gold' },
    silver: { variant: 'neutral', icon: 'star', label: 'Silver' },
    bronze: { variant: 'secondary', icon: 'star_half', label: 'Bronze' },
  };

  const config = statusConfig[status] || { variant: 'neutral', icon: 'help', label: status };

  return (
    <Badge variant={config.variant} size={size} icon={config.icon} className={className}>
      {config.label}
    </Badge>
  );
};

// ============================================
// COUNT BADGE - Numeric counter badge
// ============================================

export const CountBadge = ({
  count,
  max = 99,
  variant = 'error',
  className = '',
}) => {
  const displayCount = count > max ? `${max}+` : count;

  const variantClasses = {
    primary: 'bg-primary text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    success: 'bg-success text-white',
    neutral: 'bg-text-muted text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px] px-1
        text-[10px] font-bold
        rounded-full
        ${variantClasses[variant] || variantClasses.error}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

// ============================================
// AVATAR BADGE - User avatar with status
// ============================================

export const AvatarBadge = ({
  src,
  name,
  size = 'md',
  status = null,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-text-muted',
    away: 'bg-warning',
    busy: 'bg-error',
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size] || sizeClasses.md}
            rounded-full bg-primary/10 text-primary
            flex items-center justify-center font-semibold
          `}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizeClasses[size] || statusSizeClasses.md}
            rounded-full border-2 border-white dark:border-bg-dark-card
            ${statusColors[status] || statusColors.offline}
          `}
        />
      )}
    </div>
  );
};

// ============================================
// CHIP BADGE - Clickable filter/tag badge
// ============================================

export const ChipBadge = ({
  children,
  active = false,
  onClick,
  onRemove,
  className = '',
}) => {
  const chipClasses = `
    inline-flex items-center gap-1.5
    px-3 py-1.5 rounded-full
    text-sm font-medium
    transition-all duration-200
    ${active
      ? 'bg-primary text-white'
      : 'bg-white text-text-secondary border border-border-light hover:border-primary/30'
    }
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={chipClasses} onClick={onClick}>
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[1em]">close</span>
        </button>
      )}
    </span>
  );
};

export default Badge;
