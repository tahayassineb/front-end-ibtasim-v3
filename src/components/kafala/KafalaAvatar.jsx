import React from 'react';

// Grey silhouette SVGs for male/female
const MaleSilhouette = ({ size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ذكر"
  >
    {/* Head */}
    <circle cx="60" cy="38" r="18" fill="#9CA3AF" />
    {/* Body */}
    <path
      d="M30 115 C30 90 40 78 60 75 C80 78 90 90 90 115"
      fill="#9CA3AF"
    />
    {/* Shoulders / torso */}
    <rect x="36" y="72" width="48" height="28" rx="12" fill="#9CA3AF" />
  </svg>
);

const FemaleSilhouette = ({ size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="أنثى"
  >
    {/* Hijab outer */}
    <ellipse cx="60" cy="42" rx="26" ry="28" fill="#9CA3AF" />
    {/* Face */}
    <ellipse cx="60" cy="38" rx="14" ry="16" fill="#D1D5DB" />
    {/* Hijab bottom drape */}
    <path
      d="M34 55 Q60 72 86 55 L90 80 Q60 88 30 80 Z"
      fill="#9CA3AF"
    />
    {/* Body */}
    <path
      d="M33 78 Q60 90 87 78 L90 115 H30 Z"
      fill="#9CA3AF"
    />
  </svg>
);

/**
 * KafalaAvatar — Shows orphan photo if available, or a gender-appropriate grey silhouette.
 *
 * Props:
 *   gender: "male" | "female"
 *   photo: storageId string (optional)
 *   photoUrl: full URL (optional — takes priority over photo storageId)
 *   size: number (px, default 80)
 *   className: additional CSS classes
 */
export default function KafalaAvatar({ gender, photo, photoUrl, size = 80, className = '' }) {
  const hasPhoto = !!(photo || photoUrl);

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {hasPhoto ? (
        <img
          src={photoUrl || photo}
          alt="صورة اليتيم"
          className="w-full h-full object-cover"
          onError={(e) => {
            // On image load error, hide img and show silhouette
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Silhouette fallback — always rendered, hidden when photo loads */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-gray-100"
        style={{ display: hasPhoto ? 'none' : 'flex' }}
      >
        {gender === 'female' ? (
          <FemaleSilhouette size={Math.round(size * 0.85)} />
        ) : (
          <MaleSilhouette size={Math.round(size * 0.85)} />
        )}
      </div>
    </div>
  );
}
