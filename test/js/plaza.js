/* ==========================================================================
   QUEST 05 · 광장 게시판(섬 코드) · 학급 광장(친구 아바타 구경)
   - 서버 없이 '섬 코드'를 주고받아요. 코드는 이 기기에만 저장돼요.
   ========================================================================== */
const Plaza = (() => {
  const PLAZA_KEY = 'yeoul-plaza-v1';
  const Z = 'YS1z', J = 'YS1j'; // 압축 코드 / 압축 못 할 때 쓰는 코드
  const MAX_CODE = 30000, MAX_TEXT = 300000, MAX_RESIDENTS = 40;
  const $ = id => document.getElementById(id);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const arr = v => (Array.isArray(v) ? v : []);
  const int = (v, a, b, d = a) => (Number.isFinite(+v) ? Math.round(G.clamp(+v, a, b)) : d);
  const pick = (v, table, d) => (typeof v === 'string' && own(table, v) ? v : d);
  const pp = (word, pair) => G.josa(word, pair).slice(String(word).length);

  /* ---------- 섬 코드 만들기 · 읽기 ---------- */
  function toB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function readLimited(stream) {
    const reader = stream.getReader(), parts = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_TEXT) { reader.cancel(); throw new Error('코드가 너무 커요'); }
      parts.push(value);
    }
    const all = new Uint8Array(total);
    let o = 0; parts.forEach(p => { all.set(p, o); o += p.length; });
    return new TextDecoder().decode(all);
  }
  async function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === 'function') {
      try {
        const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        return Z + toB64(new Uint8Array(await new Response(st).arrayBuffer()));
      } catch (e) { /* 압축을 못 하면 그대로 */ }
    }
    return J + toB64(bytes);
  }
  async function decode(code) {
    if (code.length > MAX_CODE) throw new Error('코드가 너무 길어요');
    let text;
    if (code.startsWith(Z)) {
      if (typeof DecompressionStream !== 'function') throw new Error('이 브라우저에서는 압축된 코드를 열 수 없어요');
      text = await readLimited(new Blob([fromB64(code.slice(4))]).stream().pipeThrough(new DecompressionStream('deflate-raw')));
    } else if (code.startsWith(J)) {
      text = new TextDecoder().decode(fromB64(code.slice(4)));
    } else throw new Error('여울섬 코드가 아니에요');
    const raw = JSON.parse(text);
    if (!isObj(raw) || raw.k !== 'yeoul') throw new Error('여울섬 코드가 아니에요');
    return raw;
  }
  const findCodes = text => (String(text).match(/YS1[zj][A-Za-z0-9_-]{20,}/g) || []);

  // 코드에 넣는 내 섬 (퀴즈 기록은 빼요)
  function snapshot() {
    const { quizzes, ...rest } = G.S;
    return { ...rest, k: 'yeoul', at: Date.now() };
  }

  /* ---------- 받은 자료 다듬기 (모르는 값은 버려요) ---------- */
  const cleanText = (v, n, d) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n) || d;
  const validFabric = id => { const m = /^fab_([a-z]+)_([a-z]+)$/.exec(id); return !!m && own(FIBERS, m[1]) && own(WEAVES, m[2]); };
  const validDish = id => /^dish_/.test(id) && RECIPES.some(r => 'dish_' + r.id === id);
  const validItem = id => typeof id === 'string' && (own(ITEMS, id) || own(PARTS, id) || validFabric(id) || validDish(id));
  function cleanBag(o) {
    const out = {};
    if (isObj(o)) Object.keys(o).slice(0, 200).forEach(k => { if (validItem(k)) { const n = int(o[k], 0, 999, 0); if (n > 0) out[k] = n; } });
    return out;
  }
  function cleanOutfit(o) {
    if (!isObj(o)) return null;
    return {
      id: cleanText(String(o.id || '').replace(/[^a-z0-9]/gi, ''), 16, 'o' + Math.random().toString(36).slice(2, 8)),
      name: cleanText(o.name, 16, '옷'),
      top: pick(o.top, TOPS, 'tee'),
      color: CLOTH_COLORS.some(c => c.id === o.color) ? o.color : 'white',
      fabric: typeof o.fabric === 'string' && validFabric(o.fabric) ? o.fabric : null,
      details: [...new Set(arr(o.details).filter(d => typeof d === 'string' && own(DETAILS, d)))].slice(0, 4),
      hat: pick(o.hat, HATS, 'none'),
      shoes: pick(o.shoes, SHOES, 'sneakers')
    };
  }
  function cleanHouse(h) {
    const e = G.emptyHouse();
    if (!isObj(h)) return e;
    const part = (v, slot) => (typeof v === 'string' && own(PARTS, v) && PARTS[v].slot === slot ? v : null);
    e.floors = h.floors === 2 ? 2 : 1;
    e.base = h.base === 'raised_base' ? 'raised_base' : 'basic';
    for (let f = 0; f < 2; f++) {
      e.walls[f] = part(arr(h.walls)[f], 'wall');
      for (let k = 0; k < 2; k++) {
        e.windows[f][k] = part(arr(arr(h.windows)[f])[k], 'window');
        e.awnings[f][k] = !!(e.windows[f][k] && arr(arr(h.awnings)[f])[k]);
      }
    }
    e.insulation = !!h.insulation;
    e.roof = part(h.roof, 'roof');
    e.roofTop = part(h.roofTop, 'roofTop');
    for (let i = 0; i < 3; i++) e.yard[i] = part(arr(h.yard)[i], 'yard');
    return e;
  }
  // 5분 미션의 시대별 기록(예측 문제·여름 5일 점검)
  function cleanEras(o) {
    const out = {}, part = v => (['의', '식', '주'].includes(v) ? v : null);
    if (!isObj(o)) return out;
    ['1', '2', '3'].forEach(k => {
      const e = o[k];
      if (!isObj(e)) return;
      out[k] = {
        fc: isObj(e.fc) ? { answer: int(e.fc.answer, 0, 3, 0), correct: !!e.fc.correct } : null,
        started: !!e.started, done: !!e.done, next: !!e.next,
        days: arr(e.days).slice(0, SUMMER_LIVE_DAYS).filter(isObj).map(d => ({ w: pick(d.w, WEATHER, 'sunny'), c: arr(d.c).slice(0, 3).map(x => [part(arr(x)[0]) || '식', arr(x)[1] ? 1 : 0]) }))
      };
    });
    return out;
  }
  // ⚡ 3분 스피드 미션의 끝난 판 기록(진행 중인 판은 저장하지 않아요)
  function cleanSpeed(o) {
    if (!isObj(o) || o.done !== true) return null;
    const ids = new Set([...MEASURES.map(m => m.id), ...BAD_CARDS.map(b => b.id)]);
    const pair = v => [int(arr(v)[0], 0, 20, 0), int(arr(v)[1], 0, 20, 0)];
    const eras = {};
    ['1', '2', '3'].forEach(k => {
      const e = isObj(o.eras) ? o.eras[k] : null;
      if (!isObj(e)) return;
      eras[k] = {
        lv: int(e.lv, 0, LEVELS.length - 1, 0), fc: e.fc ? 1 : 0, heat: pair(e.heat), rain: pair(e.rain),
        right: int(e.right, 0, 20, 0), total: int(e.total, 0, 20, 0),
        days: arr(e.days).slice(0, SUMMER_LIVE_DAYS).map(d => [pick(arr(d)[0], WEATHER, 'sunny'), int(arr(d)[1], -1, 1, -1)])
      };
    });
    return {
      done: true, timeUp: !!o.timeUp, score: int(o.score, 0, 9999, 0), bonus: int(o.bonus, 0, TIME_LIMIT, 0), best: int(o.best, 0, 40, 0),
      right: int(o.right, 0, 40, 0), total: int(o.total, 0, 40, 0), base: int(o.base, 0, 9999, 0), max: int(o.max, 0, 9999, 0),
      left: int(o.left, 0, TIME_LIMIT, 0), eras, wrong: arr(o.wrong).filter(x => typeof x === 'string' && ids.has(x)).slice(0, 40)
    };
  }
  const cleanOwned = o => { const out = {}; if (isObj(o)) MEASURES.forEach(m => { if (o[m.id] === true) out[m.id] = true; }); return out; };
  const cleanTable = t => Array.from({ length: TABLE_SLOTS }, (_, i) => { const v = arr(t)[i]; return typeof v === 'string' && RECIPES.some(r => r.id === v) ? v : null; });
  // 섬 코드 → 게임 상태 전체 (다른 기기에서 이어 하기)
  function cleanState(raw) {
    const s = G.newState({
      name: cleanText(raw.name, 8, '여울이'),
      color: BODY_COLORS.some(c => c.id === raw.color) ? raw.color : BODY_COLORS[0].id,
      pet: pick(raw.pet, PETS, 'bee')
    });
    s.region = pick(raw.region, CLIMATE, s.region);
    s.scenario = pick(raw.scenario, SCENARIOS, s.scenario);
    s.chapter = int(raw.chapter, 1, 3, 1);
    s.day = int(raw.day, 1, 99999, 1);
    s.chapterStartDay = int(raw.chapterStartDay, 1, s.day, 1);
    s.seed = int(raw.seed, 0, 1e9, s.seed);
    s.quest = int(raw.quest, 0, QUESTS.length - 1, 0);
    s.step = int(raw.step, 0, QUESTS[s.quest].steps.length - 1, 0);
    const fresh = raw.k === 'yeoul' && raw.v !== 3; // 예전 판의 섬 코드: 같은 캐릭터로 5분 미션을 처음부터
    if (fresh) { s.chapter = 1; s.quest = 0; s.step = 0; }
    const v3 = raw.v === 3;
    s.coins = v3 ? int(raw.coins, 0, 99999, ERA_COINS[1]) : ERA_COINS[1];
    s.owned = v3 ? cleanOwned(raw.owned) : {};
    s.eras = v3 ? cleanEras(raw.eras) : {};
    s.speed = v3 ? cleanSpeed(raw.speed) : null;
    s.seenRules = v3 && !!raw.seenRules;
    s.timeLeft = v3 ? int(raw.timeLeft, 0, TIME_LIMIT, TIME_LIMIT) : TIME_LIMIT;
    s.started = v3 && !!raw.started;
    s.finished = v3 && !!raw.finished;
    s.timeUp = v3 && !!raw.timeUp;
    s.timeBonus = v3 ? int(raw.timeBonus, 0, Math.ceil(TIME_LIMIT / 6), 0) : 0;
    s.inv = cleanBag(raw.inv);
    s.fridge = cleanBag(raw.fridge);
    Object.keys(s.fridge).forEach(k => { if (!validDish(k)) delete s.fridge[k]; });
    s.plots = s.plots.map((d, i) => {
      const p = arr(raw.plots)[i];
      if (!isObj(p)) return d;
      const crop = pick(p.crop, CROPS, null);
      if (crop === 'rice' && i !== 5) return d;
      if (crop && crop !== 'rice' && i === 5) return d;
      return {
        crop, stage: crop ? int(p.stage, 0, CROPS[crop].days, 0) : 0,
        moisture: int(p.moisture, 0, 2, 0), stress: int(p.stress, 0, 3, 0), stressTotal: int(p.stressTotal, 0, 99, 0),
        shade: !!p.shade, greenhouse: !!p.greenhouse, mulch: !!p.mulch, drain: !!p.drain, dead: !!(crop && p.dead)
      };
    });
    if (isObj(raw.gathered)) Object.keys(GATHER).concat('grandmaSeeds').forEach(k => { if (raw.gathered[k] != null) s.gathered[k] = int(raw.gathered[k], 0, 99999, 0); });
    s.table = cleanTable(raw.table);
    s.outfits = arr(raw.outfits).slice(0, 12).map(cleanOutfit).filter(Boolean);
    s.equipped = s.outfits.some(o => o.id === raw.equipped) ? raw.equipped : null;
    s.house = cleanHouse(raw.house);
    if (isObj(raw.stats)) Object.keys(s.stats).forEach(k => { s.stats[k] = int(raw.stats[k], 0, 99999, 0); });
    if (isObj(raw.pos)) s.pos = { x: int(raw.pos.x, 30, 1250, 700), y: int(raw.pos.y, 96, 790, 390) };
    s.created = int(raw.created, 0, 9e15, Date.now());
    return s;
  }
  // 게임 상태 → 광장 주민 (보여 줄 것만)
  function resident(s, me = false) {
    return {
      id: me ? 'me' : `${(s.created || 0).toString(36)}-${(s.seed || 0).toString(36)}`,
      me, name: s.name, color: s.color, pet: s.pet, region: s.region, scenario: s.scenario,
      chapter: s.chapter, dayIn: s.day - s.chapterStartDay + 1,
      outfit: s.outfits.find(o => o.id === s.equipped) || null,
      outfits: s.outfits.map(o => ({ ...o })), table: [...s.table], house: JSON.parse(JSON.stringify(s.house)),
      harvests: s.stats.harvests || 0, cooked: s.stats.cooked || 0, quest: s.quest
    };
  }
  function cleanResident(r) {
    if (!isObj(r)) return null;
    const s = cleanState({ ...r, equipped: r.outfit && r.outfit.id, outfits: [...arr(r.outfits)], day: (int(r.dayIn, 1, 99999, 1)), chapterStartDay: 1, stats: { harvests: r.harvests, cooked: r.cooked } });
    if (r.outfit && !s.equipped) { const o = cleanOutfit(r.outfit); if (o) { s.outfits.unshift(o); s.outfits = s.outfits.slice(0, 12); s.equipped = o.id; } }
    const out = resident(s);
    out.id = cleanText(String(r.id || '').replace(/[^a-z0-9-]/gi, ''), 30, out.id);
    return out;
  }

  /* ---------- 광장 주민 저장 ---------- */
  let residents = [];
  function loadResidents() {
    try {
      const v = JSON.parse(localStorage.getItem(PLAZA_KEY) || '[]');
      residents = arr(v).map(cleanResident).filter(Boolean).slice(0, MAX_RESIDENTS);
    } catch (e) { residents = []; }
  }
  function saveResidents() {
    try { localStorage.setItem(PLAZA_KEY, JSON.stringify(residents)); } catch (e) { /* 저장 불가: 이번만 보여요 */ }
  }
  async function addCodes(text) {
    const codes = [...new Set(findCodes(text))];
    if (!codes.length) return { added: 0, failed: 0, none: true };
    let added = 0, failed = 0;
    for (const c of codes) {
      try {
        const r = resident(cleanState(await decode(c)));
        if (G.S && r.id === `${(G.S.created || 0).toString(36)}-${(G.S.seed || 0).toString(36)}`) continue; // 내 섬은 이미 광장에 있어요
        const i = residents.findIndex(x => x.id === r.id);
        if (i >= 0) residents[i] = r; else residents.push(r);
        added++;
      } catch (e) { failed++; }
    }
    residents = residents.slice(-MAX_RESIDENTS);
    saveResidents();
    return { added, failed };
  }

  /* ---------- 복사 · 파일 ---------- */
  async function copyText(text, area) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      if (area) { area.select(); try { return document.execCommand('copy'); } catch (e2) { return false; } }
      return false;
    }
  }
  function downloadText(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const readFiles = files => Promise.all([...files].slice(0, 60).map(f => (f.size > 200000 ? Promise.resolve('') : f.text().catch(() => '')))).then(t => t.join('\n'));

  /* ---------- 광장 게시판 패널 ---------- */
  let lastCode = null, making = false;
  async function makeCode() {
    if (making) return;
    making = true;
    try {
      lastCode = await encode(snapshot());
      G.S.stats.codeMade = 1;
    } catch (e) { G.toast('코드를 만들지 못했어요. 다시 해 봐요.'); }
    making = false;
    G.changed();
  }
  function renderBoard(el, arg) {
    const S = G.S;
    if (arg === 'code' && !lastCode && !making) makeCode();
    el.innerHTML = `<div class="board">
      <div class="board-head">${Art.avatarSVG({ color: S.color, outfit: G.equippedOutfit() }, 84)}${Art.petSVG(S.pet, 52)}
        <p>내 섬 코드를 만들어 친구들과 나눠요. 친구들의 코드를 학급 광장에 모으면 모두의 아바타가 한곳에 모여요. 옷, 식탁, 집도 구경할 수 있어요.</p></div>
      ${lastCode ? `<label class="code-label" for="codeOut">내 섬 코드 <small>${lastCode.length.toLocaleString('ko-KR')}글자</small></label>
        <textarea id="codeOut" class="code-box" readonly>${G.esc(lastCode)}</textarea>
        <div class="row"><button type="button" class="btn primary" id="codeCopy">복사하기</button><button type="button" class="btn" id="codeSave">파일로 저장(.txt)</button><button type="button" class="btn" id="codeAgain">새로 만들기</button></div>
        <p class="hint">이 코드에는 별명, 옷, 식탁, 집, 밭, 가방 기록이 들어 있어요. 실명이나 연락처는 들어 있지 않아요. 다른 기기의 처음 화면에서 「섬 코드로 이어하기」를 하면 이어서 할 수 있어요.</p>`
      : `<button type="button" class="btn primary big" id="codeMake" ${making ? 'disabled' : ''}>${making ? '만드는 중…' : '🏝️ 내 섬 코드 만들기'}</button>`}
      <div class="board-go"><button type="button" class="btn big" id="goPlaza">🎪 학급 광장으로 가기</button>
      <p class="hint">선생님이 학급 게시판(클래스룸, 패들렛 등)에 코드를 모아 주면, 광장에서 한꺼번에 붙여 넣을 수 있어요.</p></div>
    </div>`;
    if ($('codeMake')) $('codeMake').onclick = makeCode;
    if ($('codeAgain')) $('codeAgain').onclick = () => { lastCode = null; makeCode(); };
    if ($('codeCopy')) $('codeCopy').onclick = async () => { G.toast(await copyText(lastCode, $('codeOut')) ? '복사했어요! 학급 게시판에 붙여 넣어요.' : '복사가 안 돼요. 코드를 길게 눌러 직접 복사해요.', 'good'); };
    if ($('codeSave')) $('codeSave').onclick = () => {
      const d = new Date(), stamp = `${d.getMonth() + 1}월${d.getDate()}일`;
      downloadText(`여울섬_${S.name}_섬코드_${stamp}.txt`, `여울섬 기후 생활 RPG · 섬 코드\n별명: ${S.name}\n만든 날: ${d.toLocaleString('ko-KR')}\n\n${lastCode}\n`);
    };
    $('goPlaza').onclick = () => { G.closePanel(); Main.showPlaza(); };
  }
  G.registerPanel('board', { title: '광장 게시판', icon: () => '<span class="emoji-ico">📮</span>', render: renderBoard, onClose() { lastCode = null; } });

  /* ---------- 학급 광장 화면 ---------- */
  const W = 1000, H = 620, FOUNT = { x: 500, y: 420, r: 96 };
  let walkers = [], raf = null, lastT = 0, bubbleT = 0, openRid = null;
  // 나 → 실시간 반 광장 친구(live.js) → 섬 코드로 초대한 친구(실시간 광장에 같은 섬이 있으면 빼요)
  const liveOn = () => typeof Live !== 'undefined' && Live.on();
  function all() {
    const live = liveOn() ? Live.list() : [], seen = new Set(live.map(r => r.island));
    return (G.S ? [resident(G.S, true)] : []).concat(live, residents.filter(r => !seen.has(r.id)));
  }
  const findR = id => all().find(r => r.id === id);
  const dotFill = r => (r.live.online ? '#3FA796' : '#B8C4CF');

  function stage() {
    const o = [];
    o.push(`<rect width="${W}" height="${H}" fill="#BFE6A8"/><rect width="${W}" height="190" fill="#CFEFFF"/>`);
    o.push('<g fill="#fff" opacity=".9" class="cloud"><ellipse cx="160" cy="70" rx="70" ry="22"/><ellipse cx="200" cy="56" rx="44" ry="20"/><ellipse cx="760" cy="96" rx="80" ry="22"/><ellipse cx="800" cy="82" rx="50" ry="20"/></g>');
    o.push('<g>' + Array.from({ length: 14 }, (_, i) => `<circle cx="${i * 78 + 10}" cy="${186 + (i % 2) * 8}" r="${40 + (i % 3) * 6}" fill="${i % 2 ? '#7CC48A' : '#6DB37C'}"/>`).join('') + '</g>');
    o.push(`<rect y="200" width="${W}" height="${H - 200}" fill="#BFE6A8"/>`);
    // 둥근 광장 바닥
    o.push(`<ellipse cx="500" cy="420" rx="460" ry="190" fill="#F6E7BF" stroke="#E2CE96" stroke-width="4"/>`);
    o.push('<g stroke="#EAD7A2" stroke-width="3" fill="none">' + [130, 230, 330].map(r => `<ellipse cx="500" cy="420" rx="${r * 1.3}" ry="${r * .54}"/>`).join('') + '</g>');
    // 깃발 줄
    o.push('<path d="M40 228 Q 500 300 960 228" stroke="#B88B5E" stroke-width="3" fill="none"/>');
    o.push('<g>' + Array.from({ length: 15 }, (_, i) => { const t = (i + .5) / 15, x = 40 + t * 920, y = 228 + 4 * 72 * t * (1 - t); const c = ['#FF9EB5', '#FFD66B', '#8FD3F4', '#A8E6A3', '#C9B6FF'][i % 5]; return `<path d="M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 22}Z" fill="${c}"/>`; }).join('') + '</g>');
    // 게시판 · 나무 · 꽃밭
    o.push('<g transform="translate(500 236)"><rect x="-6" y="0" width="12" height="40" fill="#8B5E3C"/><rect x="-92" y="-44" width="184" height="54" rx="12" fill="#FFF8E8" stroke="#B88B5E" stroke-width="4"/><text y="-9" text-anchor="middle" font-size="26" font-weight="900" fill="#8B5E3C">우리 반 광장</text></g>');
    [[70, 300], [930, 300], [60, 560], [940, 560]].forEach(([x, y]) => o.push(`<g transform="translate(${x} ${y})"><rect x="-7" y="-6" width="14" height="40" rx="4" fill="#9B6B43"/><circle cy="-30" r="38" fill="#5FA36F"/><circle cx="-18" cy="-44" r="22" fill="#7CC48A"/><circle cx="20" cy="-20" r="18" fill="#6DB37C"/></g>`));
    o.push('<g>' + Array.from({ length: 26 }, (_, i) => { const x = (i * 173) % 960 + 20, y = 560 + (i * 37) % 50; return `<circle cx="${x}" cy="${y}" r="4" fill="${['#FFF4B5', '#FFD0DC', '#FFFFFF', '#D9C9FF'][i % 4]}"/>`; }).join('') + '</g>');
    // 분수
    o.push(`<g transform="translate(${FOUNT.x} ${FOUNT.y})"><ellipse rx="96" ry="40" fill="#C9D3DC"/><ellipse rx="84" ry="32" fill="#9ED8F0"/><ellipse cy="-4" rx="70" ry="24" fill="#B7E5F6" class="shimmer"/><rect x="-10" y="-60" width="20" height="56" rx="6" fill="#C9D3DC"/><ellipse cy="-60" rx="34" ry="12" fill="#C9D3DC"/><g class="fountain" fill="#D8F2FB"><circle cy="-80" r="8"/><circle cx="-16" cy="-70" r="6"/><circle cx="16" cy="-70" r="6"/></g></g>`);
    return o.join('');
  }
  function randomSpot() {
    for (let k = 0; k < 20; k++) {
      const t = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random());
      const x = 500 + Math.cos(t) * 420 * rr, y = 452 + Math.sin(t) * 140 * rr;
      if (Math.hypot((x - FOUNT.x) / 1.3, y - FOUNT.y) > FOUNT.r + 30) return { x, y };
    }
    return { x: 200, y: 480 };
  }
  function makeWalkers() {
    const list = all();
    const old = new Map(walkers.map(w => [w.id, w]));
    walkers = list.map(r => {
      const w = old.get(r.id) || { ...randomSpot(), wait: Math.random() * 2, face: 1 };
      return { ...w, id: r.id, r, t: randomSpot(), speed: 50 + Math.random() * 30 };
    });
    const g = $('plazaActors');
    g.innerHTML = walkers.map(w => {
      const r = w.r;
      return `<g class="resident tap${r.me ? ' me' : ''}" data-rid="${G.esc(r.id)}" role="button" tabindex="0" aria-label="${G.esc(r.name)}의 섬 보기">
        <g class="pl-pet"><g transform="scale(.44)"><g class="bob">${Art.pet(r.pet)}</g></g></g>
        <g class="pl-body"><g transform="scale(.6)"><g class="walkbob">${Art.avatar({ color: r.color, outfit: r.outfit })}</g></g></g>
        <g class="pl-tag"><rect x="-60" y="52" width="120" height="30" rx="15" fill="${r.me ? '#FFE27A' : '#FFFFFF'}" stroke="${r.me ? '#E0B83A' : '#C9D3DC'}" stroke-width="2"/><text y="73" text-anchor="middle" font-size="19" font-weight="800" fill="#33475B">${G.esc(r.me ? r.name + ' (나)' : r.name)}</text>${r.live ? `<circle class="pl-dot" cx="-60" cy="67" r="8" fill="${dotFill(r)}" stroke="#FFFFFF" stroke-width="3"/>` : ''}</g>
        <g class="pl-bubble" hidden><rect x="-110" y="-136" width="220" height="46" rx="16" fill="#FFFFFF" stroke="#C9D3DC" stroke-width="2"/><path d="M-9 -91 L0 -78 L9 -91Z" fill="#FFFFFF" stroke="#C9D3DC" stroke-width="2"/><text y="-106" text-anchor="middle" font-size="19" font-weight="700" fill="#33475B"></text></g>
      </g>`;
    }).join('');
    [...g.children].forEach((node, i) => { walkers[i].node = node; });
    placeWalkers(false);
  }
  function placeWalkers(moving) {
    walkers.forEach(w => {
      if (!w.node) return;
      w.node.setAttribute('transform', `translate(${w.x.toFixed(1)} ${w.y.toFixed(1)})`);
      w.node.querySelector('.pl-pet').setAttribute('transform', `translate(${-62 * w.face} 14)`);
      w.node.querySelector('.pl-body').classList.toggle('moving', !!(moving && w.moving));
    });
    const g = $('plazaActors');
    [...walkers].sort((a, b) => a.y - b.y).forEach((w, i) => { if (g.children[i] !== w.node) g.appendChild(w.node); });
  }
  function bubbleLine(r) {
    const lines = [`${CHAPTERS[r.chapter].title}에서 왔어요!`, `${r.region} · ${SCENARIOS[r.scenario].name}를 탐험 중이에요.`];
    if (r.outfit) { const sc = Tailor.scores(r.outfit); lines.push(`내 옷은 폭염 ★${sc.heat}, 비 ★${sc.rain}!`); }
    const dishes = r.table.filter(Boolean);
    if (dishes.length) { const d = RECIPES.find(x => x.id === dishes[0]); lines.push(`오늘 식탁엔 ${d.name}${pp(d.name, '이/가')} 있어요.`); }
    if (r.house.roofTop === 'greenroof') lines.push('우리 집 지붕엔 옥상 정원이 있어요.');
    if (r.house.roofTop === 'solar') lines.push('우리 집 지붕엔 태양광 패널이 있어요.');
    if (r.house.yard.includes('shade_tree')) lines.push('마당의 그늘 나무가 시원해요.');
    if (r.harvests) lines.push(`작물을 ${r.harvests}번 거뒀어요!`);
    return lines[Math.floor(Math.random() * lines.length)];
  }
  function showBubble() {
    if (!walkers.length) return;
    const w = walkers[Math.floor(Math.random() * walkers.length)];
    const b = w.node.querySelector('.pl-bubble');
    const text = bubbleLine(w.r);
    b.querySelector('text').textContent = text;
    const width = Math.min(380, Math.max(140, text.length * 19 + 34));
    // 광장 가장자리에서도 말풍선이 잘리지 않게 옆으로 밀어요
    const dx = G.clamp(0, 10 - (w.x - width / 2), 990 - (w.x + width / 2));
    b.querySelector('rect').setAttribute('x', -width / 2 + dx);
    b.querySelector('text').setAttribute('x', dx);
    b.querySelector('rect').setAttribute('width', width);
    b.removeAttribute('hidden'); // SVG 요소라 .hidden 대신 속성으로
    clearTimeout(w.bt);
    w.bt = setTimeout(() => { b.setAttribute('hidden', ''); }, 3200);
  }
  function tick(t) {
    raf = null;
    if ($('screen-plaza').hidden) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
    lastT = t;
    if (!$('plazaCard').hidden) { raf = requestAnimationFrame(tick); return; }
    walkers.forEach(w => {
      w.moving = false;
      if (w.wait > 0) { w.wait -= dt; return; }
      const dx = w.t.x - w.x, dy = w.t.y - w.y, d = Math.hypot(dx, dy);
      if (d < 3) { w.t = randomSpot(); w.wait = 1 + Math.random() * 3; return; }
      w.moving = true;
      const step = Math.min(d, w.speed * dt);
      w.x += dx / d * step; w.y += dy / d * step;
      if (Math.abs(dx) > 1) w.face = dx > 0 ? 1 : -1;
      // 분수는 돌아서 가요
      const fx = (w.x - FOUNT.x) / 1.3, fy = w.y - FOUNT.y, fd = Math.hypot(fx, fy);
      if (fd < FOUNT.r + 20) { const k = (FOUNT.r + 20) / (fd || 1); w.x = FOUNT.x + fx * k * 1.3; w.y = FOUNT.y + fy * k; }
    });
    placeWalkers(true);
    bubbleT -= dt;
    if (bubbleT <= 0) { bubbleT = 2.2 + Math.random() * 1.5; showBubble(); }
    raf = requestAnimationFrame(tick);
  }

  /* ---------- 친구 섬 카드 ---------- */
  function mealCheck(table) {
    const cats = table.filter(Boolean).map(id => RECIPES.find(r => r.id === id).cat);
    return ['밥', '국', '반찬'].map(k => `<span class="${cats.includes(k) ? 'ok' : ''}">${cats.includes(k) ? '✔' : '○'} ${k}</span>`).join('');
  }
  function outfitInfo(o) {
    return [TOPS[o.top].name, Art.clothColor(o.color).name, o.fabric ? G.itemName(o.fabric) : '기본 원단', ...o.details.map(d => DETAILS[d].name), o.hat !== 'none' ? HATS[o.hat].name : '', SHOES[o.shoes].name].filter(Boolean);
  }
  function compareLine(r) {
    if (r.me || !G.S) return '';
    const mine = resident(G.S, true), tips = [];
    const ms = mine.outfit ? Tailor.scores(mine.outfit) : null, rs = r.outfit ? Tailor.scores(r.outfit) : null;
    if (rs && (!ms || rs.heat > ms.heat)) tips.push(`${r.name}의 옷은 폭염 ★${rs.heat}로 내 옷${ms ? `(★${ms.heat})` : ''}보다 시원해요. 원단과 색을 살펴봐요.`);
    const mc = Build.checks(mine.house), rc = Build.checks(r.house);
    if (rc.heatOk > mc.heatOk) tips.push(`${r.name}의 집은 폭염 점검 ${rc.heatOk}개로 내 집(${mc.heatOk}개)보다 많아요.`);
    if (rc.rainOk > mc.rainOk) tips.push(`${r.name}의 집은 집중호우 점검 ${rc.rainOk}개로 내 집(${mc.rainOk}개)보다 많아요.`);
    if (r.scenario !== mine.scenario) tips.push(`${r.name}${pp(r.name, '은/는')} ${SCENARIOS[r.scenario].name}를 골랐어요. 같은 시기 폭염일수가 얼마나 다른지 연구소에서 비교해 봐요.`);
    return tips.length ? `<div class="compare"><b>💡 나와 비교해 보기</b><ul>${tips.map(t => `<li>${G.esc(t)}</li>`).join('')}</ul></div>` : '';
  }
  function openCard(id) {
    const r = findR(id);
    if (!r) return;
    openRid = id;
    const c = Build.checks(r.house), built = Build.isBuilt(r.house);
    const sc = r.outfit ? Tailor.scores(r.outfit) : null;
    $('plazaCardBody').innerHTML = `
      <div class="card-head">${Art.avatarSVG({ color: r.color, outfit: r.outfit }, 110)}${Art.petSVG(r.pet, 60)}
        <div><h3>${G.esc(r.name)}${r.me ? ' (나)' : ''}의 섬</h3><p>${PETS[r.pet].kind} ${PETS[r.pet].name}${pp(PETS[r.pet].name, '과/와')} 함께 · ${G.esc(r.region)} · ${SCENARIOS[r.scenario].name}(${SCENARIOS[r.scenario].code})</p><p><b>${CHAPTERS[r.chapter].title}</b> ${r.dayIn}일째 · 수확 ${r.harvests}번 · 요리 ${r.cooked}번</p>${r.live ? `<p class="live-tag"><i class="dot${r.live.online ? ' on' : ''}"></i>실시간 반 광장 · ${r.live.online ? '지금 접속 중' : '쉬는 중'}</p>` : ''}</div></div>
      <div class="card-grid">
        <section><h4>👕 지금 입은 옷</h4>${r.outfit ? `<p><b>${G.esc(r.outfit.name)}</b></p><p class="small">${outfitInfo(r.outfit).map(G.esc).join(' · ')}</p>${Tailor.bars(sc)}` : '<p class="empty small">아직 만든 옷을 입지 않았어요.</p>'}
          ${r.outfits.length > 1 ? `<h4>옷장 (${r.outfits.length}벌)</h4><div class="mini-closet">${r.outfits.map(o => `<figure>${Art.avatarSVG({ color: r.color, outfit: o }, 56)}<figcaption>${G.esc(o.name)}</figcaption></figure>`).join('')}</div>` : ''}</section>
        <section><h4>🍚 식탁</h4><div class="card-table">${Art.tableSVG(r.table)}</div><div class="meal-check">${mealCheck(r.table)}</div></section>
        <section class="wide"><h4>🏡 집 ${built ? '' : '<small>(짓는 중)</small>'}</h4><div class="card-house">${Art.houseSVG(r.house, `${G.esc(r.name)}의 집`)}</div>
          <div class="checks mini"><div><b>폭염 대비 ${c.heatOk}/${c.heat.length}</b><ul>${c.heat.map(([nm, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${nm}</li>`).join('')}</ul></div><div><b>집중호우 대비 ${c.rainOk}/${c.rain.length}</b><ul>${c.rain.map(([nm, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${nm}</li>`).join('')}</ul></div></div></section>
      </div>
      ${compareLine(r)}
      ${r.me ? '' : `<div class="row end"><button type="button" class="btn danger small" id="cardRemove">${r.live ? '내 화면에서 숨기기' : '광장에서 내보내기'}</button></div>`}`;
    $('plazaCard').hidden = false;
    $('plazaCardClose').focus();
    if ($('cardRemove')) $('cardRemove').onclick = () => {
      closeCard();
      if (r.live) { Live.hide(id); return; } // 실시간 친구는 이 기기 화면에서만 숨겨요
      residents = residents.filter(x => x.id !== id); saveResidents(); refresh();
    };
  }
  function closeCard() { $('plazaCard').hidden = true; openRid = null; }

  /* ---------- 우리 반 비교표 ---------- */
  function openCompare() {
    const list = all();
    if (!list.length) { G.toast('광장에 아직 아무도 없어요.'); return; }
    const star = v => (v == null ? '-' : `★${v}`);
    $('plazaCardBody').innerHTML = `<h3>우리 반 비교표</h3>
      <div class="table-scroll"><table class="clim compare-table"><thead><tr><th>별명</th><th>지역·미래</th><th>시대</th><th>옷 폭염</th><th>옷 비</th><th>식탁</th><th>집 폭염</th><th>집 호우</th><th>수확</th></tr></thead><tbody>
      ${list.map(r => { const sc = r.outfit ? Tailor.scores(r.outfit) : null, c = Build.checks(r.house), n = r.table.filter(Boolean).length; return `<tr class="${r.me ? 'cur' : ''}"><td><button type="button" class="link" data-open="${G.esc(r.id)}">${G.esc(r.name)}${r.me ? ' (나)' : ''}</button></td><td>${G.esc(r.region)}<small>${SCENARIOS[r.scenario].name}</small></td><td>${CHAPTERS[r.chapter].title}</td><td>${star(sc && sc.heat)}</td><td>${star(sc && sc.rain)}</td><td>${n}가지</td><td>${c.heatOk}/${c.heat.length}</td><td>${c.rainOk}/${c.rain.length}</td><td>${r.harvests}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="hint">점수는 학습용 비교 규칙이에요. 표를 보며 "누구의 선택이 왜 더 시원할까?"를 이야기해 봐요.</p>`;
    $('plazaCard').hidden = false;
    $('plazaCardBody').querySelectorAll('[data-open]').forEach(b => b.onclick = () => openCard(b.dataset.open));
    $('plazaCardClose').focus();
  }

  /* ---------- 화면 열기 · 새로 그리기 ---------- */
  function renderList() {
    const list = all();
    $('plazaCount').textContent = `${list.length}명이 모였어요`;
    $('plazaList').innerHTML = list.length ? list.map(r => `<li><button type="button" class="res-item${r.me ? ' me' : ''}" data-open="${G.esc(r.id)}">${Art.avatarSVG({ color: r.color, outfit: r.outfit }, 34)}<span><b>${G.esc(r.name)}${r.me ? ' (나)' : ''}</b><small>${CHAPTERS[r.chapter].title} · ${SCENARIOS[r.scenario].name}</small>${r.live ? `<small class="live-tag"><i class="dot${r.live.online ? ' on' : ''}"></i>${r.live.online ? '지금 접속 중' : '쉬는 중'}</small>` : ''}</span></button></li>`).join('') : `<li class="empty small">${liveOn() ? '아직 아무도 없어요. 같은 반 친구가 들어오면 바로 나타나요.' : '아직 아무도 없어요. 친구의 섬 코드를 붙여 넣어 보세요.'}</li>`;
    $('plazaList').querySelectorAll('[data-open]').forEach(b => b.onclick = () => openCard(b.dataset.open));
    $('plazaEmpty').hidden = list.length > 0;
    $('plazaClear').disabled = !residents.length;
  }
  function refresh() { makeWalkers(); renderList(); }
  // live.js가 부르는 새로 그리기: 옷·집이 바뀌면 전부, 접속 표시만 바뀌면 목록과 점만
  function refreshLive(full) {
    if ($('screen-plaza').hidden || !$('plazaActors')) return;
    if (full) { refresh(); if (openRid && !findR(openRid)) closeCard(); return; }
    renderList();
    const now = new Map(all().map(r => [r.id, r]));
    walkers.forEach(w => {
      const r = now.get(w.id), dot = w.node && w.node.querySelector('.pl-dot');
      if (r) w.r = r;
      if (r && r.live && dot) dot.setAttribute('fill', dotFill(r));
    });
  }
  let bound = false;
  function bind() {
    bound = true;
    $('plazaSvg').addEventListener('click', e => { const t = e.target.closest('[data-rid]'); if (t) openCard(t.dataset.rid); });
    $('plazaSvg').addEventListener('keydown', e => { const t = e.target.closest('[data-rid]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCard(t.dataset.rid); } });
    $('plazaAdd').onclick = async () => {
      const box = $('plazaInput');
      const res = await addCodes(box.value);
      showResult(res);
      if (res.added) box.value = '';
    };
    $('plazaFile').onchange = async e => {
      const text = await readFiles(e.target.files);
      e.target.value = '';
      showResult(await addCodes(text));
    };
    $('plazaClear').onclick = async () => {
      if (!(await G.ask('광장에 초대한 친구들을 모두 내보낼까요? (친구들의 게임 기록은 지워지지 않아요)', { ok: '모두 내보내기', danger: true }))) return;
      residents = []; saveResidents(); refresh();
    };
    $('plazaCompare').onclick = openCompare;
    $('plazaCardClose').onclick = closeCard;
    $('plazaCard').addEventListener('click', e => { if (e.target.id === 'plazaCard') closeCard(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('screen-plaza').hidden && !$('plazaCard').hidden) closeCard(); });
    $('plazaBack').onclick = () => { if (typeof Live !== 'undefined') Live.pause(); Main.leavePlaza(); };
  }
  function showResult(res) {
    const msg = $('plazaMsg');
    if (res.none) { msg.textContent = '섬 코드를 찾지 못했어요. YS1로 시작하는 코드를 붙여 넣어요.'; msg.className = 'hint warn'; return; }
    msg.textContent = `${res.added}명을 초대했어요.${res.failed ? ` 읽지 못한 코드 ${res.failed}개가 있어요.` : ''}`;
    msg.className = 'hint ' + (res.failed ? 'warn' : 'good');
    refresh();
  }
  function open() {
    if (!bound) bind();
    loadResidents();
    $('plazaSvg').innerHTML = `${stage()}<g id="plazaActors"></g>`;
    walkers = [];
    closeCard();
    $('plazaMsg').textContent = '';
    $('plazaBack').textContent = G.S ? '◀ 내 섬으로' : '◀ 처음 화면';
    refresh();
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(tick); }
    if (typeof Live !== 'undefined') Live.enter(); // 설정이 비어 있으면 아무것도 안 해요
  }

  return { open, decode, findCodes, cleanState, encode, resident, cleanResident, refreshLive };
})();
