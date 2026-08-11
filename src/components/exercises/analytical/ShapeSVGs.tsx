/**
 * ShapeSVGs.tsx
 * Library of inline SVG components used as complex designs and section shapes
 * in the ANALYTICAL_PERCEPTION mock exercises.
 *
 * DESIGN CONVENTIONS:
 *  - Complex designs: black stroke, no fill (or white fill), viewBox="0 0 120 120"
 *  - Section shapes: blue stroke (#4F46E5), no fill, viewBox="0 0 40 40"
 */

// ---------------------------------------------------------------------------
// Complex Designs (120×120)
// ---------------------------------------------------------------------------

/** Diamond with inner diamond pattern (A1 design) */
export function DesignDiamondInner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer diamond */}
      <polygon points="60,8 112,60 60,112 8,60" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Inner diamond pattern — 4 chevrons */}
      <polygon points="60,24 96,60 60,96 24,60" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      <line x1="60" y1="8"  x2="60" y2="24"  stroke="#1a1a1a" strokeWidth="1.5" />
      <line x1="112" y1="60" x2="96" y2="60"  stroke="#1a1a1a" strokeWidth="1.5" />
      <line x1="60" y1="112" x2="60" y2="96"  stroke="#1a1a1a" strokeWidth="1.5" />
      <line x1="8" y1="60"  x2="24" y2="60"  stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Arrow-like inner lines */}
      <line x1="60" y1="24" x2="38" y2="60"  stroke="#1a1a1a" strokeWidth="1.2" />
      <line x1="60" y1="24" x2="82" y2="60"  stroke="#1a1a1a" strokeWidth="1.2" />
      <line x1="60" y1="96" x2="38" y2="60"  stroke="#1a1a1a" strokeWidth="1.2" />
      <line x1="60" y1="96" x2="82" y2="60"  stroke="#1a1a1a" strokeWidth="1.2" />
    </svg>
  );
}

/** Square with X crossing lines (A2 design) */
export function DesignSquareX({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer square */}
      <rect x="10" y="10" width="100" height="100" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* X diagonals */}
      <line x1="10" y1="10" x2="110" y2="110" stroke="#1a1a1a" strokeWidth="1.8" />
      <line x1="110" y1="10" x2="10" y2="110"  stroke="#1a1a1a" strokeWidth="1.8" />
      {/* Inner triangles formed by bisectors */}
      <line x1="60" y1="10" x2="60" y2="110" stroke="#1a1a1a" strokeWidth="1.4" />
      <line x1="10" y1="60" x2="110" y2="60"  stroke="#1a1a1a" strokeWidth="1.4" />
    </svg>
  );
}

/** Rectangle with 2 oval shapes inside (A3 design) */
export function DesignRectOvals({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer rectangle */}
      <rect x="8" y="25" width="104" height="70" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Left oval */}
      <ellipse cx="38" cy="60" rx="20" ry="28" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      {/* Right oval */}
      <ellipse cx="82" cy="60" rx="20" ry="28" fill="none" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  );
}

/** Triangle with inner triangles (A4 design) */
export function DesignTriangleInner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer triangle */}
      <polygon points="60,8 112,108 8,108" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Inner triangle 1 */}
      <polygon points="60,32 92,92 28,92"  fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      {/* Inner triangle 2 */}
      <polygon points="60,52 78,84 42,84"  fill="none" stroke="#1a1a1a" strokeWidth="1.4" />
    </svg>
  );
}

/** Rectangle with oval columns (B1 design) */
export function DesignRectColumns({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer rectangle */}
      <rect x="8" y="15" width="104" height="90" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Three oval columns */}
      <ellipse cx="32" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      <ellipse cx="60" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      <ellipse cx="88" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
    </svg>
  );
}

/** Parallelogram with inner shapes (B2 design) */
export function DesignParallelogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer parallelogram */}
      <polygon points="25,20 110,20 95,100 10,100" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Inner parallelogram 1 */}
      <polygon points="38,36 97,36 82,84 23,84"   fill="none" stroke="#1a1a1a" strokeWidth="1.6" />
      {/* Diagonal lines */}
      <line x1="25" y1="20" x2="95" y2="100" stroke="#1a1a1a" strokeWidth="1.3" />
      <line x1="110" y1="20" x2="10" y2="100" stroke="#1a1a1a" strokeWidth="1.3" />
    </svg>
  );
}

