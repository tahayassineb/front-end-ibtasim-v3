import React from 'react';

// ============================================
// PROGRESS BAR COMPONENT - Linear progress indicator
// ============================================

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  labelPosition = 'right',
  className = '',
  animated = true,
  striped = false,
  ...props
}) => {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Size classes
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  // Color classes
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    neutral: 'bg-text-muted',
  };

  const containerClasses = `
    w-full bg-bg-teal-wash dark:bg-bg-dark rounded-full overflow-hidden
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const fillClasses = `
    h-full ${colorClasses[color] || colorClasses.primary} rounded-full
    ${animated ? 'transition-all duration-500 ease-out' : ''}
    ${striped ? 'progress-striped' : ''}
  `.trim().replace(/\s+/g, ' ');

  const renderLabel = () => (
    <span className="text-sm font-semibold text-text-secondary min-w-[40px] text-right">
      {Math.round(percentage)}%
    </span>
  );

  return (
    <div className={`flex items-center gap-3 ${labelPosition === 'top' || labelPosition === 'bottom' ? 'flex-col' : ''}`}>
      {showLabel && labelPosition === 'left' && renderLabel()}
      {showLabel && labelPosition === 'top' && (
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-text-muted">Progress</span>
          {renderLabel()}
        </div>
      )}
      
      <div className={containerClasses} {...props}>
        <div
          className={fillClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {showLabel && labelPosition === 'right' && renderLabel()}
      {showLabel && labelPosition === 'bottom' && (
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-text-muted">{value} of {max}</span>
          {renderLabel()}
        </div>
      )}
    </div>
  );
};

// ============================================
// CIRCULAR PROGRESS - Circular progress indicator
// ============================================

export const CircularProgress = ({
  value = 0,
  max = 100,
  size = 60,
  strokeWidth = 6,
  color = 'primary',
  showLabel = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
    neutral: 'text-text-muted',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-teal-wash dark:text-bg-dark"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${colorClasses[color] || colorClasses.primary} transition-all duration-500 ease-out`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-text-primary dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// STEPPER PROGRESS - Multi-step progress indicator
// ============================================

export const StepperProgress = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  className = '',
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`${isHorizontal ? 'flex items-center' : 'flex flex-col'} ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step indicator */}
            <div className={`flex ${isHorizontal ? 'flex-col items-center' : 'flex-row items-center gap-3'}`}>
              {/* Step circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-semibold transition-all duration-300
                  ${isCompleted
                    ? 'bg-success text-white'
                    : isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-bg-teal-wash text-text-muted'
                  }
                `}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step label */}
              {step.label && (
                <span
                  className={`
                    text-xs font-medium mt-1 text-center max-w-[80px]
                    ${isCompleted || isCurrent ? 'text-text-primary dark:text-white' : 'text-text-muted'}
                  `}
                >
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  ${isHorizontal ? 'flex-1 h-0.5 mx-2' : 'w-0.5 h-8 ml-4 my-1'}
                  ${isCompleted ? 'bg-success' : 'bg-bg-teal-wash'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// SEGMENTED PROGRESS - Segmented progress bar
// ============================================

export const SegmentedProgress = ({
  segments,
  activeSegment,
  className = '',
}) => {
  return (
    <div className={`flex gap-1 ${className}`}>
      {segments.map((segment, index) => (
        <div
          key={index}
          className={`
            flex-1 h-2 rounded-full transition-all duration-300
            ${index <= activeSegment ? 'bg-primary' : 'bg-bg-teal-wash'}
          `}
          title={segment.label}
        />
      ))}
    </div>
  );
};

// ============================================
// GOAL PROGRESS - Progress with goal display
// ============================================

export const GoalProgress = ({
  current,
  goal,
  size = 'md',
  showAmounts = true,
  className = '',
}) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {showAmounts && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">
            {current.toLocaleString()} MAD
          </span>
          <span className="text-text-muted">
            {goal.toLocaleString()} MAD
          </span>
        </div>
      )}
      <ProgressBar value={current} max={goal} size={size} color="primary" />
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">{Math.round(percentage)}% raised</span>
        <span className="text-text-muted">{Math.max(goal - current, 0).toLocaleString()} MAD to go</span>
      </div>
    </div>
  );
};

export default ProgressBar;
