import React from 'react';

export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="8" width="40" height="40" rx="6" fill="#071224" stroke="#2b6cff" strokeWidth="2" />
      <rect x="8" y="14" width="28" height="4" rx="1" fill="#163447" />
      <rect x="8" y="20" width="20" height="3" rx="1" fill="#0b2a3a" />
      <rect x="8" y="25" width="20" height="3" rx="1" fill="#0b2a3a" />
      <circle cx="48" cy="16" r="10" fill="#0b2a3a" stroke="#2b6cff" strokeWidth="2" />
      <path d="M50 20 L58 28" stroke="#2b6cff" strokeWidth="3" strokeLinecap="round" />
      <text x="10" y="44" fill="#9fb6d9" fontSize="8" fontWeight="700" fontFamily="Inter, Arial">FinSight</text>
    </svg>
  );
}
