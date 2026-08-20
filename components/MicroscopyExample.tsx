// Stylized illustration of a supported input (stained bacterial field) used as the
// "example supported image" on the upload page. Purely decorative, deterministic.

export function MicroscopyExample({ className }: { className?: string }) {
  const rods = [
    { x: 22, y: 30, r: -20 },
    { x: 60, y: 22, r: 35 },
    { x: 95, y: 44, r: -10 },
    { x: 40, y: 70, r: 60 },
    { x: 120, y: 78, r: 18 },
    { x: 150, y: 36, r: -45 },
    { x: 78, y: 100, r: 80 },
    { x: 132, y: 110, r: -25 },
    { x: 30, y: 110, r: 15 },
  ];
  const cocci = [
    { x: 165, y: 95 },
    { x: 175, y: 102 },
    { x: 168, y: 108 },
    { x: 50, y: 48 },
  ];
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      role="img"
      aria-label="Example stained microscopy field with pink rods and purple cocci"
    >
      <defs>
        <radialGradient id="field" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#1b1430" />
          <stop offset="100%" stopColor="#0c0a18" />
        </radialGradient>
      </defs>
      <rect width="200" height="140" rx="10" fill="url(#field)" />
      {rods.map((d, i) => (
        <g key={i} transform={`translate(${d.x} ${d.y}) rotate(${d.r})`}>
          <rect
            x="-9"
            y="-3.4"
            width="18"
            height="6.8"
            rx="3.4"
            fill="#ff6fa5"
            opacity="0.9"
          />
          <rect x="-9" y="-3.4" width="18" height="3" rx="2.5" fill="#ff97bd" opacity="0.6" />
        </g>
      ))}
      {cocci.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="4" fill="#b69bff" opacity="0.85" />
      ))}
    </svg>
  );
}
