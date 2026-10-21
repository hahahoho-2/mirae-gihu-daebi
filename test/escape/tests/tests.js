/* ==========================================================================
   2045 미래하우스 탈출 자동 시험 — tests/test.html에서 불러요
   - 시험 전에 이 기기의 게임 기록(저장·최고 기록·꾸미기 지갑)을 보관했다가 끝나면 되돌려요.
   - 화면 흐름 시험과 파일 확인은 웹 서버(또는 온라인 주소)로 열었을 때만 해요.
   ========================================================================== */
(async () => {
  const KEYS = ['yeoul-future-escape-v1', 'yeoul-future-best-v1', 'yeoul-future-closet-v1'];
  const kept = {};
  try { KEYS.forEach(k => { kept[k] = localStorage.getItem(k); }); } catch (e) { /* 저장 공간 없음 */ }
  const restore = () => { try { KEYS.forEach(k => { if (kept[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, kept[k]); }); } catch (e) { /* 무시 */ } };
  const wipe = () => { try { KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) { /* 무시 */ } };
  wipe();

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
  const solveAll = ids => ids.forEach(id => { const r = E.submit(id, E.answerOf(id)); ok(r.ok, id + ' 풀이 실패'); });
  const fresh = (o = {}) => { E.start(Object.assign({ name: '시험', look: 'cat', job: 'farm', mode: 'normal', seed: 7 }, o)); E.begin(); return E.get(); };
  const ROOM_LOCKS = ['L1', 'F1', 'F2', 'W1', 'W2', 'H1', 'H2'];
  const allClues = () => Object.keys(CLUES).forEach(c => { E.get().clues[c] = true; });

  try {
    /* ---------- 불러오기 ---------- */
    section('불러오기');
    await test('자료와 규칙 스크립트를 오류 없이 불러와요', () => { eq(window.__loadErrors, [], '불러오기 오류'); ok(typeof E === 'object' && typeof LOCKS === 'object', 'E, LOCKS'); });

    /* ---------- 자료 짝 맞음 ---------- */
    section('퍼즐 자료');
    await test('방 물건의 단서·자물쇠가 모두 있고 자물쇠의 방·물건이 서로 맞아요', () => {
      Object.entries(ROOMS).forEach(([r, R]) => {
        R.objects.forEach(o => {
          if (o.clue) ok(CLUES[o.clue] && CLUES[o.clue].room === r, `${r}.${o.id} 단서`);
          if (o.lock) ok(LOCKS[o.lock] && LOCKS[o.lock].room === r && LOCKS[o.lock].obj === o.id, `${r}.${o.id} 자물쇠`);
        });
        R.locks.forEach(id => ok(R.objects.some(o => o.lock === id), `${r}의 ${id}가 화면에 없어요`));
      });
    });
    await test('단서 카드는 모두 어느 방의 물건 하나에서 찾을 수 있어요', () => {
      Object.keys(CLUES).forEach(c => eq(Object.values(ROOMS).flatMap(R => R.objects).filter(o => o.clue === c).length, 1, c));
    });
    await test('퍼즐의 관련 단서가 모두 있어요', () => Object.entries(LOCKS).forEach(([id, L]) => (L.uses || []).forEach(c => ok(CLUES[c], `${id}: ${c}`))));
    await test('칸 나누기 정답은 칸 안에 있고, 칸마다 하나 이상 들어가요', () => Object.entries(LOCKS).filter(([, L]) => L.type === 'sort').forEach(([id, L]) => {
      L.items.forEach(it => ok(it.a >= 0 && it.a < L.bins.length && it.why, id));
      L.bins.forEach((b, k) => ok(L.items.some(it => it.a === k), `${id}: ${b} 칸이 비어요`));
    }));
    await test('고르기 퍼즐(손님 의뢰 포함)은 칸마다 정답이 정확히 1개이고 이유가 있어요', () => {
      const all = Object.entries(LOCKS).filter(([, L]) => L.type === 'slots').map(([id, L]) => [id, L.slots]).concat(PERSONAS.map(P => [P.id, P.slots]));
      all.forEach(([id, slots]) => slots.forEach(sl => { eq(sl.opts.filter(o => o.ok).length, 1, `${id} ${sl.name}`); sl.opts.forEach(o => ok(o.why, `${id} ${o.t} 이유`)); }));
      PERSONAS.forEach(P => eq(P.slots.length, 4, P.id + ' 칸 수'));
    });
    await test('다중 인증 퍼즐의 인증 방법은 세 종류에 두 개씩 있어요', () => {
      const L = LOCKS.H2; Object.keys(L.kinds).forEach(k => eq(L.items.filter(it => it.k === k).length, 2, k)); eq(L.pick, 2, '고르는 수');
    });
    await test('바이러스를 이길 카드는 방에서 찾을 수 있고, 일반 태도 카드(비판적 수용)는 정답이 아니에요', () => MONSTERS.forEach(m => {
      ok(m.ok.length, m.id); m.ok.forEach(c => ok(CLUES[c] && CLUES[c].room !== 'lobby', `${m.id}: ${c}`)); ok(!m.ok.includes('c_critical'), m.id);
    }));
    await test('미래 직업의 전문 방은 열쇠 방 중 하나예요', () => JOBS.forEach(j => ok(KEY_ROOMS.includes(j.room), j.id)));

    /* ---------- 규칙 ---------- */
    section('규칙');
    await test('새 판: 고른 모드의 시간, 코인 30, 힌트 열쇠 2, 손님은 판마다 정해져요', () => {
      const s = fresh({ mode: 'fast' }); eq([s.time, s.limit, s.coins, s.hints], [420, 420, 30, 2]); ok(PERSONAS[s.persona], '손님');
      eq(E.newState({ seed: 4 }).persona, 4 % PERSONAS.length, '씨앗으로 정한 손님');
    });
    await test('순서: 안내실 문을 열어야 복도로, 첫 자물쇠를 열어야 두 번째, 열쇠 3개여야 탈출 문', () => {
      fresh();
      ok(!E.canGo('hall') && !E.available('F1'), '처음'); solveAll(['L1']); ok(E.canGo('hall') && E.canGo('food'), '안내실 뒤');
      ok(!E.available('F2'), 'F2는 아직'); eq(E.submit('F2', E.answerOf('F2')).blocked, true, 'F2 막힘');
      solveAll(['F1', 'F2', 'W1', 'W2', 'H1']); ok(!E.canGo('gate'), '열쇠 2개'); solveAll(['H2']); ok(E.canGo('gate'), '열쇠 3개'); eq(E.keys(), 3);
      ok(!E.available('FINAL'), '바이러스 전에는 의뢰 잠김');
    });
    await test('한 번에 풀면 별 3개·20XP·코인 15, 한 번 틀리면 별 2개·15XP·코인 10', () => {
      fresh({ job: 'home' });
      const r = E.submit('L1', E.answerOf('L1')); eq([r.stars, r.xp, r.coin], [3, 20, 15]);
      const w = E.answerOf('F1').map(a => (a + 1) % 3); E.submit('F1', w);
      const r2 = E.submit('F1', E.answerOf('F1')); eq([r2.stars, r2.xp, r2.coin], [2, 15, 10]);
    });
    await test('틀리면 10초가 줄고, 몇 개가 맞았는지 알려 줘요', () => {
      fresh({ job: 'home' }); const t = E.get().time;
      const ans = E.answerOf('L1'); ans[0] = (ans[0] + 1) % 4;
      const r = E.submit('L1', ans); eq([r.ok, r.right, r.total, r.pen], [false, 3, 4, 10]); eq(E.get().time, t - 10);
    });
    await test('내 전문 방에서는 틀려도 시간이 줄지 않고, 그 방을 열면 코인 +15', () => {
      fresh({ job: 'farm' }); solveAll(['L1']); const t = E.get().time;
      const w = E.answerOf('F1').map(a => (a + 1) % 3); eq(E.submit('F1', w).pen, -2, '전문 방'); eq(E.get().time, t);
      solveAll(['F1']); const r = E.submit('F2', E.answerOf('F2')); eq([r.room, r.bonus], ['food', 15]);
    });
    await test('실수 방패는 다음 실수 1번의 시간 감점을 막아요', () => {
      fresh({ job: 'home' }); E.get().shield = 1; const t = E.get().time;
      const ans = E.answerOf('L1'); ans[1] = (ans[1] + 1) % 4;
      eq(E.submit('L1', ans).pen, -1); eq(E.get().time, t); eq(E.submit('L1', ans).pen, 10); eq(E.get().time, t - 10);
    });
    await test('다중 인증: 같은 종류 2개는 틀리고(이유 안내), 다른 종류 2개면 어떤 조합이든 열려요', () => {
      const L = LOCKS.H2, idx = t => L.items.findIndex(x => x.t.includes(t));
      fresh({ job: 'farm' }); solveAll(['L1', 'H1']);
      const r = E.submit('H2', [idx('비밀번호'), idx('보안 질문')]); ok(!r.ok && /같은 종류/.test(r.why), r.why);
      eq(E.submit('H2', [idx('지문')]).pen, 0, '1개만 고르면 감점 없음');
      ok(E.submit('H2', [idx('스마트카드'), idx('얼굴')]).ok, '소유+생체');
      fresh({ job: 'farm' }); solveAll(['L1', 'H1']); ok(E.submit('H2', [idx('보안 질문'), idx('NFC')]).ok, '지식+소유');
    });
    await test('손님 의뢰의 정답은 그 판의 손님에 맞춰 바뀌어요', () => PERSONAS.forEach((P, i) => {
      E.start({ name: '시험', seed: 1, persona: i }); E.begin(); eq(E.get().persona, i);
      eq(E.answerOf('FINAL'), P.slots.map(sl => sl.opts.findIndex(o => o.ok)), P.id);
    }));
    await test('힌트: 열쇠 → (열쇠가 없으면) 30초 → 3번 틀리면 무료', () => {
      fresh({ job: 'home' }); eq(E.hintState('L1'), 'key'); eq(E.takeHint('L1'), 'key'); eq(E.get().hints, 1); eq(E.hintState('L1'), 'seen');
      E.get().hints = 0; const t = E.get().time; eq(E.takeHint('F1'), 'time'); eq(E.get().time, t - 30);
      solveAll(['L1']); const ans = E.answerOf('W1').map(a => (a + 1) % 3); [1, 2, 3].forEach(() => E.submit('W1', ans)); eq(E.hintState('W1'), 'free');
      const h = E.get().hints; E.takeHint('W1'); eq(E.get().hints, h, '무료');
      eq(E.submit('W1', E.answerOf('W1')).stars, 1, '3번 틀리면 별 1개');
    });
    await test('AI 돋보기: 정답 한 칸을 알려 주고 1개 줄며, 힌트처럼 별이 1개 줄어요', () => {
      fresh({ job: 'home' }); E.get().lens = 2;
      const r = E.lens('L1'); ok(r && /→/.test(r.text), '알려 준 글'); eq(E.get().lens, 1);
      eq(E.submit('L1', E.answerOf('L1')).stars, 2);
      E.get().lens = 0; eq(E.lens('F1'), null, '돋보기가 없으면');
    });
    await test('상점: 코인이 모자라면 못 사고, 시간 충전은 +60초씩 3번까지예요', () => {
      fresh(); E.get().coins = 10; ok(!E.buy('hint').ok, '모자람');
      E.get().coins = 500; const t = E.get().time;
      ok(E.buy('hint').ok && E.buy('lens').ok && E.buy('shield').ok, '사기'); eq([E.get().hints, E.get().lens, E.get().shield], [3, 1, 1]);
      [1, 2, 3].forEach(() => ok(E.buy('time').ok)); ok(!E.buy('time').ok, '4번째'); eq(E.get().time, t + 180);
      eq(E.get().coins, 500 - 20 - 30 - 15 - 120);
    });
    await test('단서는 처음 볼 때만 코인 +5를 받아요', () => {
      fresh(); eq(E.seeClue('lobby', 'whiteboard', 'c_factors'), 5); eq(E.seeClue('lobby', 'whiteboard', 'c_factors'), 0); eq(E.get().coins, 35); ok(E.get().clues.c_factors);
    });
    await test('방을 열면 그 방의 단서가 모두 수첩에 들어가요', () => {
      fresh(); solveAll(['L1', 'W1', 'W2']); E.roomClues('cloth').forEach(c => ok(E.get().clues[c], c));
    });
    await test('바이러스: 열쇠 3개 전에는 못 싸우고, 일반 카드는 감점 없이 안내, 틀린 카드는 감점', () => {
      fresh({ job: 'home' }); solveAll(['L1', 'F1', 'F2', 'W1', 'W2']); allClues();
      ok(E.attack('m1', ['c_insect']).blocked, '열쇠 부족');
      solveAll(['H1', 'H2']); const t = E.get().time;
      const g = E.attack('m1', ['c_critical']); ok(g.general && g.pen === 0, '일반 카드'); eq((E.get().fights.m1 || {}).wrong || 0, 0);
      eq(E.attack('m1', ['c_sensor']).pen, 10); eq(E.get().time, t - 10);
      ok(E.attack('m2', ['c_meta']).blocked, '순서를 지켜요');
      ok(E.attack('m1', ['c_plant']).ok, 'm1'); ok(E.attack('m2', ['c_meta']).ok, 'm2'); ok(!E.attack('m3', ['c_3dcloth']).ok, '3D 의류는 집 주장과 달라요'); ok(E.attack('m3', ['c_3dhouse']).ok, 'm3');
      ok(E.available('FINAL'), '의뢰 열림');
    });
    await test('끝까지 모두 한 번에 풀면: 탈출, XP 220, 별 33개, Lv.5, 점수 = XP + 남은 시간÷10', () => {
      fresh({ job: 'home' }); solveAll(ROOM_LOCKS); allClues();
      MONSTERS.forEach(m => ok(E.attack(m.id, [m.ok[0]]).ok, m.id));
      const r = E.submit('FINAL', E.answerOf('FINAL')); ok(r.ok && r.escaped, '탈출');
      eq([E.get().end, E.get().xp, E.stars(), E.level(), E.totalTasks()], ['escaped', 220, 33, 4, 11]);
      eq(E.score(), 220 + Math.floor(E.get().time / 10)); ok(!E.canAct(), '끝난 뒤에는 멈춰요');
      ok(E.best() && E.best().score === E.score(), '최고 기록');
    });
    await test('시간이 다 되면 멈추고, 연습 모드로 끝까지 풀면 연습 탈출로 남아요(기록 없음)', () => {
      wipe(); fresh({ job: 'home' }); E.get().time = 2; E.tick(); E.tick();
      eq(E.get().end, 'timeup'); ok(!E.canAct(), '멈춤'); ok(E.submit('L1', E.answerOf('L1')).blocked, '못 풀어요');
      E.practice(); ok(E.canAct(), '연습'); const t = E.get().time; E.tick(); eq(E.get().time, t, '연습에는 시간이 안 흘러요');
      ok(!E.buy('time').ok, '연습에는 시간 충전 없음');
      solveAll(ROOM_LOCKS); allClues(); MONSTERS.forEach(m => E.attack(m.id, [m.ok[0]])); E.submit('FINAL', E.answerOf('FINAL'));
      eq([E.get().end, E.get().practiceDone], ['timeup', true]); eq(E.best(), null, '최고 기록 없음');
    });
    await test('꾸미기 지갑: 끝난 판의 코인은 한 번만 옮겨지고, 아이템을 사면 입고 다시 누르면 벗어요', () => {
      wipe(); fresh(); ok(E.bank() === 0, '진행 중에는 안 옮겨요');
      E.get().coins = 70; E.get().end = 'escaped'; eq(E.bank(), 70); eq(E.bank(), 0, '두 번째');
      ok(!E.buyLook('nope').ok); ok(E.buyLook('glasses').ok); eq(E.closet().coins, 40); eq(E.wearing(), ['glasses']);
      ok(E.buyLook('glasses').toggled); eq(E.wearing(), []); ok(!E.buyLook('cape').ok, '모자람');
    });

    /* ---------- 저장 기록 다듬기 ---------- */
    section('저장 기록 다듬기 (E.sanitize)');
    await test('이상한 기록은 버려요', () => { [null, 1, 'x', {}, { k: 'yeoul-future', v: 2 }, { k: 'other', v: 1 }].forEach(x => eq(E.sanitize(x), null, show(x))); });
    await test('글자·숫자는 범위 안으로, 모르는 값은 기본값으로 바꿔요', () => {
      const s = E.sanitize({ k: 'yeoul-future', v: 1, name: '<img src=x>해커', look: '__proto__', job: 'constructor', mode: 'x', time: 1e9, coins: -5, hints: 99, lens: 'a', shield: 1e6, timeBuys: 99, seed: 'q', at: 'gate', ideas: { '의': '<b>' + 'x'.repeat(200) }, seen: { 'lobby:whiteboard': true, '<x>': true }, clues: { c_factors: true, evil: true } });
      ok(!/[<>]/.test(s.name) && s.name.length <= 8, s.name); eq([s.look, s.job, s.mode], ['sprout', 'farm', 'normal']);
      eq([s.time <= 600 + 180, s.coins, s.hints, s.lens, s.shield, s.timeBuys], [true, 0, 9, 0, 9, 3]);
      eq(s.at, 'lobby', '열쇠 없이 탈출 문'); ok(!/[<>]/.test(s.ideas['의']) && s.ideas['의'].length <= 80, '아이디어');
      eq(Object.keys(s.seen), ['lobby:whiteboard']); eq(Object.keys(s.clues), ['c_factors']);
    });
    await test('순서를 건너뛴 풀이와 부풀린 점수는 바로잡아요', () => {
      const s = E.sanitize({ k: 'yeoul-future', v: 1, xp: 9999, end: 'escaped', locks: { F2: { done: true }, L1: { done: true, wrong: 1 }, FINAL: { done: true } }, fights: { m1: { done: true } } });
      ok(s.locks.L1.done && !s.locks.F2.done, 'F1 없이 F2'); ok(!s.fights.m1.done, '열쇠 없이 바이러스'); ok(!s.locks.FINAL.done, '바이러스 없이 의뢰');
      eq([s.xp, s.locks.L1.stars, s.end], [15, 2, null]);
    });
    await test('저장했다가 불러오면 진행이 그대로예요', () => {
      wipe(); fresh({ job: 'fashion', mode: 'relax' }); solveAll(['L1', 'W1']); E.seeClue('cloth', 'mirror', 'c_meta'); E.go('cloth');
      const a = E.get(), b = E.load();
      eq([b.job, b.mode, b.at, b.xp, b.coins, b.time, b.persona, b.seed], [a.job, a.mode, a.at, a.xp, a.coins, a.time, a.persona, a.seed]);
      ok(b.locks.W1.done && b.clues.c_meta && b.seen['cloth:mirror'], '풀이·단서');
    });

    /* ---------- 화면 흐름 (게임 페이지를 숨은 창에서 열어요) ---------- */
    section('화면 흐름');
    const served = location.protocol.startsWith('http');
    let win = null;
    if (served) {
      wipe();
      const frame = document.createElement('iframe');
      frame.src = '../index.html?test=' + Date.now();
      document.body.appendChild(frame);
      await new Promise(res => { frame.onload = res; setTimeout(res, 8000); });
      win = frame.contentWindow;
      win.__errors = [];
      win.addEventListener('error', e => win.__errors.push(String(e.message || e)));
    }
    const W = () => win.Escape;
    const $w = id => win.document.getElementById(id);
    await test('게임 페이지가 처음 화면으로 열려요', () => {
      if (!served) return 'skip';
      ok(W() && W().Game, 'Escape'); ok(!$w('scrTitle').hidden, '처음 화면'); ok($w('titleArt').querySelector('svg'), '그림');
    });
    await test('탐험가 등록 → 게임 방법 → 시작하면 시간이 흘러요', async () => {
      if (!served) return 'skip';
      $w('btnNew').click(); $w('inName').value = ''; $w('btnMakeGo').click(); ok(!$w('scrMake').hidden, '별명이 없으면 그대로');
      $w('inName').value = '화면시험'; $w('btnMakeGo').click(); ok(!$w('scrGame').hidden, '게임 화면'); ok(!$w('modalBack').hidden && $w('modalX').hidden, '게임 방법(닫기 버튼 없이)');
      ok(!W().E.get().started, '시작 전'); $w('rulesGo').click(); ok(W().E.get().started, '시작');
    });
    await test('모든 장소의 그림이 그려지고 물건 수만큼 누를 곳이 있어요', () => {
      if (!served) return 'skip';
      const E2 = W().E, s = E2.get();
      ['L1', 'F1', 'F2', 'W1', 'W2', 'H1', 'H2'].forEach(id => E2.submit(id, E2.answerOf(id)));
      Object.keys(ROOMS).forEach(r => { E2.go(r); W().Game.render(); eq($w('stage').querySelectorAll('[data-obj]').length, ROOMS[r].objects.length, r); });
      E2.go('hall'); W().Game.render(); eq($w('stage').querySelectorAll('[data-go]').length, 5, '복도 문');
      E2.go('gate'); W().Game.render(); ok($w('stage').querySelector('[data-fight]'), '바이러스');
      eq($w('minimap').querySelectorAll('[data-go]').length, 6, '지도'); void s;
    });
    await test('단서를 누르면 카드가 열리고 코인이 늘어요', () => {
      if (!served) return 'skip';
      const E2 = W().E; E2.go('house'); W().Game.render(); const c = E2.get().coins;
      $w('stage').querySelector('[data-obj="sensors"] .hit').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      ok(!$w('modalBack').hidden && /센서/.test($w('modalTitle').textContent), '카드 창'); eq(E2.get().coins, c + 5); $w('clueOk').click();
    });
    await test('상점에서 사면 코인이 줄고 위쪽 표시가 바뀌어요', () => {
      if (!served) return 'skip';
      const E2 = W().E; E2.get().coins = 100; W().Game.render(); $w('btnShop').click();
      win.document.querySelector('[data-buy="lens"]').click(); eq([E2.get().coins, E2.get().lens], [70, 1]); eq($w('hudLens').textContent, '1'); W().U.closeModal();
    });
    await test('바이러스 3마리와 손님 의뢰를 화면에서 풀면 결과 보고서가 나와요', async () => {
      if (!served) return 'skip';
      const E2 = W().E, wait = ms => new Promise(r => setTimeout(r, ms));
      Object.keys(CLUES).forEach(c => { E2.get().clues[c] = true; });
      E2.go('gate'); W().Game.render();
      for (const m of MONSTERS) {
        W().Puzzles.fight(m.id); win.document.querySelector(`.card-b[data-c="${m.ok[0]}"]`).click(); $w('atkGo').click();
        await wait(800); ok(/치료/.test($w('modalTitle').textContent), m.id); W().U.closeModal(); await wait(80);
      }
      W().U.closeModal(); W().Puzzles.open('FINAL');
      E2.slotsOf('FINAL').forEach((sl, si) => win.document.querySelector(`.seg-b[data-s="${si}"][data-o="${sl.opts.findIndex(o => o.ok)}"]`).click());
      $w('pzGo').click(); ok(/깨어났어요/.test($w('modalTitle').textContent), '탈출'); $w('svGo').click(); await wait(80);
      ok(!$w('scrResult').hidden, '결과 화면'); ok(/나의 미래 생활 보고서/.test($w('resultBody').textContent), '보고서');
      const text = W().Game.reportText(); ok(/고객 맞춤 미래 생활 설계/.test(text) && /탈출 성공/.test(text), '보고서 글');
    });
    await test('게임 페이지에서 오류가 생기지 않았어요', () => { if (!served) return 'skip'; eq(win.__errors, [], '오류'); });

    /* ---------- 파일 ---------- */
    section('파일');
    await test('index.html이 부르는 파일이 모두 있어요', async () => {
      if (!served) return 'skip';
      const html = await (await fetch('../index.html', { cache: 'no-store' })).text();
      const refs = [...html.matchAll(/(?:src|href)="((?:js\/)?[\w.-]+\.(?:js|css))"/g)].map(m => m[1]);
      ok(refs.length >= 7, '파일 수 ' + refs.length);
      const missing = [];
      for (const u of refs) { const r = await fetch('../' + u, { cache: 'no-store' }); if (!r.ok) missing.push(u); }
      eq(missing, [], '없는 파일');
    });
  } finally {
    document.querySelectorAll('iframe').forEach(f => f.remove());
    restore();
  }

  /* ---------- 결과 표시 ---------- */
  const out = document.getElementById('out');
  const groups = [...new Set(results.map(r => r.group))];
  out.innerHTML = groups.map(g => `<h2>${g}</h2><ul>${results.filter(r => r.group === g).map(r => `<li class="${r.state}">${r.name}${r.why ? `<small>${r.why.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</small>` : ''}${r.state === 'skip' ? '<small>웹 서버로 열었을 때만 시험해요</small>' : ''}</li>`).join('')}</ul>`).join('');
  const n = s => results.filter(r => r.state === s).length;
  const sum = document.getElementById('summary');
  sum.textContent = `통과 ${n('ok')} · 실패 ${n('bad')} · 건너뜀 ${n('skip')}`;
  sum.className = n('bad') ? 'bad' : 'ok';
  sum.dataset.done = '1';
})();
