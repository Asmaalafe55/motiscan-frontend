// Placeholder SVG images used as mock data for the DIFFERENCES exercise type.
// Each pair (A/B) shares the same scene layout with deliberate visual differences for students to find.

const encode = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// ---------------------------------------------------------------------------
// PAIR 1 — Living Room Scene
// Differences: sofa colour, lamp position, painting removed, window panes, bookshelf→plant
// ---------------------------------------------------------------------------

const room1A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#FFF8E1"/>
  <rect y="230" width="400" height="50" fill="#A0826D"/>
  <rect x="0" y="225" width="400" height="8" fill="#8D6E63"/>
  <rect x="80" y="155" width="190" height="65" rx="10" fill="#1565C0"/>
  <rect x="70" y="145" width="22" height="75" rx="6" fill="#0D47A1"/>
  <rect x="278" y="145" width="22" height="75" rx="6" fill="#0D47A1"/>
  <rect x="80" y="145" width="190" height="26" rx="5" fill="#0D47A1"/>
  <rect x="28" y="110" width="7" height="120" fill="#795548"/>
  <ellipse cx="31" cy="108" rx="28" ry="13" fill="#FF8F00" stroke="#E65100" stroke-width="2"/>
  <ellipse cx="31" cy="108" rx="10" ry="5" fill="#FFE082"/>
  <rect x="55" y="60" width="70" height="50" rx="4" fill="#2E7D32" stroke="#1B5E20" stroke-width="3"/>
  <line x1="90" y1="60" x2="90" y2="110" stroke="#1B5E20" stroke-width="2"/>
  <line x1="55" y1="85" x2="125" y2="85" stroke="#1B5E20" stroke-width="2"/>
  <rect x="280" y="25" width="90" height="80" rx="4" fill="#BBDEFB" stroke="#90A4AE" stroke-width="3"/>
  <line x1="325" y1="25" x2="325" y2="105" stroke="#90A4AE" stroke-width="2"/>
  <line x1="280" y1="65" x2="370" y2="65" stroke="#90A4AE" stroke-width="2"/>
  <rect x="310" y="145" width="60" height="82" rx="3" fill="#6D4C41" stroke="#4E342E" stroke-width="2"/>
  <line x1="340" y1="145" x2="340" y2="227" stroke="#4E342E" stroke-width="1.5"/>
  <line x1="310" y1="178" x2="370" y2="178" stroke="#4E342E" stroke-width="1.5"/>
  <line x1="310" y1="205" x2="370" y2="205" stroke="#4E342E" stroke-width="1.5"/>
</svg>`;

const room1B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#FFF8E1"/>
  <rect y="230" width="400" height="50" fill="#A0826D"/>
  <rect x="0" y="225" width="400" height="8" fill="#8D6E63"/>
  <rect x="80" y="155" width="190" height="65" rx="10" fill="#C62828"/>
  <rect x="70" y="145" width="22" height="75" rx="6" fill="#B71C1C"/>
  <rect x="278" y="145" width="22" height="75" rx="6" fill="#B71C1C"/>
  <rect x="80" y="145" width="190" height="26" rx="5" fill="#B71C1C"/>
  <rect x="365" y="110" width="7" height="120" fill="#795548"/>
  <ellipse cx="369" cy="108" rx="28" ry="13" fill="#FF8F00" stroke="#E65100" stroke-width="2"/>
  <ellipse cx="369" cy="108" rx="10" ry="5" fill="#FFE082"/>
  <rect x="280" y="25" width="90" height="80" rx="4" fill="#BBDEFB" stroke="#90A4AE" stroke-width="3"/>
  <line x1="325" y1="25" x2="325" y2="105" stroke="#90A4AE" stroke-width="2"/>
  <rect x="312" y="145" width="14" height="82" fill="#5D4037"/>
  <circle cx="319" cy="136" r="28" fill="#388E3C"/>
  <circle cx="305" cy="122" r="16" fill="#43A047"/>
  <circle cx="333" cy="120" r="14" fill="#43A047"/>
</svg>`;

// ---------------------------------------------------------------------------
// PAIR 2 — Garden Scene
// Differences: sun position, cloud removed, door colour, tree removed, flower colour
// ---------------------------------------------------------------------------

