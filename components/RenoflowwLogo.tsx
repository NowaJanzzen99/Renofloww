'use client';

/**
 * Renofloww logo component.
 *
 * variant="full"  → complete wordmark  (Renofloww with house in the ww)
 * variant="icon"  → house-only icon    (for tablet icon-only sidebar)
 *
 * The wordmark is an inline SVG so it inherits the page font and renders
 * identically everywhere. House roof-lines + chimney are overlaid on the
 * "ww" portion via SVG paths.
 *
 * All positions are calibrated for Inter 700 at 60px; smaller sizes are
 * produced by scaling the viewBox via the SVG width/height attributes.
 */

interface Props {
  variant?: 'full' | 'icon';
  /** Controls physical size of the rendered element. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 'green'  → #288760  (on white / light backgrounds)
   * 'dark'   → #1A1A1A  (homepage navbar — keeps wordmark charcoal)
   * 'white'  → white    (footer / dark backgrounds)
   */
  textColor?: 'green' | 'dark' | 'white';
}

// ─── Size table ────────────────────────────────────────────────────────────
// All viewBox coordinates are designed at the "lg" reference size and the
// SVG is then rendered smaller via width/height attrs.
const VIEWBOX_W = 345;
const VIEWBOX_H = 78;

const physicalW = { sm: 207, md: 276, lg: 345 } as const;
const physicalH = { sm: 47,  md: 62,  lg: 78  } as const;

// ─── Colour map ────────────────────────────────────────────────────────────
const colours = {
  green: '#288760',
  dark:  '#288760', // still green — the actual logo is always green
  white: '#FFFFFF',
} as const;

// ─── House overlay coordinates (at 60 px / Inter 700 reference) ───────────
//
// "Renofloww" at font-size 60, weight 700, letter-spacing -1
// Empirically: "Renoflo" ≈ 248 px, each "w" ≈ 45 px  → "ww" ≈ 90 px
//
// x-height of Inter Bold 60 px ≈ 31.5 px  → peaks sit at y = 68 - 31.5 = 36.5 ≈ 36
//
// Within each "w", the two interior peaks are at ≈ 24 % and 74 % of the
// letter width (45 px):
//   peak 1:  45 × 0.24 ≈ 11  →  248 + 11 = 259
//   peak 2:  45 × 0.74 ≈ 33  →  248 + 33 = 281
//   (right w, offset by 45 px)
//   peak 3:  293 + 11  = 304
//   peak 4:  293 + 33  = 326

const PEAK_Y        = 36;     // y of the roofline (x-height of the "w" glyphs)
const CHIMNEY_TOP   = 16;     // y of chimney top
const STROKE_W      = 4.8;    // stroke width of roof lines (matches bold letter strokes)
const CHIMNEY_W     = 8;
const CHIMNEY_R     = 1.5;

// Left "w"  (starts ≈ x=252)
const LW_X0         = 252;
const LW_PEAK1      = LW_X0 + 11;   // 263
const LW_PEAK2      = LW_X0 + 33;   // 285
// chimney is above LW_PEAK1, offset slightly left
const CHIMNEY_X     = LW_PEAK1 - 4; // 259

// Right "w" (starts ≈ x=293)
const RW_X0         = LW_X0 + 44;   // 296
const RW_PEAK1      = RW_X0 + 11;   // 307
const RW_PEAK2      = RW_X0 + 33;   // 329

// ─── Component ─────────────────────────────────────────────────────────────
export default function RenoflowwLogo({
  variant   = 'full',
  size      = 'md',
  textColor = 'green',
}: Props) {
  const fill = colours[textColor];

  // ── Icon-only variant (tablet sidebar) ───────────────────────────────────
  if (variant === 'icon') {
    const dim = { sm: 28, md: 36, lg: 44 }[size];
    const src = textColor === 'white' ? '/logo-mark-white.png' : '/logo-mark.png';
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Renofloww"
        style={{ width: dim, height: dim, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }

  // ── Full wordmark variant ─────────────────────────────────────────────────
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width={physicalW[size]}
      height={physicalH[size]}
      style={{ display: 'block', flexShrink: 0 }}
      role="img"
      aria-label="Renofloww"
    >
      {/* ── Wordmark text ──────────────────────────────────────────────── */}
      <text
        x="3"
        y="68"
        fontFamily="Inter, Nunito, 'Segoe UI', system-ui, sans-serif"
        fontWeight="700"
        fontSize="60"
        letterSpacing="-1"
        fill={fill}
      >
        Renofloww
      </text>

      {/* ── House roof-line — left "w" ─────────────────────────────────── */}
      <line
        x1={LW_PEAK1} y1={PEAK_Y}
        x2={LW_PEAK2} y2={PEAK_Y}
        stroke={fill}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />

      {/* ── Chimney above left peak ────────────────────────────────────── */}
      <rect
        x={CHIMNEY_X}
        y={CHIMNEY_TOP}
        width={CHIMNEY_W}
        height={PEAK_Y - CHIMNEY_TOP + STROKE_W / 2}
        rx={CHIMNEY_R}
        fill={fill}
      />

      {/* ── House roof-line — right "w" ────────────────────────────────── */}
      <line
        x1={RW_PEAK1} y1={PEAK_Y}
        x2={RW_PEAK2} y2={PEAK_Y}
        stroke={fill}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
    </svg>
  );
}
