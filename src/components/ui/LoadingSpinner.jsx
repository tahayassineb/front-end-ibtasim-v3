import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  ariaLabel = 'Chargement en cours...' 
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex ${className}`}
    >
      <svg
        className={`${sizes[size]} animate-spin text-primary-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
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
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

// Skeleton Loader Component
export const Skeleton = ({ 
  variant = 'text',
  width,
  height,
  className = '',
  animate = true 
}) => {
  const baseStyles = 'bg-gray-200 rounded';
  const animationStyles = animate ? 'animate-pulse' : '';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    image: 'w-full aspect-video',
    card: 'w-full h-48',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animationStyles} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

// Skeleton Card for Project Cards
export const ProjectCardSkeleton = () => {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton variant="image" className="h-48" />
      <div className="p-5 space-y-4">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="text" />
        <Skeleton variant="text" className="w-4/5" />
        <div className="pt-2">
          <Skeleton variant="text" className="h-2 rounded-full" />
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="text" className="w-20" />
        </div>
      </div>
    </div>
  );
};

// Page Loading Skeleton
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50" aria-hidden="true">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b" />
      
      {/* Hero Skeleton */}
      <div className="h-[500px] bg-gray-200" />
      
      {/* Stats Skeleton */}
      <div className="py-12 bg-primary-600">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton variant="text" className="h-10 w-24 mx-auto bg-primary-500/30" />
                <Skeleton variant="text" className="h-4 w-20 mx-auto bg-primary-500/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="page-container py-16">
        <div className="text-center mb-12 space-y-4">
          <Skeleton variant="title" className="h-8 w-64 mx-auto" />
          <Skeleton variant="text" className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ 
  isLoading, 
  children,
  message = 'Chargement...'
}) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
