import { useId } from "react";
import type { LayerId, LayerOption, SpotColor } from "../../data/types";
import { COLOR_HEX } from "../util";

interface Props {
  layer: LayerId;
  option: LayerOption;
  color: SpotColor;
  exposed?: boolean;
  damaged?: boolean;
  rising?: boolean;
  scale?: number;
}

// Riso building "standee" — a flat shape that rises from the board like a game
// piece. The silhouette encodes the choice (§10.1): cooling tower vs wind vs
// chain-link compute; a vault vs a cage for weights; a storefront for an app.
export function Building({ layer, option, color, exposed, damaged, rising, scale = 1 }: Props) {
  const id = useId().replace(/:/g, "");
  const fill = COLOR_HEX[color];
  const ink = "#1a1a18";
  const tags = option.tags;
  const has = (t: string) => tags.includes(t as never);

  return (
    <div className={`bld ${rising ? "rising" : ""} ${exposed ? "exposed" : ""} ${damaged ? "damaged" : ""}`} style={{ transform: `scale(${scale})` }}>
      <svg viewBox="0 0 48 64" width="46" height="62" aria-hidden>
        <defs>
          <pattern id={`d${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill={ink} opacity="0.55" />
          </pattern>
        </defs>
        {/* ground shadow */}
        <ellipse cx="24" cy="60" rx="15" ry="3.4" fill={ink} opacity="0.28" />

        {layer === "chips" && (
          <g>
            <rect x="13" y="24" width="22" height="22" rx="2" fill={fill} stroke={ink} strokeWidth="2.5" />
            <rect x="18" y="29" width="12" height="12" fill={`url(#d${id})`} stroke={ink} strokeWidth="1.5" />
            {[15, 21, 27].map((x) => (<g key={x}><line x1={x} y1="20" x2={x} y2="24" stroke={ink} strokeWidth="2" /><line x1={x} y1="46" x2={x} y2="50" stroke={ink} strokeWidth="2" /></g>))}
            {has("leverage") && <text x="24" y="17" textAnchor="middle" fontSize="11" fill={ink}>◆</text>}
          </g>
        )}

        {layer === "compute" && (
          <g>
            <rect x="9" y="34" width="30" height="20" fill={fill} stroke={ink} strokeWidth="2.5" />
            <rect x="9" y="34" width="30" height="20" fill={`url(#d${id})`} opacity="0.6" />
            {(has("nuclear")) && <g><rect x="26" y="18" width="9" height="18" rx="4.5" fill={fill} stroke={ink} strokeWidth="2.5" /><path d="M26 23 Q30 21 35 23" fill="none" stroke={ink} strokeWidth="1.5" /></g>}
            {has("renewable") && <g><line x1="16" y1="18" x2="16" y2="34" stroke={ink} strokeWidth="2.5" /><g transform="translate(16,18)"><path d="M0 0 L0 -7 M0 0 L6 4 M0 0 L-6 4" stroke={ink} strokeWidth="2.5" fill="none" /></g></g>}
            {has("foreign") && [12, 18, 24, 30].map((x) => <line key={x} x1={x} y1="34" x2={x + 6} y2="54" stroke={ink} strokeWidth="1.2" opacity="0.7" />)}
            {has("small-compute") && <path d="M14 34 a10 8 0 0 1 20 0" fill={fill} stroke={ink} strokeWidth="2.5" />}
            <rect x="14" y="44" width="5" height="10" fill={ink} opacity="0.8" />
          </g>
        )}

        {layer === "model" && (
          <g>
            <path d="M12 52 L12 30 L24 22 L36 30 L36 52 Z" fill={fill} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M24 22 L36 30 L36 52" fill={`url(#d${id})`} opacity="0.5" />
            <circle cx="24" cy="38" r="5.5" fill="none" stroke={ink} strokeWidth="2.2" />
            <path d="M24 32.5 L24 29 M24 43.5 L24 47 M18.5 38 L15 38 M29.5 38 L33 38" stroke={ink} strokeWidth="2" />
          </g>
        )}

        {layer === "weights" && (
          <g>
            <rect x="12" y="28" width="24" height="24" fill={fill} stroke={ink} strokeWidth="2.5" />
            <rect x="12" y="28" width="24" height="24" fill={`url(#d${id})`} opacity="0.45" />
            {has("owned") ? (
              <g><circle cx="24" cy="40" r="6" fill="none" stroke={ink} strokeWidth="2.5" /><circle cx="24" cy="40" r="1.6" fill={ink} /><line x1="24" y1="40" x2="28" y2="44" stroke={ink} strokeWidth="2.2" /></g>
            ) : (
              [17, 22, 27, 32].map((x) => <line key={x} x1={x} y1="28" x2={x} y2="52" stroke={ink} strokeWidth="2" />)
            )}
          </g>
        )}

        {layer === "hosting" && (
          <g>
            <rect x="11" y="32" width="26" height="22" fill={fill} stroke={ink} strokeWidth="2.5" />
            <path d="M9 32 L39 32 L36 26 L12 26 Z" fill={fill} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
            {[14, 20, 26, 32].map((x) => <line key={x} x1={x} y1="26" x2={x} y2="32" stroke={ink} strokeWidth="1.4" />)}
            <rect x="20" y="42" width="8" height="12" fill={`url(#d${id})`} stroke={ink} strokeWidth="1.6" />
            {has("consumer-market") && <g><line x1="33" y1="32" x2="33" y2="20" stroke={ink} strokeWidth="2" /><path d="M33 20 q5 1 7 5" fill="none" stroke={ink} strokeWidth="1.6" /><path d="M33 23 q3 1 4 3" fill="none" stroke={ink} strokeWidth="1.6" /></g>}
            {has("foreign") && <circle cx="32" cy="22" r="4" fill="none" stroke={ink} strokeWidth="2" />}
          </g>
        )}

        {exposed && <text x="40" y="16" fontSize="13" textAnchor="middle" fill="#e8552b">⚡</text>}
      </svg>
    </div>
  );
}
