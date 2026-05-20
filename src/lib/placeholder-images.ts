// Placeholder SVG images used as mock data for the DIFFERENCES exercise type.
// Each pair (A/B) shares the same scene layout with deliberate visual differences for students to find.

const encode = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// ---------------------------------------------------------------------------
// PAIR 1 — Living Room Scene
// Differences: sofa colour, lamp position, painting removed, window panes, bookshelf→plant
// ---------------------------------------------------------------------------

const room1A = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
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

const room1B = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
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

const garden2A = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
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

const garden2B = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
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

// ---------------------------------------------------------------------------
// PAIR 3 — Kitchen Scene
// Differences: curtains added, fridge colour, 3→2 cups, pear removed, clock added
// ---------------------------------------------------------------------------

const kitchen3A = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#F0F4F8"/>
  <rect y="185" width="315" height="50" fill="#C8956C"/>
  <rect y="235" width="315" height="45" fill="#A0724A"/>
  <rect y="105" width="315" height="80" fill="#DDEEFF"/>
  <line x1="0" y1="125" x2="315" y2="125" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="0" y1="145" x2="315" y2="145" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="0" y1="165" x2="315" y2="165" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="79" y1="105" x2="79" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="158" y1="105" x2="158" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="237" y1="105" x2="237" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <rect x="28" y="18" width="92" height="68" rx="4" fill="#87CEEB" stroke="#90A4AE" stroke-width="3"/>
  <line x1="74" y1="18" x2="74" y2="86" stroke="#90A4AE" stroke-width="2"/>
  <line x1="28" y1="52" x2="120" y2="52" stroke="#90A4AE" stroke-width="2"/>
  <rect x="128" y="188" width="82" height="40" rx="5" fill="#9E9E9E"/>
  <rect x="163" y="178" width="10" height="18" fill="#607D8B"/>
  <circle cx="168" cy="177" r="4" fill="#455A64"/>
  <rect x="330" y="8" width="70" height="272" rx="6" fill="#FAFAFA" stroke="#CFD8DC" stroke-width="2"/>
  <line x1="330" y1="148" x2="400" y2="148" stroke="#CFD8DC" stroke-width="2"/>
  <rect x="387" y="88" width="7" height="28" rx="3" fill="#90A4AE"/>
  <rect x="387" y="160" width="7" height="28" rx="3" fill="#90A4AE"/>
  <path d="M28,90 Q40,90 40,103 L34,117 Q33,121 28,121 Q23,121 22,117 L16,103 Q16,90 28,90Z" fill="#EF9A9A"/>
  <rect x="15" y="84" width="2" height="9" fill="#555"/>
  <path d="M58,88 Q70,88 70,101 L64,115 Q63,119 58,119 Q53,119 52,115 L46,101 Q46,88 58,88Z" fill="#80CBC4"/>
  <rect x="45" y="82" width="2" height="9" fill="#555"/>
  <path d="M88,90 Q100,90 100,103 L94,117 Q93,121 88,121 Q83,121 82,117 L76,103 Q76,90 88,90Z" fill="#FFF176"/>
  <rect x="75" y="84" width="2" height="9" fill="#555"/>
  <circle cx="225" cy="182" r="12" fill="#EF5350"/>
  <ellipse cx="252" cy="181" rx="18" ry="10" fill="#AED581" transform="rotate(15 252 181)"/>
  <circle cx="280" cy="182" r="11" fill="#FFA726"/>
