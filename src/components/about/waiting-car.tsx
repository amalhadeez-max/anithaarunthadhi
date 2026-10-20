/**
 * Decorative "person waiting by a parked car" scene for the Find-us card.
 * Pure inline SVG + CSS keyframes (see globals.css → .scene-*). No runtime deps.
 */
export function WaitingCarScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 170" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3f4f6" />
        </linearGradient>
        <linearGradient id="wc-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* backdrop */}
      <rect width="320" height="170" fill="url(#wc-sky)" />
      {/* distant buildings */}
      <g fill="#e5e7eb">
        <rect x="18" y="70" width="34" height="48" rx="2" />
        <rect x="58" y="58" width="22" height="60" rx="2" />
        <rect x="250" y="64" width="30" height="54" rx="2" />
        <rect x="286" y="78" width="24" height="40" rx="2" />
      </g>
      <g fill="#f9fafb">
        <rect x="24" y="78" width="6" height="6" /><rect x="36" y="78" width="6" height="6" />
        <rect x="24" y="92" width="6" height="6" /><rect x="36" y="92" width="6" height="6" />
        <rect x="64" y="66" width="5" height="5" /><rect x="64" y="78" width="5" height="5" />
        <rect x="258" y="72" width="6" height="6" /><rect x="270" y="72" width="6" height="6" />
        <rect x="258" y="86" width="6" height="6" /><rect x="270" y="86" width="6" height="6" />
      </g>
      {/* tree */}
      <rect x="226" y="98" width="4" height="20" fill="#a3a3a3" />
      <circle cx="228" cy="92" r="12" fill="#d1d5db" />
      {/* road */}
      <rect x="0" y="118" width="320" height="52" fill="#e5e7eb" />
      <rect x="0" y="118" width="320" height="3" fill="#d1d5db" />
      <g stroke="#ffffff" strokeWidth="2" strokeDasharray="14 10" className="scene-road">
        <line x1="0" y1="146" x2="320" y2="146" />
      </g>

      {/* exhaust puffs */}
      <g fill="#cbd5e1">
        <circle cx="84" cy="112" r="4" className="scene-puff" />
        <circle cx="84" cy="112" r="3" className="scene-puff scene-puff-2" />
      </g>

      {/* car (bobbing) */}
      <g className="scene-car">
        {/* shadow */}
        <ellipse cx="150" cy="124" rx="62" ry="4" fill="#00000012" />
        {/* body */}
        <path
          d="M92 112c0-5 3-8 8-8h12l14-18c2-3 5-4 9-4h44c4 0 7 1 9 4l14 18h10c6 0 10 4 10 10v8c0 3-2 5-5 5H97c-3 0-5-2-5-5v-10z"
          fill="#111827"
        />
        {/* windows */}
        <path d="M120 104l11-15c1-1 2-2 4-2h18v17h-33z" fill="url(#wc-glass)" />
        <path d="M158 87h18c2 0 3 1 4 2l12 15h-34V87z" fill="url(#wc-glass)" />
        {/* door line + handle */}
        <line x1="155" y1="104" x2="155" y2="122" stroke="#374151" strokeWidth="1.5" />
        <rect x="158" y="109" width="8" height="2.5" rx="1" fill="#6b7280" />
        {/* headlight / tail light */}
        <rect x="212" y="110" width="8" height="5" rx="1.5" fill="#fde68a" />
        <rect x="94" y="110" width="6" height="5" rx="1.5" fill="#ef4444" />
        {/* wheels */}
        <g className="scene-wheel" style={{ transformOrigin: "118px 122px" }}>
          <circle cx="118" cy="122" r="10" fill="#1f2937" />
          <circle cx="118" cy="122" r="5.5" fill="#9ca3af" />
          <path d="M118 117v10M113 122h10" stroke="#1f2937" strokeWidth="1.5" />
        </g>
        <g className="scene-wheel" style={{ transformOrigin: "196px 122px" }}>
          <circle cx="196" cy="122" r="10" fill="#1f2937" />
          <circle cx="196" cy="122" r="5.5" fill="#9ca3af" />
          <path d="M196 117v10M191 122h10" stroke="#1f2937" strokeWidth="1.5" />
        </g>
      </g>

      {/* person waiting (checking phone) */}
      <g className="scene-person">
        <ellipse cx="248" cy="126" rx="10" ry="2" fill="#00000012" />
        {/* legs */}
        <path d="M244 98v26M252 98v26" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
        {/* shoes */}
        <rect x="240" y="122" width="9" height="4" rx="2" fill="#111827" />
        <rect x="249" y="122" width="9" height="4" rx="2" fill="#111827" />
        {/* torso */}
        <rect x="239" y="74" width="18" height="28" rx="6" fill="#e11d48" />
        {/* arm holding phone */}
        <path d="M241 80c-6 4-7 10-3 14" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" fill="none" />
        <rect x="233" y="91" width="7" height="10" rx="1.5" fill="#111827" />
        <rect x="234.5" y="92.5" width="4" height="6" rx="0.5" fill="#60a5fa" />
        {/* other arm */}
        <path d="M256 80c5 3 6 9 4 13" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* head */}
        <circle cx="248" cy="64" r="8" fill="#f5c6a5" />
        <path d="M240 62c1-6 5-9 8-9s7 3 8 9c-2-2-5-3-8-3s-6 1-8 3z" fill="#1f2937" />
      </g>

      {/* map pin above the car */}
      <g className="scene-pin">
        <path d="M150 48c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#e11d48" />
        <circle cx="150" cy="64" r="6" fill="#ffffff" />
      </g>
      <ellipse cx="150" cy="94" rx="7" ry="2" fill="#e11d4833" className="scene-pin-shadow" />
    </svg>
  );
}