/** Circle with hexagon pattern inside (B3 design) */
export function DesignCircleHex({ className = "" }: { className?: string }) {
  // Pentagon inside circle — 5 instances
  const pts = (cx: number, cy: number, r: number, n: number, offset: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n + offset;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Hexagon */}
      <polygon points={pts(60, 60, 36, 6, -Math.PI / 2)} fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      {/* 5 inner pentagons arranged in a ring */}
      {[0,1,2,3,4].map((i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const cx = 60 + 22 * Math.cos(angle);
        const cy = 60 + 22 * Math.sin(angle);
        return (
          <polygon
            key={i}
            points={pts(cx, cy, 10, 5, -Math.PI / 2)}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.2"
          />
        );
      })}
    </svg>
  );
}

/** Overlapping rectangles (B4 design) */
export function DesignOverlapRects({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Back rectangles */}
      <rect x="8"  y="30" width="68" height="60" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="44" y="20" width="68" height="60" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="26" y="40" width="68" height="60" fill="white" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Exercise 2 designs (Complex Pattern Analysis)
// ---------------------------------------------------------------------------

/** Concentric squares (C1 design) */
export function DesignConcentricSquares({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6"  y="6"  width="108" height="108" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      <rect x="20" y="20" width="80"  height="80"  fill="none"  stroke="#1a1a1a" strokeWidth="1.8" />
      <rect x="34" y="34" width="52"  height="52"  fill="none"  stroke="#1a1a1a" strokeWidth="1.4" />
      <rect x="48" y="48" width="24"  height="24"  fill="none"  stroke="#1a1a1a" strokeWidth="1.2" />
      <line x1="6" y1="6"  x2="114" y2="114" stroke="#1a1a1a" strokeWidth="1.2" />
      <line x1="114" y1="6" x2="6" y2="114" stroke="#1a1a1a" strokeWidth="1.2" />
    </svg>
  );
}

/** Star / asterisk pattern (C2 design) */
export function DesignStar({ className = "" }: { className?: string }) {
  const lines = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI * i) / 6;
    return { x1: 60 - 50 * Math.cos(a), y1: 60 - 50 * Math.sin(a), x2: 60 + 50 * Math.cos(a), y2: 60 + 50 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {lines.map((l, i) => <line key={i} {...l} stroke="#1a1a1a" strokeWidth="2" />)}
      <circle cx="60" cy="60" r="8" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
    </svg>
  );
}

/** Grid of dots pattern (C3 design) */
export function DesignDotGrid({ className = "" }: { className?: string }) {
  const dots: { cx: number; cy: number }[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    dots.push({ cx: 18 + c * 28, cy: 18 + r * 28 });
  }
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="5" fill="#1a1a1a" />)}
      {/* Lines connecting adjacent dots */}
      {dots.map((d, i) => {
        const col = i % 4; const row = Math.floor(i / 4);
        return (
          <g key={`l${i}`}>
            {col < 3 && <line x1={d.cx} y1={d.cy} x2={d.cx + 28} y2={d.cy} stroke="#1a1a1a" strokeWidth="1" />}
            {row < 3 && <line x1={d.cx} y1={d.cy} x2={d.cx} y2={d.cy + 28} stroke="#1a1a1a" strokeWidth="1" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Flower / petal pattern (C4 design) */
export function DesignFlower({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 6;
    const cx = 60 + 22 * Math.cos(a);
    const cy = 60 + 22 * Math.sin(a);
    return { cx, cy };
  });
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />
      {petals.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r="16" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />)}
      <circle cx="60" cy="60" r="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
    </svg>
  );
}

/** Arrow cross pattern (C5 design) */
export function DesignArrowCross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      {/* 4 arrows pointing inward */}
      <polygon points="60,14 70,30 63,30 63,56 57,56 57,30 50,30" fill="#1a1a1a" />
      <polygon points="60,106 50,90 57,90 57,64 63,64 63,90 70,90" fill="#1a1a1a" />
      <polygon points="14,60 30,50 30,57 56,57 56,63 30,63 30,70" fill="#1a1a1a" />
      <polygon points="106,60 90,70 90,63 64,63 64,57 90,57 90,50" fill="#1a1a1a" />
    </svg>
  );
}