</svg>`;

const kitchen3B = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#F0F4F8"/>
  <rect y="185" width="315" height="50" fill="#C8956C"/>
  <rect y="235" width="315" height="45" fill="#A0724A"/>
  <rect y="105" width="315" height="80" fill="#DDEEFF"/>
  <line x1="0" y1="125" x2="315" y2="125" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="0" y1="145" x2="315" y2="145" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="0" y1="165" x2="315" y2="165" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="79" y1="105" x2="79" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="158" y1="105" x2="158" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <line x1="237" y1="105" x2="237" y2="185" stroke="#BBCFE8" stroke-width="1.5"/>
  <rect x="28" y="18" width="92" height="68" rx="4" fill="#87CEEB" stroke="#90A4AE" stroke-width="3"/>
  <line x1="74" y1="18" x2="74" y2="86" stroke="#90A4AE" stroke-width="2"/>
  <line x1="28" y1="52" x2="120" y2="52" stroke="#90A4AE" stroke-width="2"/>
  <rect x="26" y="16" width="16" height="72" fill="#F48FB1" opacity="0.9"/>
  <rect x="106" y="16" width="16" height="72" fill="#F48FB1" opacity="0.9"/>
  <rect x="128" y="188" width="82" height="40" rx="5" fill="#9E9E9E"/>
  <rect x="163" y="178" width="10" height="18" fill="#607D8B"/>
  <circle cx="168" cy="177" r="4" fill="#455A64"/>
  <rect x="330" y="8" width="70" height="272" rx="6" fill="#F5E6D3" stroke="#CFD8DC" stroke-width="2"/>
  <line x1="330" y1="148" x2="400" y2="148" stroke="#CFD8DC" stroke-width="2"/>
  <rect x="387" y="88" width="7" height="28" rx="3" fill="#90A4AE"/>
  <rect x="387" y="160" width="7" height="28" rx="3" fill="#90A4AE"/>
  <path d="M28,90 Q40,90 40,103 L34,117 Q33,121 28,121 Q23,121 22,117 L16,103 Q16,90 28,90Z" fill="#EF9A9A"/>
  <rect x="15" y="84" width="2" height="9" fill="#555"/>
  <path d="M58,88 Q70,88 70,101 L64,115 Q63,119 58,119 Q53,119 52,115 L46,101 Q46,88 58,88Z" fill="#80CBC4"/>
  <rect x="45" y="82" width="2" height="9" fill="#555"/>
  <circle cx="225" cy="182" r="12" fill="#EF5350"/>
  <circle cx="258" cy="182" r="11" fill="#FFA726"/>
  <circle cx="275" cy="55" r="22" fill="white" stroke="#37474F" stroke-width="3"/>
  <line x1="275" y1="40" x2="275" y2="55" stroke="#37474F" stroke-width="2"/>
  <line x1="275" y1="55" x2="287" y2="60" stroke="#37474F" stroke-width="2"/>
  <circle cx="275" cy="55" r="2" fill="#37474F"/>
</svg>`;

// ---------------------------------------------------------------------------
// PAIR 4 — Classroom Scene
// Differences: board colour, 3→2 desks, clock removed, apple on teacher desk,
//              fewer bookshelf books, extra small window
// ---------------------------------------------------------------------------

const classroom4A = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#FFFDE7"/>
  <rect y="248" width="400" height="32" fill="#D7CCC8"/>
  <rect x="18" y="14" width="222" height="130" rx="4" fill="#4CAF50" stroke="#388E3C" stroke-width="3"/>
  <line x1="38" y1="55" x2="105" y2="55" stroke="white" stroke-width="2"/>
  <line x1="38" y1="75" x2="135" y2="75" stroke="white" stroke-width="2"/>
  <line x1="58" y1="95" x2="92" y2="95" stroke="white" stroke-width="2"/>
  <rect x="18" y="144" width="222" height="8" fill="#8D6E63"/>
  <rect x="38" y="163" width="122" height="52" rx="4" fill="#8D6E63"/>
  <rect x="40" y="215" width="20" height="33" fill="#795548"/>
  <rect x="140" y="215" width="20" height="33" fill="#795548"/>
  <rect x="13" y="210" width="52" height="36" rx="3" fill="#A1887F"/>
  <rect x="16" y="246" width="13" height="22" fill="#795548"/>
  <rect x="49" y="246" width="13" height="22" fill="#795548"/>
  <rect x="88" y="210" width="52" height="36" rx="3" fill="#A1887F"/>
  <rect x="91" y="246" width="13" height="22" fill="#795548"/>
  <rect x="124" y="246" width="13" height="22" fill="#795548"/>
  <rect x="163" y="210" width="52" height="36" rx="3" fill="#A1887F"/>
  <rect x="166" y="246" width="13" height="22" fill="#795548"/>
  <rect x="199" y="246" width="13" height="22" fill="#795548"/>
  <circle cx="340" cy="38" r="22" fill="white" stroke="#37474F" stroke-width="3"/>
  <line x1="340" y1="23" x2="340" y2="38" stroke="#37474F" stroke-width="2"/>
  <line x1="340" y1="38" x2="352" y2="43" stroke="#37474F" stroke-width="2"/>
  <circle cx="340" cy="38" r="2" fill="#37474F"/>
  <rect x="292" y="52" width="90" height="76" rx="4" fill="#87CEEB" stroke="#90A4AE" stroke-width="2"/>
  <line x1="337" y1="52" x2="337" y2="128" stroke="#90A4AE" stroke-width="2"/>
  <line x1="292" y1="90" x2="382" y2="90" stroke="#90A4AE" stroke-width="2"/>
  <rect x="286" y="142" width="114" height="100" rx="3" fill="#6D4C41" stroke="#4E342E" stroke-width="2"/>
  <line x1="286" y1="178" x2="400" y2="178" stroke="#4E342E" stroke-width="1.5"/>
  <line x1="286" y1="213" x2="400" y2="213" stroke="#4E342E" stroke-width="1.5"/>
  <rect x="291" y="147" width="20" height="28" fill="#EF5350"/>
  <rect x="314" y="147" width="16" height="28" fill="#2196F3"/>
  <rect x="333" y="147" width="18" height="28" fill="#4CAF50"/>
  <rect x="354" y="147" width="14" height="28" fill="#FF9800"/>
  <rect x="291" y="182" width="22" height="28" fill="#9C27B0"/>
  <rect x="316" y="182" width="16" height="28" fill="#FF5722"/>
  <rect x="335" y="182" width="20" height="28" fill="#607D8B"/>
