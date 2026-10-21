/* ==========================================================================
   2045 미래하우스 탈출 — 그림 (코드로 그린 SVG)
   장면 크기: 가로 1000 × 세로 560
   ========================================================================== */
const Art = (() => {
  const esc = U.esc;
  const em = (x, y, s, size = 22, anchor = 'middle') => `<text x="${x}" y="${y}" class="em" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const tx = (x, y, s, size = 14, fill = '#2F3E4E', o = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" ${o}>${s}</text>`;
  const B = 'font-weight="800"';
  const padlock = (x, y) => `<g transform="translate(${x} ${y})"><path d="M6 12 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="#C9A227" stroke-width="4"/><rect x="0" y="12" width="28" height="22" rx="4" fill="#F2C14E"/><circle cx="14" cy="22" r="3" fill="#7A5C1E"/><rect x="12.5" y="23" width="3" height="6" fill="#7A5C1E"/></g>`;
  const legs = (w, y, h = 40) => `<rect x="12" y="${y}" width="9" height="${h}" fill="#6B7A8F"/><rect x="${w - 21}" y="${y}" width="9" height="${h}" fill="#6B7A8F"/>`;
  const screen = (x, y, w, h, fill = '#16233A') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}"/>`;
  const nest = (svg, x, y) => `<g transform="translate(${x} ${y})">${svg.replace('<svg ', '<svg x="0" y="0" ')}</g>`;

  /* ---------- 사람·로봇·바이러스 ---------- */
  function avatar(lookId, size = 80, wear) {
    const L = LOOKS.find(l => l.id === lookId) || LOOKS[0];
    const w = new Set(wear || []);
    const ears = {
      sprout: `<path d="M50 14 q-6 -16 -22 -16 q4 14 22 16z" fill="#7CC47F"/><path d="M50 14 q6 -18 24 -18 q-4 16 -24 18z" fill="#5DB075"/><path d="M50 22 v-10" stroke="#4E9A63" stroke-width="3"/>`,
      cat: `<path d="M27 38 L28 8 L48 26 Z" fill="${L.skin}"/><path d="M73 38 L72 8 L52 26 Z" fill="${L.skin}"/><path d="M32 30 L32.5 15 L42 25Z M68 30 L67.5 15 L58 25Z" fill="#F4A3A3"/>`,
      bear: `<circle cx="28" cy="28" r="11" fill="${L.skin}"/><circle cx="72" cy="28" r="11" fill="${L.skin}"/><circle cx="28" cy="28" r="5.5" fill="#A87B52"/><circle cx="72" cy="28" r="5.5" fill="#A87B52"/>`,
      bunny: `<ellipse cx="38" cy="8" rx="8.5" ry="23" fill="${L.skin}" stroke="#E6DCCF"/><ellipse cx="62" cy="8" rx="8.5" ry="23" fill="${L.skin}" stroke="#E6DCCF"/><ellipse cx="38" cy="10" rx="4" ry="15" fill="#F4B6C2"/><ellipse cx="62" cy="10" rx="4" ry="15" fill="#F4B6C2"/>`
    }[L.id] || '';
    const cape = w.has('cape') ? '<path d="M26 80 L8 120 L92 120 L74 80 Z" fill="#2F6DB5"/><path d="M14 112 h72" stroke="#7FD4FF" stroke-width="3" stroke-dasharray="6 4"/>' : '';
    const cap = w.has('cap') ? `<path d="M22 40 Q50 8 78 40 Z" fill="#22344A"/><rect x="18" y="36" width="64" height="8" rx="4" fill="#22344A"/><circle cx="36" cy="30" r="3" fill="#6FFFE9"/><circle cx="50" cy="25" r="3" fill="#FFD166"/><circle cx="64" cy="30" r="3" fill="#FF8FAB"/>`
      : `<path d="M24 42 Q50 12 76 42 Q50 34 24 42Z" fill="${L.hat}"/><rect x="20" y="38" width="60" height="7" rx="3.5" fill="${L.hat}"/>`;
    const glasses = w.has('glasses') ? '<rect x="31" y="49" width="17" height="12" rx="4" fill="#6FFFE9" fill-opacity=".45" stroke="#22344A" stroke-width="2.5"/><rect x="52" y="49" width="17" height="12" rx="4" fill="#6FFFE9" fill-opacity=".45" stroke="#22344A" stroke-width="2.5"/><path d="M48 55 h4" stroke="#22344A" stroke-width="2.5"/>' : '';
    const headset = w.has('headset') ? '<path d="M22 54 Q22 22 50 22 Q78 22 78 54" fill="none" stroke="#3D3D5C" stroke-width="5"/><rect x="16" y="48" width="10" height="18" rx="4" fill="#FF8A65"/><rect x="74" y="48" width="10" height="18" rx="4" fill="#FF8A65"/>' : '';
    const watch = w.has('watch') ? '<rect x="20" y="96" width="12" height="12" rx="3" fill="#22344A"/><rect x="22" y="98" width="8" height="8" rx="2" fill="#6FFFE9"/>' : '';
    return `<svg viewBox="0 -16 100 136" width="${size}" height="${Math.round(size * 1.36)}" aria-hidden="true" class="avatar">
      ${cape}${ears}
      <path d="M24 118 Q22 76 50 74 Q78 76 76 118 Z" fill="${L.coat}"/>
      <path d="M42 76 L50 92 L58 76" fill="#FFFFFF" opacity=".85"/>
      <circle cx="50" cy="50" r="27" fill="${L.skin}" stroke="#00000014"/>
      ${cap}
      <circle cx="41" cy="55" r="4" fill="#2F3E4E"/><circle cx="59" cy="55" r="4" fill="#2F3E4E"/>
      <circle cx="42.5" cy="53.5" r="1.4" fill="#fff"/><circle cx="60.5" cy="53.5" r="1.4" fill="#fff"/>
      <ellipse cx="33" cy="64" rx="5" ry="3" fill="#FF9AA2" opacity=".6"/><ellipse cx="67" cy="64" rx="5" ry="3" fill="#FF9AA2" opacity=".6"/>
      <path d="M45 65 q5 5 10 0" stroke="#2F3E4E" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${glasses}${headset}${watch}
      <path d="M76 99 L69 109" stroke="#4A4A4A" stroke-width="4" stroke-linecap="round"/>
      <circle cx="81" cy="92" r="9" fill="#CFE8FA" stroke="#4A4A4A" stroke-width="3"/>
    </svg>`;
  }
  function bot(size = 44, mood = '') {
    const face = mood === 'happy'
      ? '<path d="M18 32 q5 -6 10 0 M32 32 q5 -6 10 0" stroke="#6FFFE9" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : mood === 'worry'
        ? '<circle cx="23" cy="31" r="3.5" fill="#FFD166"/><circle cx="37" cy="31" r="3.5" fill="#FFD166"/><path d="M18 24 l8 3 M42 24 l-8 3" stroke="#FFD166" stroke-width="2.5" stroke-linecap="round"/>'
        : mood === 'sleep'
          ? '<path d="M18 31 h10 M32 31 h10" stroke="#6FFFE9" stroke-width="3" stroke-linecap="round"/>'
          : '<circle cx="23" cy="30" r="4" fill="#6FFFE9"/><circle cx="37" cy="30" r="4" fill="#6FFFE9"/>';
    return `<svg viewBox="0 0 60 64" width="${size}" height="${Math.round(size * 64 / 60)}" aria-hidden="true">
      <path d="M30 11 V3" stroke="#8AA0B4" stroke-width="3"/><circle cx="30" cy="4" r="4" fill="#FFD166"/>
      <rect x="6" y="11" width="48" height="40" rx="14" fill="#DDEFFC" stroke="#8AA0B4" stroke-width="3"/>
      <rect x="13" y="19" width="34" height="24" rx="9" fill="#22344A"/>${face}
      <rect x="20" y="51" width="20" height="10" rx="4" fill="#B8CCDD"/></svg>`;
  }
  /* 생각 바이러스: 가시 달린 동그라미 + 표정 */
  function monster(look, size = 140, cls = '') {
    const col = { reject: ['#E85D75', '#B8324B'], accept: ['#FF9EC7', '#D9578F'], magic: ['#9B7BEA', '#5E3FB8'] }[look] || ['#AAA', '#777'];
    let spikes = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x1 = 80 + Math.cos(a) * 50, y1 = 78 + Math.sin(a) * 50, x2 = 80 + Math.cos(a) * 66, y2 = 78 + Math.sin(a) * 66; spikes += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${col[1]}" stroke-width="6" stroke-linecap="round"/><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="7" fill="${col[0]}" stroke="${col[1]}" stroke-width="3"/>`; }
    const face = {
      reject: '<path d="M56 64 l20 8 M104 64 l-20 8" stroke="#1E1E2E" stroke-width="5" stroke-linecap="round"/><circle cx="66" cy="80" r="6" fill="#1E1E2E"/><circle cx="94" cy="80" r="6" fill="#1E1E2E"/><path d="M64 104 q16 -12 32 0" stroke="#1E1E2E" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 110 l80 -60" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity=".85"/>',
      accept: '<path d="M60 76 q6 -12 12 0 q6 -12 12 0 l-12 14z" fill="#E63946" transform="translate(-6 0)"/><path d="M88 76 q6 -12 12 0 q6 -12 12 0 l-12 14z" fill="#E63946" transform="translate(-6 0)"/><path d="M62 100 q18 16 36 0" stroke="#1E1E2E" stroke-width="5" fill="#fff" stroke-linecap="round"/>',
      magic: '<circle cx="66" cy="78" r="7" fill="#fff"/><circle cx="94" cy="78" r="7" fill="#fff"/><circle cx="68" cy="80" r="3.5" fill="#1E1E2E"/><circle cx="96" cy="80" r="3.5" fill="#1E1E2E"/><path d="M64 102 q16 10 32 0" stroke="#1E1E2E" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M118 116 L146 140" stroke="#5C4632" stroke-width="6" stroke-linecap="round"/><path d="M112 104 l4 10 l10 2 l-8 6 l2 10 l-8 -6 l-9 5 l3 -10 l-7 -7 l10 -1z" fill="#FFD166"/>'
    }[look] || '';
    return `<svg viewBox="0 0 160 150" width="${size}" height="${Math.round(size * 150 / 160)}" class="mon ${cls}" aria-hidden="true">${spikes}<circle cx="80" cy="78" r="52" fill="${col[0]}" stroke="${col[1]}" stroke-width="4"/>${face}</svg>`;
  }

  /* ---------- 방 안 물건 (st.open: 풀림, st.avail: 풀 수 있음) ---------- */
  const OBJ = {
    /* 안내실 */
    whiteboard: { w: 270, h: 170, draw: () => `
      <rect width="270" height="170" rx="10" fill="#C9D3DD"/><rect x="8" y="8" width="254" height="144" rx="6" fill="#FFFFFF"/>
      ${tx(135, 34, '미래를 바꾸는 4가지', 16, '#2F3E4E', B)}
      ${[['🛍️', '소비자', '욕구'], ['👨‍👩‍👧', '가족', '구조'], ['💻', '디지털', '전환'], ['🌏', '환경', '변화']].map(([e, a, b], i) => `${em(42 + i * 62, 80, e, 26)}${tx(42 + i * 62, 106, a, 12, '#4A5A70', 'font-weight="700"')}${tx(42 + i * 62, 122, b, 12, '#4A5A70', 'font-weight="700"')}`).join('')}
      <rect x="20" y="156" width="230" height="8" rx="3" fill="#9AA8BA"/>` },
    scale: { w: 160, h: 190, draw: () => `
      <rect width="160" height="190" rx="6" fill="#FFF4D6" stroke="#E9D8A6" stroke-width="3"/>
      ${tx(80, 30, '비판적 수용', 17, '#7A4E2D', B)}
      <path d="M80 50 V140 M40 70 H120" stroke="#7A5C42" stroke-width="5" stroke-linecap="round"/>
      <path d="M28 70 l-14 34 h28z M132 70 l-14 34 h28z" fill="#F2C14E" stroke="#C9A227" stroke-width="2"/>
      ${tx(28, 124, '장점', 13, '#2A9D8F', B)}${tx(132, 124, '한계', 13, '#C2410C', B)}
      <rect x="56" y="140" width="48" height="10" rx="4" fill="#7A5C42"/>${tx(80, 176, '둘 다 따져 봐요', 12, '#7A5C42')}` },
    dock: { w: 160, h: 180, draw: () => `
      <ellipse cx="80" cy="168" rx="70" ry="12" fill="#00000033"/>
      <rect x="20" y="128" width="120" height="40" rx="12" fill="#5B6B85"/><rect x="40" y="136" width="80" height="8" rx="4" fill="#6FFFE9" opacity=".7"/>
      ${nest(bot(96, E.isDone('L1') ? 'happy' : 'sleep'), 32, 30)}
      ${E.isDone('L1') ? '' : tx(132, 40, 'Zzz', 18, '#BFD7EA', B)}` },
    door: { w: 130, h: 320, draw: st => `
      <rect width="130" height="320" rx="6" fill="#26324A"/>
      ${st.open ? `<rect x="10" y="10" width="110" height="310" fill="#BDF2FF"/><path d="M10 10 L56 28 L56 310 L10 320 Z" fill="#5B8FD9"/>${tx(88, 170, '복도', 16, '#2F6DB5', B)}`
        : `<rect x="10" y="10" width="110" height="310" fill="#5B8FD9"/><rect x="24" y="26" width="82" height="110" rx="6" fill="#4A7BC4"/><rect x="24" y="150" width="82" height="150" rx="6" fill="#4A7BC4"/>
           <rect x="34" y="48" width="62" height="56" rx="6" fill="#16233A"/>${em(65, 84, '🔄', 24)}${padlock(51, 182)}`}` },
    /* 키친 */
    farmwindow: { w: 230, h: 190, draw: () => `
      <rect width="230" height="190" rx="8" fill="#DDE7EE"/><rect x="10" y="10" width="210" height="170" fill="#BDE6FA"/>
      <rect x="10" y="130" width="210" height="50" fill="#9BD08A"/>
      <path d="M30 150 V92 A85 56 0 0 1 200 92 V150 Z" fill="#FFFFFF" fill-opacity=".55" stroke="#FFFFFF" stroke-width="3"/>
      ${em(70, 144, '🥬', 18)}${em(110, 144, '🥬', 18)}${em(150, 144, '🥬', 18)}
      <g>${[['🌡️', '24℃'], ['💧', '60%'], ['☀️', 'LED']].map(([e, v], i) => `<rect x="${18 + i * 70}" y="18" width="62" height="28" rx="14" fill="#16233A" opacity=".85"/>${em(34 + i * 70, 38, e, 15)}${tx(60 + i * 70, 37, v, 12, '#6FFFE9', B)}`).join('')}</g>
      <path d="M180 60 l10 -6 l10 6" stroke="#2F6DB5" stroke-width="3" fill="none"/>${em(190, 80, '📶', 16)}` },
    farmpanel: { w: 200, h: 150, draw: st => `
      <rect width="200" height="150" rx="10" fill="#3A4A66"/>${screen(10, 10, 180, 110)}
      ${st.open ? `${tx(100, 60, '정상 운전 중', 16, '#52D273', B)}${em(100, 96, '✅', 26)}`
        : `${tx(100, 34, '⚠ 경고 4건', 15, '#FFD166', B)}${[['🌡️', '31℃'], ['💧', '40%'], ['☁️', '빛↓'], ['🪴', '건조']].map(([e, v], i) => `${em(34 + i * 44, 72, e, 18)}${tx(34 + i * 44, 100, v, 11, '#FF8FAB', B)}`).join('')}`}
      <rect x="70" y="126" width="60" height="14" rx="7" fill="#22344A"/>` },
    insectbox: { w: 180, h: 160, draw: () => `
      <rect y="110" width="180" height="12" rx="4" fill="#9C7B5B"/>${legs(180, 122, 38)}
      <rect x="22" y="30" width="136" height="80" rx="8" fill="#E8F5E1" fill-opacity=".8" stroke="#8FB98A" stroke-width="3"/>
      <rect x="22" y="22" width="136" height="12" rx="4" fill="#8FB98A"/>
      <path d="M30 104 q30 -14 60 0 q30 -14 62 0" fill="#C8955E"/>${em(64, 88, '🦗', 22)}${em(116, 78, '🐛', 20)}
      ${tx(90, 150, '식용 곤충', 12, '#FFF6D5', B)}` },
    labdish: { w: 190, h: 170, draw: () => `
      <rect y="110" width="190" height="12" rx="4" fill="#C9D3DD"/>${legs(190, 122, 48)}
      <ellipse cx="70" cy="100" rx="46" ry="12" fill="#E3F2FD" stroke="#90CAF9" stroke-width="3"/><ellipse cx="70" cy="96" rx="36" ry="7" fill="#F8BBD0"/>
      ${[0, 1, 2, 3, 4].map(i => `<circle cx="${50 + i * 10}" cy="${95 + (i % 2) * 3}" r="3" fill="#E91E63" opacity=".6"/>`).join('')}
      <path d="M140 108 V40 l10 -10 h10 l-14 20 M128 108 h40" stroke="#5B677A" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="138" y="58" width="14" height="22" rx="3" fill="#90A4AE"/>${em(70, 60, '🧫', 26)}` },
    shelf: { w: 170, h: 300, draw: () => `
      <rect width="170" height="300" rx="6" fill="#DCE6F0"/><rect x="8" y="8" width="154" height="284" fill="#F7FAFC"/>
      ${[80, 160, 240].map(y => `<rect x="8" y="${y}" width="154" height="8" fill="#B8C7D6"/>`).join('')}
      ${em(44, 70, '🌱', 26)}${em(86, 70, '🥜', 24)}${em(128, 70, '🥚', 24)}
      <rect x="28" y="110" width="40" height="48" rx="4" fill="#90BE6D"/>${tx(48, 140, '식물성', 10, '#fff', B)}
      <rect x="80" y="104" width="56" height="54" rx="4" fill="#F9C74F"/>${tx(108, 136, '콩고기', 11, '#5C4632', B)}
      ${em(50, 228, '🥛', 26)}${em(110, 228, '🍔', 26)}
      <rect x="30" y="252" width="110" height="36" rx="6" fill="#FFFFFF" stroke="#B8C7D6"/>${tx(85, 275, '대체 식품', 13, '#2F3E4E', B)}` },
    sorter: { w: 200, h: 290, draw: st => `
      <rect x="20" y="0" width="160" height="200" rx="16" fill="#8C9DB5"/>${screen(40, 20, 120, 70)}
      ${st.open ? `${tx(100, 62, '분류 완료!', 15, '#52D273', B)}` : `${tx(100, 50, '어떤 식품?', 14, '#6FFFE9', B)}${tx(100, 74, '6개 대기 중', 12, '#BFD7EA')}`}
      <rect x="70" y="100" width="60" height="40" rx="8" fill="#22344A"/>${em(100, 128, st.open ? '✅' : '❓', 22)}
      ${['🌱', '🦗', '🧫'].map((e, i) => `<path d="M${36 + i * 50} 200 l-6 50 h52 l-6 -50 z" fill="#5B6B85"/>${em(56 + i * 50, 238, e, 22)}`).join('')}
      <rect x="10" y="250" width="180" height="40" rx="8" fill="#3A4A66"/>
      ${st.open ? '' : padlock(86, 152)}` },
    /* 드레스룸 */
    jacket: { w: 130, h: 290, draw: () => `
      <ellipse cx="65" cy="284" rx="40" ry="7" fill="#00000033"/><rect x="62" y="190" width="6" height="94" fill="#6B7A8F"/>
      <circle cx="65" cy="34" r="20" fill="#E8D9C5"/><rect x="59" y="52" width="12" height="12" fill="#E8D9C5"/>
      <path d="M22 66 Q65 54 108 66 L118 196 L12 196 Z" fill="#E63946"/><path d="M65 64 V196" stroke="#9B1D2A" stroke-width="3"/>
      <circle cx="40" cy="100" r="7" fill="#FFD166" stroke="#9B1D2A" stroke-width="2"/><circle cx="92" cy="96" r="6" fill="#16233A"/>
      <path d="M22 70 L6 150 M108 70 L124 150" stroke="#E63946" stroke-width="16" stroke-linecap="round"/>
      <circle cx="10" cy="146" r="5" fill="#6FFFE9"/>${em(98, 150, '📡', 16)}` },
    mirror: { w: 160, h: 320, draw: () => `
      <rect width="160" height="320" rx="80" fill="#B8C7D6"/><rect x="12" y="12" width="136" height="296" rx="68" fill="#1E2B45"/>
      <circle cx="80" cy="110" r="22" fill="#6FFFE9" opacity=".5"/><path d="M48 230 Q46 150 80 140 Q114 150 112 230 Z" fill="#6FFFE9" opacity=".35"/>
      <rect x="28" y="250" width="104" height="34" rx="10" fill="#FFFFFF" opacity=".9"/>${tx(80, 272, '가상 피팅', 13, '#2F3E4E', B)}
      ${em(124, 70, '✨', 18)}${tx(80, 54, 'AR', 18, '#6FFFE9', B)}` },
    printer: { w: 180, h: 200, draw: () => `
      <rect y="150" width="180" height="12" rx="4" fill="#C9D3DD"/>${legs(180, 162, 38)}
      <rect x="24" y="10" width="132" height="140" rx="10" fill="#EEF2F6" stroke="#9AA8BA" stroke-width="3"/>
      <rect x="36" y="22" width="108" height="112" rx="6" fill="#DDE7EE"/><rect x="40" y="36" width="100" height="8" rx="4" fill="#5B677A"/>
      <rect x="82" y="40" width="16" height="22" rx="3" fill="#E76F51"/><path d="M90 62 v10" stroke="#E76F51" stroke-width="3"/>
      ${em(90, 120, '👟', 30)}<path d="M50 126 h80" stroke="#5B677A" stroke-width="3"/>${tx(90, 196, '3D', 14, '#FFF6D5', B)}` },
    recycle: { w: 150, h: 150, draw: () => `
      <rect x="10" y="30" width="130" height="120" rx="12" fill="#2A9D8F"/><rect x="0" y="16" width="150" height="24" rx="8" fill="#21867A"/>
      ${em(75, 104, '♻️', 40)}<path d="M36 34 q12 -26 30 -10 q14 -18 30 4" fill="#F4A261" stroke="#C97B3A" stroke-width="2"/>
      ${tx(75, 138, '옷 순환', 12, '#FFFFFF', B)}` },
    kiosk: { w: 200, h: 150, draw: st => `
      <rect width="200" height="150" rx="12" fill="#3A4A66"/>${screen(12, 12, 176, 104)}
      ${st.open ? `${tx(100, 60, '주문 완료!', 16, '#52D273', B)}${em(100, 96, '🗝️', 24)}` : st.avail
        ? `${tx(100, 38, '고객 주문 4건', 14, '#6FFFE9', B)}${['🧗', '🎵', '🛍️', '👟'].map((e, i) => em(44 + i * 38, 82, e, 22)).join('')}`
        : `${tx(100, 60, '잠금', 15, '#FF8FAB', B)}${em(100, 96, '⛓️', 22)}`}
      <rect x="80" y="124" width="40" height="12" rx="6" fill="#22344A"/>` },
    wardrobe: { w: 170, h: 320, draw: st => `
      <rect width="170" height="320" rx="10" fill="#E9EEF5" stroke="#B8C7D6" stroke-width="3"/>
      <rect x="10" y="10" width="150" height="40" rx="6" fill="#16233A"/>${tx(85, 36, st.open ? '분류 완료' : '스마트 옷장', 13, '#6FFFE9', B)}
      ${st.open ? `<rect x="12" y="56" width="146" height="252" fill="#DDE7EE"/><path d="M18 78 h134" stroke="#9AA8BA" stroke-width="4"/>
          ${['#E63946', '#F4A261', '#2A9D8F', '#6C8EEB'].map((c, i) => `<path d="M${36 + i * 32} 78 l-12 18 v74 h28 v-74 z" fill="${c}"/>`).join('')}`
        : `<rect x="14" y="56" width="68" height="252" rx="4" fill="#F7FAFC"/><rect x="88" y="56" width="68" height="252" rx="4" fill="#F7FAFC"/>
           <rect x="72" y="170" width="6" height="34" rx="3" fill="#9AA8BA"/><rect x="92" y="170" width="6" height="34" rx="3" fill="#9AA8BA"/>${padlock(71, 214)}`}` },
    /* 컨트롤룸 */
    wallpad: { w: 180, h: 200, draw: () => `
      <rect width="180" height="200" rx="14" fill="#E9EEF5" stroke="#B8C7D6" stroke-width="3"/>${screen(14, 14, 152, 140)}
      ${[['🔒', '안전'], ['💡', '편리'], ['🌡️', '쾌적'], ['❤️', '헬스'], ['⚡', '에너지'], ['🎬', '여가']].map(([e, n], i) => `${em(42 + (i % 3) * 48, 56 + Math.floor(i / 3) * 56, e, 20)}${tx(42 + (i % 3) * 48, 76 + Math.floor(i / 3) * 56, n, 10, '#BFD7EA')}`).join('')}
      ${tx(90, 182, '월패드', 13, '#2F3E4E', B)}` },
    sensors: { w: 240, h: 160, draw: () => `
      <rect width="240" height="160" rx="10" fill="#FFFFFF" stroke="#B8C7D6" stroke-width="3"/>
      ${tx(120, 28, '6대 스마트 센서', 15, '#2F3E4E', B)}
      ${[['🌡️', '온도'], ['💧', '습도'], ['☀️', '조도'], ['🚶', '동작'], ['⚠️', '가스'], ['😷', '먼지']].map(([e, n], i) => `${em(32 + (i % 3) * 76, 72 + Math.floor(i / 3) * 52, e, 22)}${tx(60 + (i % 3) * 76, 68 + Math.floor(i / 3) * 52, n, 13, '#4A5A70', B)}`).join('')}` },
    authsign: { w: 160, h: 180, draw: () => `
      <rect width="160" height="180" rx="6" fill="#FFF4D6" stroke="#E9D8A6" stroke-width="3"/>
      ${tx(80, 28, '인증 3종류', 15, '#7A4E2D', B)}
      ${[['🧠', '아는 것'], ['🔑', '가진 것'], ['👆', '나 자신']].map(([e, n], i) => `${em(40, 66 + i * 38, e, 22)}${tx(98, 62 + i * 38, n, 13, '#5C4632', B)}`).join('')}
      ${tx(80, 168, '2종류 이상 = MFA', 12, '#C2410C', B)}` },
    printhouse: { w: 230, h: 190, draw: () => `
      <rect y="140" width="230" height="12" rx="4" fill="#C9D3DD"/>${legs(230, 152, 38)}
      <path d="M20 14 h190 v10 h-190z M24 24 v116 M206 24 v116" stroke="#5B677A" stroke-width="6"/>
      <rect x="100" y="24" width="26" height="22" rx="4" fill="#F2C14E"/><path d="M113 46 v18" stroke="#F2C14E" stroke-width="5"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${54} ${136 - i * 10} q60 -18 120 0" fill="none" stroke="#B0B7C3" stroke-width="9" stroke-linecap="round"/>`).join('')}
      <path d="M54 76 q60 -18 120 0" fill="none" stroke="#6FFFE9" stroke-width="9" stroke-linecap="round" opacity=".7"/>` },
    console: { w: 210, h: 180, draw: st => `
      <rect y="120" width="210" height="14" rx="4" fill="#5B6B85"/>${legs(210, 134, 46)}
      <rect x="40" y="10" width="130" height="94" rx="8" fill="#3A4A66"/>${screen(48, 18, 114, 72)}
      ${st.open ? `${tx(105, 60, '연결 완료', 14, '#52D273', B)}` : st.avail
        ? `${['🚶', '⚠️', '☀️', '😷'].map((e, i) => em(64 + i * 28, 50, e, 16)).join('')}${tx(105, 78, '센서 미연결 4', 11, '#FF8FAB', B)}`
        : `${tx(105, 62, '잠금', 14, '#FF8FAB', B)}`}
      <rect x="96" y="104" width="18" height="16" fill="#3A4A66"/><rect x="60" y="112" width="90" height="8" rx="3" fill="#22344A"/>` },
    doorlock: { w: 150, h: 330, draw: st => `
      <rect width="150" height="330" rx="6" fill="#26324A"/>
      ${st.open ? `<rect x="10" y="10" width="130" height="320" fill="#FFE9A8"/><path d="M10 10 L60 28 L60 312 L10 330 Z" fill="#8A6A4A"/>${em(100, 170, '🗝️', 30)}`
        : `<rect x="10" y="10" width="130" height="320" fill="#8A6A4A"/><rect x="26" y="30" width="98" height="120" rx="6" fill="#7A5C42"/><rect x="26" y="166" width="98" height="144" rx="6" fill="#7A5C42"/>
           <rect x="96" y="150" width="38" height="70" rx="8" fill="#16233A"/>${[0, 1, 2].map(r => [0, 1].map(c => `<circle cx="${107 + c * 16}" cy="${164 + r * 16}" r="4" fill="${st.avail ? '#6FFFE9' : '#5B677A'}"/>`).join('')).join('')}
           ${em(115, 214, '👆', 12)}${padlock(36, 196)}`}` }
  };

  /* ---------- 장면 ---------- */
  const PAL = {
    lobby: { wall: '#2E4A62', wall2: '#2A445A', floor: '#5A6B7E', trim: '#203547' },
    food: { wall: '#2F6658', wall2: '#295B4F', floor: '#7A6650', trim: '#214A40' },
    cloth: { wall: '#5A4678', wall2: '#523F6E', floor: '#6E5E7A', trim: '#3E2F57' },
    house: { wall: '#34466E', wall2: '#2F4064', floor: '#4E5670', trim: '#24304D' },
    hall: { wall: '#2F3A55', wall2: '#2A344D', floor: '#474A5E', trim: '#222B40' },
    gate: { wall: '#2A2340', wall2: '#251F39', floor: '#3A2F4F', trim: '#1C172C' }
  };
  function backdrop(p) {
    const c = PAL[p];
    let stripes = '';
    for (let x = 0; x < 1000; x += 80) stripes += `<rect x="${x}" y="0" width="40" height="392" fill="${c.wall2}"/>`;
    return `<rect width="1000" height="400" fill="${c.wall}"/>${stripes}
      <rect y="400" width="1000" height="160" fill="${c.floor}"/>
      ${[438, 476, 518].map(y => `<path d="M0 ${y} H1000" stroke="#00000018" stroke-width="2"/>`).join('')}
      <rect y="388" width="1000" height="14" fill="${c.trim}"/>
      <path d="M0 392 H1000" stroke="#6FFFE9" stroke-width="2" opacity=".35"/>
      <rect width="1000" height="560" fill="url(#vignette)"/>`;
  }
  const defs = '<defs><radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>';
  function chip(cx, y, label) {
    const w = [...label].reduce((t, ch) => t + (/[ -~]/.test(ch) ? 8 : 14), 0) + 20;
    return `<g class="chip"><rect x="${cx - w / 2}" y="${y}" width="${w}" height="24" rx="12"/><text x="${cx}" y="${y + 17}" text-anchor="middle">${esc(label)}</text></g>`;
  }
  const badge = (x, y, s) => (s ? `<g class="badge"><circle cx="${x}" cy="${y}" r="17"/>${em(x, y + 7, s, 18)}</g>` : '');

  function objState(room, o) {
    const S = E.get();
    if (o.talk) return { cls: 'talk', badge: '💬', glow: false, aria: '(말 걸기)' };
    if (o.clue) {
      const seen = !!S.seen[room + ':' + o.id];
      return { cls: 'clue' + (seen ? ' seen' : ''), badge: seen ? '' : '✨', glow: !seen, aria: seen ? '(살펴봄)' : '(단서)' };
    }
    const done = E.isDone(o.lock), avail = E.available(o.lock);
    return { cls: 'lock' + (done ? ' done' : avail ? ' ready' : ' locked'), badge: done ? '✅' : avail ? '🔒' : '⛓️', glow: avail && !done, open: done, avail, aria: done ? '(열림)' : avail ? '(자물쇠)' : '(아직 잠김)' };
  }
  function hot(room, o) {
    const d = OBJ[o.id], st = objState(room, o), cx = o.x + d.w / 2;
    return `<g class="hot ${st.cls}" data-obj="${o.id}" tabindex="0" role="button" aria-label="${esc(o.name + ' ' + st.aria)}">
      ${st.glow ? `<ellipse class="glow" cx="${cx}" cy="${o.y + d.h - 4}" rx="${d.w * 0.62}" ry="18"/>` : ''}
      <g transform="translate(${o.x} ${o.y})">${d.draw(st)}</g>
      <rect class="hit" x="${o.x - 6}" y="${o.y - 6}" width="${d.w + 12}" height="${d.h + 12}" rx="12"/>
      ${badge(o.x + d.w - 2, o.y - 2, st.badge)}${chip(cx, o.y + d.h + 8, o.name)}</g>`;
  }
  function room(id) {
    const R = ROOMS[id];
    return `<svg viewBox="0 0 1000 560" class="scene" role="group" aria-label="${esc(R.name)}">${defs}${backdrop(id)}
      <ellipse cx="500" cy="0" rx="360" ry="120" fill="#BDF2FF" opacity=".06"/>
      ${R.objects.map(o => hot(id, o)).join('')}</svg>`;
  }

  /* 복도: 문 다섯 개 */
  const HALL = [{ go: 'lobby', x: 30 }, { go: 'food', x: 215 }, { go: 'cloth', x: 400 }, { go: 'house', x: 585 }];
  function hall() {
    const doorCol = { lobby: '#4F7CAC', food: '#4E8C7A', cloth: '#8A68A6', house: '#5B74B5' };
    const doors = HALL.map(d => {
      const R = ROOMS[d.go], done = E.cleared(d.go);
      const job = E.jobOf(E.get().job).room === d.go;
      return `<g class="hot door-go${done ? ' done' : ''}" data-go="${d.go}" tabindex="0" role="button" aria-label="${esc(R.name)}로 가기${done ? ' (완료)' : ''}">
        ${done ? '' : `<ellipse class="glow" cx="${d.x + 75}" cy="398" rx="90" ry="16"/>`}
        <rect x="${d.x}" y="130" width="150" height="270" rx="6" fill="#1E2538"/>
        <rect x="${d.x + 10}" y="140" width="130" height="260" fill="${doorCol[d.go]}"/>
        <rect x="${d.x + 24}" y="156" width="102" height="96" rx="6" fill="#00000022"/><rect x="${d.x + 24}" y="266" width="102" height="118" rx="6" fill="#00000022"/>
        <circle cx="${d.x + 124}" cy="276" r="6" fill="#F2C14E"/>
        ${em(d.x + 75, 222, R.icon, 44)}
        <rect x="${d.x + 6}" y="82" width="138" height="38" rx="8" fill="#FFF8E7"/>${tx(d.x + 70, 107, esc(R.short), 15, '#2F3E4E', B)}
        <circle cx="${d.x + 130}" cy="101" r="7" fill="${done ? '#52D273' : '#FFD166'}"/>
        ${job && !done ? `<rect x="${d.x + 26}" y="300" width="98" height="26" rx="13" fill="#FFD166"/>${tx(d.x + 75, 318, '⭐ 내 전문', 12, '#5C4632', B)}` : ''}
        ${done ? badge(d.x + 140, 136, '✅') : ''}
        <rect class="hit" x="${d.x - 4}" y="78" width="158" height="326" rx="10"/></g>`;
    }).join('');
    const k = E.keys(), open = k === KEY_ROOMS.length;
    const slots = KEY_ROOMS.map((r, i) => `<circle cx="${830 + i * 45}" cy="250" r="17" fill="${E.cleared(r) ? '#FFD166' : '#1C172C'}" stroke="#C9A227" stroke-width="3"/>${em(830 + i * 45, 257, E.cleared(r) ? '🗝️' : ROOMS[r].icon, E.cleared(r) ? 16 : 14)}`).join('');
    const gate = `<g class="hot gate-go${open ? ' ready' : ' locked'}" data-go="gate" tabindex="0" role="button" aria-label="탈출 문${open ? '' : ' (열쇠 ' + k + '/3)'}">
      ${open ? '<ellipse class="glow" cx="875" cy="398" rx="110" ry="18"/>' : ''}
      <path d="M780 400 V170 Q875 90 970 170 V400 Z" fill="#14101F"/>
      <path d="M792 400 V176 Q875 106 958 176 V400 Z" fill="${open ? '#2F6DB5' : '#33415E'}"/>
      <path d="M875 120 V400" stroke="#14101F" stroke-width="5"/>
      <rect x="806" y="226" width="138" height="48" rx="24" fill="#1C172C" opacity=".9"/>${slots}
      ${tx(875, 330, '탈출 문', 22, '#FFE9A8', 'font-family="Jua, sans-serif"')}${tx(875, 356, `열쇠 ${k}/3`, 15, '#FFE9A8', B)}
      ${badge(950, 170, open ? '🚪' : '⛓️')}
      <rect class="hit" x="776" y="96" width="198" height="308" rx="10"/></g>`;
    const lamps = [120, 305, 490, 675, 875].map(x => `<rect x="${x - 16}" y="0" width="32" height="18" fill="#1C2233"/><ellipse cx="${x}" cy="22" rx="22" ry="8" fill="#BDF2FF"/><ellipse cx="${x}" cy="60" rx="70" ry="44" fill="#BDF2FF" opacity=".07"/>`).join('');
    return `<svg viewBox="0 0 1000 560" class="scene" role="group" aria-label="미래하우스 복도">${defs}${backdrop('hall')}${lamps}
      <rect x="0" y="470" width="1000" height="40" fill="#2F6DB5" opacity=".35"/>${doors}${gate}</svg>`;
  }

  /* 탈출 문 앞: 생각 바이러스, 그다음 고객 의뢰서 */
  function gate() {
    const S = E.get(), cur = E.fight(), done = MONSTERS.filter(m => E.isDone(m.id));
    const small = done.map((m, i) => nest(monster(m.look, 64), 30 + i * 74, 450)).join('');
    const me = nest(avatar(S.look, 130, E.wearing()), 110, 250);
    let main = '';
    if (cur) {
      main = `<g class="hot monster-go ready" data-fight="${cur.id}" tabindex="0" role="button" aria-label="${esc(cur.name)}와 맞서기">
        <ellipse class="glow" cx="640" cy="470" rx="150" ry="22"/>${nest(monster(cur.look, 230), 525, 230)}
        <rect x="380" y="112" width="440" height="86" rx="18" fill="#FFF8E7"/><path d="M620 198 l20 22 l6 -22z" fill="#FFF8E7"/>
        <foreignObject x="392" y="120" width="416" height="72"><div xmlns="http://www.w3.org/1999/xhtml" class="claim-svg">${esc(cur.claim)}</div></foreignObject>
        <rect class="hit" x="380" y="104" width="440" height="390" rx="16"/></g>`;
    } else {
      const P = E.persona(), fin = E.isDone('FINAL');
      main = `<g class="hot order-go${fin ? ' done' : ' ready'}" data-lock="FINAL" tabindex="0" role="button" aria-label="고객 의뢰서 열기">
        ${fin ? '' : '<ellipse class="glow" cx="640" cy="470" rx="150" ry="22"/>'}
        <rect x="500" y="170" width="280" height="290" rx="14" fill="#FFF8E7" stroke="#E9D8A6" stroke-width="4"/>
        ${tx(640, 210, '📋 고객 의뢰서', 22, '#2F3E4E', 'font-family="Jua, sans-serif"')}
        ${em(640, 290, P.icon, 64)}${tx(640, 336, esc(P.name), 15, '#2F3E4E', B)}
        ${tx(640, 380, fin ? '설계 완료! 여울봇이 깨어났어요' : '의·식·주 미래 생활 설계', 14, fin ? '#2A9D8F' : '#C2410C', B)}
        ${fin ? em(640, 430, '🎉', 34) : padlock(626, 404)}
        <rect class="hit" x="494" y="164" width="292" height="302" rx="16"/></g>`;
    }
    return `<svg viewBox="0 0 1000 560" class="scene" role="group" aria-label="탈출 문 앞">${defs}${backdrop('gate')}
      <path d="M330 400 V140 Q500 30 670 140 V400 Z" fill="#14101F" opacity=".8"/>
      ${tx(500, 80, cur ? `생각 바이러스 ${done.length + 1} / ${MONSTERS.length}` : '마지막 의뢰', 20, '#FFE9A8', 'font-family="Jua, sans-serif"')}
      ${small}${me}${main}</svg>`;
  }

  /* 처음 화면 그림 */
  function title(wear) {
    const people = LOOKS.map((l, i) => nest(avatar(l.id, 84, i === 0 ? wear : []), 250 + i * 110, 300)).join('');
    let stars = '';
    for (let i = 0; i < 26; i++) stars += `<circle cx="${(i * 137) % 1000}" cy="${(i * 53) % 200 + 10}" r="${1 + (i % 3)}" fill="#BDF2FF" opacity="${0.35 + (i % 4) * 0.15}"/>`;
    return `<svg viewBox="0 0 1000 440" class="title-svg" aria-hidden="true">
      <rect width="1000" height="440" fill="#1A2540"/>${stars}
      <path d="M0 360 Q500 300 1000 360 V440 H0Z" fill="#24435A"/>
      <path d="M300 340 V170 Q300 110 360 110 H640 Q700 110 700 170 V340 Z" fill="#E9EEF5"/>
      <path d="M300 190 Q500 120 700 190" fill="none" stroke="#B8C7D6" stroke-width="6"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${330 + i * 90}" y="200" width="60" height="44" rx="8" fill="#6FFFE9" opacity="${i === 1 ? 0.9 : 0.6}"/>`).join('')}
      <rect x="460" y="262" width="80" height="78" rx="8" fill="#5B8FD9"/>${padlock(486, 282)}
      <rect x="560" y="70" width="140" height="26" rx="6" fill="#2F6DB5"/><rect x="560" y="70" width="140" height="10" fill="#7FD4FF" opacity=".6"/>
      ${em(660, 160, '📶', 26)}${em(340, 150, '🌱', 22)}
      ${tx(500, 150, '2045 미래하우스', 22, '#2F3E4E', 'font-family="Jua, sans-serif"')}
      ${people}${nest(bot(70, 'sleep'), 700, 300)}</svg>`;
  }

  /* 스마트 팜 미리 보기: sel = 칸마다 고른 번호 */
  /* 고른 장치만 보여 주고, 맞는지는 「열기」를 눌러야 알 수 있어요 */
  const DEVICE = [['냉방', '🌀'], ['난방', '🔥'], ['가습', '💨'], ['제습', '🌬️'], ['LED', '💡'], ['차광막', '⬛'], ['자동 물', '💧'], ['멈추', '⛔']];
  function farm(sel) {
    const L = LOCKS.F2, pick = i => (sel[i] == null ? null : L.slots[i].opts[sel[i]]);
    const icon = i => { const o = pick(i); if (!o) return ''; const d = DEVICE.find(([k]) => o.t.includes(k)); return d ? d[1] : '✔'; };
    const ind = (x, e, label) => `<rect x="${x}" y="10" width="74" height="40" rx="10" fill="#7A2E3E"/>${em(x + 18, 38, e, 16)}${tx(x + 50, 36, label, 11, '#FFFFFF', B)}`;
    const dev = (x, i) => `<circle cx="${x}" cy="74" r="15" fill="${pick(i) ? '#FFFFFF' : '#FFFFFF66'}" stroke="#22344A" stroke-width="2" stroke-dasharray="${pick(i) ? '0' : '4 3'}"/>${pick(i) ? em(x, 80, icon(i), 15) : tx(x, 79, '?', 13, '#22344A', B)}`;
    return `<svg viewBox="0 0 320 210" class="farm-svg" aria-hidden="true">
      <rect width="320" height="210" rx="12" fill="#BDE6FA"/>
      ${ind(4, '🌡️', '31℃')}${ind(82, '💧', '40%')}${ind(160, '☀️', '부족')}${ind(238, '🪴', '건조')}
      ${[41, 119, 197, 275].map((x, i) => dev(x, i)).join('')}
      <rect y="160" width="320" height="50" fill="#9BD08A"/>
      <path d="M30 172 V112 A130 56 0 0 1 290 112 V172 Z" fill="#FFFFFF" fill-opacity=".55" stroke="#FFFFFF" stroke-width="3"/>
      ${[90, 130, 170, 210].map(x => em(x, 168, '🌱', 20)).join('')}</svg>`;
  }

  return { avatar, bot, monster, room, hall, gate, title, farm, OBJ };
})();
