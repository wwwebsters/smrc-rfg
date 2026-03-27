export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Running figure silhouette */}
      <g transform="translate(2, 4)">
        {/* Head */}
        <circle cx="10" cy="6" r="5" fill="#F5A623" />
        {/* Body */}
        <path
          d="M10 11 L10 25"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Front arm */}
        <path
          d="M10 15 L17 20"
          stroke="#F5A623"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Back arm */}
        <path
          d="M10 15 L3 21"
          stroke="#F5A623"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Front leg */}
        <path
          d="M10 25 L18 36"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Back leg */}
        <path
          d="M10 25 L2 34"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Motion lines */}
        <path d="M22 10 L28 10" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M24 15 L30 15" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <path d="M22 20 L27 20" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.2" />
      </g>

      {/* SMRC text */}
      <text
        x="40"
        y="33"
        fontFamily="Poppins, sans-serif"
        fontWeight="800"
        fontSize="32"
        letterSpacing="2"
        fill="#F5A623"
      >
        SMRC
      </text>

      {/* Underline accent */}
      <rect x="40" y="38" width="60" height="2.5" rx="1.25" fill="#F5A623" opacity="0.4" />
      <rect x="40" y="38" width="30" height="2.5" rx="1.25" fill="#F5A623" opacity="0.7" />
    </svg>
  );
}