</svg>`;

const classroom4B = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
  <rect width="400" height="280" fill="#FFFDE7"/>
  <rect y="248" width="400" height="32" fill="#D7CCC8"/>
  <rect x="18" y="14" width="222" height="130" rx="4" fill="#37474F" stroke="#263238" stroke-width="3"/>
  <line x1="38" y1="55" x2="105" y2="55" stroke="white" stroke-width="2"/>
  <line x1="38" y1="75" x2="135" y2="75" stroke="white" stroke-width="2"/>
  <line x1="58" y1="95" x2="92" y2="95" stroke="white" stroke-width="2"/>
  <rect x="18" y="144" width="222" height="8" fill="#8D6E63"/>
  <rect x="38" y="163" width="122" height="52" rx="4" fill="#8D6E63"/>
  <rect x="40" y="215" width="20" height="33" fill="#795548"/>
  <rect x="140" y="215" width="20" height="33" fill="#795548"/>
  <circle cx="148" cy="160" r="9" fill="#F44336"/>
  <rect x="13" y="210" width="52" height="36" rx="3" fill="#A1887F"/>
  <rect x="16" y="246" width="13" height="22" fill="#795548"/>
  <rect x="49" y="246" width="13" height="22" fill="#795548"/>
  <rect x="88" y="210" width="52" height="36" rx="3" fill="#A1887F"/>
  <rect x="91" y="246" width="13" height="22" fill="#795548"/>
  <rect x="124" y="246" width="13" height="22" fill="#795548"/>
  <rect x="292" y="52" width="90" height="76" rx="4" fill="#87CEEB" stroke="#90A4AE" stroke-width="2"/>
  <line x1="337" y1="52" x2="337" y2="128" stroke="#90A4AE" stroke-width="2"/>
  <line x1="292" y1="90" x2="382" y2="90" stroke="#90A4AE" stroke-width="2"/>
  <rect x="248" y="18" width="42" height="38" rx="3" fill="#87CEEB" stroke="#90A4AE" stroke-width="2"/>
  <line x1="269" y1="18" x2="269" y2="56" stroke="#90A4AE" stroke-width="1.5"/>
  <rect x="286" y="142" width="114" height="100" rx="3" fill="#6D4C41" stroke="#4E342E" stroke-width="2"/>
  <line x1="286" y1="178" x2="400" y2="178" stroke="#4E342E" stroke-width="1.5"/>
  <line x1="286" y1="213" x2="400" y2="213" stroke="#4E342E" stroke-width="1.5"/>
  <rect x="291" y="147" width="20" height="28" fill="#EF5350"/>
  <rect x="314" y="147" width="16" height="28" fill="#2196F3"/>
  <rect x="333" y="147" width="18" height="28" fill="#4CAF50"/>
  <rect x="291" y="182" width="22" height="28" fill="#9C27B0"/>
  <rect x="316" y="182" width="16" height="28" fill="#FF5722"/>
</svg>`;

export const placeholderImages = {
  room1A: encode(room1A),
  room1B: encode(room1B),
  garden2A: encode(garden2A),
  garden2B: encode(garden2B),
  kitchen3A: encode(kitchen3A),
  kitchen3B: encode(kitchen3B),
  classroom4A: encode(classroom4A),
  classroom4B: encode(classroom4B),
};
