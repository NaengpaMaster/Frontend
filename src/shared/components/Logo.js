import { C } from '@/shared/data/mockData';

export function Logo({ size = 32, color = C.primary }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="3" width="34" height="42" rx="9" fill={color} />
      <rect x="12" y="8" width="24" height="10" rx="3" fill="#FFFFFF" fillOpacity="0.22" />
      <rect x="12" y="22" width="24" height="17" rx="3" fill="#FFFFFF" fillOpacity="0.12" />
      <rect x="15" y="11" width="2.6" height="4" rx="1.3" fill="#FFFFFF" />
      <rect x="15" y="26" width="2.6" height="4" rx="1.3" fill="#FFFFFF" />
      <path
        d="M30 27c3 0 5.5 2.5 5.5 5.6 0 3-2.4 5.4-5.5 6.4-3.1-1-5.5-3.4-5.5-6.4C24.5 29.5 27 27 30 27Z"
        fill="#FFFFFF"
      />
      <path
        d="M30 29.4c1.9 1.3 2.9 2.9 2.9 4.6"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
