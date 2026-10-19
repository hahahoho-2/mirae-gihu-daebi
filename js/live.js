/* ==========================================================================
   실시간 학급 광장 (Firebase 실시간 데이터베이스 + 익명 로그인)
   - 라이브러리 없이 fetch와 EventSource만 써요. index.html을 더블클릭해서 열어도 돼요.
   - 올리는 것: 광장 주민 자료뿐이에요(Plaza.cleanResident를 거친 별명·옷·식탁·집·횟수).
     가방·밭 기록은 올리지 않아요.
   - 받는 것: 같은 반 코드 친구들의 주민 자료. 모두 Plaza.cleanResident로 다듬은 뒤에만 보여 줘요.
   - 받은 자료로 내 섬 저장 기록을 덮어쓰지 않아요.
   - js/live-config.js가 비어 있으면 아무것도 하지 않아요. 섬 코드 방식은 그대로 써요.
   ========================================================================== */
const Live = (() => {
  const ROOM_KEY = 'yeoul-live-room-v1', AUTH_KEY = 'yeoul-live-auth-v1', HIDE_KEY = 'yeoul-live-hidden-v1';
  const MAX_LIVE = 60, MAX_D = 8000, ONLINE_MS = 2 * 60 * 1000, BEAT_MS = 45 * 1000;
  const $ = id => document.getElementById(id);
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const BAD_KEY = /^(__proto__|constructor|prototype)$/;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가: 이번만 기억해요 */ } }
  };

  /* ---------- 설정 읽기 (Firebase 주소만 받아요. 시험용으로 이 컴퓨터 주소도 돼요) ---------- */
  const isLocal = u => u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname);
  function readConfig(c) {
    if (!isObj(c)) c = {};
    const key = String(c.apiKey || '').trim();
    let db = null, authBase = 'https://identitytoolkit.googleapis.com', tokenBase = 'https://securetoken.googleapis.com';
    try {
      const u = new URL(String(c.databaseURL || '').trim());
      if ((u.protocol === 'https:' && /\.(firebaseio\.com|firebasedatabase\.app)$/.test(u.hostname)) || isLocal(u)) db = { origin: u.origin, ns: u.searchParams.get('ns') };
    } catch (e) { /* 비었거나 주소가 아니에요 */ }
    try {
      const u = new URL(String(c.authEmulator || ''));
      if (isLocal(u)) { authBase = u.origin + '/identitytoolkit.googleapis.com'; tokenBase = u.origin + '/securetoken.googleapis.com'; }
    } catch (e) { /* 진짜 Firebase 로그인 주소를 써요 */ }
    return key && db ? { key, db, authBase, tokenBase } : null;
  }
  const C = readConfig(typeof LIVE_CONFIG === 'object' ? LIVE_CONFIG : null);

  function fail(kind, detail) { const e = new Error(detail || kind); e.kind = kind; return e; }
  const MSG = {
    'anon-off': '실시간 광장 설정이 덜 됐어요(익명 로그인). 선생님께 알려 주세요.',
    key: '실시간 광장 설정이 맞지 않아요(API 키). 선생님께 알려 주세요.',
    url: '실시간 광장 주소를 찾지 못했어요(databaseURL). 선생님께 알려 주세요.',
    denied: '반 광장에 들어갈 수 없어요. 반 코드를 확인하고, 그래도 안 되면 선생님께 알려 주세요(보안 규칙).',
    busy: '지금 들어오는 친구가 많아요. 잠시 뒤에 다시 연결할게요…',
    net: '인터넷 연결이 끊겼어요. 다시 연결하는 중이에요…',
    other: '실시간 광장에 잠시 연결이 안 돼요. 다시 연결하는 중이에요…'
  };
  const FATAL = ['anon-off', 'key', 'url', 'denied'];

  /* ---------- 익명 로그인 (학생 계정 없이 무작위 번호만 받아요) ---------- */
  let A = null, signing = null; // A = { uid, refresh, token, exp }
  async function post(url, body, form) {
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body: form ? new URLSearchParams(body).toString() : JSON.stringify(body) });
    } catch (e) { throw fail('net'); }
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const m = String((data && data.error && data.error.message) || res.status);
    throw fail(/ADMIN_ONLY|OPERATION_NOT_ALLOWED/.test(m) ? 'anon-off' : /API key|API_KEY/i.test(m) ? 'key' : /TOO_MANY|QUOTA/.test(m) ? 'busy' : /TOKEN|USER_|GRANT/.test(m) ? 'relogin' : 'other', m);
  }
  function keep(uid, refresh, token, sec) {
    A = { uid: String(uid), refresh: String(refresh), token: String(token), exp: Date.now() + (Number(sec) || 3600) * 1000 };
    store.set(AUTH_KEY, { k: C.key, uid: A.uid, refresh: A.refresh });
  }
  async function signIn(force) {
    if (!A) { const s = store.get(AUTH_KEY); if (s && s.k === C.key && typeof s.uid === 'string' && typeof s.refresh === 'string') A = { uid: s.uid, refresh: s.refresh, token: null, exp: 0 }; }
    if (A && A.token && !force && Date.now() < A.exp - 60000) return A.token;
    if (A) {
      try {
        const d = await post(`${C.tokenBase}/v1/token?key=${encodeURIComponent(C.key)}`, { grant_type: 'refresh_token', refresh_token: A.refresh }, true);
        keep(d.user_id, d.refresh_token, d.id_token, d.expires_in);
        return A.token;
      } catch (e) { if (e.kind !== 'relogin') throw e; A = null; } // 익명 번호가 지워졌으면 새로 받아요
    }
    const d = await post(`${C.authBase}/v1/accounts:signUp?key=${encodeURIComponent(C.key)}`, { returnSecureToken: true });
    keep(d.localId, d.refreshToken, d.idToken, d.expiresIn);
    return A.token;
  }
  function token(force) {
    if (!signing) signing = signIn(force).finally(() => { signing = null; });
    return signing;
  }

  /* ---------- 데이터베이스 주고받기 (REST) ---------- */
  // ME 자리에는 요청을 보내는 순간의 내 익명 번호가 들어가요(다시 로그인하면 번호가 바뀔 수 있어요)
  const ME = {};
  function url(parts, q = {}) {
    const p = new URLSearchParams(q);
    if (C.db.ns) p.set('ns', C.db.ns);
    return `${C.db.origin}/${parts.map(x => encodeURIComponent(x === ME ? A.uid : x)).join('/')}.json?${p}`;
  }
  async function req(method, parts, body, q = {}) {
    for (let n = 0; n < 2; n++) {
      const t = await token(n > 0);
      let res;
      try {
        res = await fetch(url(parts, { ...q, auth: t }), body === undefined ? { method } : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch (e) { throw fail('net'); }
      if (res.status === 401 && n === 0) continue; // 열쇠(토큰)가 낡았을 수 있어요: 새로 받아 한 번 더
      if (res.ok) return res.json().catch(() => null);
      throw fail(res.status === 401 || res.status === 403 ? 'denied' : res.status === 404 ? 'url' : res.status === 429 ? 'busy' : 'other', String(res.status));
    }
  }

  /* ---------- 반 코드 ---------- */
  const normRoom = v => String(v || '').trim().toLowerCase().replace(/\s+/g, '-');
  const validRoom = v => /^[a-z0-9-]{4,24}$/.test(v);
  const path = uid => ['rooms', room, 'residents'].concat(uid ? [uid] : []);

  let room = null, es = null, cache = {}, list = [], sig = '', active = false, offset = 0, sent = '', sentUid = null, leaving = false;
  let beat = null, clock = null, retry = null, retryMs = 0, timer = null;
  let state = 'idle', msg = '', warn = false;
  let hidden = new Set((Array.isArray(store.get(HIDE_KEY)) ? store.get(HIDE_KEY) : []).filter(v => typeof v === 'string'));

  /* ---------- 상태 표시 ---------- */
  function setState(s, m = '', w = false) { state = s; msg = m; warn = w; render(); }
  function render() {
    const box = $('liveBox');
    if (!box) return;
    box.hidden = !C;
    if (!C) return;
    $('liveJoin').hidden = !!room;
    $('liveOn').hidden = !room;
    if (room) {
      const online = list.filter(r => r.live.online).length;
      $('liveRoomName').textContent = `반 코드 ${room}`;
      $('liveState').textContent = state === 'live' ? `연결됨 · 지금 접속한 친구 ${online}명` : state === 'connecting' ? '연결하는 중…' : state === 'paused' ? '쉬는 중' : '연결 안 됨';
      $('liveDot').className = 'live-dot ' + (state === 'live' ? 'on' : state === 'connecting' ? 'wait' : 'off');
      $('liveRetry').hidden = state !== 'error';
    }
    const n = [...hidden].filter(k => room && k.startsWith(room + '/')).length;
    $('liveUnhide').hidden = !n;
    $('liveUnhide').textContent = `숨긴 친구 ${n}명 다시 보기`;
    $('liveMsg').textContent = msg;
    $('liveMsg').className = 'hint' + (warn ? ' warn' : '');
  }

  /* ---------- 연결 · 올리기 · 받기 ---------- */
  async function connect() {
    if (!C || !room || !active) return;
    clearTimeout(retry); closeStream(); clearInterval(beat);
    cache = {}; sent = '';
    setState('connecting', G.S ? '' : '내 섬이 없어서 친구들을 구경만 해요.');
    try {
      await token();
      if (G.S) await upload(true);
      else await req('GET', path(), undefined, { shallow: 'true' }); // 들어갈 수 있는지만 먼저 확인
      if (!active || !room) return;
      openStream();
      if (G.S) startBeat();
    } catch (e) { onError(e); }
  }
  async function upload(force) {
    if (!G.S || !A || !room) return;
    const r = Plaza.cleanResident(Plaza.resident(G.S)); // 받는 쪽과 같은 다듬기를 거친 자료만 올려요
    const d = JSON.stringify(r);
    if (d.length > MAX_D) { setState(state, '내 섬 자료가 너무 커서 올리지 못했어요. 옷장의 옷을 조금 줄여 봐요.', true); return; }
    if (!force && d === sent && A.uid === sentUid) return;
    const out = await req('PUT', path(ME), { v: 1, n: r.name, d, at: { '.sv': 'timestamp' } });
    sent = d; sentUid = A.uid;
    if (out && Number.isFinite(out.at)) offset = out.at - Date.now();
  }
  // 45초마다 '접속 중' 시각만 새로 써요. 익명 번호가 바뀌었으면 내 자료 전체를 새 칸에 다시 올려요.
  function startBeat() {
    clearInterval(beat);
    beat = setInterval(async () => {
      if (!active || !room || !A || !G.S) return;
      try {
        if (A.uid !== sentUid) { await upload(true); return; }
        const at = await req('PUT', path(ME).concat('at'), { '.sv': 'timestamp' });
        if (Number.isFinite(at)) offset = at - Date.now();
      } catch (e) {
        if (e.kind === 'denied' && A && A.uid !== sentUid) { try { await upload(true); return; } catch (e2) { e = e2; } }
        onError(e);
      }
    }, BEAT_MS);
  }
  function openStream() {
    closeStream();
    const s = new EventSource(url(path(), { auth: A.token }));
    es = s;
    const on = (type, fn) => s.addEventListener(type, ev => { if (es === s) fn(ev); });
    on('put', ev => apply(ev.data, false));
    on('patch', ev => apply(ev.data, true));
    on('cancel', () => { closeStream(); onError(fail('denied')); });
    on('auth_revoked', () => { closeStream(); token(true).then(() => { if (active && room) openStream(); }, onError); });
    s.onopen = () => { if (es === s) { retryMs = 0; setState('live', G.S ? '' : '내 섬이 없어서 친구들을 구경만 해요.'); } };
    s.onerror = () => {
      if (es !== s) return;
      if (s.readyState === EventSource.CLOSED) { closeStream(); onError(fail('other')); } // 처음부터 다시 연결해요
      else setState('connecting', MSG.net);
    };
  }
  function closeStream() { if (es) { es.close(); es = null; } }
  function apply(text, patch) {
    const had = !!(A && cache[A.uid]);
    cache = applyEvent(cache, text, patch);
    if (had && G.S && !leaving && !cache[A.uid]) { removed(); return; }
    clearTimeout(timer);
    timer = setTimeout(rebuild, 250);
  }
  // 받은 put/patch 사건 하나를 받은 자료 묶음(root)에 반영해요. 이상한 사건은 버려요.
  function applyEvent(root, text, patch) {
    let ev;
    try { ev = JSON.parse(text); } catch (e) { return root; }
    if (!isObj(ev) || typeof ev.path !== 'string') return root;
    const parts = ev.path.split('/').filter(Boolean);
    if (!patch) return setAt(root, parts, ev.data);
    if (isObj(ev.data)) Object.keys(ev.data).forEach(k => { root = setAt(root, parts.concat(k.split('/').filter(Boolean)), ev.data[k]); });
    return root;
  }
  function setAt(root, parts, val) {
    if (parts.some(p => BAD_KEY.test(p))) return root;
    if (!parts.length) return isObj(val) ? val : {};
    let o = root;
    for (const p of parts.slice(0, -1)) {
      if (!isObj(o[p])) { if (val == null) return root; o[p] = {}; }
      o = o[p];
    }
    const k = parts[parts.length - 1];
    if (val == null) delete o[k]; else o[k] = val;
    return root;
  }
  // 받은 자료 → 광장 주민 (모르는 값은 버려요)
  // 같은 섬(기기를 바꿨거나 기록이 지워져 새 익명 번호로 다시 올린 경우)은 접속 중인 것을 모두 보여 주고,
  // 아무도 접속 중이 아닐 때만 가장 최근 것 하나만 보여 줘요. 섬 번호는 누구나 흉내 낼 수 있어서
  // 접속 중인 친구를 가리는 데 쓰이면 안 돼요.
  function pickFriends(entries, { now, mine = null, myUid = null, roomCode = '', hide = new Set() }) {
    const groups = new Map();
    Object.keys(isObj(entries) ? entries : {}).forEach(uid => {
      const e = entries[uid], key = roomCode + '/' + uid;
      if (BAD_KEY.test(uid) || uid === myUid || hide.has(key) || !isObj(e) || typeof e.d !== 'string' || e.d.length > MAX_D) return;
      let raw;
      try { raw = JSON.parse(e.d); } catch (err) { return; }
      const r = Plaza.cleanResident(raw);
      if (!r || r.id === mine) return; // 다른 기기에서 올린 내 섬은 이미 '나'로 있어요
      const at = Number.isFinite(+e.at) ? +e.at : 0;
      r.island = r.id;
      r.id = 'L' + uid.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
      r.live = { uid, key, at, online: now - at < ONLINE_MS };
      if (!groups.has(r.island)) groups.set(r.island, []);
      groups.get(r.island).push(r);
    });
    const shown = [];
    groups.forEach(g => {
      const on = g.filter(r => r.live.online);
      if (on.length) shown.push(...on); else shown.push(g.reduce((a, b) => (b.live.at > a.live.at ? b : a)));
    });
    return shown.sort((a, b) => b.live.at - a.live.at).slice(0, MAX_LIVE)
      .sort((a, b) => (b.live.online - a.live.online) || a.name.localeCompare(b.name, 'ko')); // 접속 중인 친구 먼저, 그다음 가나다순
  }
  function rebuild() {
    list = pickFriends(cache, { now: Date.now() + offset, mine: G.S ? Plaza.resident(G.S).id : null, myUid: A && A.uid, roomCode: room, hide: hidden });
    const next = list.map(r => r.id + '\u0001' + cache[r.live.uid].d).sort().join('\u0002');
    const full = next !== sig;
    sig = next;
    render();
    Plaza.refreshLive(full); // 옷·집이 바뀌면 다시 그리고, 접속 표시만 바뀌면 목록만 고쳐요
  }
  function removed() {
    stop();
    room = null; store.set(ROOM_KEY, null); cache = {}; list = []; sig = '';
    setState('idle', '반 광장에서 내 아바타가 내려졌어요(선생님이 내렸거나 다른 창에서 나갔어요). 다시 들어가려면 반 코드를 넣어요.', true);
    Plaza.refreshLive(true);
  }
  function onError(e) {
    if (!active || !room) return;
    const kind = (e && e.kind) || 'other';
    closeStream(); clearInterval(beat);
    setState('error', MSG[kind] || MSG.other, true);
    clearTimeout(retry);
    if (FATAL.includes(kind)) return; // 설정 문제는 「다시 연결」을 누를 때까지 기다려요
    retryMs = Math.min(60000, retryMs ? retryMs * 2 : 3000);
    retry = setTimeout(connect, retryMs);
  }
  function stop() { closeStream(); clearInterval(beat); clearInterval(clock); clearTimeout(retry); clearTimeout(timer); }

  /* ---------- 들어가기 · 나가기 · 숨기기 ---------- */
  function join() {
    const v = normRoom($('liveRoom').value);
    if (!validRoom(v)) { setState('idle', '반 코드는 영어 소문자·숫자·-(빼기)로 4~24글자예요. 선생님이 알려 준 대로 써요.', true); $('liveRoom').focus(); return; }
    room = v; store.set(ROOM_KEY, v); retryMs = 0;
    $('liveRoom').value = '';
    startClock();
    connect();
  }
  async function leaveRoom() {
    const ok = await G.ask(G.S ? '반 광장에서 나갈까요? 친구들 광장에서 내 아바타가 사라져요. (내 섬 기록은 그대로예요)' : '반 광장 구경을 그만할까요?', { ok: '나가기', cancel: '그대로 있기' });
    if (!ok || !room) return;
    const r = room;
    leaving = true;
    stop();
    let gone = true;
    try { if (A && G.S) await req('DELETE', ['rooms', r, 'residents', A.uid]); } catch (e) { gone = false; }
    leaving = false;
    room = null; store.set(ROOM_KEY, null); cache = {}; list = []; sig = '';
    setState('idle', gone ? '반 광장에서 나왔어요.' : '반 광장에서 나왔어요. 인터넷이 끊겨 있어서 친구들 화면에는 내 아바타가 잠시 남아 있을 수 있어요.', !gone);
    Plaza.refreshLive(true);
  }
  function hide(id) {
    const r = list.find(x => x.id === id);
    if (!r) return;
    hidden.add(r.live.key);
    store.set(HIDE_KEY, [...hidden].slice(-200));
    rebuild();
  }
  function unhide() {
    hidden = new Set([...hidden].filter(k => !room || !k.startsWith(room + '/')));
    store.set(HIDE_KEY, [...hidden]);
    rebuild();
  }
  function startClock() {
    clearInterval(clock);
    clock = setInterval(() => { if (active && room) rebuild(); }, 30000); // '접속 중' 표시를 새로 셈해요
  }

  /* ---------- 광장 화면과 함께 켜고 끄기 ---------- */
  let bound = false;
  function bind() {
    bound = true;
    $('liveGo').onclick = join;
    $('liveRoom').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) join(); }); // 한글 조합 중 Enter는 건너뛰어요
    $('liveLeave').onclick = leaveRoom;
    $('liveRetry').onclick = () => { retryMs = 0; connect(); };
    $('liveUnhide').onclick = unhide;
    window.addEventListener('online', () => { if (active && room && state !== 'live') { retryMs = 0; connect(); } });
  }
  function enter() {
    if (!C) { render(); return; }
    if (!bound) bind();
    active = true;
    const saved = normRoom(store.get(ROOM_KEY));
    room = validRoom(saved) ? saved : null;
    list = []; sig = '';
    if (room) { startClock(); connect(); } else setState('idle');
  }
  function pause() {
    if (!active) return;
    active = false;
    stop();
    if (room) setState('paused'); // 광장을 떠나면 연결을 닫아요(동시 접속 수 아끼기)
  }

  return {
    enter, pause, hide,
    list: () => list,
    on: () => !!(C && room),
    configured: !!C,
    _debug: () => ({ room, state, msg, uid: A && A.uid, offset, friends: list.map(r => ({ id: r.id, name: r.name, online: r.live.online })) }),
    // tests/test.html에서 쓰는 순수 함수(저장 공간·네트워크를 건드리지 않아요)
    _test: { readConfig, normRoom, validRoom, applyEvent, pickFriends, ONLINE_MS, MAX_LIVE }
  };
})();
