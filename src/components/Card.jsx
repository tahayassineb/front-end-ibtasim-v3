import React from 'react';
import { useApp } from '../context/AppContext';

// ============================================
// CARD COMPONENT - Flexible card component
// ============================================

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
  ...props
}) => {
  // Base classes
  const baseClasses = `
    bg-white dark:bg-bg-dark-card
    rounded-xl
    overflow-hidden
    transition-all duration-300
    ${hoverable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
  `;

  // Variant classes
  const variantClasses = {
    default: 'border border-border-light dark:border-white/10 shadow-sm',
    flat: 'border border-border-light dark:border-white/10',
    elevated: 'shadow-lg hover:shadow-xl',
    glass: 'glass-card',
    outlined: 'border-2 border-primary/20',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.default}
    ${paddingClasses[padding] || paddingClasses.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================
// CARD HEADER - Header section for cards
// ============================================

export const CardHeader = ({
  title,
  subtitle,
  icon = null,
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">{icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-text-primary dark:text-white truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-text-muted truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

// ============================================
// CARD MEDIA - Image/video section for cards
// ============================================

export const CardMedia = ({
  src,
  alt = '',
  aspectRatio = 'video',
  overlay = null,
  className = '',
}) => {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
    project: 'aspect-[16/10]',
  };

  return (
    <div className={`relative ${aspectClasses[aspectRatio] || aspectClasses.video} overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        loading="lazy"
      />
      {overlay && (
        <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-transparent">
          {overlay}
        </div>
      )}
    </div>
  );
};

// ============================================
// CARD FOOTER - Footer section for cards
// ============================================

export const CardFooter = ({
  children,
  className = '',
  divider = true,
}) => {
  return (
    <div className={`${divider ? 'pt-4 mt-4 border-t border-border-light dark:border-white/10' : ''} ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// STAT CARD - Card for displaying statistics
// ============================================

export const StatCard = ({
  label,
  value,
  trend = null,
  trendValue = null,
  icon = null,
  color = 'primary',
  className = '',
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
  };

  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted';
  const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove';

  return (
    <Card className={className} padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{value}</p>
          {(trend || trendValue) && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              {trend && <span className="material-symbols-outlined text-sm">{trendIcon}</span>}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl ${colorClasses[color] || colorClasses.primary} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================
// PROJECT CARD - Card for project listings
// ============================================

export const ProjectCard = ({
  project,
  onDonate,
  onView,
  className = '',
}) => {
  const { calculateProgress, formatCurrency, daysRemaining, t } = useApp();
  
  const progress = calculateProgress ? calculateProgress(project.raised, project.goal) : 0;
  const daysLeft = daysRemaining ? daysRemaining(project.endDate) : null;

  return (
    <Card className={className} hoverable={!!onView} onClick={onView} padding="none">
      <CardMedia
        src={project.image || '/placeholder-project.jpg'}
        alt={project.title}
        aspectRatio="project"
        overlay={
          project.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-primary">
              {project.category}
            </span>
          )
        }
      />
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary dark:text-white line-clamp-2 mb-1">
            {project.title}
          </h3>
          <p className="text-sm text-text-muted line-clamp-2">
            {project.description}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary">
              {formatCurrency ? formatCurrency(project.raised) : project.raised} MAD
            </span>
            <span className="text-text-muted">
              {formatCurrency ? formatCurrency(project.goal, false) : project.goal} MAD
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">{progress}% {t ? t('raised') : 'raised'}</span>
            {daysLeft !== null && (
              <span className="text-text-muted">
                {daysLeft} {t ? t('daysLeft') : 'days left'}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        {onDonate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDonate();
            }}
            className="w-full btn-primary"
          >
            {t ? t('donate') : 'Donate Now'}
          </button>
        )}
      </div>
    </Card>
  );
};

// ============================================
// DONATION CARD (Admin) - Card for admin donations list
// ============================================

export const DonationCard = ({
  donation,
  onVerify,
  onReject,
  onView,
  className = '',
}) => {
  const { formatCurrency, formatDate, formatPhoneNumber } = useApp();
  
  const statusColors = {
    pending: 'warning',
    verified: 'success',
    rejected: 'error',
  };

  const statusLabels = {
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
  };

  return (
    <Card className={className} hoverable={!!onView} onClick={onView}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge-${statusColors[donation.status] || 'neutral'}`}>
              {statusLabels[donation.status] || donation.status}
            </span>
            <span className="text-xs text-text-muted">
              {formatDate ? formatDate(donation.date) : donation.date}
            </span>
          </div>
          <h4 className="font-semibold text-text-primary dark:text-white truncate">
            {donation.donorName}
          </h4>
          <p className="text-sm text-text-muted">
            {formatPhoneNumber ? formatPhoneNumber(donation.phone) : donation.phone}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-text-primary dark:text-white">
            {formatCurrency ? formatCurrency(donation.amount) : donation.amount}
          </p>
          <p className="text-xs text-text-muted">{donation.projectName}</p>
        </div>
      </div>

      {donation.status === 'pending' && (onVerify || onReject) && (
        <div className="flex gap-2 mt-4">
          {onVerify && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerify();
              }}
              className="flex-1 py-2 px-4 rounded-lg bg-success text-white text-sm font-medium hover:bg-success-600 transition-colors"
            >
              Verify
            </button>
          )}
          {onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="flex-1 py-2 px-4 rounded-lg bg-error text-white text-sm font-medium hover:bg-error-600 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default Card;