const garden2A = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#87CEEB"/>
  <rect y="210" width="400" height="70" fill="#4CAF50"/>
  <rect y="208" width="400" height="8" fill="#388E3C"/>
  <circle cx="355" cy="45" r="32" fill="#FFD600"/>
  <line x1="355" y1="5" x2="355" y2="15" stroke="#FFD600" stroke-width="3"/>
  <line x1="355" y1="75" x2="355" y2="85" stroke="#FFD600" stroke-width="3"/>
  <line x1="315" y1="45" x2="325" y2="45" stroke="#FFD600" stroke-width="3"/>
  <line x1="385" y1="45" x2="395" y2="45" stroke="#FFD600" stroke-width="3"/>
  <ellipse cx="95" cy="65" rx="52" ry="24" fill="white"/>
  <ellipse cx="130" cy="52" rx="36" ry="22" fill="white"/>
  <ellipse cx="65" cy="60" rx="28" ry="18" fill="white"/>
  <rect x="145" y="120" width="120" height="95" fill="#ECEFF1" stroke="#CFD8DC" stroke-width="2"/>
  <polygon points="125,122 205,60 285,122" fill="#795548"/>
  <rect x="178" y="170" width="48" height="50" rx="5" fill="#D32F2F"/>
  <circle cx="222" cy="196" r="3" fill="#FFD600"/>
  <rect x="155" y="130" width="34" height="28" rx="3" fill="#90CAF9" stroke="#90A4AE" stroke-width="2"/>
  <line x1="172" y1="130" x2="172" y2="158" stroke="#90A4AE" stroke-width="1.5"/>
  <line x1="155" y1="144" x2="189" y2="144" stroke="#90A4AE" stroke-width="1.5"/>
  <rect x="48" y="148" width="16" height="70" fill="#6D4C41"/>
  <circle cx="56" cy="138" r="36" fill="#2E7D32"/>
  <circle cx="38" cy="125" r="20" fill="#388E3C"/>
  <circle cx="74" cy="124" r="18" fill="#388E3C"/>
  <circle cx="290" cy="207" r="11" fill="#FF6F00"/>
  <circle cx="316" cy="207" r="11" fill="#FF6F00"/>
  <circle cx="342" cy="207" r="11" fill="#FF6F00"/>
  <rect x="287" y="210" width="5" height="20" fill="#2E7D32"/>
  <rect x="313" y="210" width="5" height="20" fill="#2E7D32"/>
  <rect x="339" y="210" width="5" height="20" fill="#2E7D32"/>
</svg>`;

const garden2B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#87CEEB"/>
  <rect y="210" width="400" height="70" fill="#4CAF50"/>
  <rect y="208" width="400" height="8" fill="#388E3C"/>
  <circle cx="45" cy="45" r="32" fill="#FFD600"/>
  <line x1="45" y1="5" x2="45" y2="15" stroke="#FFD600" stroke-width="3"/>
  <line x1="45" y1="75" x2="45" y2="85" stroke="#FFD600" stroke-width="3"/>
  <line x1="5" y1="45" x2="15" y2="45" stroke="#FFD600" stroke-width="3"/>
  <line x1="75" y1="45" x2="85" y2="45" stroke="#FFD600" stroke-width="3"/>
  <rect x="145" y="120" width="120" height="95" fill="#ECEFF1" stroke="#CFD8DC" stroke-width="2"/>
  <polygon points="125,122 205,60 285,122" fill="#795548"/>
  <rect x="178" y="170" width="48" height="50" rx="5" fill="#1565C0"/>
  <circle cx="222" cy="196" r="3" fill="#FFD600"/>
  <rect x="155" y="130" width="34" height="28" rx="3" fill="#90CAF9" stroke="#90A4AE" stroke-width="2"/>
  <line x1="172" y1="130" x2="172" y2="158" stroke="#90A4AE" stroke-width="1.5"/>
  <line x1="155" y1="144" x2="189" y2="144" stroke="#90A4AE" stroke-width="1.5"/>
  <circle cx="290" cy="207" r="11" fill="#7B1FA2"/>
  <circle cx="316" cy="207" r="11" fill="#7B1FA2"/>
  <circle cx="342" cy="207" r="11" fill="#7B1FA2"/>
  <rect x="287" y="210" width="5" height="20" fill="#2E7D32"/>
  <rect x="313" y="210" width="5" height="20" fill="#2E7D32"/>
  <rect x="339" y="210" width="5" height="20" fill="#2E7D32"/>
  <path d="M295 90 Q305 80 315 90" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
  <path d="M325 82 Q335 72 345 82" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export const placeholderImages = {
  room1A: encode(room1A),
  room1B: encode(room1B),
  garden2A: encode(garden2A),
  garden2B: encode(garden2B),
};
