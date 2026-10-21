/* ==========================================================================
   2045 미래하우스 탈출 — 화면 흐름: 처음 화면, 탐험가 등록, 게임, 상점, 수첩, 결과 보고서
   ========================================================================== */
const Game = (() => {
  const { $, esc, fmt } = U;
  const SCREENS = ['scrTitle', 'scrMake', 'scrGame', 'scrResult'];
  let draft = { name: '', look: LOOKS[0].id, job: JOBS[0].id, mode: 'normal' };
  let lastBot = '';

  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 ? ((c - 0xAC00) % 28 ? a : b) : `${a}(${b})`); };
  const S = () => E.get();
  function show(id) { SCREENS.forEach(s => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); }
  const onGame = () => !$('scrGame').hidden;

  /* ---------- 처음 화면 ---------- */
  function title() {
    show('scrTitle');
    const c = E.closet();
    $('titleArt').innerHTML = Art.title(Object.keys(c.wear));
    const saved = E.load();
    const b = $('btnContinue');
    if (saved && saved.started) {
      const ended = saved.end === 'escaped' || (saved.end === 'timeup' && !saved.practice);
      b.hidden = false;
      b.textContent = ended ? '📝 지난 결과 보기' : `▶ 이어 하기 (${fmt(saved.time)} 남음)`;
      b.onclick = () => { E.set(saved); if (ended) result(); else enter(); };
    } else b.hidden = true;
    const best = E.best();
    $('bestLine').hidden = !best;
    if (best) $('bestLine').textContent = `🏆 이 기기 최고 기록: ${best.score}점 (${best.name}, ${E.modeOf(best.mode).name} 모드, ${best.date})`;
    $('walletLine').textContent = `🎁 꾸미기 지갑 🪙 ${c.coins}`;
  }

  /* ---------- 탐험가 등록 ---------- */
  function make(prev) {
    if (prev) draft = { name: prev.name, look: prev.look, job: prev.job, mode: prev.mode };
    show('scrMake');
    $('inName').value = draft.name;
    const opt = (box, list, key, fn) => {
      $(box).innerHTML = list.map(x => `<button type="button" class="opt${draft[key] === x.id ? ' on' : ''}" data-v="${x.id}" aria-pressed="${draft[key] === x.id}">${fn(x)}</button>`).join('');
      $(box).querySelectorAll('.opt').forEach(b => b.onclick = () => { draft[key] = b.dataset.v; make(); });
    };
    opt('optLook', LOOKS, 'look', l => `${Art.avatar(l.id, 44, E.wearing())}<span>${esc(l.name)}</span>`);
    opt('optJob', JOBS, 'job', j => `<b>${j.icon} ${esc(j.name)}</b><small>${esc(j.what)}<br>⭐ 능력: ${esc(ROOMS[j.room].name)}에서는 틀려도 시간이 줄지 않고, 방을 열면 🪙 +${GAME.jobBonus}</small>`);
    opt('optMode', GAME.modes, 'mode', m => `<b>${esc(m.name)}</b><small>⏱ ${esc(m.note)}</small>`);
    $('makePreview').innerHTML = Art.avatar(draft.look, 120, E.wearing());
  }
  function go() {
    const name = $('inName').value.replace(/[<>]/g, '').trim().slice(0, 8);
    if (!name) { U.toast('별명을 적어 주세요(실명 말고 별명).'); $('inName').focus(); return; }
    draft.name = name;
    E.start(draft);
    enter();
  }

  /* ---------- 게임 화면 ---------- */
  function enter() {
    show('scrGame');
    render();
    const s = S();
    if (!s.started) rules(true);
    else if (s.end === 'timeup' && !s.practice) timeUpPanel();
    else if (E.see('intro:' + s.at) && ROOMS[s.at]) say(ROOMS[s.at].intro);
  }
  function render() {
    if (!S()) return;
    hud(); goal(); scene(); minimap();
  }
  function hud() {
    const s = S(); if (!s) return;
    const lv = E.level(), L = LEVELS[lv], next = LEVELS[lv + 1];
    $('hudAvatar').innerHTML = Art.avatar(s.look, 34, E.wearing());
    $('hudName').textContent = s.name;
    $('hudLevel').textContent = `Lv.${lv + 1} ${L.name}`;
    $('hudXp').style.width = (next ? Math.round(100 * (s.xp - L.xp) / (next.xp - L.xp)) : 100) + '%';
    $('hudCoins').textContent = s.coins;
    $('hudHints').textContent = s.hints;
    $('hudLens').textContent = s.lens;
    $('hudShieldWrap').hidden = !s.shield;
    $('hudShield').textContent = s.shield;
    $('hudClues').textContent = Object.keys(s.clues).length;
    timer();
  }
  function timer() {
    const s = S(), t = $('hudTimer');
    if (s.practice) { $('hudTime').textContent = '연습'; t.className = 'hud-timer done'; return; }
    $('hudTime').textContent = fmt(s.time);
    t.className = 'hud-timer' + (s.end ? ' done' : s.time <= 30 ? ' danger' : s.time <= 120 ? ' warn' : '');
  }
  function goalText() {
    const s = S();
    if (s.end === 'timeup' && !s.practice) return '⏰ 시간이 다 됐어요. 연습 모드로 끝까지 풀거나 결과를 봐요.';
    if (s.at === 'lobby') return E.isDone('L1') ? '🚪 열린 문을 눌러 복도로 나가요.' : '✨ 단서 2개를 살펴보고 🔒 현관 안쪽 문의 퍼즐을 풀어요.';
    if (s.at === 'hall') { const k = E.keys(); return k < 3 ? `🗝️ 의·식·주 방에서 열쇠를 모아요 (${k}/3). 방은 원하는 순서로 들어가요.` : '🗝️ 열쇠 3개를 모았어요! 🚪 탈출 문으로 가요.'; }
    if (s.at === 'gate') { const m = E.fight(); return m ? `🦠 근거 카드로 「${m.name}」의 극단적인 생각을 바로잡아요.` : E.isDone('FINAL') ? '🎉 탈출 성공!' : '📋 고객 의뢰서를 눌러 미래 생활을 설계해요.'; }
    const R = ROOMS[s.at], [a, b] = R.locks;
    if (!E.isDone(a)) return `✨ 단서를 살펴보고 🔒 ${josa(LOCKS[a].name, '을', '를')} 열어요.`;
    if (!E.isDone(b)) return `🔒 ${LOCKS[b].name} 퍼즐을 풀어 ${R.part} 열쇠를 얻어요.`;
    return `🗝️ ${R.part} 열쇠를 얻었어요! 아래 지도에서 다른 방으로 가요.`;
  }
  function goal() { $('goalLine').textContent = goalText(); }
  function scene() {
    const s = S(), at = s.at;
    const svg = at === 'hall' ? Art.hall() : at === 'gate' ? Art.gate() : Art.room(at);
    $('stage').innerHTML = svg;
    $('btnExit').hidden = !(at !== 'hall' && (at !== 'lobby' || E.isDone('L1')));
  }
  function minimap() {
    const s = S();
    const node = (p, icon, name, st) => `<button type="button" class="mm-node${s.at === p ? ' here' : ''}${st === 'done' ? ' done' : ''}${st === 'lock' ? ' lock' : ''}" data-go="${p}" aria-label="${esc(name)}${st === 'done' ? ' 완료' : st === 'lock' ? ' 잠김' : ''}${s.at === p ? ' (지금 여기)' : ''}">
        <span class="mm-ico">${s.at === p ? Art.avatar(s.look, 22, E.wearing()) : icon}</span><span class="mm-name">${esc(name)}</span><span class="mm-st">${st === 'done' ? '✅' : st === 'lock' ? '🔒' : st === 'key' ? '🗝️' : ''}</span></button>`;
    const room = p => (E.cleared(p) ? 'done' : E.canGo(p) ? '' : 'lock');
    $('minimap').innerHTML = `<div class="mm-line"></div>
      ${node('lobby', '🧭', '안내실', E.cleared('lobby') ? 'done' : '')}
      ${node('hall', '🚪', '복도', E.canGo('hall') ? '' : 'lock')}
      ${KEY_ROOMS.map(r => node(r, ROOMS[r].icon, ROOMS[r].short, room(r))).join('')}
      ${node('gate', '🏁', '탈출 문', E.isDone('FINAL') ? 'done' : E.canGo('gate') ? 'key' : 'lock')}`;
  }
  function say(text, mood = '') {
    lastBot = text;
    $('botFace').innerHTML = Art.bot(40, mood);
    $('botText').textContent = text;
  }

  /* ---------- 이동과 물건 ---------- */
  function travel(place) {
    const s = S();
    if (s.at === place) return;
    if (!E.canGo(place)) {
      if (!E.cleared('lobby')) U.toast('먼저 안내실의 문을 열어요.');
      else if (place === 'gate') U.toast(`탈출 문에는 열쇠 3개가 필요해요. (지금 ${E.keys()}/3)`);
      return;
    }
    E.go(place);
    render();
    if (place === 'gate') {
      say('삐빅! 극단적인 생각 바이러스가 제 기억을 막고 있어요. 근거 카드로 바로잡아 주세요!', 'worry');
      const m = E.fight();
      if (m && E.canAct()) setTimeout(() => Puzzles.fight(m.id), 250);
      else if (!m && !E.isDone('FINAL') && E.canAct()) setTimeout(() => Puzzles.open('FINAL'), 250);
    } else if (ROOMS[place] && E.see('intro:' + place)) say(ROOMS[place].intro);
    else if (place === 'hall') say(E.keys() < 3 ? '의·식·주 방 가운데 아무 곳이나 골라 들어가요. ⭐ 표시는 내 전문 방이에요.' : '열쇠 3개를 모두 모았어요! 탈출 문으로 가요.', 'happy');
  }
  function onObj(objId) {
    const s = S(), R = ROOMS[s.at]; if (!R) return;
    const o = R.objects.find(x => x.id === objId); if (!o) return;
    if (o.talk) { say(E.isDone('L1') ? '덕분에 조금씩 기억이 돌아오고 있어요! ' + BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)] : R.intro, E.isDone('L1') ? 'happy' : 'sleep'); return; }
    if (o.clue) {
      const got = E.seeClue(s.at, o.id, o.clue);
      U.modal({ icon: CLUES[o.clue].icon, title: `${o.name} · 단서`, wide: true, onClose: render,
        html: `${Puzzles.card(o.clue)}${got ? `<p class="got">📒 수첩에 넣었어요. 🪙 +${got}</p>` : '<p class="hint">📒 이미 수첩에 있는 단서예요.</p>'}<div class="row end"><button type="button" class="btn primary" data-focus id="clueOk">확인</button></div>` });
      $('clueOk').onclick = U.closeModal;
      return;
    }
    const id = o.lock;
    if (E.isDone(id)) {
      if (id === 'L1') { travel('hall'); return; }
      U.toast(`이미 열었어요. ${R.part} 열쇠는 챙겼어요!`);
      return;
    }
    if (!E.canAct()) { timeUpPanel(); return; }
    if (!E.available(id)) { const first = R.locks[R.locks.indexOf(id) - 1]; say(`아직 잠겨 있어요. 먼저 🔒 ${josa(LOCKS[first].name, '을', '를')} 열어요.`, 'worry'); return; }
    Puzzles.open(id);
  }
  function onStage(e) {
    const g = e.target.closest('[data-obj],[data-go],[data-fight],[data-lock]');
    if (!g || !$('stage').contains(g)) return;
    if (g.dataset.obj) onObj(g.dataset.obj);
    else if (g.dataset.go) travel(g.dataset.go);
    else if (g.dataset.fight) { if (E.canAct()) Puzzles.fight(g.dataset.fight); else timeUpPanel(); }
    else if (g.dataset.lock) {
      if (E.isDone(g.dataset.lock)) { result(); return; }
      if (E.canAct()) Puzzles.open(g.dataset.lock); else timeUpPanel();
    }
  }

  /* ---------- 상점 ---------- */
  function shop() {
    const s = S(), can = E.canAct();
    const have = { hint: s.hints, lens: s.lens, shield: s.shield, time: `${s.timeBuys}/3` };
    U.modal({ icon: '🛒', title: '미래 상점', wide: true, onClose: render, html: `<div class="shop">
        <p class="shop-head"><span class="coin-big">🪙 <b>${s.coins}</b></span><small>코인은 게임 속 돈이에요. 단서를 처음 살펴보거나(+${GAME.clueCoins}) 퍼즐을 풀면(별 1개당 +5) 모여요.</small></p>
        <div class="shop-grid">${SHOP.map(it => `<div class="shop-item"><span class="si-ico">${it.icon}</span><div class="si-txt"><b>${esc(it.name)}</b><small>${esc(it.note)}</small><small class="have">가진 것: ${have[it.id]}</small></div>
          <button type="button" class="btn small primary" data-buy="${it.id}" ${can && s.coins >= it.cost ? '' : 'disabled'}>🪙 ${it.cost}</button></div>`).join('')}</div>
        ${can ? '<p class="hint">⏱ 상점에 있는 동안에도 시간은 흘러요.</p>' : '<p class="hint warn">지금은 살 수 없어요.</p>'}
        <p class="hint">🎁 꾸미기 아이템은 탈출한 뒤 결과 화면에서 남은 코인으로 살 수 있어요.</p></div>` });
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const r = E.buy(b.dataset.buy);
      if (!r.ok) { U.toast(r.why); return; }
      U.toast(`${r.item.icon} ${r.item.name}을(를) 샀어요!`, 'good');
      shop();
    });
  }

  /* ---------- 수첩 ---------- */
  let noteTab = 'all';
  function note() {
    const s = S(), tabs = [['all', '전체'], ...Object.keys(ROOMS).map(r => [r, ROOMS[r].icon + ' ' + ROOMS[r].short])];
    const ids = Object.keys(CLUES).filter(c => noteTab === 'all' || CLUES[c].room === noteTab);
    const have = ids.filter(c => s.clues[c]), miss = ids.filter(c => !s.clues[c]);
    U.modal({ icon: '📒', title: `단서 수첩 (${Object.keys(s.clues).length}/${Object.keys(CLUES).length})`, wide: true, onClose: render, html: `
      <div class="tabs">${tabs.map(([k, n]) => `<button type="button" class="tab${noteTab === k ? ' on' : ''}" data-nt="${k}">${esc(n)}</button>`).join('')}</div>
      <div class="note-list">${have.map(c => Puzzles.card(c)).join('') || '<p class="hint">아직 모은 단서가 없어요. 방에서 ✨ 반짝이는 물건을 눌러요.</p>'}</div>
      ${miss.length ? `<p class="hint">❓ 아직 못 찾은 단서 ${miss.length}개: ${miss.map(c => { const r = CLUES[c].room, o = ROOMS[r].objects.find(x => x.clue === c); return `${ROOMS[r].icon} ${esc(o.name)}`; }).join(', ')}</p>` : ''}` });
    document.querySelectorAll('[data-nt]').forEach(b => b.onclick = () => { noteTab = b.dataset.nt; note(); });
  }

  /* ---------- 게임 방법 ---------- */
  function rules(first) {
    const s = S(), mode = s ? E.modeOf(s.mode) : E.modeOf('normal');
    U.modal({ icon: '📖', title: '게임 방법', wide: true, noClose: !!first, onClose: () => { if (first) { E.begin(); say(ROOMS.lobby.intro, 'sleep'); E.see('intro:lobby'); render(); } },
      html: `<div class="rules">
        <p class="lead">🎯 <b>${esc(mode.note)} 안에</b> 미래하우스를 탈출해요. 의·식·주 방의 미래 기술을 알아내고, 극단적인 생각 바이러스를 바로잡고, 손님에게 맞는 미래 생활을 설계해요.</p>
        <ol class="steps">
          <li><b>🧭 안내실</b> 미래 생활을 바꾸는 4가지 변화 요소를 알아보고 문을 열어요.</li>
          <li><b>🍽️ 키친 · 👕 드레스룸 · 🏠 컨트롤룸</b> 순서는 자유예요. 방마다 자물쇠 2개를 풀면 열쇠를 얻어요.</li>
          <li><b>🚪 탈출 문</b> 열쇠 3개로 열고, 🦠 생각 바이러스 3마리를 근거 카드로 바로잡아요.</li>
          <li><b>📋 고객 의뢰</b> 손님의 필요에 맞게 의·식·주 기술을 고르면 탈출!</li>
        </ol>
        <div class="rule-grid">
          <div>✨ <b>단서</b> 반짝이는 물건을 누르면 단서 카드가 📒 수첩에 모여요. 처음 보면 🪙 +${GAME.clueCoins}.</div>
          <div>⏱ <b>시간</b> 틀리면 ${GAME.wrongPenalty}초가 줄어요. 내 직업의 전문 방에서는 줄지 않아요.</div>
          <div>💡 <b>힌트</b> 힌트 열쇠 ${GAME.hintKeys}개로 시작해요. 같은 자물쇠에서 ${GAME.freeHintAfter}번 틀리면 무료예요.</div>
          <div>🛒 <b>상점</b> 코인으로 힌트 열쇠, AI 돋보기, 실수 방패, 시간 충전을 사요.</div>
          <div>⭐ <b>별·레벨</b> 한 번에 풀면 별 3개(20XP·🪙15), 한 번 틀리거나 힌트를 쓰면 별 2개, 그 밖에는 별 1개예요.</div>
          <div>📝 <b>보고서</b> 끝나면 내가 알아낸 미래 의식주 생활이 보고서로 정리돼요. 복사해서 제출할 수 있어요.</div>
        </div>
        <p class="hint">※ 기술 내용은 「기술·가정」 교과서(생활 문화와 디지털 환경)를 바탕으로 했어요. 시간·코인·별은 게임 규칙이에요.</p>
        <div class="row end"><button type="button" class="btn primary big" data-focus id="rulesGo">${first ? '⏱ 시작하기' : '닫기'}</button></div></div>` });
    $('rulesGo').onclick = U.closeModal;
  }
  async function menu() {
    U.modal({ icon: '☰', title: '메뉴', html: `<div class="menu-list">
      <button type="button" class="btn" id="mHow">📖 게임 방법</button>
      <button type="button" class="btn" id="mHome">🏠 처음 화면으로 (저장돼요)</button>
      <button type="button" class="btn danger" id="mNew">🔄 처음부터 새로 하기</button></div>` });
    $('mHow').onclick = () => rules(false);
    $('mHome').onclick = () => { U.closeModal(); E.save(); title(); };
    $('mNew').onclick = async () => {
      const ok = await U.ask('지금 판을 지우고 새로 시작할까요?', { ok: '새로 하기', cancel: '계속하기' });
      if (!ok) return;
      U.closeModal(); const prev = S(); E.clear(); make(prev);
    };
  }

  /* ---------- 시간 ---------- */
  function timeUpPanel() {
    const s = S();
    const rooms = KEY_ROOMS.filter(E.cleared).length, mons = MONSTERS.filter(m => E.isDone(m.id)).length;
    U.modal({ icon: '⏰', title: '시간이 다 됐어요!', noClose: true, html: `<div class="solved">
        <p>지금까지 열쇠 <b>${rooms}/3</b>, 바이러스 <b>${mons}/${MONSTERS.length}</b>를 해결했어요.</p>
        <p class="hint">연습 모드에서는 시간 제한 없이 끝까지 풀 수 있어요(기록에는 남지 않아요). 끝까지 풀면 보고서가 더 풍성해져요.</p>
        <div class="row end"><button type="button" class="btn" id="tuResult">📝 결과 보기</button><button type="button" class="btn primary" data-focus id="tuPractice">🔦 연습 모드로 끝까지</button></div></div>` });
    $('tuResult').onclick = () => { U.closeModal(); result(); };
    $('tuPractice').onclick = () => { E.practice(); U.closeModal(); render(); say('연습 모드예요. 천천히 끝까지 풀어 봐요!', 'happy'); };
    void s;
  }

  /* ---------- 결과와 보고서 ---------- */
  const AREAS = [['lobby', '🧭 미래 생활을 바꾸는 요소'], ['food', '🍽️ 식생활'], ['cloth', '👕 의생활'], ['house', '🏠 주생활']];
  function reportText() {
    const s = S(), P = E.persona(), lv = E.level();
    const head = s.end === 'escaped' ? `탈출 성공 (남은 시간 ${fmt(s.time)})` : s.practiceDone ? '시간 초과 후 연습 모드로 탈출' : '시간 초과';
    const lines = [`[2045 미래하우스 탈출 보고서]`, `별명: ${s.name} / 모드: ${E.modeOf(s.mode).name}(${E.modeOf(s.mode).note}) / 결과: ${head}`, `레벨: Lv.${lv + 1} ${LEVELS[lv].name} / 별 ${E.stars()}개 / XP ${s.xp}${s.end === 'escaped' ? ` / 점수 ${E.score()}` : ''}`, ''];
    AREAS.forEach(([room, label]) => {
      lines.push('■ ' + label.replace(/^\S+ /, ''));
      ROOMS[room].locks.forEach(id => { const I = LOCKS[id].insight; lines.push(E.isDone(id) ? `- ${LOCKS[id].title}: ${I.tech} → ${I.life}` : `- ${LOCKS[id].title}: (아직 풀지 못함)`); });
    });
    lines.push('■ 고객 맞춤 미래 생활 설계');
    lines.push(`- 고객: ${P.name} (${P.need})`);
    if (E.isDone('FINAL')) P.slots.forEach(sl => lines.push(`- ${sl.name.replace(/^\S+ /, '')}: ${sl.opts.find(o => o.ok).t}`));
    else lines.push('- (아직 설계하지 못함)');
    lines.push('■ 바로잡은 극단적인 생각');
    MONSTERS.forEach(m => lines.push(E.isDone(m.id) ? `- "${m.claim}" → ${m.win}` : `- ${m.name}: (아직 못 바로잡음)`));
    lines.push('■ 2045년 나의 미래 생활 상상');
    ['의', '식', '주'].forEach(p => lines.push(`- ${p}: ${s.ideas[p] || '(비어 있음)'}`));
    lines.push('', '※ 「기술·가정」 생활 문화와 디지털 환경 단원을 바탕으로 한 학습용 게임이에요.');
    return lines.join('\n');
  }
  function result() {
    const s = S(); if (!s) { title(); return; }
    U.closeModal();
    show('scrResult');
    const banked = E.bank();
    const lv = E.level(), P = E.persona();
    const head = s.end === 'escaped' ? { icon: '🎉', t: '탈출 성공!', sub: `남은 시간 ${fmt(s.time)} · 걸린 시간 ${fmt(s.used)}` }
      : s.practiceDone ? { icon: '🔦', t: '연습 모드로 탈출 완료!', sub: '시간 안에는 못 했지만 끝까지 해냈어요.' }
        : { icon: '⏰', t: '시간 초과', sub: '다음 판에는 상점과 힌트를 전략적으로 써 봐요.' };
    const area = ([room, label]) => `<section class="rp-area"><h4>${label}</h4>${ROOMS[room].locks.map(id => { const L = LOCKS[id], I = L.insight; return E.isDone(id)
      ? `<div class="rp-item"><b>✔ ${esc(L.title)}</b><p>🔧 ${esc(I.tech)}</p><p>🏡 ${esc(I.life)}</p></div>` : `<div class="rp-item todo"><b>… ${esc(L.title)}</b><p>아직 풀지 못했어요.</p></div>`; }).join('')}</section>`;
    $('resultBody').innerHTML = `
      <div class="rs-head"><span class="rs-ico">${head.icon}</span><div><h2>${head.t}</h2><p>${esc(head.sub)}</p></div><div class="rs-av">${Art.avatar(s.look, 70, E.wearing())}</div></div>
      <div class="rs-stats">
        ${s.end === 'escaped' ? `<div><small>점수</small><b>${E.score()}</b><small>XP ${s.xp} + 시간 ${E.timeBonus()}</small></div>` : ''}
        <div><small>레벨</small><b>Lv.${lv + 1}</b><small>${esc(LEVELS[lv].name)}</small></div>
        <div><small>별</small><b>${E.stars()} / ${E.totalTasks() * 3}</b><small>풀이 ${[...Object.keys(LOCKS), ...MONSTERS.map(m => m.id)].filter(E.isDone).length}/${E.totalTasks()}</small></div>
        <div><small>코인</small><b>🪙 ${s.coins}</b><small>${banked ? `꾸미기 지갑에 +${banked}` : '꾸미기 지갑으로 옮겼어요'}</small></div>
      </div>
      <h3 class="rp-title">📝 나의 미래 생활 보고서</h3>
      <div class="rp-grid">${AREAS.map(area).join('')}</div>
      <section class="rp-area wide"><h4>📋 고객 맞춤 설계 · ${P.icon} ${esc(P.name)}</h4><p class="hint">${esc(P.need)}</p>
        ${E.isDone('FINAL') ? `<ul class="rp-plan">${P.slots.map(sl => `<li><b>${esc(sl.name)}</b> ${esc(sl.opts.find(o => o.ok).t)}</li>`).join('')}</ul>` : '<p>아직 설계하지 못했어요.</p>'}</section>
      <section class="rp-area wide"><h4>💭 2045년 나의 미래 생활 상상 <small>(한 줄씩, 시간 제한 없음)</small></h4>
        ${[['의', '👕', '예: 체온에 맞춰 통풍이 조절되는 교복'], ['식', '🍽️', '예: 베란다 스마트 텃밭 채소로 만든 저탄소 도시락'], ['주', '🏠', '예: 할머니 걸음을 살펴 주는 센서 집']].map(([p, i, ph]) => `<label class="idea"><span>${i} ${p}</span><input maxlength="80" data-idea="${p}" value="${esc(s.ideas[p])}" placeholder="${esc(ph)}"></label>`).join('')}</section>
      <div class="row center rs-btns">
        <button type="button" class="btn primary" id="rsCopy">📋 보고서 복사</button>
        <button type="button" class="btn" id="rsCloset">🎁 꾸미기 상점</button>
        <button type="button" class="btn" id="rsAgain">🔁 다시 하기</button>
        <button type="button" class="btn ghost" id="rsHome">🏠 처음 화면</button>
      </div>
      ${s.end === 'timeup' && !s.practiceDone ? '<div class="row center"><button type="button" class="btn small" id="rsPractice">🔦 연습 모드로 이어서 풀기</button></div>' : ''}
      <textarea id="rsText" class="sr-copy" aria-hidden="true" tabindex="-1" readonly></textarea>`;
    document.querySelectorAll('[data-idea]').forEach(i => { i.oninput = () => E.setIdea(i.dataset.idea, i.value); });
    $('rsCopy').onclick = copyReport;
    $('rsCloset').onclick = closetPanel;
    $('rsAgain').onclick = () => { const prev = S(); E.clear(); make(prev); };
    $('rsHome').onclick = () => title();
    if ($('rsPractice')) $('rsPractice').onclick = () => { E.practice(); enter(); };
    if (banked) U.toast(`🪙 ${banked}개를 꾸미기 지갑에 넣었어요.`, 'good');
  }
  async function copyReport() {
    const text = reportText();
    try { await navigator.clipboard.writeText(text); U.toast('보고서를 복사했어요. 학급 게시판에 붙여 넣어요.', 'good'); return; } catch (e) { /* 아래 방법으로 */ }
    const t = $('rsText'); t.value = text; t.removeAttribute('aria-hidden'); t.select();
    try { document.execCommand('copy'); U.toast('보고서를 복사했어요.', 'good'); } catch (e) { U.toast('복사가 안 돼요. 길게 눌러 직접 복사해요.'); }
  }
  function closetPanel() {
    const c = E.closet();
    U.modal({ icon: '🎁', title: '꾸미기 상점', wide: true, html: `<div class="closet">
        <div class="cl-av">${Art.avatar(S() ? S().look : LOOKS[0].id, 110, Object.keys(c.wear))}<p class="coin-big">🪙 <b>${c.coins}</b></p><small>판이 끝날 때 남은 코인이 모여요(이 기기에 저장).</small></div>
        <div class="shop-grid">${LOOKS_SHOP.map(it => `<div class="shop-item"><span class="si-ico">${it.icon}</span><div class="si-txt"><b>${esc(it.name)}</b><small>${c.owned[it.id] ? (c.wear[it.id] ? '착용 중' : '가지고 있어요') : `🪙 ${it.cost}`}</small></div>
          <button type="button" class="btn small${c.owned[it.id] ? '' : ' primary'}" data-look="${it.id}" ${!c.owned[it.id] && c.coins < it.cost ? 'disabled' : ''}>${c.owned[it.id] ? (c.wear[it.id] ? '벗기' : '입기') : '사기'}</button></div>`).join('')}</div></div>` });
    document.querySelectorAll('[data-look]').forEach(b => b.onclick = () => {
      const r = E.buyLook(b.dataset.look);
      if (!r.ok) { U.toast(r.why); return; }
      if (r.bought) U.toast('새 꾸미기 아이템을 입었어요!', 'good');
      closetPanel();
      if (!$('scrResult').hidden) { const av = document.querySelector('.rs-av'); if (av && S()) av.innerHTML = Art.avatar(S().look, 70, E.wearing()); }
      if (!$('scrTitle').hidden) title();
    });
  }

  /* ---------- 연결 ---------- */
  E.hooks.changed = () => { if (onGame()) { hud(); goal(); minimap(); } };
  E.hooks.tick = () => { if (onGame()) timer(); };
  E.hooks.warn = t => { const m = t >= 60 ? `${t / 60}분` : `${t}초`; U.toast(`⏰ ${m} 남았어요!`, 'warn'); say(`⏰ ${m} 남았어요! 막히면 🛒 상점이나 💡 힌트를 써요.`, 'worry'); };
  E.hooks.timeup = () => { if (onGame()) { render(); timeUpPanel(); } };
  Puzzles.setAfter(() => { const s = S(); if (s && (s.end === 'escaped' || s.practiceDone) && E.isDone('FINAL')) { result(); return; } render(); });

  $('btnNew').onclick = () => make();
  $('btnHow').onclick = () => rules(false);
  $('btnTitleCloset').onclick = closetPanel;
  $('btnMakeBack').onclick = title;
  $('btnMakeGo').onclick = go;
  $('inName').onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) go(); };
  $('inName').oninput = () => { draft.name = $('inName').value; };
  $('btnShop').onclick = shop;
  $('btnNote').onclick = note;
  $('btnExit').onclick = () => travel('hall');
  $('btnMenu').onclick = menu;
  $('btnHintHud').onclick = () => U.toast('💡 힌트는 퍼즐 창 아래의 버튼으로 써요. 열쇠는 🛒 상점에서 더 살 수 있어요.');
  $('minimap').onclick = e => { const b = e.target.closest('[data-go]'); if (b) travel(b.dataset.go); };
  $('stage').onclick = onStage;
  $('stage').onkeydown = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-obj],[data-go],[data-fight],[data-lock]')) { e.preventDefault(); onStage(e); } };
  setInterval(() => { if (onGame() && !document.hidden) E.tick(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) E.save(); });

  title();
  return { title, make, enter, render, travel, onObj, result, reportText, shop, note, say, lastBot: () => lastBot };
})();
window.Escape = { E, Game, Puzzles, U };
