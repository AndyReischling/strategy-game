// Stylized, deliberately blocky riso continents in a 100 × 60 board space
// (equirectangular-ish). Not cartographically exact — tuned so each region's
// anchor (see regions.ts) lands on the right landmass. Heavy outline + halftone
// applied in CSS/SVG. The board is a flat map you lean over, not a globe (§10.1).

export const CONTINENTS: string[] = [
  // North America
  "M5,17 L24,14 L33,22 L31,33 L24,44 L14,45 L8,37 L4,27 Z",
  // Central strip
  "M24,44 L31,45 L29,50 L25,49 Z",
  // South America
  "M27,50 L34,49 L33,57 L29,60 L26,56 Z",
  // Greenland nub
  "M33,10 L40,9 L40,15 L34,16 Z",
  // Europe (with a Scandinavian spur upward)
  "M42,17 L48,13 L51,17 L56,18 L55,27 L49,33 L44,31 L41,24 Z",
  // Africa
  "M45,34 L60,33 L62,44 L56,55 L49,56 L45,46 Z",
  // Asia (the dominant eastern mass)
  "M56,14 L78,11 L90,15 L92,28 L86,36 L74,37 L64,35 L57,27 Z",
  // India peninsula
  "M65,36 L74,36 L72,47 L67,48 Z",
  // Middle East / Gulf bridge
  "M56,36 L64,36 L63,44 L57,44 Z",
  // Japan / Korea island arc
  "M82,30 L86,29 L87,35 L84,38 L81,35 Z",
  // SE Asia / Oceania
  "M78,40 L92,42 L90,53 L80,52 L77,46 Z",
];

// Soft riso clouds drifting over the ocean (§10.3 ambient life)
export const CLOUDS = [
  { x: 12, y: 8, s: 1.1, d: 38 },
  { x: 64, y: 7, s: 0.85, d: 52 },
  { x: 40, y: 52, s: 1.25, d: 64 },
  { x: 86, y: 22, s: 0.7, d: 46 },
];
