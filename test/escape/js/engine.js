/* ==========================================================================
   2045 미래하우스 탈출 — 게임 규칙과 저장 (화면과 따로 동작해서 자동 시험이 쉬워요)
   ========================================================================== */
const E = (() => {
  const SAVE = 'yeoul-future-escape-v1', BEST = 'yeoul-future-best-v1', CLOSET = 'yeoul-future-closet-v1';
  const PLACES = ['lobby', 'hall', 'food', 'cloth', 'house', 'gate'];
  const PART_ROOM = { '식': 'food', '의': 'cloth', '주': 'house' };
  let S = null;
  const hooks = { changed() {}, tick() {}, warn() {}, timeup() {}, escaped() {} };

  const modeOf = id => GAME.modes.find(m => m.id === id) || GAME.modes[1];
  const jobOf = id => JOBS.find(j => j.id === id) || JOBS[0];
  const clean = (x, n) => String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').slice(0, n);

  /* ---------- 상태 ---------- */
  function newState(o = {}) {
    const mode = modeOf(o.mode), job = jobOf(o.job);
    const seed = (o.seed != null && Number.isFinite(Number(o.seed)) ? Number(o.seed) : Math.floor(Math.random() * 2147483647)) >>> 0;
    return {
      k: 'yeoul-future', v: 1,
      name: clean(o.name, 8).trim() || '탐험가',
      look: LOOKS.some(l => l.id === o.look) ? o.look : LOOKS[0].id,
      job: job.id, mode: mode.id, seed,
      persona: Number.isInteger(o.persona) && PERSONAS[o.persona] ? o.persona : seed % PERSONAS.length,
      limit: mode.time, time: mode.time, used: 0,
      coins: GAME.startCoins, hints: GAME.hintKeys, lens: 0, shield: 0, timeBuys: 0, banked: 0,
      started: false, end: null, practice: false, practiceDone: false,
      at: 'lobby', seen: {}, clues: {}, locks: {}, fights: {}, xp: 0, bonus: {},
      ideas: { '의': '', '식': '', '주': '' }
    };
  }
  function start(o) { S = newState(o); save(); return S; }
  function begin() { if (S && !S.started) { S.started = true; save(); hooks.changed(); } }
  const get = () => S;
  const set = s => { S = s; return S; };
  const persona = () => PERSONAS[S.persona];

  /* ---------- 자물쇠 ---------- */
  const blank = () => ({ wrong: 0, hint: 0, hintSeen: false, free: false, done: false, stars: 0, shown: [] });
  const lk = id => S.locks[id] || (S.locks[id] = blank());
  const fr = id => S.fights[id] || (S.fights[id] = blank());
  const isDone = id => !!((S.locks[id] && S.locks[id].done) || (S.fights[id] && S.fights[id].done));
  const cleared = room => { const r = ROOMS[room].locks; return isDone(r[r.length - 1]); };
  const keys = () => KEY_ROOMS.filter(cleared).length;
  const monstersDone = () => MONSTERS.every(m => isDone(m.id));
  function available(id) {
    const L = LOCKS[id]; if (!L) return false;
    if (L.room === 'gate') return keys() === KEY_ROOMS.length && monstersDone();
    if (L.room !== 'lobby' && !cleared('lobby')) return false;
    const r = ROOMS[L.room].locks, i = r.indexOf(id);
    return i <= 0 || isDone(r[i - 1]);
  }
  function canGo(place) {
    if (place === 'lobby') return true;
    if (!cleared('lobby')) return false;
    if (place === 'gate') return keys() === KEY_ROOMS.length;
    return PLACES.includes(place);
  }
  function go(place) { if (!S || !canGo(place)) return false; S.at = place; save(); hooks.changed(); return true; }
  const canAct = () => !!S && S.started && S.end !== 'escaped' && (S.end !== 'timeup' || S.practice);

  /* 별·경험치·코인: 틀린 횟수 + 힌트(무료 힌트 제외) */
  function starsOf(rec) { const m = rec.wrong + (rec.hint ? 1 : 0); return m === 0 ? 3 : m === 1 ? 2 : 1; }
  const xpOf = stars => 5 + stars * 5;
  const coinOf = stars => stars * 5;
  function level(xp) { xp = xp == null ? S.xp : xp; let i = 0; LEVELS.forEach((L, k) => { if (xp >= L.xp) i = k; }); return i; }

  /* 섞기: 같은 판에서는 다시 열어도 순서가 같아요 */
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function order(id, n) {
    let a = ((S ? S.seed : 1) ^ hash(id)) | 0;
    const rnd = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const p = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    return p;
  }

  const slotsOf = id => (LOCKS[id].type === 'plan' ? persona().slots : LOCKS[id].slots);
  function answerOf(id) {
    const L = LOCKS[id];
    if (L.type === 'sort') return L.items.map(it => it.a);
    if (L.type === 'slots' || L.type === 'plan') return slotsOf(id).map(sl => sl.opts.findIndex(o => o.ok));
    if (L.type === 'combo') { const ks = Object.keys(L.kinds); return ks.slice(0, L.pick).map(k => L.items.findIndex(it => it.k === k)); }
    return null;
  }
  function grade(id, ans) {
    const L = LOCKS[id];
    if (L.type === 'combo') {
      const idx = Array.isArray(ans) ? [...new Set(ans.map(Number))].filter(i => L.items[i]) : [];
      if (idx.length !== L.pick) return { ok: false, count: true, why: `${L.pick}가지를 골라요.` };
      const kinds = idx.map(i => L.items[i].k);
      if (new Set(kinds).size === L.pick) return { ok: true, why: '서로 다른 종류: ' + kinds.map(k => L.kinds[k]).join(' + ') };
      const same = kinds.find((k, i) => kinds.indexOf(k) !== i);
      return { ok: false, why: `고른 것이 모두 ${L.kinds[same]}이에요. 같은 종류를 반복하면 다중 인증이 아니에요.` };
    }
    const want = answerOf(id), total = want.length;
    if (!Array.isArray(ans) || ans.length !== total) return { ok: false, count: true, right: 0, total };
    const right = want.filter((w, i) => ans[i] != null && ans[i] !== '' && Number(ans[i]) === w).length;
    return { ok: right === total, right, total };
  }

  const roomOfTask = id => (LOCKS[id] ? LOCKS[id].room : PART_ROOM[(MONSTERS.find(m => m.id === id) || {}).part]);
  function penalize(id) {
    if (S.practice || S.end) return 0;
    if (jobOf(S.job).room === roomOfTask(id)) return -2;  // 내 전문 방: 시간이 줄지 않아요
    if (S.shield > 0) { S.shield--; return -1; }          // 실수 방패
    S.time = Math.max(0, S.time - GAME.wrongPenalty);
    if (S.time === 0) timeUp();
    return GAME.wrongPenalty;
  }
  function roomClues(room) { return ROOMS[room].objects.filter(o => o.clue).map(o => o.clue); }
  function reward(rec) { rec.stars = starsOf(rec); const xp = xpOf(rec.stars), coin = coinOf(rec.stars); S.xp += xp; S.coins += coin; return { xp, coin }; }
  function solve(id) {
    const rec = lk(id), L = LOCKS[id], before = level();
    rec.done = true;
    const g = reward(rec);
    let room = null, bonus = 0;
    if (L.room !== 'gate' && cleared(L.room)) {
      room = L.room;
      roomClues(room).forEach(c => { S.clues[c] = true; });
      if (jobOf(S.job).room === room && !S.bonus[room]) { S.bonus[room] = true; S.coins += GAME.jobBonus; bonus = GAME.jobBonus; }
    }
    if (L.room === 'gate') escape();
    save(); hooks.changed();
    return { ok: true, stars: rec.stars, xp: g.xp, coin: g.coin, bonus, up: level() > before, room, escaped: L.room === 'gate' };
  }
  function submit(id, ans) {
    const L = LOCKS[id];
    if (!L || !canAct() || !available(id)) return { ok: false, blocked: true };
    const rec = lk(id); if (rec.done) return { ok: true, already: true };
    const g = grade(id, ans);
    if (g.ok) return Object.assign(solve(id), { why: g.why });
    if (g.count) return Object.assign(g, { pen: 0 });
    rec.wrong++;
    const pen = penalize(id); save(); hooks.changed();
    return Object.assign(g, { pen });
  }

  /* ---------- 힌트·AI 돋보기 ---------- */
  const recOf = id => (LOCKS[id] ? S.locks[id] : S.fights[id]) || {};
  function hintState(id) {
    const rec = recOf(id);
    if (rec.hintSeen) return 'seen';
    if (S.practice || (rec.wrong || 0) >= GAME.freeHintAfter) return 'free';
    return S.hints > 0 ? 'key' : 'time';
  }
  function takeHint(id) {
    if (!S || !(LOCKS[id] || MONSTERS.some(m => m.id === id))) return null;
    const st = hintState(id), rec = LOCKS[id] ? lk(id) : fr(id);
    if (st === 'free') rec.free = true;
    else if (st === 'key') { S.hints--; rec.hint = 1; }
    else if (st === 'time') {
      rec.hint = 1;
      if (!S.practice && !S.end) { S.time = Math.max(0, S.time - GAME.noKeyHintCost); if (S.time === 0) timeUp(); }
    }
    rec.hintSeen = true;
    save(); hooks.changed();
    return st;
  }
  const hintText = id => (LOCKS[id] || MONSTERS.find(m => m.id === id) || {}).hint || '';
  function lens(id) {
    const L = LOCKS[id];
    if (!S || !L || S.lens <= 0 || !canAct() || !available(id)) return null;
    const rec = lk(id); if (rec.done) return null;
    const n = L.type === 'sort' || L.type === 'combo' ? L.items.length : slotsOf(id).length;
    const k = [...Array(n).keys()].find(i => !rec.shown.includes(i));
    if (k == null) return { none: true, text: '더 알려 줄 칸이 없어요.' };
    S.lens--; rec.shown.push(k); rec.hint = 1;
    let text;
    if (L.type === 'sort') text = `「${L.items[k].t}」 → ${L.bins[L.items[k].a]}`;
    else if (L.type === 'combo') text = `${L.items[k].t} → ${L.kinds[L.items[k].k]}`;
    else { const sl = slotsOf(id)[k]; text = `${sl.name} → ${sl.opts.find(o => o.ok).t}`; }
    save(); hooks.changed();
    return { text, k };
  }

  /* ---------- 상점 ---------- */
  function buy(itemId) {
    const it = SHOP.find(x => x.id === itemId);
    if (!S || !it || !canAct()) return { ok: false, why: '지금은 살 수 없어요.' };
    if (it.id === 'time' && S.practice) return { ok: false, why: '연습 모드에서는 시간이 줄지 않아요.' };
    if (it.max && it.id === 'time' && S.timeBuys >= it.max) return { ok: false, why: `시간 충전은 한 판에 ${it.max}번까지예요.` };
    if (S.coins < it.cost) return { ok: false, why: `코인이 ${it.cost - S.coins}개 모자라요.` };
    S.coins -= it.cost;
    if (it.id === 'time') { S.timeBuys++; S.time += it.sec; }
    else if (it.id === 'hint') S.hints++;
    else if (it.id === 'lens') S.lens++;
    else if (it.id === 'shield') S.shield++;
    save(); hooks.changed();
    return { ok: true, item: it };
  }
  function seeClue(room, obj, clue) {
    const key = room + ':' + obj;
    if (!S || S.seen[key] || !CLUES[clue]) return 0;
    S.seen[key] = true; S.clues[clue] = true; S.coins += GAME.clueCoins;
    save(); hooks.changed();
    return GAME.clueCoins;
  }
  function see(key) { if (S && !S.seen[key]) { S.seen[key] = true; save(); return true; } return false; }

  /* ---------- 생각 바이러스 ---------- */
  const fight = () => MONSTERS.find(m => !isDone(m.id)) || null;
  function attack(id, cards) {
    const M = MONSTERS.find(m => m.id === id);
    if (!M || !canAct() || keys() < KEY_ROOMS.length || fight() !== M) return { ok: false, blocked: true };
    cards = [...new Set(cards || [])].filter(c => S.clues[c]);
    if (cards.length !== 1) return { ok: false, count: true, pen: 0, why: '카드를 한 장 골라요.' };
    const rec = fr(id);
    if (cards[0] === 'c_critical') return { ok: false, pen: 0, general: true, why: '좋은 태도예요! 그런데 바이러스를 바로잡으려면 이 기술에 대한 구체적인 근거가 필요해요. 의·식·주 방에서 찾은 카드를 골라요.' };
    if (!M.ok.includes(cards[0])) {
      rec.wrong++;
      const pen = penalize(id); save(); hooks.changed();
      return { ok: false, pen, card: cards[0] };
    }
    const before = level();
    rec.done = true;
    const g = reward(rec);
    save(); hooks.changed();
    return { ok: true, stars: rec.stars, xp: g.xp, coin: g.coin, up: level() > before };
  }

  /* ---------- 시간 ---------- */
  function tick() {
    if (!S || !S.started || S.end || S.practice) return;
    S.time = Math.max(0, S.time - 1); S.used++;
    if (S.time === 0) { timeUp(); return; }
    if ([120, 60, 30].includes(S.time)) hooks.warn(S.time);
    if (S.time % 5 === 0) save();
    hooks.tick();
  }
  function timeUp() { if (!S || S.end) return; S.end = 'timeup'; save(); hooks.timeup(); }
  function practice() { if (S && S.end === 'timeup') { S.practice = true; save(); hooks.changed(); } }
  function escape() {
    if (!S.end) { S.end = 'escaped'; recordBest(); }
    else if (S.end === 'timeup') S.practiceDone = true;
    save(); hooks.escaped();
  }
  const timeBonus = () => Math.floor((S.end === 'escaped' ? S.time : 0) / 10);
  const score = () => S.xp + timeBonus();
  const totalTasks = () => Object.keys(LOCKS).length + MONSTERS.length;
  function stars() { let n = 0; [...Object.values(S.locks), ...Object.values(S.fights)].forEach(r => { if (r.done) n += r.stars; }); return n; }

  /* ---------- 저장 ---------- */
  function save() { if (!S) return; try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* 저장 불가: 그냥 진행 */ } }
  function load() { try { return sanitize(JSON.parse(localStorage.getItem(SAVE) || 'null')); } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(SAVE); } catch (e) { /* 무시 */ } }
  const n0 = (x, hi) => Math.min(hi, Math.max(0, Math.round(Number(x) || 0)));
  function best() {
    try {
      const b = JSON.parse(localStorage.getItem(BEST) || 'null');
      if (!b || typeof b !== 'object') return null;
      return { score: n0(b.score, 9999), time: n0(b.time, 9999), xp: n0(b.xp, 9999), mode: modeOf(b.mode).id, name: clean(b.name, 8), date: clean(b.date, 10) };
    } catch (e) { return null; }
  }
  function recordBest() {
    const b = best(), sc = score();
    if (b && b.score >= sc) return false;
    try { localStorage.setItem(BEST, JSON.stringify({ score: sc, time: S.time, xp: S.xp, mode: S.mode, name: S.name, date: new Date().toISOString().slice(0, 10) })); } catch (e) { /* 무시 */ }
    return true;
  }

  /* 꾸미기 옷장: 판이 끝나면 남은 코인이 꾸미기 지갑으로 옮겨져요(이 기기에 저장) */
  function closet() {
    const c = { coins: 0, owned: {}, wear: {} };
    try {
      const raw = JSON.parse(localStorage.getItem(CLOSET) || 'null') || {};
      c.coins = n0(raw.coins, 99999);
      LOOKS_SHOP.forEach(it => { if (raw.owned && raw.owned[it.id] === true) { c.owned[it.id] = true; if (raw.wear && raw.wear[it.id] === true) c.wear[it.id] = true; } });
    } catch (e) { /* 기본값 */ }
    return c;
  }
  function saveCloset(c) { try { localStorage.setItem(CLOSET, JSON.stringify(c)); } catch (e) { /* 무시 */ } }
  function bank() {
    if (!S || !S.end) return 0;
    const add = Math.max(0, S.coins - S.banked);
    if (!add) return 0;
    const c = closet(); c.coins = Math.min(99999, c.coins + add); saveCloset(c);
    S.banked = S.coins; save();
    return add;
  }
  function buyLook(id) {
    const it = LOOKS_SHOP.find(x => x.id === id), c = closet();
    if (!it) return { ok: false, why: '없는 아이템이에요.' };
    if (c.owned[id]) { c.wear[id] = !c.wear[id]; if (!c.wear[id]) delete c.wear[id]; saveCloset(c); return { ok: true, toggled: true, wear: !!c.wear[id] }; }
    if (c.coins < it.cost) return { ok: false, why: `꾸미기 코인이 ${it.cost - c.coins}개 모자라요.` };
    c.coins -= it.cost; c.owned[id] = true; c.wear[id] = true; saveCloset(c);
    return { ok: true, bought: true };
  }
  const wearing = () => Object.keys(closet().wear);

  /* 저장 기록 다듬기: 알 수 없는 값은 버리고, 숫자는 범위 안으로, 점수와 코인 근거는 다시 맞춰요 */
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || raw.k !== 'yeoul-future' || raw.v !== 1) return null;
    const num = (x, lo, hi, d) => { x = Number(x); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : d; };
    const s = newState({ name: raw.name, look: raw.look, job: raw.job, mode: raw.mode, seed: num(raw.seed, 0, 2147483647, undefined), persona: num(raw.persona, 0, PERSONAS.length - 1, undefined) });
    const timeMax = s.limit + SHOP.find(x => x.id === 'time').sec * SHOP.find(x => x.id === 'time').max;
    s.time = num(raw.time, 0, timeMax, s.time);
    s.used = num(raw.used, 0, 99999, 0);
    s.coins = num(raw.coins, 0, 99999, s.coins);
    s.banked = num(raw.banked, 0, s.coins, 0);
    s.hints = num(raw.hints, 0, 9, s.hints);
    s.lens = num(raw.lens, 0, 9, 0);
    s.shield = num(raw.shield, 0, 9, 0);
    s.timeBuys = num(raw.timeBuys, 0, SHOP.find(x => x.id === 'time').max, 0);
    s.started = raw.started === true;
    s.end = raw.end === 'timeup' || raw.end === 'escaped' ? raw.end : null;
    s.practice = s.end === 'timeup' && raw.practice === true;
    s.practiceDone = s.practice && raw.practiceDone === true;
    const rec = (r, n) => {
      r = r && typeof r === 'object' ? r : {};
      const o = { wrong: num(r.wrong, 0, 99, 0), hint: r.hint ? 1 : 0, hintSeen: r.hintSeen === true, free: r.free === true, done: r.done === true, stars: 0,
        shown: (Array.isArray(r.shown) ? r.shown : []).map(Number).filter((x, i, a) => Number.isInteger(x) && x >= 0 && x < n && a.indexOf(x) === i) };
      o.stars = o.done ? starsOf(o) : 0;
      return o;
    };
    const prev = S; S = s;
    Object.keys(LOCKS).forEach(id => {
      if (!raw.locks || !raw.locks[id]) return;
      const L = LOCKS[id], n = L.type === 'sort' || L.type === 'combo' ? L.items.length : slotsOf(id).length;
      s.locks[id] = rec(raw.locks[id], n);
    });
    MONSTERS.forEach(m => { if (raw.fights && raw.fights[m.id]) s.fights[m.id] = rec(raw.fights[m.id], 0); });
    // 순서 지키기: 앞 자물쇠를 연 뒤에만 다음 자물쇠, 열쇠 3개 뒤에만 바이러스, 바이러스를 모두 이긴 뒤에만 마지막 의뢰
    Object.keys(ROOMS).forEach(room => { const r = ROOMS[room].locks; r.forEach((id, i) => { if (i > 0 && s.locks[id] && s.locks[id].done && !isDone(r[i - 1])) s.locks[id].done = false; }); });
    let ok = keys() === KEY_ROOMS.length;
    MONSTERS.forEach(m => { const r = s.fights[m.id]; if (r && r.done && !ok) r.done = false; if (!(r && r.done)) ok = false; });
    Object.keys(LOCKS).filter(id => LOCKS[id].room === 'gate').forEach(id => { if (s.locks[id] && s.locks[id].done && !available(id)) s.locks[id].done = false; });
    [...Object.values(s.locks), ...Object.values(s.fights)].forEach(r => { r.stars = r.done ? starsOf(r) : 0; });
    Object.keys(CLUES).forEach(c => { if (raw.clues && raw.clues[c] === true) s.clues[c] = true; });
    Object.keys(ROOMS).forEach(room => { if (cleared(room)) roomClues(room).forEach(c => { s.clues[c] = true; }); });
    Object.keys(raw.seen || {}).forEach(k => { if (/^[a-z0-9:_]{1,40}$/.test(k) && raw.seen[k] === true) s.seen[k] = true; });
    KEY_ROOMS.forEach(r => { if (raw.bonus && raw.bonus[r] === true && cleared(r) && jobOf(s.job).room === r) s.bonus[r] = true; });
    s.xp = [...Object.values(s.locks), ...Object.values(s.fights)].reduce((t, r) => t + (r.done ? xpOf(r.stars) : 0), 0);
    const finalDone = Object.keys(LOCKS).filter(id => LOCKS[id].room === 'gate').every(isDone);
    if (s.end === 'escaped' && !finalDone) s.end = null;
    if (s.practiceDone && !finalDone) s.practiceDone = false;
    s.at = PLACES.includes(raw.at) && canGo(raw.at) ? raw.at : (cleared('lobby') ? 'hall' : 'lobby');
    ['의', '식', '주'].forEach(p => { s.ideas[p] = clean(raw.ideas && raw.ideas[p], 80); });
    S = prev;
    return s;
  }
  function setIdea(part, text) { if (S && part in S.ideas) { S.ideas[part] = clean(text, 80); save(); } }

  return {
    hooks, PLACES, newState, start, begin, get, set, persona, modeOf, jobOf,
    available, cleared, keys, monstersDone, canGo, go, canAct, isDone, starsOf, xpOf, coinOf, level, order, slotsOf,
    answerOf, grade, submit, hintState, takeHint, hintText, lens, buy, seeClue, see, fight, attack,
    tick, timeUp, practice, timeBonus, score, totalTasks, stars, roomClues,
    save, load, clear, best, closet, bank, buyLook, wearing, sanitize, setIdea
  };
})();
