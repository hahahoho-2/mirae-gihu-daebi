/* ==========================================================================
   여울섬 그림 모음 (모두 코드로 그린 SVG — 외부 그림 파일 없음)
   좌표: 캐릭터는 몸 중심이 (0,0), 몸 반지름 55
   ========================================================================== */
const Art = (() => {
  const bodyColor = id => BODY_COLORS.find(c => c.id === id) || BODY_COLORS[0];
  const clothColor = id => CLOTH_COLORS.find(c => c.id === id) || CLOTH_COLORS[0];
  const INK = '#2B2B3A';

  /* ---------- 얼굴 ---------- */
  function face(o = {}) {
    const dy = o.dy || 0, mood = o.mood || 'smile';
    const mouth = mood === 'hot'
      ? `<ellipse cx="0" cy="${2 + dy}" rx="5" ry="4" fill="${INK}"/>`
      : mood === 'wow'
        ? `<ellipse cx="0" cy="${2 + dy}" rx="4" ry="5" fill="${INK}"/>`
        : `<path d="M-6 ${-1 + dy}Q0 ${5 + dy} 6 ${-1 + dy}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    return `<g class="blink"><ellipse cx="-16" cy="${-16 + dy}" rx="6.5" ry="10" fill="${INK}"/><ellipse cx="16" cy="${-16 + dy}" rx="6.5" ry="10" fill="${INK}"/></g>
      <circle cx="-14" cy="${-21 + dy}" r="2.8" fill="#fff"/><circle cx="18" cy="${-21 + dy}" r="2.8" fill="#fff"/>
      <ellipse cx="-31" cy="${dy}" rx="8" ry="4.5" fill="#FF8FA3" opacity=".6"/><ellipse cx="31" cy="${dy}" rx="8" ry="4.5" fill="#FF8FA3" opacity=".6"/>
      ${mouth}`;
  }

  /* ---------- 주인공 새싹이 ----------
     o = { color, outfit: { top, color, details[], hat, shoes }, mood } */
  function avatar(o = {}) {
    const b = bodyColor(o.color);
    const f = o.outfit || {};
    const top = f.top || 'none', det = f.details || [], hat = f.hat || 'none', shoes = f.shoes || 'none';
    const c = clothColor(f.color);
    const out = [];
    out.push('<ellipse cx="0" cy="66" rx="42" ry="7" fill="#000" opacity=".08"/>');
    // 발 / 신발
    for (const x of [-24, 24]) {
      if (shoes === 'boots') out.push(`<path d="M${x - 19} 54 Q${x - 19} 38 ${x - 10} 36 H${x + 10} Q${x + 19} 38 ${x + 19} 54 Q${x} 66 ${x - 19} 54Z" fill="#3F86C6" stroke="#2F6EA6" stroke-width="1.5"/><rect x="${x - 12}" y="36" width="24" height="5" rx="2" fill="#5FA0DA"/>`);
      else if (shoes === 'sneakers') out.push(`<ellipse cx="${x}" cy="52" rx="20" ry="11" fill="#FFFFFF" stroke="#B8C2CC" stroke-width="1.5"/><path d="M${x - 12} 50 Q${x} 44 ${x + 12} 50" fill="none" stroke="#5FA7D6" stroke-width="3" stroke-linecap="round"/><path d="M${x - 19} 56 H${x + 19}" stroke="#B8C2CC" stroke-width="2"/>`);
      else {
        out.push(`<ellipse cx="${x}" cy="52" rx="20" ry="11" fill="${b.feet}" stroke="${b.stroke}" stroke-width="1.5"/>`);
        if (shoes === 'sandals') out.push(`<path d="M${x - 15} 48 H${x + 15} M${x - 4} 44 V58" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>`);
      }
    }
    // 후드(등 뒤)
    if (det.includes('hood') && top !== 'raincoat' && top !== 'none') out.push(`<path d="M-50 -12 A58 58 0 0 1 50 -12" fill="none" stroke="${c.fill}" stroke-width="12" stroke-linecap="round"/><path d="M-50 -12 A58 58 0 0 1 50 -12" fill="none" stroke="${c.stroke}" stroke-width="1.5" transform="translate(0 -6) scale(1.06)"/>`);
    // 몸
    if (top === 'raincoat') {
      out.push(`<circle r="57" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><ellipse cx="0" cy="-6" rx="42" ry="36" fill="${b.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
      out.push(`<circle cx="-10" cy="44" r="3" fill="${c.stroke}"/><circle cx="10" cy="44" r="3" fill="${c.stroke}"/>`);
    } else {
      out.push(`<circle r="55" fill="${b.fill}" stroke="${b.stroke}" stroke-width="2"/>`);
    }
    // 상의
    const sleeve = (rx, ry) => `<ellipse cx="-55" cy="17" rx="${rx}" ry="${ry}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><ellipse cx="55" cy="17" rx="${rx}" ry="${ry}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`;
    const meshPanels = `<path d="M-49.5 24L-35 24L-29 46.7A55 55 0 0 1 -49.5 24Z" fill="#E3ECF3"/><path d="M-49.5 24L-35 24L-29 46.7A55 55 0 0 1 -49.5 24Z" fill="url(#meshPat)" stroke="#AFC0CF"/><path d="M49.5 24L35 24L29 46.7A55 55 0 0 0 49.5 24Z" fill="#E3ECF3"/><path d="M49.5 24L35 24L29 46.7A55 55 0 0 0 49.5 24Z" fill="url(#meshPat)" stroke="#AFC0CF"/>`;
    if (top === 'tee') {
      out.push(`<path d="M52 18L12 18Q0 30 -12 18L-52 18A55 55 0 0 0 52 18Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`);
      if (det.includes('mesh')) out.push(meshPanels);
      out.push(sleeve(16, 12));
    } else if (top === 'shirt') {
      out.push(`<path d="M52 18L9 18L0 28L-9 18L-52 18A55 55 0 0 0 52 18Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`);
      if (det.includes('mesh')) out.push(meshPanels);
      out.push(`<polygon points="-11,16 -1,30 -18,28" fill="#fff" stroke="${c.stroke}" stroke-width="1.5"/><polygon points="11,16 1,30 18,28" fill="#fff" stroke="${c.stroke}" stroke-width="1.5"/><path d="M0 30V52" stroke="${c.stroke}" stroke-width="1.5"/><circle cx="0" cy="38" r="2.2" fill="${c.stroke}"/><circle cx="0" cy="47" r="2.2" fill="${c.stroke}"/>`);
      out.push(sleeve(14, 11));
    } else if (top === 'cardigan') {
      out.push(`<path d="M52 18L12 18Q0 30 -12 18L-52 18A55 55 0 0 0 52 18Z" fill="#FFFFFF" stroke="#C5D0DA" stroke-width="2"/>`);
      if (det.includes('mesh')) out.push(meshPanels);
      out.push(`<path d="M-52 18L-12 18L-8 54.4A55 55 0 0 1 -52 18Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><path d="M52 18L12 18L8 54.4A55 55 0 0 0 52 18Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><circle cx="-12" cy="30" r="2.2" fill="${c.stroke}"/><circle cx="-11" cy="42" r="2.2" fill="${c.stroke}"/>`);
      out.push(sleeve(15, 12));
    } else if (top === 'raincoat') {
      out.push(`<ellipse cx="-58" cy="16" rx="13" ry="11" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><ellipse cx="58" cy="16" rx="13" ry="11" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`);
    }
    // 손 / 쿨토시
    const hx = top === 'raincoat' ? 67 : top === 'tee' ? 66 : 64;
    for (const s of [-1, 1]) {
      if (det.includes('sleeves') && top !== 'none') out.push(`<ellipse cx="${s * (hx + 1)}" cy="25" rx="9" ry="7.5" fill="#fff" stroke="#B9C6D2" stroke-width="1.5"/><path d="M${s * (hx - 4)} 21l${s * 9} 7" stroke="#D3E2EE" stroke-width="2"/><ellipse cx="${s * (hx + 8)}" cy="30" rx="4.5" ry="4" fill="${b.fill}" stroke="${b.stroke}" stroke-width="1.2"/>`);
      else if (top === 'none') out.push(`<ellipse cx="${s * 56}" cy="16" rx="13" ry="10" fill="${b.fill}" stroke="${b.stroke}" stroke-width="2"/>`);
      else out.push(`<ellipse cx="${s * hx}" cy="25" rx="7" ry="6" fill="${b.fill}" stroke="${b.stroke}" stroke-width="1.5"/>`);
    }
    // 쿨스카프
    if (det.includes('scarf')) out.push(`<polygon points="-17,15 17,15 0,34" fill="#7CC4E8" stroke="#4E9BC4" stroke-width="1.5"/><circle cx="-17" cy="15" r="3.5" fill="#7CC4E8" stroke="#4E9BC4"/><circle cx="17" cy="15" r="3.5" fill="#7CC4E8" stroke="#4E9BC4"/>`);
    out.push(face({ mood: o.mood }));
    // 새싹 / 모자
    if (hat === 'none' && top !== 'raincoat') out.push(sprout());
    if (hat === 'sunhat') out.push(`<ellipse cx="0" cy="-47" rx="58" ry="12" fill="#F4E1A1" stroke="#D6BC6B" stroke-width="2"/><path d="M-28 -46Q-28 -76 0 -76Q28 -76 28 -46Z" fill="#F4E1A1" stroke="#D6BC6B" stroke-width="2"/><rect x="-27" y="-55" width="54" height="7" fill="#F4A261"/>`);
    if (hat === 'cap') out.push(`<path d="M-44 -34Q-42 -72 0 -72Q42 -72 44 -34Z" fill="#5FA7D6" stroke="#3F7FB0" stroke-width="2"/><path d="M14 -36 Q48 -40 62 -30 Q40 -26 14 -30Z" fill="#4A93C8" stroke="#3F7FB0" stroke-width="1.5"/><circle cx="0" cy="-71" r="3.5" fill="#3F7FB0"/>`);
    if (hat === 'rainhat') out.push(`<ellipse cx="0" cy="-42" rx="62" ry="14" fill="#FFD34E" stroke="#E0A92A" stroke-width="2"/><path d="M-34 -42Q-34 -74 0 -74Q34 -74 34 -42Z" fill="#FFD34E" stroke="#E0A92A" stroke-width="2"/>`);
    if (hat === 'beanie') out.push(`<path d="M-48 -31Q-48 -78 0 -78Q48 -78 48 -31Z" fill="#E07A8B" stroke="#C25B6D" stroke-width="2"/><rect x="-50" y="-41" width="100" height="12" rx="6" fill="#EC9AA8" stroke="#C25B6D" stroke-width="1.5"/><circle cx="0" cy="-80" r="9" fill="#F7C6CF" stroke="#C25B6D" stroke-width="1.5"/>`);
    return out.join('');
  }
  function sprout() {
    return `<path d="M0 -54 Q-2 -66 0 -76" fill="none" stroke="#4FAE6E" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="-10" cy="-76" rx="11" ry="6" transform="rotate(-28 -10 -76)" fill="#7BD08F" stroke="#4FAE6E" stroke-width="1.5"/><ellipse cx="11" cy="-79" rx="12" ry="6.5" transform="rotate(24 11 -79)" fill="#7BD08F" stroke="#4FAE6E" stroke-width="1.5"/>`;
  }
  const avatarSVG = (o, size = 120) => `<svg viewBox="-85 -100 170 180" width="${size}" height="${size * 180 / 170}" aria-hidden="true">${avatar(o)}</svg>`;

  /* ---------- 동물 친구 ---------- */
  const PET_ART = {
    bee: `<g transform="translate(-130 -382)">
      <g class="flap"><ellipse cx="114" cy="346" rx="13" ry="18" transform="rotate(-22 114 346)" fill="#E2F4FF" stroke="#9CCBE6" stroke-width="1.5"/></g>
      <g class="flap"><ellipse cx="146" cy="346" rx="13" ry="18" transform="rotate(22 146 346)" fill="#E2F4FF" stroke="#9CCBE6" stroke-width="1.5"/></g>
      <path d="M122 354 Q116 342 110 334" fill="none" stroke="#6B4A2E" stroke-width="2.5" stroke-linecap="round"/><circle cx="110" cy="333" r="3.5" fill="#6B4A2E"/>
      <path d="M138 354 Q144 342 150 334" fill="none" stroke="#6B4A2E" stroke-width="2.5" stroke-linecap="round"/><circle cx="150" cy="333" r="3.5" fill="#6B4A2E"/>
      <ellipse cx="130" cy="382" rx="36" ry="32" fill="#FFD45C" stroke="#E2A72E" stroke-width="2"/>
      <g clip-path="url(#beeClip)" fill="#6B4A2E"><rect x="90" y="390" width="80" height="8"/><rect x="90" y="404" width="80" height="8"/></g>
      <ellipse cx="130" cy="382" rx="36" ry="32" fill="none" stroke="#E2A72E" stroke-width="2"/>
      <g class="blink"><ellipse cx="119" cy="370" rx="4.5" ry="6.5" fill="${INK}"/><ellipse cx="141" cy="370" rx="4.5" ry="6.5" fill="${INK}"/></g>
      <circle cx="120.5" cy="367" r="1.8" fill="#fff"/><circle cx="142.5" cy="367" r="1.8" fill="#fff"/>
      <ellipse cx="107" cy="380" rx="6" ry="3.5" fill="#FF8FA3" opacity=".6"/><ellipse cx="153" cy="380" rx="6" ry="3.5" fill="#FF8FA3" opacity=".6"/>
      <path d="M126 379 Q130 383 134 379" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`,
    otter: `<g transform="translate(-340 -384)">
      <ellipse cx="382" cy="406" rx="22" ry="9" transform="rotate(-25 382 406)" fill="#9C6F4C"/>
      <circle cx="312" cy="352" r="9" fill="#B98A64" stroke="#8E6443" stroke-width="2"/><circle cx="312" cy="352" r="4" fill="#8E6443"/>
      <circle cx="368" cy="352" r="9" fill="#B98A64" stroke="#8E6443" stroke-width="2"/><circle cx="368" cy="352" r="4" fill="#8E6443"/>
      <ellipse cx="340" cy="384" rx="38" ry="36" fill="#B98A64" stroke="#8E6443" stroke-width="2"/>
      <ellipse cx="340" cy="402" rx="24" ry="16" fill="#F2DCC0"/><ellipse cx="340" cy="380" rx="15" ry="10" fill="#F7EBDD"/>
      <ellipse cx="340" cy="374" rx="5" ry="3.5" fill="#3A2A22"/><path d="M335 381 Q340 385 345 381" fill="none" stroke="#3A2A22" stroke-width="1.8" stroke-linecap="round"/>
      <g class="blink"><ellipse cx="324" cy="364" rx="4.5" ry="6" fill="${INK}"/><ellipse cx="356" cy="364" rx="4.5" ry="6" fill="${INK}"/></g>
      <circle cx="325.5" cy="361.5" r="1.8" fill="#fff"/><circle cx="357.5" cy="361.5" r="1.8" fill="#fff"/>
      <g stroke="#8E6443" stroke-width="1.2" stroke-linecap="round"><path d="M326 379l-14-3"/><path d="M326 383l-14 2"/><path d="M354 379l14-3"/><path d="M354 383l14 2"/></g>
      <ellipse cx="315" cy="386" rx="6" ry="3.5" fill="#FF8FA3" opacity=".55"/><ellipse cx="365" cy="386" rx="6" ry="3.5" fill="#FF8FA3" opacity=".55"/>
      <path d="M340 396 Q331 409 340 413 Q349 409 340 396" fill="#7CC4F0" stroke="#4A9BCB" stroke-width="1.2"/>
      <ellipse cx="329" cy="410" rx="7" ry="5" fill="#9C6F4C"/><ellipse cx="351" cy="410" rx="7" ry="5" fill="#9C6F4C"/></g>`,
    hedgehog: `<g transform="translate(-550 -390)"><g fill="#8A6A50" stroke="#6E523C" stroke-width="1.2">
      ${[-100, -75, -50, -25, 0, 25, 50, 75, 100].map(a => `<polygon points="543,352 550,334 557,352" transform="rotate(${a} 550 386)"/>`).join('')}
      <circle cx="550" cy="386" r="37"/></g>
      <circle cx="528" cy="362" r="6.5" fill="#F5DDBF" stroke="#D2B08A" stroke-width="1.5"/><circle cx="572" cy="362" r="6.5" fill="#F5DDBF" stroke="#D2B08A" stroke-width="1.5"/>
      <ellipse cx="550" cy="394" rx="31" ry="27" fill="#F5DDBF" stroke="#D2B08A" stroke-width="2"/>
      <ellipse cx="550" cy="397" rx="10" ry="7" fill="#FBE9D6"/><circle cx="550" cy="392" r="3.5" fill="#3A2A22"/>
      <g class="blink"><ellipse cx="537" cy="383" rx="4.5" ry="6" fill="${INK}"/><ellipse cx="563" cy="383" rx="4.5" ry="6" fill="${INK}"/></g>
      <circle cx="538.5" cy="380.5" r="1.8" fill="#fff"/><circle cx="564.5" cy="380.5" r="1.8" fill="#fff"/>
      <ellipse cx="528" cy="398" rx="6" ry="3.5" fill="#FF8FA3" opacity=".55"/><ellipse cx="572" cy="398" rx="6" ry="3.5" fill="#FF8FA3" opacity=".55"/>
      <ellipse cx="550" cy="414" rx="7" ry="8" fill="#C98B4E"/><path d="M542 410 Q550 401 558 410 Z" fill="#7A5434"/>
      <ellipse cx="537" cy="420" rx="8" ry="5" fill="#D2B08A"/><ellipse cx="563" cy="420" rx="8" ry="5" fill="#D2B08A"/></g>`
  };
  const pet = kind => `<ellipse cx="0" cy="40" rx="32" ry="6" fill="#000" opacity=".08"/>${PET_ART[kind] || PET_ART.bee}`;
  const petSVG = (kind, size = 80) => `<svg viewBox="-55 -60 110 110" width="${size}" height="${size}" aria-hidden="true">${pet(kind)}</svg>`;

  /* ---------- 마을 주민 ---------- */
  function npcBody(fill, stroke, feet) {
    return `<ellipse cx="0" cy="62" rx="40" ry="7" fill="#000" opacity=".08"/><ellipse cx="-22" cy="48" rx="18" ry="10" fill="${feet}" stroke="${stroke}" stroke-width="1.5"/><ellipse cx="22" cy="48" rx="18" ry="10" fill="${feet}" stroke="${stroke}" stroke-width="1.5"/><circle r="50" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  }
  const hands = (fill, stroke) => `<ellipse cx="-52" cy="14" rx="12" ry="9" fill="${fill}" stroke="${stroke}" stroke-width="2"/><ellipse cx="52" cy="14" rx="12" ry="9" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const NPC_ART = {
    researcher: () => `${npcBody('#D7E9FA', '#93BCE0', '#9FC3E6')}
      <path d="M-47 16L-12 16L-8 49.4A50 50 0 0 1 -47 16Z" fill="#fff" stroke="#C5D0DA" stroke-width="2"/><path d="M47 16L12 16L8 49.4A50 50 0 0 0 47 16Z" fill="#fff" stroke="#C5D0DA" stroke-width="2"/>
      ${hands('#fff', '#C5D0DA')}<rect x="50" y="2" width="20" height="26" rx="3" fill="#C79A6B" stroke="#A47A50"/><rect x="54" y="7" width="12" height="17" fill="#fff"/><path d="M56 12h8M56 16h8M56 20h6" stroke="#9AB3C9" stroke-width="1.2"/>
      ${face()}<circle cx="-16" cy="-16" r="12" fill="none" stroke="#4A5A70" stroke-width="2"/><circle cx="16" cy="-16" r="12" fill="none" stroke="#4A5A70" stroke-width="2"/><path d="M-4 -17h8" stroke="#4A5A70" stroke-width="2"/>
      <g fill="#fff" stroke="#C9D6E3" stroke-width="1.5"><circle cx="-16" cy="-50" r="12"/><circle cx="16" cy="-50" r="12"/><circle cx="0" cy="-58" r="15"/></g>`,
    grandma: () => `${npcBody('#F7E6CF', '#D9B98F', '#E6C49A')}
      <path d="M-30 16 L30 16 L33 46 Q0 56 -33 46 Z" fill="#fff" stroke="#D7C4AE" stroke-width="1.5"/><rect x="-10" y="28" width="20" height="12" rx="3" fill="none" stroke="#D7C4AE" stroke-width="1.5"/>
      ${hands('#F7E6CF', '#D9B98F')}${face()}
      <circle cx="-16" cy="-16" r="10" fill="none" stroke="#8A6A50" stroke-width="1.6"/><circle cx="16" cy="-16" r="10" fill="none" stroke="#8A6A50" stroke-width="1.6"/>
      <path d="M-50 -18 Q-48 -62 0 -64 Q48 -62 50 -18 Q36 -40 0 -40 Q-36 -40 -50 -18Z" fill="#F28FA0" stroke="#D9677B" stroke-width="2"/>
      <g fill="#fff"><circle cx="-24" cy="-48" r="3"/><circle cx="0" cy="-54" r="3"/><circle cx="24" cy="-48" r="3"/><circle cx="-36" cy="-32" r="2.5"/><circle cx="36" cy="-32" r="2.5"/></g>`,
    chef: () => `${npcBody('#FFEBD6', '#E5B98F', '#F0C49B')}
      <path d="M-30 16 L30 16 L33 46 Q0 56 -33 46 Z" fill="#fff" stroke="#D5DCE3" stroke-width="1.5"/>
      <polygon points="-16,12 16,12 0,28" fill="#E86A5C" stroke="#C94F42" stroke-width="1.5"/>
      ${hands('#FFEBD6', '#E5B98F')}${face()}
      <rect x="-28" y="-62" width="56" height="16" rx="4" fill="#fff" stroke="#D5DCE3" stroke-width="2"/>
      <g fill="#fff" stroke="#D5DCE3" stroke-width="2"><circle cx="-18" cy="-72" r="15"/><circle cx="18" cy="-72" r="15"/><circle cx="0" cy="-80" r="18"/></g><rect x="-26" y="-64" width="52" height="8" fill="#fff"/>`,
    tailor: () => `${npcBody('#E8DCFA', '#AC99D8', '#B9A5E3')}
      ${hands('#E8DCFA', '#AC99D8')}
      <path d="M-40 6 Q0 32 40 6" fill="none" stroke="#F2C94C" stroke-width="7" stroke-linecap="round"/><path d="M-30 13l1 4M-20 17l1 4M-10 20l0 4M0 21v4M10 20v4M20 17l-1 4M30 13l-1 4" stroke="#B8902A" stroke-width="1.2"/>
      <path d="M38 8 Q46 26 40 40" fill="none" stroke="#F2C94C" stroke-width="7" stroke-linecap="round"/>
      ${face()}<ellipse cx="-6" cy="-50" rx="40" ry="14" transform="rotate(-10 -6 -50)" fill="#7A5CB8" stroke="#5E4499" stroke-width="2"/><circle cx="-4" cy="-64" r="4" fill="#5E4499"/>`,
    builder: () => `${npcBody('#FFE0B5', '#E3B27A', '#EBBF86')}
      <path d="M-49 22 Q0 34 49 22 L48 32 Q0 44 -48 32Z" fill="#8B5E3C" stroke="#6E4628" stroke-width="1.5"/><rect x="-7" y="27" width="14" height="10" rx="2" fill="#E3C27A" stroke="#B8902A"/>
      ${hands('#FFE0B5', '#E3B27A')}<path d="M60 18 L70 -8" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round"/><rect x="62" y="-16" width="20" height="10" rx="2" transform="rotate(20 72 -11)" fill="#9AA5B1" stroke="#6E7883"/>
      ${face()}<ellipse cx="0" cy="-36" rx="52" ry="8" fill="#F5B92E" stroke="#D9A21B" stroke-width="2"/><path d="M-42 -36Q-42 -78 0 -78Q42 -78 42 -36Z" fill="#FFC93C" stroke="#D9A21B" stroke-width="2"/><path d="M0 -78V-40" stroke="#D9A21B" stroke-width="5"/>`
  };
  const npc = kind => NPC_ART[kind] ? NPC_ART[kind]() : '';
  const npcSVG = (kind, size = 90) => `<svg viewBox="-80 -95 160 165" width="${size}" height="${size * 165 / 160}" aria-hidden="true">${npc(kind)}</svg>`;

  /* ---------- 작물 ---------- */
  const CROP_ART = {
    rice: '<path d="M24 44Q25 21 37 8M24 44Q15 29 7 26M25 42Q32 31 42 30" fill="none" stroke="#5d9561" stroke-width="2.5" stroke-linecap="round"/><path d="M21 41Q8 38 7 26q12 2 14 15m7-4q7-9 15-7-3 8-15 7" fill="#83ad62"/><g fill="#d3ae54"><ellipse cx="36" cy="10" rx="4" ry="6" transform="rotate(35 36 10)"/><ellipse cx="32" cy="18" rx="4" ry="6" transform="rotate(35 32 18)"/><ellipse cx="28" cy="26" rx="4" ry="6" transform="rotate(35 28 26)"/><ellipse cx="42" cy="15" rx="3" ry="5" transform="rotate(35 42 15)"/><ellipse cx="38" cy="24" rx="3" ry="5" transform="rotate(35 38 24)"/></g>',
    soy: '<path d="M10 43Q24 27 37 6" fill="none" stroke="#5b8d51" stroke-width="2.5"/><path d="M24 24Q1 18 7 8q19 0 17 16m7-9Q30-1 43 4q2 13-12 11" fill="#8aaf60"/><path d="M19 25q15-14 21-4 7 12-13 20-14 4-8-16" fill="#6e9d4d" stroke="#4d843d" stroke-width="1.5"/><g fill="#b9d17c"><circle cx="25" cy="30" r="4"/><circle cx="33" cy="24" r="4"/><circle cx="31" cy="36" r="3.5"/></g>',
    sweet: '<path d="M22 24q1-13 15-20M25 16Q11 4 6 13q1 12 19 3m6-7Q35-1 44 3q0 12-13 6" fill="#81a760" stroke="#688b4a" stroke-width="1.5"/><path d="M6 32q2-15 17-10 18 4 23 16-11 12-25 6Q10 41 6 32" fill="#ab6c87"/><path d="M8 29q3-7 12-5 13 4 21 13-17 3-33-8" fill="#c1849b"/><path d="m15 29 3 2m10 4 3 2m3 3 3 1" stroke="#dfb3b1" stroke-width="2" stroke-linecap="round"/>',
    sorghum: '<path d="M24 46V17M24 39Q8 28 4 29m20 4q11-11 22-10" fill="none" stroke="#739858" stroke-width="2.5"/><path d="M24 40Q9 37 4 29q15-3 20 11m0-6q10-12 22-11-4 10-22 11" fill="#94af67"/><g fill="#b98660"><circle cx="25" cy="7" r="4"/><circle cx="19" cy="12" r="4"/><circle cx="30" cy="13" r="4"/><circle cx="15" cy="18" r="4"/><circle cx="23" cy="18" r="4"/><circle cx="33" cy="19" r="4"/><circle cx="18" cy="24" r="4"/><circle cx="27" cy="25" r="5"/></g>',
    lettuce: '<path d="M24 44C8 46 2 36 7 29-2 19 10 12 15 15 11 4 24 2 29 9 35 3 43 9 40 17 52 22 44 31 41 32 47 40 35 45 24 44Z" fill="#8eb66d" stroke="#6e9a51" stroke-width="1.5"/><path d="M25 42C13 37 11 25 18 23 16 11 28 13 30 21 41 18 42 30 34 34 36 40 29 44 25 42" fill="#bad18d"/><path d="M25 44V22m0 12-10-6m10 10 12-9M25 28l-5-8" fill="none" stroke="#749d54" stroke-width="1.6" stroke-linecap="round"/>'
  };
  const cropArt = id => CROP_ART[id] || '';

  /* ---------- 밭 한 칸 (w x h = 120 x 110) ---------- */
  function plot(p, opts = {}) {
    const paddy = opts.paddy;
    const out = [];
    const soil = paddy ? '#8DB9C9' : '#B88B5E';
    if (p.drain) out.push('<path d="M4 98 Q60 70 116 98 L116 106 H4Z" fill="#9C7149"/><path d="M0 104 H120" stroke="#7FB2D0" stroke-width="3" stroke-dasharray="6 4"/>');
    out.push(`<rect x="6" y="${p.drain ? 70 : 74}" width="108" height="${p.drain ? 30 : 30}" rx="10" fill="${soil}" stroke="${paddy ? '#5E93A8' : '#94693F'}" stroke-width="2"/>`);
    if (paddy) out.push('<path d="M14 84h20M44 90h22M78 82h24" stroke="#CDEAF5" stroke-width="2" stroke-linecap="round"/>');
    if (p.mulch) out.push('<g stroke="#E8C96A" stroke-width="2" stroke-linecap="round">' + [12, 24, 36, 48, 60, 72, 84, 96].map((x, i) => `<path d="M${x} ${80 + (i % 2) * 6}l10 ${i % 2 ? -4 : 4}"/>`).join('') + '</g>');
    if (p.moisture > 0 && !paddy) out.push(`<g fill="#5AAFE3">${[0, 1].slice(0, p.moisture).map(i => `<path d="M${100 - i * 12} 62 q-5 7 0 10 q5 -3 0 -10Z"/>`).join('')}</g>`);
    if (p.crop) {
      const c = CROPS[p.crop];
      if (p.dead) out.push('<g transform="translate(36 34)"><path d="M24 44 Q22 30 14 26 M24 44 Q28 32 36 30" fill="none" stroke="#9A7B55" stroke-width="3" stroke-linecap="round"/><ellipse cx="12" cy="26" rx="8" ry="4" fill="#B79A6E" transform="rotate(30 12 26)"/><ellipse cx="38" cy="30" rx="8" ry="4" fill="#B79A6E" transform="rotate(-30 38 30)"/></g>');
      else if (p.stage >= c.days) out.push(`<g transform="translate(30 24) scale(1.2)">${cropArt(p.crop)}</g>`);
      else if (p.stage >= 2) out.push(`<g transform="translate(60 78)"><path d="M0 0V-26" stroke="#4FAE6E" stroke-width="3"/><ellipse cx="-11" cy="-20" rx="12" ry="6" transform="rotate(-25 -11 -20)" fill="#7BD08F" stroke="#4FAE6E"/><ellipse cx="11" cy="-22" rx="12" ry="6" transform="rotate(25 11 -22)" fill="#7BD08F" stroke="#4FAE6E"/><ellipse cx="-8" cy="-34" rx="9" ry="5" transform="rotate(-35 -8 -34)" fill="#8EDB9E" stroke="#4FAE6E"/><ellipse cx="8" cy="-36" rx="9" ry="5" transform="rotate(35 8 -36)" fill="#8EDB9E" stroke="#4FAE6E"/></g>`);
      else if (p.stage >= 1) out.push('<g transform="translate(60 80)"><path d="M0 0V-14" stroke="#4FAE6E" stroke-width="3"/><ellipse cx="-8" cy="-14" rx="8" ry="4.5" transform="rotate(-25 -8 -14)" fill="#8EDB9E" stroke="#4FAE6E"/><ellipse cx="8" cy="-15" rx="8" ry="4.5" transform="rotate(25 8 -15)" fill="#8EDB9E" stroke="#4FAE6E"/></g>');
      else out.push('<g fill="#6B4A2E"><circle cx="48" cy="84" r="2.5"/><circle cx="60" cy="82" r="2.5"/><circle cx="72" cy="85" r="2.5"/></g>');
      if (p.stress > 0 && !p.dead) out.push(`<g fill="#7CC4F0"><path d="M18 40 q-5 7 0 10 q5 -3 0 -10Z"/></g><text x="22" y="34" font-size="14" fill="#C2410C" font-weight="900">!</text>`);
    }
    if (p.greenhouse) out.push('<path d="M4 102 V58 Q60 6 116 58 V102" fill="#DFF3FB" fill-opacity=".45" stroke="#8FC6DE" stroke-width="2.5"/><path d="M60 14 V102 M30 30 V102 M90 30 V102" stroke="#BFE2F0" stroke-width="1.5"/>');
    if (p.shade) out.push('<path d="M14 100 V36 M106 100 V36" stroke="#8B6B3E" stroke-width="3"/><path d="M8 34 H112 L104 44 H16Z" fill="#2F6B4F" fill-opacity=".75"/><path d="M14 34 L22 44 M30 34 L38 44 M46 34 L54 44 M62 34 L70 44 M78 34 L86 44 M94 34 L102 44" stroke="#5E9C7F" stroke-width="1.5"/>');
    return out.join('');
  }
  const plotSVG = (p, opts) => `<svg viewBox="0 0 120 110" aria-hidden="true">${plot(p, opts)}</svg>`;

  /* ---------- 날씨 아이콘 (viewBox 0 0 48 48) ---------- */
  const WEATHER_ART = {
    sunny: '<circle cx="24" cy="24" r="10" fill="#FFC94D"/><g stroke="#FFC94D" stroke-width="3" stroke-linecap="round"><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4 4M33.5 33.5l4 4M10.5 37.5l4-4M33.5 14.5l4-4"/></g>',
    cloudy: '<circle cx="34" cy="16" r="7" fill="#FFC94D"/><g fill="#E5ECF2" stroke="#AFC0CF" stroke-width="1.5"><path d="M12 36 Q4 36 6 28 Q8 21 16 23 Q18 14 28 16 Q38 17 38 27 Q44 28 43 34 Q42 37 37 36Z"/></g>',
    heat: '<circle cx="22" cy="22" r="11" fill="#FF8A3D"/><g stroke="#FF8A3D" stroke-width="3" stroke-linecap="round"><path d="M22 3v5M22 36v5M3 22h5M36 22h5M8.5 8.5l3.5 3.5M32 32l3.5 3.5M8.5 35.5l3.5-3.5M32 12l3.5-3.5"/></g><rect x="34" y="20" width="8" height="20" rx="4" fill="#fff" stroke="#E2563B" stroke-width="2"/><circle cx="38" cy="40" r="5" fill="#E2563B"/><rect x="36.5" y="26" width="3" height="12" fill="#E2563B"/>',
    rain: '<path d="M12 28 Q4 28 6 20 Q8 13 16 15 Q18 6 28 8 Q38 9 38 19 Q44 20 43 26 Q42 29 37 28Z" fill="#D7E3EE" stroke="#9FB4C6" stroke-width="1.5"/><g stroke="#4FA3DD" stroke-width="2.5" stroke-linecap="round"><path d="M16 33l-2 6M26 33l-2 6M36 33l-2 6"/></g>',
    storm: '<path d="M12 26 Q4 26 6 18 Q8 11 16 13 Q18 4 28 6 Q38 7 38 17 Q44 18 43 24 Q42 27 37 26Z" fill="#8E9FB2" stroke="#61758B" stroke-width="1.5"/><g stroke="#2F7FC1" stroke-width="3" stroke-linecap="round"><path d="M12 30l-3 8M20 30l-3 8M28 30l-3 8M36 30l-3 8M16 40l-2 5M24 40l-2 5M32 40l-2 5"/></g>'
  };
  const weatherIcon = (type, size = 40) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${WEATHER_ART[type] || WEATHER_ART.sunny}</svg>`;

  /* ---------- 아이템 아이콘 (viewBox 0 0 48 48) ---------- */
  const RAW_ART = {
    straw: '<g stroke="#D9B74A" stroke-width="3" stroke-linecap="round"><path d="M10 40 L30 8M16 42 L34 10M22 42 L38 12M8 34 L26 6"/></g><path d="M8 26 Q24 32 40 24" stroke="#B48A2E" stroke-width="4" fill="none"/>',
    cotton: '<path d="M24 44V30" stroke="#6E9A51" stroke-width="3"/><g fill="#fff" stroke="#C9D3DC" stroke-width="1.5"><circle cx="16" cy="22" r="9"/><circle cx="32" cy="22" r="9"/><circle cx="24" cy="14" r="10"/><circle cx="24" cy="26" r="8"/></g><path d="M14 30 Q24 36 34 30" stroke="#8A6A50" stroke-width="2.5" fill="none"/>',
    ramie: '<g stroke="#5D9561" stroke-width="3" stroke-linecap="round"><path d="M16 44V8M26 44V6M36 44V10"/></g><g fill="#8EC07A"><ellipse cx="10" cy="18" rx="7" ry="4" transform="rotate(-30 10 18)"/><ellipse cx="32" cy="14" rx="7" ry="4" transform="rotate(30 32 14)"/><ellipse cx="20" cy="28" rx="7" ry="4" transform="rotate(-30 20 28)"/><ellipse cx="42" cy="24" rx="6" ry="3.5" transform="rotate(30 42 24)"/></g>',
    wool: '<g fill="#F5F1E8" stroke="#CFC6B4" stroke-width="1.5"><circle cx="16" cy="26" r="10"/><circle cx="32" cy="26" r="10"/><circle cx="24" cy="18" r="10"/><circle cx="24" cy="32" r="9"/></g><path d="M18 24q3-3 6 0t6 0" stroke="#CFC6B4" stroke-width="1.5" fill="none"/>',
    pet: '<rect x="17" y="4" width="14" height="6" rx="2" fill="#5FA7D6"/><path d="M15 10 H33 Q38 14 38 22 V40 Q38 44 34 44 H14 Q10 44 10 40 V22 Q10 14 15 10Z" fill="#DCF0FB" stroke="#7DB8DC" stroke-width="2"/><rect x="10" y="24" width="28" height="9" fill="#9FD4F0"/>',
    net: '<path d="M6 10 Q24 2 42 10 L36 42 Q24 46 12 42Z" fill="#E6F4F1" stroke="#4E9C8F" stroke-width="2"/><g stroke="#4E9C8F" stroke-width="1.2"><path d="M9 18 L40 18M10 26 L38 26M11 34 L37 34M16 6 L18 44M24 4 V46M32 6 L30 44"/></g>',
    wood: '<rect x="6" y="16" width="34" height="18" rx="9" fill="#B07A4A" stroke="#7E5230" stroke-width="2"/><ellipse cx="38" cy="25" rx="7" ry="9" fill="#E3B884" stroke="#7E5230" stroke-width="2"/><ellipse cx="38" cy="25" rx="3" ry="4" fill="none" stroke="#B07A4A" stroke-width="1.5"/>',
    sapling: '<path d="M24 44V22" stroke="#7E5230" stroke-width="3"/><ellipse cx="16" cy="20" rx="9" ry="5" transform="rotate(-30 16 20)" fill="#7BD08F" stroke="#4FAE6E"/><ellipse cx="32" cy="18" rx="9" ry="5" transform="rotate(30 32 18)" fill="#7BD08F" stroke="#4FAE6E"/><path d="M14 44 H34" stroke="#9C7149" stroke-width="4" stroke-linecap="round"/>',
    bamboo: '<g stroke="#4F8F4A" stroke-width="2"><rect x="10" y="4" width="8" height="40" rx="3" fill="#8FCB72"/><rect x="22" y="8" width="8" height="36" rx="3" fill="#7CBF62"/><rect x="34" y="4" width="8" height="40" rx="3" fill="#8FCB72"/><path d="M10 18h8M22 22h8M34 16h8M10 32h8M22 34h8M34 30h8"/></g>',
    earth: '<path d="M6 40 Q10 22 24 20 Q38 22 42 40Z" fill="#A9784A" stroke="#7E5230" stroke-width="2"/><g fill="#8A5E36"><circle cx="18" cy="32" r="2"/><circle cx="28" cy="28" r="2"/><circle cx="32" cy="36" r="2"/></g>',
    sand: '<path d="M6 40 Q12 24 24 22 Q36 24 42 40Z" fill="#EBD39A" stroke="#C9A85A" stroke-width="2"/><g fill="#C9A85A"><circle cx="16" cy="34" r="1.5"/><circle cx="24" cy="30" r="1.5"/><circle cx="30" cy="35" r="1.5"/><circle cx="21" cy="37" r="1.5"/></g>',
    stone: '<path d="M8 38 Q6 26 16 22 Q20 14 30 18 Q42 20 40 32 Q40 40 30 41 H14 Q8 41 8 38Z" fill="#B7B9BD" stroke="#868A90" stroke-width="2"/><path d="M18 26 Q24 24 28 28" stroke="#D4D6D9" stroke-width="2" fill="none"/>',
    metal: '<rect x="6" y="12" width="30" height="22" rx="2" fill="#C3CDD6" stroke="#8A97A4" stroke-width="2" transform="rotate(-8 21 23)"/><rect x="16" y="20" width="26" height="20" rx="2" fill="#AEB9C4" stroke="#7D8A97" stroke-width="2" transform="rotate(10 29 30)"/><circle cx="20" cy="18" r="1.8" fill="#7D8A97"/>'
  };
  const PART_ART = {
    raised_base: '<rect x="4" y="22" width="40" height="18" rx="3" fill="#A9A49A" stroke="#7F7B73" stroke-width="2"/><g fill="#C9C5BC"><circle cx="12" cy="30" r="4"/><circle cx="24" cy="31" r="4"/><circle cx="36" cy="30" r="4"/></g>',
    brick: '<rect x="4" y="10" width="40" height="30" rx="2" fill="#E2C29A" stroke="#B48E62" stroke-width="2"/><path d="M4 20h40M4 30h40M18 10v10M32 10v10M10 20v10M26 20v10M40 20v10M18 30v10M32 30v10" stroke="#B48E62" stroke-width="1.5"/>',
    timber: '<rect x="4" y="8" width="40" height="34" rx="2" fill="#C9925C" stroke="#94693F" stroke-width="2"/><path d="M14 8v34M24 8v34M34 8v34" stroke="#A97546" stroke-width="2"/>',
    metalwall: '<rect x="4" y="8" width="40" height="34" rx="2" fill="#C3CDD6" stroke="#8A97A4" stroke-width="2"/><path d="M12 8v34M20 8v34M28 8v34M36 8v34" stroke="#A3AFBB" stroke-width="2"/>',
    glass: '<rect x="8" y="8" width="32" height="32" rx="2" fill="#CFEAF7" stroke="#6E8AA3" stroke-width="3"/><path d="M24 8v32M8 24h32" stroke="#6E8AA3" stroke-width="2"/><path d="M12 14 l6 -4" stroke="#fff" stroke-width="2"/>',
    dglass: '<rect x="6" y="6" width="36" height="36" rx="2" fill="#CFEAF7" stroke="#6E8AA3" stroke-width="3"/><rect x="11" y="11" width="26" height="26" fill="none" stroke="#6E8AA3" stroke-width="2"/><path d="M24 11v26" stroke="#6E8AA3" stroke-width="2"/><path d="M14 16 l6 -4" stroke="#fff" stroke-width="2"/>',
    bamboo_shade: '<path d="M4 14 H44 L38 30 H10Z" fill="#D8C27A" stroke="#A88E3E" stroke-width="2"/><path d="M12 14 L14 30M20 14 L21 30M28 14 L27 30M36 14 L34 30" stroke="#A88E3E" stroke-width="1.5"/><path d="M10 30 V42M38 30 V42" stroke="#8B6B3E" stroke-width="2.5"/>',
    insulation: '<rect x="6" y="10" width="36" height="30" rx="4" fill="#F1D88A" stroke="#C9A84A" stroke-width="2"/><g stroke="#C9A84A" stroke-width="1.5"><path d="M10 16l8 6M16 14l10 8M24 16l10 8M30 14l8 6M10 28l8 6M18 26l10 8M28 28l8 6"/></g>',
    metalroof: '<path d="M4 34 L24 10 L44 34Z" fill="#EEF2F5" stroke="#A9B6C2" stroke-width="2"/><path d="M14 34 L24 16 M24 34 V10 M34 34 L24 16" stroke="#C7D0D8" stroke-width="1.5"/>',
    woodroof: '<path d="M4 34 L24 10 L44 34Z" fill="#A0663E" stroke="#7A4B2A" stroke-width="2"/><path d="M10 28 H38 M15 22 H33 M19 16 H29" stroke="#C48A5C" stroke-width="2"/>',
    greenroof: '<path d="M4 34 L24 12 L44 34Z" fill="#B9C4CC" stroke="#8A97A4" stroke-width="2"/><path d="M4 34 L24 12 L44 34" fill="none" stroke="#6DB36D" stroke-width="6" stroke-linejoin="round"/><g fill="#8CC97A"><circle cx="14" cy="22" r="4"/><circle cx="24" cy="12" r="4"/><circle cx="34" cy="22" r="4"/></g>',
    solar: '<path d="M6 34 L16 12 H44 L34 34Z" fill="#304D83" stroke="#1F3561" stroke-width="2"/><path d="M11 23 H39 M25 12 L20 34 M35 12 L30 34" stroke="#9FB4DA" stroke-width="1.5"/>',
    rain_barrel: '<rect x="12" y="12" width="24" height="30" rx="6" fill="#5FA7D6" stroke="#3F7FB0" stroke-width="2"/><path d="M12 22h24M12 32h24" stroke="#3F7FB0" stroke-width="2"/><path d="M30 4 V12" stroke="#8A97A4" stroke-width="3"/><path d="M26 18 q-3 5 0 7 q3 -2 0 -7Z" fill="#DCF0FB"/>',
    shade_tree: '<path d="M24 44V28" stroke="#7E5230" stroke-width="4"/><circle cx="24" cy="18" r="14" fill="#5FA36F" stroke="#3F7F52" stroke-width="2"/><circle cx="16" cy="22" r="8" fill="#76B884"/>',
    rain_garden: '<ellipse cx="24" cy="32" rx="20" ry="9" fill="#9FD6E8" stroke="#5EA9C4" stroke-width="2"/><g fill="#6FB66F"><path d="M10 30 q2 -10 4 0Z"/><path d="M34 30 q2 -10 4 0Z"/><path d="M22 26 q2 -10 4 0Z"/></g><g fill="#A9A49A"><circle cx="8" cy="36" r="3"/><circle cx="40" cy="36" r="3"/></g>',
    greenhouse_kit: '<path d="M4 42 V24 Q24 0 44 24 V42Z" fill="#DFF3FB" stroke="#5FA7C7" stroke-width="2"/><path d="M24 4 V42 M14 12 V42 M34 12 V42" stroke="#9CCDE2" stroke-width="1.5"/>'
  };
  function fabricArt(fiber, weave) {
    const col = { cotton: '#FBF7EF', ramie: '#EEF2DD', wool: '#F5EBDD', lyocell: '#E9F1F4', rpet: '#E3EDF8', rnylon: '#DDEAF2' }[fiber] || '#fff';
    const pat = weave === 'dense' ? '<path d="M8 14h32M8 20h32M8 26h32M8 32h32M8 38h32" stroke="#C5CDD4" stroke-width="1"/>'
      : weave === 'mesh' ? '<g stroke="#AFC0CF" stroke-width="1"><path d="M8 12l30 30M8 24l18 18M18 10l22 22M30 10l10 10M8 36l6 6M8 42l34-34M8 30l24-24M8 18l12-12M20 42l20-20M32 42l8-8"/></g>'
        : '<path d="M8 18h32M8 28h32M8 38h32M16 8v34M28 8v34" stroke="#D4DAE0" stroke-width="1"/>';
    return `<path d="M8 8 H40 V40 L34 36 L28 40 L22 36 L16 40 L8 38Z" fill="${col}" stroke="#A9B4BF" stroke-width="2"/>${pat}`;
  }
  function dishTop(recipeId, size = 48) {
    const r = RECIPES.find(x => x.id === recipeId);
    if (!r) return '';
    const bowl = r.cat === '밥' || r.cat === '국';
    if (bowl) {
      const inner = r.cat === '국'
        ? `<circle cx="24" cy="24" r="12" fill="${r.color}"/><circle cx="20" cy="21" r="2.5" fill="#E9DFC3"/><circle cx="28" cy="27" r="2" fill="#E9DFC3"/>`
        : `<circle cx="24" cy="24" r="12" fill="${r.color}"/>${r.id === 'soy_rice' ? '<g fill="#8A6A3C"><circle cx="20" cy="22" r="2"/><circle cx="27" cy="25" r="2"/><circle cx="24" cy="29" r="2"/></g>' : r.id === 'sorghum_rice' ? '<g fill="#A25D55"><circle cx="20" cy="22" r="1.6"/><circle cx="27" cy="25" r="1.6"/><circle cx="24" cy="29" r="1.6"/><circle cx="29" cy="20" r="1.6"/></g>' : '<path d="M18 22q6-4 12 0" stroke="#EDEDED" stroke-width="2" fill="none"/>'}`;
      return `<circle cx="24" cy="24" r="18" fill="#F7F4EE" stroke="#C9BFAE" stroke-width="2"/><circle cx="24" cy="24" r="14" fill="#E9E3D6"/>${inner}`;
    }
    const food = r.cat === '반찬'
      ? `<g fill="${r.color}" stroke="#5E9A44" stroke-width="1"><ellipse cx="18" cy="22" rx="8" ry="5"/><ellipse cx="29" cy="24" rx="8" ry="5"/><ellipse cx="23" cy="29" rx="8" ry="5"/></g>`
      : `<g fill="${r.color}" stroke="#8D5163" stroke-width="1"><ellipse cx="18" cy="24" rx="8" ry="6"/><ellipse cx="30" cy="24" rx="8" ry="6"/></g>`;
    return `<ellipse cx="24" cy="25" rx="20" ry="17" fill="#FFFFFF" stroke="#C9BFAE" stroke-width="2"/><ellipse cx="24" cy="25" rx="14" ry="11" fill="#F3EFE6"/>${food}`;
  }
  function itemIcon(id, size = 44) {
    let body = '';
    if (id.startsWith('seed_')) {
      const crop = id.slice(5);
      body = `<rect x="8" y="6" width="32" height="38" rx="4" fill="#FFF6DA" stroke="#C9A85A" stroke-width="2"/><rect x="8" y="6" width="32" height="8" rx="3" fill="#E9C46A"/><g transform="translate(13 16) scale(.45)">${cropArt(crop)}</g>`;
    } else if (CROP_ART[id]) body = cropArt(id);
    else if (RAW_ART[id]) body = RAW_ART[id];
    else if (PART_ART[id]) body = PART_ART[id];
    else if (id.startsWith('fab_')) { const [, fiber, weave] = id.split('_'); body = fabricArt(fiber, weave); }
    else if (id.startsWith('dish_')) body = dishTop(id.slice(5));
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
  }

  /* ---------- 식탁 (위에서 본 모습, 360 x 220) ---------- */
  function table(dishes) {
    const spots = [[90, 80], [270, 80], [90, 160], [270, 160]];
    const out = ['<rect x="20" y="30" width="320" height="180" rx="22" fill="#E7C49A" stroke="#B88B5E" stroke-width="3"/><path d="M40 60 H320 M40 120 H320 M40 180 H320" stroke="#D9B385" stroke-width="2"/>'];
    out.push('<rect x="60" y="40" width="240" height="160" rx="14" fill="#F6F0E2" stroke="#D8CBB0" stroke-width="2"/>');
    spots.forEach(([x, y], i) => {
      const id = dishes[i];
      if (id) out.push(`<g transform="translate(${x - 40} ${y - 40}) scale(1.65)">${dishTop(id)}</g>`);
      else out.push(`<circle cx="${x}" cy="${y}" r="28" fill="none" stroke="#CDBE9E" stroke-width="2" stroke-dasharray="5 5"/>`);
    });
    out.push('<g stroke="#A9A49A" stroke-width="3" stroke-linecap="round"><path d="M172 70 V170"/><path d="M188 70 V170"/></g>');
    return out.join('');
  }
  const tableSVG = dishes => `<svg viewBox="0 0 360 220" role="img" aria-label="식탁">${table(dishes)}</svg>`;

  /* ---------- 집 (옆에서 본 모습, 360 x 300) ---------- */
  function house(h) {
    h = h || {};
    const out = [];
    const floors = h.floors || 1;
    out.push('<rect x="0" y="268" width="360" height="32" fill="#CDE8B5"/><path d="M0 268 H360" stroke="#A9D18E" stroke-width="2"/>');
    const raised = h.base === 'raised_base';
    const baseTop = raised ? 236 : 256;
    out.push(raised
      ? '<rect x="72" y="236" width="216" height="34" rx="3" fill="#A9A49A" stroke="#7F7B73" stroke-width="2"/><g fill="#C9C5BC">' + [86, 112, 138, 164, 190, 216, 242, 268].map(x => `<ellipse cx="${x}" cy="253" rx="10" ry="8"/>`).join('') + '</g>'
      : '<rect x="72" y="256" width="216" height="14" rx="2" fill="#B9A894" stroke="#968670" stroke-width="2"/>');
    const wallFill = { brick: '#E2C29A', timber: '#C9925C', metalwall: '#C3CDD6' };
    const wallLine = { brick: '#B48E62', timber: '#A97546', metalwall: '#A3AFBB' };
    const FH = 80, X0 = 80, W = 200;
    for (let i = 0; i < floors; i++) {
      const y1 = baseTop - FH * (i + 1);
      const w = (h.walls || [])[i];
      if (w) {
        out.push(`<rect x="${X0}" y="${y1}" width="${W}" height="${FH}" fill="${wallFill[w]}" stroke="${wallLine[w]}" stroke-width="2"/>`);
        // 흙벽돌: 줄마다 엇갈린 줄눈
        if (w === 'brick') for (let r = 0; r < 6; r++) {
          const ry = y1 + r * 13.3;
          if (r) out.push(`<path d="M${X0} ${ry}H${X0 + W}" stroke="${wallLine[w]}" stroke-width="1.5" opacity=".7"/>`);
          for (let c = (r % 2 ? 14 : 28); c < W; c += 28) out.push(`<path d="M${X0 + c} ${ry}v13.3" stroke="${wallLine[w]}" stroke-width="1.5" opacity=".7"/>`);
        }
        if (w === 'timber') for (let c = 1; c < 10; c++) out.push(`<path d="M${X0 + c * 20} ${y1}V${y1 + FH}" stroke="${wallLine[w]}" stroke-width="1.5" opacity=".6"/>`);
        if (w === 'metalwall') for (let c = 1; c < 14; c++) out.push(`<path d="M${X0 + c * 14} ${y1}V${y1 + FH}" stroke="${wallLine[w]}" stroke-width="2" opacity=".7"/>`);
      } else out.push(`<rect x="${X0}" y="${y1}" width="${W}" height="${FH}" fill="#FFFFFF" fill-opacity=".5" stroke="#9AA5B1" stroke-width="2" stroke-dasharray="7 6"/><text x="${X0 + W / 2}" y="${y1 + 46}" text-anchor="middle" font-size="14" fill="#7A8794" font-weight="700">${i + 1}층 벽</text>`);
      const wins = (h.windows || [])[i] || [], awn = (h.awnings || [])[i] || [];
      [[100, 0], [210, 1]].forEach(([wx, k]) => {
        if (i === 0 && k === 1 && false) return;
        const wy = y1 + 18;
        const wid = wins[k];
        if (wid) {
          out.push(`<rect x="${wx}" y="${wy}" width="50" height="40" rx="2" fill="#CFEAF7" stroke="#6E8AA3" stroke-width="3"/><path d="M${wx + 25} ${wy}v40M${wx} ${wy + 20}h50" stroke="#6E8AA3" stroke-width="2"/>`);
          if (wid === 'dglass') out.push(`<rect x="${wx + 5}" y="${wy + 5}" width="40" height="30" fill="none" stroke="#6E8AA3" stroke-width="1.5"/>`);
          out.push(`<path d="M${wx + 6} ${wy + 8} l8 -5" stroke="#fff" stroke-width="2"/>`);
        } else if (w) out.push(`<rect x="${wx}" y="${wy}" width="50" height="40" rx="2" fill="none" stroke="#8A97A4" stroke-width="2" stroke-dasharray="5 4"/>`);
        if (awn[k]) out.push(`<path d="M${wx - 8} ${wy - 4} H${wx + 58} L${wx + 52} ${wy + 10} H${wx - 2}Z" fill="#D8C27A" stroke="#A88E3E" stroke-width="2"/><path d="M${wx + 6} ${wy - 4}l1 14M${wx + 18} ${wy - 4}l0 14M${wx + 30} ${wy - 4}l0 14M${wx + 42} ${wy - 4}l-1 14" stroke="#A88E3E" stroke-width="1.5"/>`);
      });
      if (i === 0 && w) out.push(`<rect x="164" y="${baseTop - 52}" width="32" height="52" rx="4" fill="#8B6B4E" stroke="#6E523C" stroke-width="2"/><circle cx="189" cy="${baseTop - 26}" r="2.5" fill="#E8C96A"/>`);
      if (i === 0 && h.insulation && w) out.push(`<path d="M${X0} ${baseTop} L${X0} ${baseTop - 30} L${X0 + 30} ${baseTop}Z" fill="#F1D88A" stroke="#C9A84A" stroke-width="1.5"/><path d="M${X0 + 4} ${baseTop - 6}l8 -6M${X0 + 4} ${baseTop - 16}l6 -5M${X0 + 12} ${baseTop - 3}l8 -6" stroke="#C9A84A" stroke-width="1.2"/>`);
    }
    const top = baseTop - FH * floors;
    if (h.roof) {
      const fill = h.roof === 'metalroof' ? '#EEF2F5' : '#A0663E', line = h.roof === 'metalroof' ? '#A9B6C2' : '#7A4B2A';
      out.push(`<path d="M64 ${top} L180 ${top - 62} L296 ${top}Z" fill="${fill}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>`);
      if (h.roof === 'metalroof') for (let k = 1; k < 8; k++) out.push(`<path d="M${64 + k * 29} ${top} L180 ${top - 62}" stroke="#C7D0D8" stroke-width="1.2" opacity=".8"/>`);
      else for (let k = 1; k < 4; k++) out.push(`<path d="M${64 + k * 29} ${top - k * 15.5}H${296 - k * 29}" stroke="#C48A5C" stroke-width="2"/>`);
      if (h.roofTop === 'greenroof') out.push(`<path d="M64 ${top} L180 ${top - 62} L296 ${top}" fill="none" stroke="#6DB36D" stroke-width="10" stroke-linejoin="round"/><g fill="#8CC97A">${[96, 130, 160, 200, 232, 262].map((x, i) => { const y = x < 180 ? top - (x - 64) * 62 / 116 : top - (296 - x) * 62 / 116; return `<circle cx="${x}" cy="${y - 8}" r="${5 + (i % 2) * 2}"/>`; }).join('')}</g>`);
      if (h.roofTop === 'solar') out.push(`<path d="M196 ${top - 50} L268 ${top - 12} L250 ${top - 4} L182 ${top - 40}Z" fill="#304D83" stroke="#1F3561" stroke-width="2"/><path d="M220 ${top - 37} L203 ${top - 27} M243 ${top - 25} L226 ${top - 15}" stroke="#9FB4DA" stroke-width="1.5"/>`);
    } else out.push(`<path d="M64 ${top} L180 ${top - 62} L296 ${top}Z" fill="none" stroke="#9AA5B1" stroke-width="2" stroke-dasharray="7 6"/><text x="180" y="${top - 18}" text-anchor="middle" font-size="14" fill="#7A8794" font-weight="700">지붕</text>`);
    const yardPos = [30, 330, 120];
    (h.yard || []).forEach((id, i) => {
      if (!id) return;
      const x = yardPos[i];
      if (id === 'shade_tree') out.push(`<path d="M${x} 270V214" stroke="#7E5230" stroke-width="7"/><circle cx="${x}" cy="200" r="30" fill="#5FA36F" stroke="#3F7F52" stroke-width="2"/><circle cx="${x - 12}" cy="208" r="16" fill="#76B884"/>`);
      if (id === 'rain_barrel') out.push(`<rect x="${x - 14}" y="232" width="28" height="38" rx="7" fill="#5FA7D6" stroke="#3F7FB0" stroke-width="2"/><path d="M${x - 14} 245h28M${x - 14} 258h28" stroke="#3F7FB0" stroke-width="2"/><path d="M${x} 232 V${top + 4}" stroke="#8A97A4" stroke-width="4" opacity="${x > 200 ? 1 : 0}"/>`);
      if (id === 'rain_garden') out.push(`<ellipse cx="${x}" cy="276" rx="34" ry="9" fill="#9FD6E8" stroke="#5EA9C4" stroke-width="2"/><g fill="#6FB66F"><path d="M${x - 24} 274 q3 -16 6 0Z"/><path d="M${x + 18} 274 q3 -16 6 0Z"/><path d="M${x - 3} 270 q3 -16 6 0Z"/></g>`);
    });
    return out.join('');
  }
  const houseSVG = (h, label = '집') => `<svg viewBox="0 0 360 300" role="img" aria-label="${label}">${house(h)}</svg>`;

  /* ---------- 마을 건물 (바닥 가운데가 0,0) ---------- */
  const sign = (text, w, y, fill = '#FFFFFF', color = '#35506B') => `<rect x="${-w / 2}" y="${y}" width="${w}" height="26" rx="7" fill="${fill}" stroke="#C9D3DC" stroke-width="1.5"/><text x="0" y="${y + 18}" text-anchor="middle" font-size="15" font-weight="800" fill="${color}">${text}</text>`;
  const BUILDINGS = {
    lab: () => `<rect x="-92" y="-112" width="184" height="112" rx="12" fill="#F3F8FC" stroke="#9BB8CF" stroke-width="2.5"/><path d="M-44 -112 A44 44 0 0 1 44 -112Z" fill="#CFE3F2" stroke="#9BB8CF" stroke-width="2.5"/><path d="M-4 -150 L10 -118" stroke="#6E8AA3" stroke-width="5" stroke-linecap="round"/>
      <path d="M70 -112 V-158" stroke="#6E8AA3" stroke-width="3"/><path d="M70 -158 L88 -150 L70 -146Z" fill="#E86A5C"/><g class="spin" style="transform-origin:70px -134px"><path d="M58 -134 H82" stroke="#6E8AA3" stroke-width="2"/><circle cx="58" cy="-134" r="4" fill="#9BB8CF"/><circle cx="82" cy="-134" r="4" fill="#9BB8CF"/></g>
      <rect x="-20" y="-54" width="40" height="54" rx="7" fill="#7FA6C9" stroke="#5E87AB" stroke-width="2"/><rect x="-74" y="-60" width="38" height="30" rx="5" fill="#CFEAF7" stroke="#6E8AA3" stroke-width="2"/><rect x="36" y="-60" width="38" height="30" rx="5" fill="#CFEAF7" stroke="#6E8AA3" stroke-width="2"/>${sign('기후 연구소', 120, -100)}`,
    kitchen: () => `<rect x="-82" y="-96" width="164" height="96" rx="6" fill="#FFF4E0" stroke="#D9B98A" stroke-width="2.5"/><path d="M-98 -94 L0 -150 L98 -94Z" fill="#E8806A" stroke="#C8604B" stroke-width="2.5" stroke-linejoin="round"/><rect x="40" y="-146" width="18" height="30" fill="#C8604B"/>
      <g class="steam" fill="#fff" opacity=".8"><circle cx="49" cy="-156" r="6"/><circle cx="56" cy="-168" r="5"/><circle cx="50" cy="-180" r="4"/></g>
      <path d="M-46 -64 H46 L38 -48 H-38Z" fill="#E86A5C"/><path d="M-30 -64 L-26 -48 M-14 -64 L-12 -48 M2 -64 L2 -48 M18 -64 L16 -48 M34 -64 L30 -48" stroke="#fff" stroke-width="5"/><rect x="-18" y="-46" width="36" height="46" rx="6" fill="#B9845A" stroke="#94693F" stroke-width="2"/><rect x="-70" y="-50" width="34" height="28" rx="4" fill="#CFEAF7" stroke="#B9845A" stroke-width="2"/><rect x="36" y="-50" width="34" height="28" rx="4" fill="#CFEAF7" stroke="#B9845A" stroke-width="2"/>${sign('공동 부엌', 108, -92)}`,
    tailor: () => `<rect x="-82" y="-96" width="164" height="96" rx="6" fill="#F4EEFC" stroke="#B7A6DE" stroke-width="2.5"/><path d="M-98 -94 L0 -148 L98 -94Z" fill="#9C84D6" stroke="#7B63B8" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="-18" y="-46" width="36" height="46" rx="6" fill="#8E7AC4" stroke="#6E5AA6" stroke-width="2"/><rect x="-72" y="-58" width="40" height="36" rx="4" fill="#CFEAF7" stroke="#8E7AC4" stroke-width="2"/><path d="M-60 -50 h16 l4 6 -4 2 v10 h-16 v-10 l-4 -2Z" fill="#FFD0DC"/>
      <rect x="32" y="-58" width="40" height="36" rx="4" fill="#CFEAF7" stroke="#8E7AC4" stroke-width="2"/><path d="M42 -52 h20 v6 l-4 2 v10 h-12 v-10 l-4 -2Z" fill="#D3EAF8"/>
      <g transform="translate(0 -124)"><ellipse cx="0" cy="0" rx="12" ry="8" fill="#F2C94C" stroke="#B8902A" stroke-width="2"/><path d="M-12 0 V8 A12 8 0 0 0 12 8 V0" fill="#F2C94C" stroke="#B8902A" stroke-width="2"/></g>${sign('재봉 공방', 108, -92)}`,
    workshop: () => `<rect x="-90" y="-104" width="180" height="104" rx="4" fill="#F2DFC4" stroke="#B88B5E" stroke-width="2.5"/><path d="M-104 -102 L0 -152 L104 -102Z" fill="#8B5E3C" stroke="#6E4628" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="-30" y="-64" width="60" height="64" rx="4" fill="#C98F5E" stroke="#94693F" stroke-width="2"/><path d="M-30 -64 L30 0 M30 -64 L-30 0" stroke="#94693F" stroke-width="3"/>
      <g fill="#C98F5E" stroke="#7E5230" stroke-width="2"><circle cx="-110" cy="-14" r="12"/><circle cx="-88" cy="-14" r="12"/><circle cx="-99" cy="-34" r="12"/></g><g fill="#E3B884"><circle cx="-110" cy="-14" r="5"/><circle cx="-88" cy="-14" r="5"/><circle cx="-99" cy="-34" r="5"/></g>${sign('목공소', 96, -98)}`,
    board: () => `<ellipse cx="0" cy="6" rx="110" ry="34" fill="#EFE3C4" stroke="#D9C79A" stroke-width="2"/><path d="M-56 0 V-70 M56 0 V-70" stroke="#8B5E3C" stroke-width="7" stroke-linecap="round"/><rect x="-72" y="-108" width="144" height="62" rx="8" fill="#C79A6B" stroke="#94693F" stroke-width="2.5"/>
      <rect x="-62" y="-100" width="34" height="26" fill="#fff" transform="rotate(-5 -45 -87)"/><rect x="-20" y="-102" width="34" height="28" fill="#FFF6DA" transform="rotate(4 -3 -88)"/><rect x="24" y="-100" width="34" height="26" fill="#E7F4FF" transform="rotate(-3 41 -87)"/>
      <circle cx="-45" cy="-98" r="3" fill="#E86A5C"/><circle cx="-3" cy="-100" r="3" fill="#5FA7D6"/><circle cx="41" cy="-98" r="3" fill="#6BBF8E"/>${sign('학급 광장', 100, -138, '#FFF8E8', '#8B5E3C')}`,
    lot: () => `<rect x="-112" y="-120" width="224" height="150" rx="10" fill="#D8EBC3" stroke="#B9D69E" stroke-width="2" stroke-dasharray="8 6"/>`,
    shop: () => `<rect x="-80" y="-92" width="160" height="92" rx="6" fill="#FFF8E8" stroke="#D9B98A" stroke-width="2.5"/>
      <path d="M-92 -96 H92 L84 -66 H-84Z" fill="#FFFFFF" stroke="#D9B98A" stroke-width="2"/>${[-92, -55, -18, 19, 56].map(x => `<path d="M${x} -96 H${x + 18.4} L${x + 16} -66 H${x + 2}Z" fill="#3FA796"/>`).join('')}
      <path d="M-84 -66 ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `q10.5 12 21 0`).join(' ')}" fill="#FFFFFF" stroke="#D9B98A" stroke-width="2"/>
      <rect x="-66" y="-40" width="132" height="22" rx="4" fill="#C98F5E" stroke="#94693F" stroke-width="2"/>
      <g><circle cx="-44" cy="-46" r="8" fill="#E86A5C"/><circle cx="-26" cy="-47" r="7" fill="#F2C94C"/><rect x="-6" y="-56" width="16" height="16" rx="3" fill="#8FCB72"/><circle cx="28" cy="-47" r="8" fill="#B5677F"/><rect x="40" y="-58" width="14" height="18" rx="3" fill="#D3EAF8" stroke="#8DBFDF"/></g>
      <rect x="-16" y="-18" width="32" height="18" fill="#B9845A"/>${sign('여울 상점', 108, -128, '#FFF8E8', '#2E7D6B')}`
  };
  const building = id => BUILDINGS[id] ? BUILDINGS[id]() : '';

  /* ---------- 재료 모으는 곳 (1판 그림 · 지금은 지도에 그리지 않아요) ---------- */
  const SPOTS = {
    forest: () => `${[[-30, 10, 34], [12, -8, 38], [-6, 30, 30]].map(([x, y, r]) => `<path d="M${x} ${y + 30}V${y + 6}" stroke="#7E5230" stroke-width="7"/><circle cx="${x}" cy="${y - 8}" r="${r}" fill="#4F9A63" stroke="#3B7A4C" stroke-width="2"/><circle cx="${x - 10}" cy="${y - 2}" r="${r * .5}" fill="#67B079"/>`).join('')}<rect x="10" y="40" width="34" height="14" rx="7" fill="#B07A4A" stroke="#7E5230" stroke-width="2"/>`,
    recycle: () => `<rect x="-40" y="-36" width="34" height="44" rx="5" fill="#5FA7D6" stroke="#3F7FB0" stroke-width="2"/><rect x="2" y="-36" width="34" height="44" rx="5" fill="#9AA5B1" stroke="#6E7883" stroke-width="2"/><rect x="-44" y="-42" width="42" height="9" rx="3" fill="#3F7FB0"/><rect x="-2" y="-42" width="42" height="9" rx="3" fill="#6E7883"/><path d="M-30 -14 l7 -9 7 9 M-16 -6 h-14" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M12 -20 h16 M12 -12 h16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    straw: () => `<path d="M-46 14 Q-44 -34 0 -38 Q44 -34 46 14Z" fill="#EBC660" stroke="#C9A43E" stroke-width="2.5"/><path d="M-30 -10 l10 -14 M-12 -20 l6 -14 M8 -22 l-2 -14 M26 -14 l-8 -14 M-36 6 l12 -10 M30 4 l-10 -10" stroke="#C9A43E" stroke-width="2"/>`,
    cotton: () => [[-30, 0], [0, -12], [28, 2]].map(([x, y]) => `<path d="M${x} ${y + 26}V${y}" stroke="#6E9A51" stroke-width="4"/><ellipse cx="${x}" cy="${y - 4}" rx="20" ry="16" fill="#8EC07A" stroke="#5E9A4A" stroke-width="2"/><g fill="#fff" stroke="#C9D3DC"><circle cx="${x - 7}" cy="${y - 8}" r="6"/><circle cx="${x + 7}" cy="${y - 4}" r="6"/><circle cx="${x}" cy="${y - 14}" r="5"/></g>`).join(''),
    ramie: () => `<g stroke="#4F8F4A" stroke-width="4" stroke-linecap="round">${[-30, -15, 0, 15, 30].map((x, i) => `<path d="M${x} 24 V${-30 - (i % 2) * 10}"/>`).join('')}</g><g fill="#8EC07A" stroke="#5E9A4A">${[-30, -15, 0, 15, 30].map((x, i) => `<ellipse cx="${x + 8}" cy="${-14 - (i % 2) * 8}" rx="10" ry="5" transform="rotate(-25 ${x + 8} ${-14 - (i % 2) * 8})"/>`).join('')}</g>`,
    sheep: () => `<rect x="-50" y="-52" width="70" height="56" rx="4" fill="#E9D3B4" stroke="#B88B5E" stroke-width="2"/><path d="M-60 -50 L-15 -84 L30 -50Z" fill="#C25B4E" stroke="#9A4337" stroke-width="2"/><rect x="-28" y="-30" width="26" height="34" rx="3" fill="#B88B5E"/>
      <g transform="translate(46 -8)"><g fill="#fff" stroke="#CFC6B4" stroke-width="1.5"><circle cx="-10" cy="0" r="10"/><circle cx="6" cy="-2" r="11"/><circle cx="-2" cy="-10" r="9"/></g><ellipse cx="18" cy="-4" rx="8" ry="7" fill="#4A4038"/><circle cx="20" cy="-6" r="1.5" fill="#fff"/><path d="M-10 9 v8 M4 9 v8" stroke="#4A4038" stroke-width="3"/></g>`,
    pond: () => `<path d="M-30 -10 Q-10 -26 10 -14 L4 10 Q-14 18 -26 8Z" fill="#E6F4F1" stroke="#4E9C8F" stroke-width="2" opacity=".9"/><g stroke="#4E9C8F" stroke-width="1"><path d="M-26 -6 L6 -4 M-24 2 L4 4 M-18 -16 L-14 12 M-6 -18 L-6 14"/></g>`,
    bamboo: () => `<g stroke="#4F8F4A" stroke-width="2">${[-36, -20, -4, 12, 28].map((x, i) => `<rect x="${x}" y="${-70 + (i % 2) * 12}" width="10" height="${92 - (i % 2) * 12}" rx="4" fill="${i % 2 ? '#7CBF62' : '#8FCB72'}"/><path d="M${x} ${-40 + (i % 2) * 6}h10M${x} ${-10}h10"/>`).join('')}</g><g fill="#8FCB72">${[-30, -8, 18].map(x => `<ellipse cx="${x}" cy="-72" rx="12" ry="5" transform="rotate(-20 ${x} -72)"/>`).join('')}</g>`,
    hill: () => `<path d="M-70 20 Q-40 -46 10 -40 Q60 -34 74 20Z" fill="#B88B5E" stroke="#94693F" stroke-width="2.5"/><path d="M-30 20 Q-10 -6 20 -2 Q44 2 50 20Z" fill="#EBD39A" stroke="#C9A85A" stroke-width="2"/><g fill="#B7B9BD" stroke="#868A90" stroke-width="1.5"><ellipse cx="-44" cy="10" rx="10" ry="7"/><ellipse cx="-24" cy="-12" rx="8" ry="6"/><ellipse cx="36" cy="-16" rx="9" ry="6"/></g>`
  };
  const spot = id => SPOTS[id] ? SPOTS[id]() : '';

  /* 공통 무늬 (문서에 한 번만 넣어요) */
  const sharedDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <pattern id="meshPat" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0L5 5M5 0L0 5" stroke="#8FA7BB" stroke-width=".8"/></pattern>
    <clipPath id="beeClip"><ellipse cx="130" cy="382" rx="36" ry="32"/></clipPath>
    <pattern id="rainPat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M8 0 L2 16 M28 14 L22 30 M18 26 L14 38" stroke="#6FA8D6" stroke-width="2.5" stroke-linecap="round" opacity=".55"/></pattern>
  </defs></svg>`;

  return { avatar, avatarSVG, sprout, pet, petSVG, npc, npcSVG, cropArt, plot, plotSVG, weatherIcon, itemIcon, dishTop, table, tableSVG, house, houseSVG, building, spot, sharedDefs, bodyColor, clothColor, face };
})();