/** Zigzag / chevron row pattern (C6 design) */
export function DesignZigzag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" strokeWidth="2" />
      {/* 4 rows of chevrons */}
      {[22, 42, 62, 82, 102].map((y, i) => (
        <polyline
          key={i}
          points={`6,${y} 21,${y - 14} 36,${y} 51,${y - 14} 66,${y} 81,${y - 14} 96,${y} 114,${y - 14}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.8"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section Shapes (40×40) — shown in blue outline
// ---------------------------------------------------------------------------

/** Arrow / chevron section shape */
export function SectionArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,30 20,10 34,30" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Small triangle section */
export function SectionTriangle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,6 34,34 6,34" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Arch / dome section */
export function SectionArch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M6,34 A14,14 0 0 1 34,34" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
      <line x1="6" y1="34" x2="6" y2="34" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Lens / oval section */
export function SectionLens({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Small parallelogram section */
export function SectionParallelogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="10,30 30,30 34,10 14,10" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Pentagon section */
export function SectionPentagon({ className = "" }: { className?: string }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return `${20 + 14 * Math.cos(a)},${20 + 14 * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points={pts} fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Angular / L-shape section */
export function SectionAngular({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polyline points="8,8 8,32 32,32" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Small square section */
export function SectionSquare({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="24" height="24" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Circle section */
export function SectionCircle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="12" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Diamond section */
export function SectionDiamond({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,6 34,20 20,34 6,20" fill="none" stroke="#4F46E5" strokeWidth="2.5" />
    </svg>
  );
}

/** Zigzag section — single chevron */
export function SectionZigzag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,30 14,14 22,26 30,10 38,24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SVG → inline string serializer (used for mock data)
// Converts a React SVG string to raw SVG text for storage in PerceptionCell.
// ---------------------------------------------------------------------------

/** Returns an SVG *string* for use in PerceptionCell.design_svg / section_svg fields */
function makeSvgString(svgBody: string, viewBox: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${svgBody}</svg>`;
}

// Pre-built SVG strings for mock data (avoids ReactDOMServer dependency)
export const MOCK_DESIGN_SVGS = {
  diamondInner: makeSvgString(
    `<polygon points="60,8 112,60 60,112 8,60" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <polygon points="60,24 96,60 60,96 24,60" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <line x1="60" y1="8" x2="60" y2="24" stroke="#1a1a1a" stroke-width="1.5"/>
     <line x1="112" y1="60" x2="96" y2="60" stroke="#1a1a1a" stroke-width="1.5"/>
     <line x1="60" y1="112" x2="60" y2="96" stroke="#1a1a1a" stroke-width="1.5"/>
     <line x1="8" y1="60" x2="24" y2="60" stroke="#1a1a1a" stroke-width="1.5"/>
     <line x1="60" y1="24" x2="38" y2="60" stroke="#1a1a1a" stroke-width="1.2"/>
     <line x1="60" y1="24" x2="82" y2="60" stroke="#1a1a1a" stroke-width="1.2"/>
     <line x1="60" y1="96" x2="38" y2="60" stroke="#1a1a1a" stroke-width="1.2"/>
     <line x1="60" y1="96" x2="82" y2="60" stroke="#1a1a1a" stroke-width="1.2"/>`,
    "0 0 120 120"
  ),
  squareX: makeSvgString(
    `<rect x="10" y="10" width="100" height="100" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <line x1="10" y1="10" x2="110" y2="110" stroke="#1a1a1a" stroke-width="1.8"/>
     <line x1="110" y1="10" x2="10" y2="110" stroke="#1a1a1a" stroke-width="1.8"/>
     <line x1="60" y1="10" x2="60" y2="110" stroke="#1a1a1a" stroke-width="1.4"/>
     <line x1="10" y1="60" x2="110" y2="60" stroke="#1a1a1a" stroke-width="1.4"/>`,
    "0 0 120 120"
  ),
  rectOvals: makeSvgString(
    `<rect x="8" y="25" width="104" height="70" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <ellipse cx="38" cy="60" rx="20" ry="28" fill="none" stroke="#1a1a1a" stroke-width="2"/>
     <ellipse cx="82" cy="60" rx="20" ry="28" fill="none" stroke="#1a1a1a" stroke-width="2"/>`,
    "0 0 120 120"
  ),
  triangleInner: makeSvgString(
    `<polygon points="60,8 112,108 8,108" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <polygon points="60,32 92,92 28,92" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polygon points="60,52 78,84 42,84" fill="none" stroke="#1a1a1a" stroke-width="1.4"/>`,
    "0 0 120 120"
  ),
  rectColumns: makeSvgString(
    `<rect x="8" y="15" width="104" height="90" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <ellipse cx="32" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <ellipse cx="60" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <ellipse cx="88" cy="60" rx="14" ry="34" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>`,
    "0 0 120 120"
  ),
  parallelogram: makeSvgString(
    `<polygon points="25,20 110,20 95,100 10,100" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <polygon points="38,36 97,36 82,84 23,84" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>
     <line x1="25" y1="20" x2="95" y2="100" stroke="#1a1a1a" stroke-width="1.3"/>
     <line x1="110" y1="20" x2="10" y2="100" stroke="#1a1a1a" stroke-width="1.3"/>`,
    "0 0 120 120"
  ),
  circleHex: makeSvgString(
    `<circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <polygon points="60,24 89.3,42 89.3,78 60,96 30.7,78 30.7,42" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <circle cx="60" cy="24" r="10" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
     <circle cx="89.3" cy="42" r="10" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
     <circle cx="89.3" cy="78" r="10" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
     <circle cx="60" cy="96" r="10" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
     <circle cx="30.7" cy="78" r="10" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>`,
    "0 0 120 120"
  ),
  overlapRects: makeSvgString(
    `<rect x="8" y="30" width="68" height="60" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     <rect x="44" y="20" width="68" height="60" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     <rect x="26" y="40" width="68" height="60" fill="white" stroke="#1a1a1a" stroke-width="2"/>`,
    "0 0 120 120"
  ),
  concentricSquares: makeSvgString(
    `<rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <rect x="20" y="20" width="80" height="80" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="34" y="34" width="52" height="52" fill="none" stroke="#1a1a1a" stroke-width="1.4"/>
     <rect x="48" y="48" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
     <line x1="6" y1="6" x2="114" y2="114" stroke="#1a1a1a" stroke-width="1.2"/>
     <line x1="114" y1="6" x2="6" y2="114" stroke="#1a1a1a" stroke-width="1.2"/>`,
    "0 0 120 120"
  ),
  star: makeSvgString(
    `<circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <line x1="10" y1="60" x2="110" y2="60" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="35" y1="17" x2="85" y2="103" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="85" y1="17" x2="35" y2="103" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="10" y1="34" x2="110" y2="86" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="10" y1="86" x2="110" y2="34" stroke="#1a1a1a" stroke-width="2"/>
     <circle cx="60" cy="60" r="8" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>`,
    "0 0 120 120"
  ),
  dotGrid: makeSvgString(
    `<rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) =>
       `<circle cx="${18 + c * 28}" cy="${18 + r * 28}" r="5" fill="#1a1a1a"/>`
     ).join("")).join("")}
     ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 3 }, (_, c) =>
       `<line x1="${18 + c * 28}" y1="${18 + r * 28}" x2="${18 + (c + 1) * 28}" y2="${18 + r * 28}" stroke="#1a1a1a" stroke-width="1"/>`
     ).join("")).join("")}
     ${Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) =>
       `<line x1="${18 + c * 28}" y1="${18 + r * 28}" x2="${18 + c * 28}" y2="${18 + (r + 1) * 28}" stroke="#1a1a1a" stroke-width="1"/>`
     ).join("")).join("")}`,
    "0 0 120 120"
  ),
  zigzag: makeSvgString(
    `<rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     <polyline points="6,22 21,8 36,22 51,8 66,22 81,8 96,22 114,8" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polyline points="6,42 21,28 36,42 51,28 66,42 81,28 96,42 114,28" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polyline points="6,62 21,48 36,62 51,48 66,62 81,48 96,62 114,48" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polyline points="6,82 21,68 36,82 51,68 66,82 81,68 96,82 114,68" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polyline points="6,102 21,88 36,102 51,88 66,102 81,88 96,102 114,88" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>`,
    "0 0 120 120"
  ),
  concentricCircles: makeSvgString(
    `<circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <circle cx="60" cy="60" r="40" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <circle cx="60" cy="60" r="28" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>
     <circle cx="60" cy="60" r="16" fill="none" stroke="#1a1a1a" stroke-width="1.4"/>
     <circle cx="60" cy="60" r="6" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>`,
    "0 0 120 120"
  ),
  flowerPetals: makeSvgString(
    `<circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <ellipse cx="60" cy="36" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(0 60 36)"/>
     <ellipse cx="80.8" cy="48" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(60 80.8 48)"/>
     <ellipse cx="80.8" cy="72" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(120 80.8 72)"/>
     <ellipse cx="60" cy="84" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(180 60 84)"/>
     <ellipse cx="39.2" cy="72" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(240 39.2 72)"/>
     <ellipse cx="39.2" cy="48" rx="18" ry="11" fill="none" stroke="#1a1a1a" stroke-width="1.8" transform="rotate(300 39.2 48)"/>
     <circle cx="60" cy="60" r="10" fill="none" stroke="#1a1a1a" stroke-width="2"/>`,
    "0 0 120 120"
  ),
  spokeWheel: makeSvgString(
    `<circle cx="60" cy="60" r="52" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <line x1="8" y1="60" x2="112" y2="60" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="60" y1="8" x2="60" y2="112" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="23" y1="23" x2="97" y2="97" stroke="#1a1a1a" stroke-width="2"/>
     <line x1="97" y1="23" x2="23" y2="97" stroke="#1a1a1a" stroke-width="2"/>
     <circle cx="60" cy="60" r="7" fill="none" stroke="#1a1a1a" stroke-width="1.6"/>`,
    "0 0 120 120"
  ),
  nestedDiamonds: makeSvgString(
    `<polygon points="60,8 112,60 60,112 8,60" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
     <polygon points="60,22 98,60 60,98 22,60" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <polygon points="60,36 84,60 60,84 36,60" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
     <polygon points="60,48 72,60 60,72 48,60" fill="none" stroke="#1a1a1a" stroke-width="1.3"/>`,
    "0 0 120 120"
  ),
  arrowCross: makeSvgString(
    `<rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     <polygon points="60,14 70,30 63,30 63,56 57,56 57,30 50,30" fill="#1a1a1a"/>
     <polygon points="60,106 50,90 57,90 57,64 63,64 63,90 70,90" fill="#1a1a1a"/>
     <polygon points="14,60 30,50 30,57 56,57 56,63 30,63 30,70" fill="#1a1a1a"/>
     <polygon points="106,60 90,70 90,63 64,63 64,57 90,57 90,50" fill="#1a1a1a"/>`,
    "0 0 120 120"
  ),
  squareGrid: makeSvgString(
    `<rect x="6" y="6" width="108" height="108" fill="white" stroke="#1a1a1a" stroke-width="2"/>
     <rect x="16" y="16" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="48" y="16" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="80" y="16" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="16" y="48" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="48" y="48" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="80" y="48" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="16" y="80" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="48" y="80" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>
     <rect x="80" y="80" width="24" height="24" fill="none" stroke="#1a1a1a" stroke-width="1.8"/>`,
    "0 0 120 120"
  ),
} as const;

export const MOCK_SECTION_SVGS = {
  arrow: makeSvgString(
    `<polygon points="20,6 30,18 24,18 24,34 16,34 16,18 10,18" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`,
    "0 0 40 40"
  ),
  /** Closed triangle — use when triangular wedge shapes appear in design */
  triangle: makeSvgString(
    `<polygon points="20,6 34,34 6,34" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  arch: makeSvgString(
    `<path d="M6,34 A14,14 0 0 1 34,34" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  /** Closed ellipse — use when oval shapes appear in design */
  oval: makeSvgString(
    `<ellipse cx="20" cy="20" rx="13" ry="9" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  lens: makeSvgString(
    `<ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  parallelogram: makeSvgString(
    `<polygon points="10,30 30,30 34,10 14,10" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  pentagon: makeSvgString(
    `<polygon points="20,6 34,17 29,33 11,33 6,17" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  angular: makeSvgString(
    `<polyline points="8,8 8,32 32,32" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`,
    "0 0 40 40"
  ),
  /** Closed rectangle — use when rectangular shapes appear in design */
  rect: makeSvgString(
    `<rect x="6" y="10" width="28" height="20" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  square: makeSvgString(
    `<rect x="8" y="8" width="24" height="24" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  circle: makeSvgString(
    `<circle cx="20" cy="20" r="12" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  diamond: makeSvgString(
    `<polygon points="20,6 34,20 20,34 6,20" fill="none" stroke="#4F46E5" stroke-width="2.5"/>`,
    "0 0 40 40"
  ),
  /** Closed chevron V — use when chevron/zigzag rows appear in design */
  chevron: makeSvgString(
    `<polygon points="20,8 36,28 28,28 20,18 12,28 4,28" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`,
    "0 0 40 40"
  ),
  zigzag: makeSvgString(
    `<polyline points="6,30 14,14 22,26 30,10 38,24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round"/>`,
    "0 0 40 40"
  ),
} as const;
