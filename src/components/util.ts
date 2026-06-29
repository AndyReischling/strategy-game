import type { SpotColor } from "../data/types";

export const COLOR_HEX: Record<SpotColor, string> = {
  blue: "#3b9bd6",
  yellow: "#f2d024",
  orange: "#e8552b",
  green: "#2e9e5b",
  violet: "#7b5ea7",
  teal: "#1f9e94",
  ink: "#1a1a18",
};

export const colorClass = (c: SpotColor) => `c-${c}`;

/** readable text color over a spot fill */
export const onColor = (c: SpotColor): string =>
  c === "yellow" ? "#1a1a18" : "#ede8dc";

// Currency is billions of USD: a value of 100 renders as "$100B".
export function credits(n: number): string {
  const v = Math.round(n * 10) / 10;
  if (v === 0) return "$0";
  return `$${v}B`;
}
