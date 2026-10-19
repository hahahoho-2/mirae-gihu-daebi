/* ==========================================================================
   여울섬 자동 시험 — tests/test.html에서 불러요
   - 저장 공간(localStorage)에 쓰지 않고, 네트워크에 연결하지 않아요.
   - 파일을 읽는 시험(보안 규칙 파일, index.html이 부르는 파일)은 웹 서버로 열었을 때만 해요.
   ========================================================================== */
(async () => {
  const results = [];
  let group = '';
  const section = name => { group = name; };
  async function test(name, fn) {
    try { const r = await fn(); results.push({ group, name, state: r === 'skip' ? 'skip' : 'ok' }); }
    catch (e) { results.push({ group, name, state: 'bad', why: e && e.message ? e.message : String(e) }); }
  }
  const show = v => JSON.stringify(v);
  function eq(actual, expected, what = '') { if (show(actual) !== show(expected)) throw new Error(`${what} 기대 ${show(expected)} / 실제 ${show(actual)}`); }
  function ok(v, what = '조건이 맞지 않아요') { if (!v) throw new Error(what); }
  const noTags = s => !/[<>]/.test(s);

  /* ---------- 불러오기 ---------- */
  section('불러오기');
  await test('게임 스크립트를 오류 없이 불러와요', () => {
    eq(window.__loadErrors, [], '불러오기 오류');
    ['G', 'Art', 'Tailor', 'Build', 'Plaza', 'Live'].forEach(n => ok(typeof window[n] !== 'undefined' || eval(`typeof ${n}`) !== 'undefined', `${n}이 없어요`));
  });

  /* ---------- 받은 자료 다듬기 ---------- */
  section('받은 자료 다듬기 (Plaza.cleanResident)');
  const evil = {
    id: '"><svg onload=alert(1)>', name: '<img src=x onerror=window.__pwned=1>', color: 'javascript:alert(1)', pet: '__proto__',
    region: '<b>서울</b>', scenario: 'constructor', chapter: 999, dayIn: -5,
    outfit: { id: '<x>', name: '<script>window.__pwned=2</script>', top: 'toString', color: '"><script>', fabric: 'fab_x_y', details: ['mesh', 'mesh', 'evil', 'hasOwnProperty'], hat: 'valueOf', shoes: '<svg>' },
    outfits: 'notarray', table: ['rice_bowl', '<img>', 'kongguk', 'x', 'y', 'z'],
    house: { floors: 99, walls: ['<svg/onload=1>', 'brick'], roof: 'constructor', roofTop: 'solar', yard: ['shade_tree', '<x>', '__proto__'] },
    harvests: 1e12, cooked: 'NaN', quest: -1
  };
  const clean = Plaza.cleanResident(evil);
  await test('별명에서 < > 를 빼고 8글자까지만 남겨요', () => { ok(noTags(clean.name), '꺾쇠가 남았어요: ' + clean.name); ok(clean.name.length <= 8, '8글자를 넘어요'); });
  await test('모르는 몸 색·동물 친구·지역·미래는 기본값으로 바꿔요', () => {
    ok(BODY_COLORS.some(c => c.id === clean.color), '몸 색'); ok(Object.prototype.hasOwnProperty.call(PETS, clean.pet), '동물 친구');
    ok(Object.prototype.hasOwnProperty.call(CLIMATE, clean.region), '지역'); ok(Object.prototype.hasOwnProperty.call(SCENARIOS, clean.scenario), '미래');
  });
  await test('숫자는 정해진 범위로 잘라요', () => { eq(clean.chapter, 3, '시대'); eq(clean.harvests, 99999, '수확'); eq(clean.cooked, 0, '요리'); eq(clean.dayIn, 1, '날짜'); });
  await test('옷의 모르는 값은 버리거나 기본값으로 바꿔요', () => {
    const o = clean.outfit;
    eq(o.top, 'tee', '윗옷'); eq(o.hat, 'none', '모자'); eq(o.fabric, null, '원단'); eq(o.details, ['mesh'], '꾸밈'); eq(o.shoes, 'sneakers', '신발');
    ok(noTags(o.name) && noTags(o.id), '옷 이름·번호에 꺾쇠가 남았어요');
  });
  await test('식탁은 아는 요리만 4칸에 남겨요', () => eq(clean.table, ['rice_bowl', null, 'kongguk', null]));
  await test('집은 아는 부품만 제자리에 남겨요', () => {
    eq(clean.house.floors, 1, '층수'); eq(clean.house.walls, [null, 'brick'], '벽'); eq(clean.house.roof, null, '지붕');
    eq(clean.house.roofTop, 'solar', '지붕 위'); eq(clean.house.yard, ['shade_tree', null, null], '마당');
  });
  await test('섬 번호는 영어·숫자·- 만 남겨요', () => ok(/^[a-z0-9-]{1,30}$/i.test(clean.id), clean.id));
  await test('객체가 아닌 자료는 버려요', () => { [null, undefined, 'str', 5, [1, 2]].forEach(v => eq(Plaza.cleanResident(v), null, show(v))); });
  await test('__proto__ 자료로 다른 객체를 오염시키지 못해요', () => {
    Plaza.cleanResident(JSON.parse('{"__proto__":{"polluted":1},"name":"a","outfit":{"__proto__":{"polluted":2}}}'));
    eq(({}).polluted, undefined);
  });
  await test('정상 자료는 다듬어도 그대로예요', () => {
    const s = G.newState({ name: '나래', color: 'sky', pet: 'otter' });
    s.outfits.push({ id: 'o1', name: '시원한 모시옷', top: 'shirt', color: 'white', fabric: 'fab_ramie_mesh', details: ['mesh'], hat: 'sunhat', shoes: 'sandals' });
    s.equipped = 'o1'; s.table = ['rice_bowl', 'kongguk', 'ssam', null];
    s.house.walls = ['brick', null]; s.house.windows[0][0] = 'dglass'; s.house.awnings[0][0] = true; s.house.roof = 'metalroof'; s.house.roofTop = 'greenroof'; s.house.yard = ['shade_tree', null, 'rain_barrel'];
    s.stats.harvests = 4; s.stats.cooked = 2;
    const r = Plaza.resident(s);
    eq(Plaza.cleanResident(JSON.parse(JSON.stringify(r))), r);
  });

  /* ---------- 섬 코드 ---------- */
  section('섬 코드');
  await test('섬 코드로 만들고 다시 읽으면 옷·식탁·집이 그대로예요', async () => {
    const s = G.newState({ name: '다온', color: 'mint', pet: 'bee' });
    s.outfits.push({ id: 'o2', name: '비옷', top: 'raincoat', color: 'yellow', fabric: null, details: ['hood'], hat: 'rainhat', shoes: 'boots' });
    s.equipped = 'o2'; s.table = ['soy_rice', null, 'jeon', null]; s.house.roof = 'woodroof';
    const code = await Plaza.encode({ ...s, k: 'yeoul', at: Date.now() });
    ok(/^YS1[zj]/.test(code), '코드 머리글자');
    const back = Plaza.cleanState(await Plaza.decode(code));
    eq([back.name, back.outfits, back.equipped, back.table, back.house.roof], [s.name, s.outfits, s.equipped, s.table, s.house.roof]);
  });
  await test('글 속에서 섬 코드를 찾아내요', () => {
    const a = 'YS1z' + 'A'.repeat(30), b = 'YS1j' + 'b_-'.repeat(10);
    eq(Plaza.findCodes(`나래: ${a}\n다온 → ${b} 끝`), [a, b]);
  });
  await test('섬 코드가 아니거나 너무 긴 글은 거절해요', async () => {
    const reject = async (code, what) => { let thrown = false; try { await Plaza.decode(code); } catch (e) { thrown = true; } ok(thrown, what); };
    await reject('hello', '일반 글');
    await reject('YS1j' + btoa('{"k":"other"}').replace(/=+$/, ''), '여울섬이 아닌 자료');
    await reject('YS1j' + 'A'.repeat(40000), '너무 긴 코드');
  });

  /* ---------- 실시간 광장 설정 ---------- */
  section('실시간 광장 설정 (Live)');
  const L = Live._test;
  await test('설정이 비어 있으면 실시간 광장이 꺼져요', () => { eq(L.readConfig({}), null); eq(L.readConfig(null), null); eq(L.readConfig({ apiKey: 'k' }), null); });
  await test('Firebase 주소만 받아요', () => {
    ok(L.readConfig({ apiKey: 'k', databaseURL: 'https://yeoul-plaza-default-rtdb.asia-southeast1.firebasedatabase.app' }), 'firebasedatabase.app');
    ok(L.readConfig({ apiKey: 'k', databaseURL: 'https://yeoul-plaza.firebaseio.com' }), 'firebaseio.com');
    ['https://evil.example.com', 'http://yeoul.firebaseio.com', 'javascript:alert(1)', 'https://firebaseio.com.evil.example'].forEach(u => eq(L.readConfig({ apiKey: 'k', databaseURL: u }), null, u));
  });
  await test('시험용 이 컴퓨터 주소는 받고, 바깥 로그인 주소로는 바꾸지 않아요', () => {
    const c = L.readConfig({ apiKey: 'k', databaseURL: 'http://localhost:9000/?ns=demo', authEmulator: 'https://evil.example.com' });
    eq([c.db.origin, c.db.ns, c.authBase], ['http://localhost:9000', 'demo', 'https://identitytoolkit.googleapis.com']);
  });
  await test('반 코드는 영어 소문자·숫자·- 로 4~24글자예요', () => {
    eq(L.normRoom('  Yeoul 3-2 '), 'yeoul-3-2');
    eq(['yeoul-3-2-k7m2', 'abcd', 'a'.repeat(24)].map(L.validRoom), [true, true, true]);
    eq(['abc', '3반', 'a'.repeat(25), 'a_b-c', 'a.b.c.d', ''].map(L.validRoom), [false, false, false, false, false, false]);
  });

  /* ---------- 실시간 자료 반영 ---------- */
  section('실시간 자료 반영 (applyEvent)');
  const ev = (path, data) => JSON.stringify({ path, data });
  await test('put은 그 자리를 바꾸고, null이면 지워요', () => {
    let root = L.applyEvent({}, ev('/', { u1: { n: 'a', at: 1 } }), false);
    root = L.applyEvent(root, ev('/u2', { n: 'b', at: 2 }), false);
    root = L.applyEvent(root, ev('/u1/at', 5), false);
    eq(root, { u1: { n: 'a', at: 5 }, u2: { n: 'b', at: 2 } });
    root = L.applyEvent(root, ev('/u1', null), false);
    eq(root, { u2: { n: 'b', at: 2 } });
    eq(L.applyEvent(root, ev('/', null), false), {}, '방 전체 삭제');
  });
  await test('patch는 여러 칸을 한꺼번에 고쳐요', () => {
    const root = L.applyEvent({ u1: { n: 'a', at: 1 } }, ev('/', { u2: { n: 'b', at: 2 }, 'u1/at': 9 }), true);
    eq(root, { u1: { n: 'a', at: 9 }, u2: { n: 'b', at: 2 } });
  });
  await test('이상한 사건(깨진 글, __proto__ 경로)은 버려요', () => {
    const root = { u1: { at: 1 } };
    eq(L.applyEvent(root, '{not json', false), root);
    eq(L.applyEvent(root, JSON.stringify({ data: 1 }), false), root, '경로 없음');
    L.applyEvent(root, ev('/__proto__/polluted', 1), false);
    L.applyEvent(root, ev('/u1/constructor', { x: 1 }), false);
    eq(({}).polluted, undefined, '오염');
    eq(root, { u1: { at: 1 } });
  });

  /* ---------- 친구 고르기 ---------- */
  section('실시간 친구 고르기 (pickFriends)');
  const NOW = 1_800_000_000_000, ON = NOW - 10_000, OFF = NOW - L.ONLINE_MS - 10_000;
  const entry = (name, island, at, extra = {}) => ({ v: 1, n: name, d: JSON.stringify({ id: island, name, color: 'peach', pet: 'bee', ...extra }), at });
  await test('서로 다른 섬은 모두 보이고, 접속 중인 친구가 먼저 와요', () => {
    const list = L.pickFriends({ u1: entry('하늘', 'i1', OFF), u2: entry('가람', 'i2', ON) }, { now: NOW });
    eq(list.map(r => [r.name, r.live.online]), [['가람', true], ['하늘', false]]);
  });
  await test('같은 섬이 둘 다 접속 중이면 둘 다 보여요(접속 중인 친구를 가릴 수 없어요)', () => {
    eq(L.pickFriends({ u1: entry('다온', 'i1', ON), u2: entry('흉내', 'i1', ON) }, { now: NOW }).length, 2);
  });
  await test('같은 섬이 하나만 접속 중이면 그것만 보여요', () => {
    eq(L.pickFriends({ u1: entry('옛날', 'i1', OFF), u2: entry('지금', 'i1', ON) }, { now: NOW }).map(r => r.name), ['지금']);
  });
  await test('같은 섬이 모두 쉬는 중이면 가장 최근 것 하나만 보여요', () => {
    eq(L.pickFriends({ u1: entry('옛날', 'i1', OFF - 5000), u2: entry('최근', 'i1', OFF) }, { now: NOW }).map(r => r.name), ['최근']);
  });
  await test('내 칸·내 섬·숨긴 친구는 빼요', () => {
    const list = L.pickFriends({ me: entry('나', 'x', ON), u1: entry('내다른기기', 'mine', ON), u2: entry('숨김', 'i2', ON), u3: entry('보임', 'i3', ON) },
      { now: NOW, myUid: 'me', mine: 'mine', roomCode: 'r1', hide: new Set(['r1/u2']) });
    eq(list.map(r => r.name), ['보임']);
  });
  await test('모양이 틀린 칸은 빼요', () => {
    // 서버에서 온 것처럼 JSON.parse로 만들어야 "__proto__"가 진짜 칸 이름이 돼요
    const entries = JSON.parse(JSON.stringify({
      a: { v: 1, n: 'x', d: { id: 'obj' }, at: ON }, b: { v: 1, n: 'x', d: 'not json', at: ON }, c: { v: 1, n: 'x', d: 'x'.repeat(8001), at: ON },
      d: 'string', proto: entry('proto', 'p', ON), ok1: entry('정상', 'i9', ON)
    }).replace('"proto":', '"__proto__":'));
    ok(Object.keys(entries).includes('__proto__'), '__proto__ 칸을 만들지 못했어요');
    const list = L.pickFriends(entries, { now: NOW });
    eq(list.map(r => r.name), ['정상']);
  });
  await test('실시간 친구 번호는 L+익명 번호, 이름은 다듬어져요', () => {
    const [r] = L.pickFriends({ 'u"><x': entry('<b>악당</b>', 'i1', ON) }, { now: NOW });
    eq(r.id, 'Lux'); ok(noTags(r.name), r.name); eq(r.island, 'i1');
  });
  await test(`한 번에 최대 ${L.MAX_LIVE}명까지 보여요`, () => {
    const many = {};
    for (let i = 0; i < 70; i++) many['u' + i] = entry('친구' + i, 'i' + i, ON - i);
    eq(L.pickFriends(many, { now: NOW }).length, L.MAX_LIVE);
  });

  /* ---------- 화면 글자 처리 ---------- */
  section('화면 글자 처리');
  await test('G.esc는 HTML 특수 문자를 모두 바꿔요', () => eq(G.esc(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;'));

  /* ---------- 파일 확인 (웹 서버로 열었을 때만) ---------- */
  section('파일 확인');
  const served = location.protocol === 'http:' || location.protocol === 'https:';
  await test('보안 규칙 파일이 올바른 JSON이고 핵심 규칙이 있어요', async () => {
    if (!served) return 'skip';
    const r = (await (await fetch('../firebase-rules.json', { cache: 'no-store' })).json()).rules;
    eq([r['.read'], r['.write']], [false, false], '맨 위 읽기·쓰기 금지');
    const res = r.rooms.$room.residents;
    eq(res['.read'], 'auth != null', '로그인한 사람만 읽기');
    ok(res.$uid['.write'].includes('auth.uid === $uid'), '자기 칸만 쓰기');
    ok(res.$uid['.write'].includes('$room.matches(/^[a-z0-9-]+$/)'), '반 코드 형식');
    eq(res.$uid.$other, { '.validate': false }, '다른 칸 금지');
    ok(res.$uid.d['.validate'].includes('<= 8000'), '자료 크기 제한');
  });
  await test('index.html이 부르는 파일이 모두 있어요', async () => {
    if (!served) return 'skip';
    const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
    const refs = [...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="stylesheet"[^>]+href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u));
    ok(refs.length >= 12, '참조 수 ' + refs.length);
    const missing = [];
    for (const u of refs) { const r = await fetch('../' + u, { cache: 'no-store' }); if (!r.ok) missing.push(u); }
    eq(missing, [], '없는 파일');
  });
  await test('배포본의 실시간 광장 설정이 비어 있어요(선생님이 채우기 전)', () => {
    if (Live.configured) return 'skip'; // 선생님이 설정을 채웠다면 이 항목은 건너뛰어요
  });

  /* ---------- 결과 그리기 ---------- */
  const out = document.getElementById('out');
  const groups = [...new Set(results.map(r => r.group))];
  out.innerHTML = groups.map(g => `<h2>${G.esc(g)}</h2><ul>${results.filter(r => r.group === g).map(r => `<li class="${r.state}">${G.esc(r.name)}${r.why ? `<small>${G.esc(r.why)}</small>` : ''}${r.state === 'skip' ? '<small>건너뜀(웹 서버로 열면 확인해요)</small>' : ''}</li>`).join('')}</ul>`).join('');
  const pass = results.filter(r => r.state === 'ok').length, fail = results.filter(r => r.state === 'bad').length, skip = results.filter(r => r.state === 'skip').length;
  const sum = document.getElementById('summary');
  sum.textContent = `통과 ${pass} · 실패 ${fail} · 건너뜀 ${skip}`;
  sum.className = fail ? 'bad' : 'ok';
  sum.dataset.done = '1';
  document.title = `${fail ? '실패' : '통과'} ${pass}/${pass + fail} · 여울섬 자동 시험`;
  window.__testResults = { pass, fail, skip, results };
})();
