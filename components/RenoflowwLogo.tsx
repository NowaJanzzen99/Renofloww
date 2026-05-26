'use client';

interface Props {
  /** 'full' shows icon + wordmark, 'icon' shows only the square icon */
  variant?: 'full' | 'icon';
  /** Controls the icon size and proportional text size */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color of the wordmark text.
   * 'green'   → #288760  (sidebar / app header)
   * 'dark'    → #1A1A1A  (homepage navbar on white)
   * 'white'   → white    (footer on dark bg)
   */
  textColor?: 'green' | 'dark' | 'white';
}

const iconDims   = { sm: 28, md: 36, lg: 44 } as const;
const fontSizes  = { sm: '15px', md: '20px', lg: '26px' } as const;
const textColors = { green: '#288760', dark: '#1A1A1A', white: '#FFFFFF' } as const;

export default function RenoflowwLogo({
  variant = 'full',
  size = 'md',
  textColor = 'green',
}: Props) {
  const dim    = iconDims[size];
  const radius = Math.round(dim * 0.28);
  const svgDim = Math.round(dim * 0.62);
  const color  = textColors[textColor];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 8 : 10, flexShrink: 0 }}>
      {/* ── Branded icon ─────────────────────────────────────────────────── */}
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #1a5140 0%, #288760 100%)',
          boxShadow: textColor === 'white' ? 'none' : '0 2px 8px rgba(40,135,96,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* House / roof silhouette — matches the "ww" double-peak concept */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          style={{ width: svgDim, height: svgDim }}
        >
          {/* Full house: roof + walls + door cutout */}
          <path
            d="M3 10.5 L12 3 L21 10.5 V20 C21 20.55 20.55 21 20 21 H15 V15 H9 V21 H4 C3.45 21 3 20.55 3 20 V10.5 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      {variant === 'full' && (
        <span
          style={{
            fontSize: fontSizes[size],
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            color,
          }}
        >
          Reno
          <span style={{ color: textColor === 'white' ? 'rgba(255,255,255,0.65)' : '#288760' }}>
            floww
          </span>
        </span>
      )}
    </div>
  );
}
