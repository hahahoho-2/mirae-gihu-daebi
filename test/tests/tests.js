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

  /* ---------- 기후 대비 공통 규칙 ---------- */
  section('기후 대비 공통 규칙 (Mission: 대비 단계·용품·여름 날씨)');
  const stateFor = (region, scenario, chapter = 1) => { const s = G.newState({ name: '시험', color: 'peach', pet: 'bee' }); Object.assign(s, { region, scenario, chapter }); Mission.applyAll(s); return s; };
  const own = (s, ids) => { ids.forEach(id => { s.owned[id] = true; }); Mission.applyAll(s); return s; };
  await test('새 판은 3분·1시대에서 시작하고, 시작 전에는 시간이 흐르지 않아요', () => {
    const s = G.newState({ name: '시험', color: 'peach', pet: 'bee' });
    eq([s.v, s.timeLeft, s.coins, s.chapter, s.quest, s.started, s.finished], [3, TIME_LIMIT, ERA_COINS[1], 1, 0, false, false]);
    eq(TIME_LIMIT, 180, '3분');
  });
  await test('폭염일수로 대비 단계를 정해요 (30일·50일 경계)', () => {
    eq([29.9, 30, 49.9, 50, 120].map(Mission.levelIndex), [0, 1, 1, 2, 2]);
    const want = { '용인시': { low: [1, 2, 2], high: [1, 2, 3] }, '서울특별시': { low: [2, 2, 2], high: [2, 3, 3] } };
    Object.entries(want).forEach(([r, byS]) => Object.entries(byS).forEach(([sc, lv]) => eq([1, 2, 3].map(c => Mission.level(c, stateFor(r, sc)).no), lv, `${r} ${sc}`)));
  });
  await test('대비 단계가 오를수록 목표도 높아지고, 갖출 수 있는 용품 수를 넘지 않아요', () => {
    const keys = ['clothHeat', 'clothRain', 'foodHeat', 'foodRain', 'houseHeat', 'houseRain'];
    keys.forEach(k => LEVELS.slice(1).forEach((l, i) => ok(l[k] >= LEVELS[i][k], `${k} ${i + 1}→${i + 2}`)));
    const avail = { 의: { heat: 0, rain: 0 }, 식: { heat: 0, rain: 0 }, 주: { heat: 0, rain: 0 } };
    MEASURES.forEach(m => avail[m.part][m.risk]++);
    LEVELS.forEach(l => Object.entries(PART_INFO).forEach(([p, info]) => { ok(l[info.heat] <= avail[p].heat, `${l.name} ${p} 폭염`); ok(l[info.rain] <= avail[p].rain, `${l.name} ${p} 호우`); }));
  });
  await test('대비 용품: 번호가 겹치지 않고, 값·종류·설명이 알맞아요', () => {
    eq(new Set(MEASURES.map(m => m.id)).size, MEASURES.length, '번호 중복');
    MEASURES.forEach(m => { ok(PART_INFO[m.part] && Mission.RISK[m.risk], m.id + ' 종류'); ok(Number.isInteger(m.cost) && m.cost > 0, m.id + ' 값'); ok(m.note.length > 10 && m.name, m.id + ' 설명'); });
  });
  await test('예산 안에서 1시대 목표를 모두 채울 수 있어요(예측을 맞혔을 때)', () => {
    Object.keys(CLIMATE).forEach(r => Object.keys(SCENARIOS).forEach(sc => {
      const s = stateFor(r, sc), L = Mission.level(1, s);
      if (L.no > 1) return; // 2단계로 시작하는 미래는 1시대에 다 못 채울 수 있어요(뒤 시대에 이어서)
      let cost = 0;
      Object.entries(PART_INFO).forEach(([p, info]) => ['heat', 'rain'].forEach(k => {
        const need = L[info[k]], prices = MEASURES.filter(m => m.part === p && m.risk === k).map(m => m.cost).sort((a, b) => a - b);
        cost += prices.slice(0, need).reduce((a, b) => a + b, 0);
      }));
      ok(cost <= ERA_COINS[1] + FORECAST_BONUS, `${r} ${sc}: ${cost}코인 필요`);
    }));
  });
  await test('산 용품이 옷·집·밭 모습에 그대로 반영돼요', () => {
    const s = stateFor('용인시', 'low');
    eq([s.outfits.length, s.outfits[0].top, s.outfits[0].color, Build.isBuilt(s.house), Build.checks(s.house).heatOk], [1, 'cardigan', 'navy', true, 0], '처음');
    own(s, ['c_white', 'c_loose', 'c_coat', 'f_crops', 'f_drain', 'h_awning', 'h_roof', 'h_base']);
    eq([s.outfits[0].top, s.outfits[0].color, s.outfits[1].top, s.plots[0].crop, s.plots[0].drain, s.table[2]], ['tee', 'white', 'raincoat', 'sweet', true, 'jeon']);
    const c = Mission.counts(s);
    eq([c.의.heat, c.의.rain, c.식.heat, c.식.rain, c.주.heat, c.주.rain], [2, 1, 1, 1, 2, 1]);
    ok(Tailor.scores(s.outfits[0]).heat > Tailor.scores({ top: 'cardigan', color: 'navy', fabric: 'fab_cotton_plain', details: [], hat: 'none', shoes: 'sneakers' }).heat, '더위 ★도 올라요');
  });
  await test('사기: 예산이 모자라거나 이미 있거나 판이 끝났으면 못 사요', () => {
    const s = stateFor('용인시', 'low'); s.coins = 4;
    eq(Mission.buy(s, 'c_coat').ok, false, '모자람'); eq(s.coins, 4);
    eq(Mission.buy(s, 'c_white'), { ok: true, cost: 2 }); eq([s.coins, s.owned.c_white, s.outfits[0].color], [2, true, 'white']);
    eq(Mission.buy(s, 'c_white').ok, false, '이미 있음');
    eq(Mission.buy(s, 'nope').ok, false, '없는 물건');
    s.finished = true; s.coins = 50; eq(Mission.buy(s, 'c_hat').ok, false, '끝난 판');
  });
  await test('예측 문제: 시대마다 정답이 하나이고 자료와 맞아요', () => {
    Object.keys(CLIMATE).forEach(r => Object.keys(SCENARIOS).forEach(sc => [1, 2, 3].forEach(c => {
      const s = stateFor(r, sc, c), fq = Mission.forecastQuestion(c, s), H = CLIMATE[r].heat, where = `${r} ${sc} ${c}`;
      eq(fq.options.filter(o => o[1]).length, 1, where + ' 정답 수');
      eq(new Set(fq.options.map(o => o[0])).size, fq.options.length, where + ' 보기 중복');
      const right = fq.options.find(o => o[1])[0];
      if (c === 1) eq(right, `${G.fmtNum(H[sc][1])}일`, where);
      if (c === 2) eq(right, `약 ${Math.round(H[sc][2] / H[sc][0])}배`, where);
      if (c === 3) eq(right, `약 ${Math.round(H.high[3] / H.low[3])}배`, where);
    })));
  });
  await test('여름 5일: 폭염일 수는 그 시대 비율대로, 집중호우는 하루', () => {
    Object.keys(CLIMATE).forEach(r => Object.keys(SCENARIOS).forEach(sc => [1, 2, 3].forEach(c => {
      const s = stateFor(r, sc, c), plan = Mission.livePlan(c, s);
      const p = G.clamp(CLIMATE[r].heat[sc][c] / SUMMER_DAYS, 0.05, 0.8), nHeat = G.clamp(Math.round(SUMMER_LIVE_DAYS * p), 1, SUMMER_LIVE_DAYS - 1);
      eq([plan.length, plan.filter(w => w === 'heat').length, plan.filter(w => w === 'storm').length], [SUMMER_LIVE_DAYS, nHeat, 1], `${r} ${sc} ${c}`);
      eq(Mission.livePlan(c, s), plan, '같은 섬이면 같은 날씨');
    })));
  });
  await test('하루 점검: 목표만큼 갖추면 통과, 모자라면 몇 개가 모자란지 알려 줘요', () => {
    const s = own(stateFor('용인시', 'low'), ['c_white', 'c_loose', 'c_boots', 'f_crops', 'f_drain', 'h_tree', 'h_awning', 'h_barrel']); // 1단계 목표
    eq(Mission.dayCheck('heat', s).map(x => [x.p, x.ok]), [['의', true], ['식', true], ['주', true]], '폭염');
    eq(Mission.dayCheck('storm', s).map(x => x.ok), [true, true, true], '집중호우');
    eq(Mission.dayCheck('sunny', s), [], '보통 날은 점검 없음');
    s.chapter = 2; // 2050년대 저탄소 = 2단계 목표
    const hot = Mission.dayCheck('heat', s);
    eq(hot.map(x => x.ok), [false, false, false], '목표가 오르면 모자라요');
    ok(/폭염 대비 2\/3개/.test(hot[0].t), hot[0].t);
  });
  await test('비가림 온실만 있고 밭 차양이 없으면 폭염 날 먹거리 점검에서 떨어져요', () => {
    const s = own(stateFor('용인시', 'low'), ['f_crops', 'f_cover']);
    const f = Mission.dayCheck('heat', s).find(x => x.p === '식');
    eq(f.ok, false); ok(/차양/.test(f.t), f.t);
    own(s, ['f_shade']); eq(Mission.dayCheck('heat', s).find(x => x.p === '식').ok, true, '차양을 하면 통과');
  });
  await test('점수: 점검 통과 10점, 예측 10점, 순위는 얻은 비율로', () => {
    const e = { fc: { answer: 0, correct: true }, started: true, done: true, next: true, days: [{ w: 'heat', c: [['의', 1], ['식', 0], ['주', 1]] }, { w: 'sunny', c: [] }, { w: 'storm', c: [['의', 1], ['식', 1], ['주', 1]] }] };
    eq(Mission.eraScore(e), { got: 60, max: 70, pass: 5, n: 6 });
    const s = stateFor('용인시', 'low'); s.eras = { 1: e }; s.timeBonus = 12;
    const t = Mission.totals(s);
    eq([t.got, t.max, t.total, t.rank.name], [60, 70, 72, RANKS[0].name]);
    eq(Mission.clock(300), '5:00'); eq(Mission.clock(59), '0:59'); eq(Mission.clock(-3), '0:00');
  });
  await test('퀘스트 흐름: 시대마다 예측 → 준비 → 체험 → 돌아보기, 마지막은 광장', () => {
    [1, 2, 3].forEach(e => eq(QUESTS.filter(q => q.era === e && q.id !== 'end').map(q => q.stage), STAGE_ORDER, `${e}번째 시대`));
    eq(QUESTS[QUESTS.length - 1].steps[0].place, 'board');
    const STATS = ['forecast', 'started', 'done', 'next', 'never'];
    QUESTS.forEach(q => q.steps.forEach(st => ok(STATS.includes(st.stat), q.id + ' ' + st.stat)));
  });

  /* ---------- ⚡ 3분 스피드 미션 ---------- */
  section('⚡ 3분 스피드 미션 (Speed)');
  const allIds = [...MEASURES.map(m => m.id), ...BAD_CARDS.map(b => b.id)];
  await test('카드: 번호가 겹치지 않고, 의·식·주와 설명이 있어요', () => {
    eq(new Set(allIds).size, allIds.length, '번호 중복');
    allIds.forEach(id => { const c = Speed.cardOf(id); ok(c && PART_INFO[c.part] && c.name && c.note.length > 10, id); ok(['heat', 'rain', 'bad'].includes(c.kind), id + ' 종류'); });
    eq(Speed.cardOf('nope'), null);
  });
  await test('시대별 카드: 대비 카드는 세 시대에 한 번씩, 도움 안 되는 카드는 시대마다 정한 수만큼 나와요', () => {
    [7, 12345, 999999].forEach(seed => {
      const d = Speed.decks(seed), all = [1, 2, 3].flatMap(e => d[e]);
      [1, 2, 3].forEach(e => {
        const k = kind => d[e].filter(id => Speed.cardOf(id).kind === kind).length;
        eq([k('heat'), k('rain'), k('bad')], SPEED.deck[e], `${seed} ${e}시대`);
      });
      eq(new Set(all).size, all.length, '같은 카드가 두 번');
      MEASURES.forEach(m => ok(all.includes(m.id), m.id + ' 빠짐'));
      eq(Speed.decks(seed), d, '같은 섬이면 같은 카드');
    });
    ok(show(Speed.decks(1)) !== show(Speed.decks(2)), '판마다 순서가 달라요');
  });
  await test('목표: 대비 단계·시대가 높을수록 커지고, 그때까지 나온 카드 수를 넘지 않아요', () => {
    [1, 2, 3].forEach(e => {
      const o = Speed.offered(e);
      [0, 1, 2].forEach(lv => { const t = Speed.target(lv, e); ok(t.heat >= 1 && t.rain >= 1 && t.heat <= o.heat && t.rain <= o.rain, `${e}시대 ${lv + 1}단계`); });
      ok(Speed.target(2, e).heat >= Speed.target(1, e).heat && Speed.target(1, e).heat >= Speed.target(0, e).heat, `${e}시대 단계 순서`);
    });
    eq([Speed.offered(3).heat, Speed.offered(3).rain], [MEASURES.filter(m => m.risk === 'heat').length, MEASURES.filter(m => m.risk === 'rain').length], '모든 대비 카드');
    eq(Speed.target(2, 3), { heat: 11, rain: 6 });
  });
  await test('정답 판정: 폭염·집중호우 대비는 그 종류, 도움 안 되는 행동은 🚫만 정답', () => {
    MEASURES.forEach(m => { ok(Speed.judge(m.id, m.risk), m.id); ok(!Speed.judge(m.id, 'bad'), m.id + ' 🚫'); });
    BAD_CARDS.forEach(b => { ok(Speed.judge(b.id, 'bad'), b.id); ok(!Speed.judge(b.id, 'heat') && !Speed.judge(b.id, 'rain'), b.id + ' 대비'); });
    ok(!Speed.judge('c_white', null), '시간 초과는 오답');
  });
  await test('예측 플래시 정답(대비 단계)은 그 시대 그 미래의 폭염일수로 정해요', () => {
    const want = { '용인시': { low: [0, 1, 1], high: [0, 1, 2] }, '서울특별시': { low: [1, 1, 1], high: [1, 2, 2] } };
    Object.entries(want).forEach(([r, byS]) => Object.entries(byS).forEach(([sc, lv]) => eq([1, 2, 3].map(e => Speed.levelOf(e, stateFor(r, sc)).lv), lv, `${r} ${sc}`)));
  });
  await test('여름 5일: 폭염일은 ☀️, 집중호우일은 ☔ 대비가 목표만큼 있어야 버텨요', () => {
    const s = stateFor('서울특별시', 'high'), t = Speed.target(Speed.levelOf(3, s).lv, 3);
    const enough = Speed.summer(3, s, { heat: t.heat, rain: t.rain }), short = Speed.summer(3, s, { heat: t.heat - 1, rain: t.rain - 1 });
    eq(enough.map(d => d.w), Mission.livePlan(3, s), '날씨는 기후 비율대로');
    enough.forEach(d => eq(d.ok, d.w === 'heat' || d.w === 'storm' ? true : null, d.w));
    short.forEach(d => eq(d.ok, d.w === 'heat' || d.w === 'storm' ? false : null, d.w + ' 모자람'));
  });
  await test('점수: 카드 10점, 1.5초 안이면 ⚡+5, 3콤보부터 🔥+5, 순위는 기본 점수 비율로', () => {
    eq([Speed.cardPoints(3000, 1), Speed.cardPoints(1200, 1), Speed.cardPoints(3000, 3), Speed.cardPoints(900, 5)], [10, 15, 15, 20]);
    const s = stateFor('용인시', 'low');
    const days = [1, 2, 3].reduce((t, e) => t + Mission.livePlan(e, s).filter(w => w === 'heat' || w === 'storm').length, 0);
    eq(Speed.maxBase(s), 3 * 20 + 26 * 10 + days * 10);
    eq([Speed.rankOf(0.9).name, Speed.rankOf(0.7).name, Speed.rankOf(0.1).name], RANKS.map(r => r.name));
  });

  /* ---------- 저장·섬 코드 ---------- */
  section('저장 기록 다듬기');
  await test('3분 미션 결과 기록의 이상한 값은 버리거나 범위로 잘라요', () => {
    const s = Plaza.cleanState({ k: 'yeoul', v: 3, name: '나래', speed: { done: true, timeUp: 'y', score: 1e9, bonus: -4, best: 99, right: 'x', total: 26, base: 390, max: 430, left: 999,
      wrong: ['c_white', 'hack', 7, 'x_dark'], eras: { 1: { lv: 9, fc: 'y', heat: [99, '<b>'], rain: [1, 1], right: 7, total: 8, days: [['<x>', 5], ['heat', 1], 'bad'] }, 7: {} } } });
    eq([s.speed.score, s.speed.bonus, s.speed.best, s.speed.right, s.speed.left, s.speed.timeUp], [9999, 0, 40, 0, TIME_LIMIT, true]);
    eq(s.speed.wrong, ['c_white', 'x_dark'], '아는 카드만');
    eq(Object.keys(s.speed.eras), ['1']);
    eq(s.speed.eras['1'], { lv: LEVELS.length - 1, fc: 1, heat: [20, 0], rain: [1, 1], right: 7, total: 8, days: [['sunny', 1], ['heat', 1], ['sunny', -1]] });
    eq(Plaza.cleanState({ k: 'yeoul', v: 3, name: '나래', speed: { done: 'yes', score: 5 } }).speed, null, '끝나지 않은 판은 버려요');
  });
  await test('산 용품·시간·시대 기록의 이상한 값은 버리거나 범위로 잘라요', () => {
    const s = Plaza.cleanState({ k: 'yeoul', v: 3, name: '나래', coins: 1e12, timeLeft: 9999, started: 1, finished: 'y', timeBonus: 500,
      owned: { c_white: true, hack: true, h_roof: 'yes', __proto__: { polluted: 1 } },
      eras: { 1: { fc: { answer: 9, correct: 'y' }, started: 1, done: 1, days: [{ w: '<b>', c: [['의', 1], ['<x>', 'y']] }, 'bad'] }, 9: {} } });
    eq([s.coins, s.timeLeft, s.started, s.finished, s.timeBonus], [99999, TIME_LIMIT, true, true, Math.ceil(TIME_LIMIT / 6)]);
    eq(s.owned, { c_white: true }, '아는 용품만');
    eq(Object.keys(s.eras), ['1']);
    eq(s.eras['1'], { fc: { answer: 3, correct: true }, started: true, done: true, next: false, days: [{ w: 'sunny', c: [['의', 1], ['식', 1]] }] });
    eq(({}).polluted, undefined, '오염');
  });
  await test('예전 판의 섬 코드는 같은 캐릭터로 미션을 처음부터 해요', () => {
    const s = Plaza.cleanState({ k: 'yeoul', v: 2, name: '옛날', color: 'mint', chapter: 3, quest: 9, coins: 500, owned: { c_white: true }, timeLeft: 10 });
    eq([s.name, s.color, s.chapter, s.quest, s.coins, s.owned, s.timeLeft, s.started], ['옛날', 'mint', 1, 0, ERA_COINS[1], {}, TIME_LIMIT, false]);
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
