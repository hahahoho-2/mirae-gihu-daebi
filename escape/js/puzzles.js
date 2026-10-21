/* ==========================================================================
   2045 미래하우스 탈출 — 퍼즐 창과 생각 바이러스 전투 창
   ========================================================================== */
const Puzzles = (() => {
  const { $, esc } = U;
  const stars = n => '<span class="stars">' + '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i></span>';
  const HINT_LABEL = { key: '💡 힌트 (열쇠 1개)', time: `💡 힌트 (−${GAME.noKeyHintCost}초)`, free: '💡 무료 힌트', seen: '💡 힌트 다시 보기' };
  let after = () => {}; // 창을 닫은 뒤 화면 다시 그리기

  /* ---------- 단서 카드 ---------- */
  function card(id, opt = {}) {
    const C = CLUES[id];
    return `<div class="clue-card${opt.small ? ' small' : ''}"><div class="cc-head"><span class="cc-ico">${C.icon}</span><b>${esc(C.title)}</b>${C.tags && C.tags.includes('limit') ? '<span class="tag limit">장점·한계</span>' : ''}</div><p>${esc(C.text)}</p></div>`;
  }
  const whereIs = id => { for (const r of Object.keys(ROOMS)) { const o = ROOMS[r].objects.find(x => x.clue === id); if (o) return o; } return null; };
  function uses(L) {
    if (!L.uses || !L.uses.length) return '';
    return `<div class="uses"><span class="uses-t">📒 관련 단서</span>${L.uses.map(c => E.get().clues[c]
      ? `<details class="use"><summary>${CLUES[c].icon} ${esc(CLUES[c].title)}</summary>${card(c)}</details>`
      : `<span class="use missing">❓ 아직 못 찾았어요 · ✨ ${esc((whereIs(c) || {}).name || '')}</span>`).join('')}</div>`;
  }

  /* ---------- 자물쇠 창 ---------- */
  function open(id) {
    const L = LOCKS[id], P = L.type === 'plan' ? E.persona() : null;
    const body = U.modal({ icon: '🔒', title: `${L.name} · ${L.title}`, wide: true, html: `<div class="pz pz-${L.type}">
        ${P ? `<div class="persona"><span class="p-ico">${P.icon}</span><div><b>${esc(P.name)}</b><p>${esc(P.need)}</p></div></div>` : ''}
        <p class="pz-ask">${esc(L.ask)}</p>${uses(L)}
        <div class="pz-body" id="pzBody"></div>
        <div class="pz-hint" id="pzHint" hidden></div>
        <p class="pz-msg" id="pzMsg" aria-live="polite"></p>
        <div class="pz-foot"><button type="button" class="btn small" id="pzHintBtn"></button><button type="button" class="btn small" id="pzLens"></button><span class="sp"></span><button type="button" class="btn primary" id="pzGo" disabled>🔓 열기</button></div>
      </div>` });
    tools(id);
    $('pzHintBtn').onclick = () => hint(id);
    $('pzLens').onclick = () => useLens(id);
    const rec = E.get().locks[id];
    if (rec && rec.hintSeen) showHint(id);
    if (rec && rec.shown && rec.shown.length) showLens(id);
    RENDER[L.type](id, body);
  }
  function tools(id) {
    const b = $('pzHintBtn'); if (b) b.textContent = HINT_LABEL[E.hintState(id)];
    const l = $('pzLens'); if (l) { const n = E.get().lens; l.textContent = `🔍 AI 돋보기 (${n})`; l.disabled = n <= 0; l.title = n ? '정답 한 칸을 알려 줘요' : '상점에서 살 수 있어요'; }
  }
  function showHint(id) { const h = $('pzHint'); if (h) { h.hidden = false; h.innerHTML = `<b>💡 힌트</b> ${esc(E.hintText(id))}<span id="pzLensText"></span>`; } }
  function showLens(id) {
    const rec = E.get().locks[id]; if (!rec || !rec.shown.length) return;
    const h = $('pzHint'); if (!h) return;
    if (h.hidden) { h.hidden = false; h.innerHTML = '<span id="pzLensText"></span>'; }
    const L = LOCKS[id], lines = rec.shown.map(k => L.type === 'sort' ? `「${L.items[k].t}」 → ${L.bins[L.items[k].a]}`
      : L.type === 'combo' ? `${L.items[k].t} → ${L.kinds[L.items[k].k]}` : (sl => `${sl.name} → ${sl.opts.find(o => o.ok).t}`)(E.slotsOf(id)[k]));
    $('pzLensText').innerHTML = `<span class="lens-line">🔍 AI 돋보기: ${lines.map(esc).join(' · ')}</span>`;
  }
  async function hint(id) {
    const st = E.hintState(id);
    if (st === 'time') {
      const ok = await U.ask(`힌트 열쇠가 없어요. 시간 ${GAME.noKeyHintCost}초를 쓰고 힌트를 볼까요?\n(🛒 상점에서 힌트 열쇠를 살 수도 있어요)`, { ok: '시간 쓰고 보기', cancel: '그만두기' });
      if (!ok) return;
    }
    E.takeHint(id);
    if (LOCKS[id]) { showHint(id); showLens(id); } else { const h = $('pzHint'); if (h) { h.hidden = false; h.innerHTML = `<b>💡 힌트</b> ${esc(E.hintText(id))}`; } }
    tools(id);
  }
  function useLens(id) {
    const r = E.lens(id);
    if (!r) { U.toast('AI 돋보기가 없어요. 🛒 상점에서 살 수 있어요.'); return; }
    if (r.none) { U.toast(r.text); return; }
    showLens(id); tools(id);
    U.toast('🔍 정답 한 칸을 알려 줬어요.', 'good');
  }
  function wrong(r, text) {
    const m = $('pzMsg'); if (!m) return;
    const pen = r.pen === -2 ? ' ⭐ 내 전문 방이라 시간은 그대로예요.' : r.pen === -1 ? ' 🛡️ 방패가 시간을 지켰어요.' : r.pen ? ` (−${r.pen}초)` : '';
    m.className = 'pz-msg bad'; m.textContent = `❌ ${text}${pen}`;
    const box = $('modal'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  function submit(id, ans) {
    const r = E.submit(id, ans);
    if (r.blocked) { U.toast('지금은 열 수 없어요.'); return r; }
    if (r.ok) { solved(id, r); return r; }
    wrong(r, r.why || (r.total ? `${r.total}개 중 ${r.right}개가 맞아요. 틀린 칸을 다시 생각해 봐요.` : '다시 생각해 봐요.'));
    tools(id);
    return r;
  }

  /* 풀었을 때: 별·경험치·코인·생각 사다리 */
  function solved(id, r) {
    const L = LOCKS[id], I = L.insight, room = r.room ? ROOMS[r.room] : null;
    const key = room && room.part !== '안내' ? `<div class="got key">🗝️ <b>${esc(room.part)} 열쇠</b>를 얻었어요! 이 방의 단서도 모두 수첩에 정리했어요.</div>` : '';
    const door = room && room.part === '안내' ? '<div class="got key">🚪 문이 열렸어요! 복도로 나가 의·식·주 방을 골라 들어가요.</div>' : '';
    const bonus = r.bonus ? `<div class="got">⭐ 내 전문 방 보너스 🪙 +${r.bonus}</div>` : '';
    U.modal({ icon: '🔓', title: r.escaped ? '여울봇이 깨어났어요!' : `${L.name} 열림!`, wide: true, cls: 'win', onClose: after, html: `<div class="solved">
        <div class="sv-top">${stars(r.stars)}<b class="xp">+${r.xp} XP</b><b class="coin">🪙 +${r.coin}</b></div>
        ${r.why ? `<p class="sv-why">✔ ${esc(r.why)}</p>` : ''}
        <div class="ladder"><div><small>🔧 기술·변화</small><p>${esc(I.tech)}</p></div><span class="arrow">→</span><div><small>❓ 해결하는 문제</small><p>${esc(I.need)}</p></div><span class="arrow">→</span><div><small>🏡 미래 생활</small><p>${esc(I.life)}</p></div></div>
        ${explain(id)}${key}${door}${bonus}
        <div class="row end"><button type="button" class="btn primary big" data-focus id="svGo">${r.escaped ? '🎉 결과 보기' : '계속하기 ▶'}</button></div></div>` });
    $('svGo').onclick = U.closeModal;
    if (r.up) setTimeout(() => U.fx(`⬆️ 레벨 업! ${LEVELS[E.level()].name}`, 'level'), 350);
  }
  function explain(id) {
    const L = LOCKS[id];
    let li = [];
    if (L.type === 'sort') li = L.items.map(it => `<li><b>${esc(L.bins[it.a])}</b> ${esc(it.t)}<br><small>${esc(it.why)}</small></li>`);
    if (L.type === 'slots' || L.type === 'plan') li = E.slotsOf(id).map(sl => { const o = sl.opts.find(x => x.ok); return `<li><b>${esc(sl.name)}</b> ${esc(o.t)}<br><small>${esc(o.why)}</small></li>`; });
    if (L.type === 'combo') li = Object.keys(L.kinds).map(k => `<li><b>${esc(L.kinds[k])}</b> ${L.items.filter(it => it.k === k).map(it => esc(it.t)).join(', ')}</li>`).concat('<li>서로 다른 종류 2가지를 고르면 어떤 조합이든 다중 인증이에요.</li>');
    return li.length ? `<details class="explain"><summary>📝 풀이 보기</summary><ul>${li.join('')}</ul></details>` : '';
  }

  /* ---------- 종류별 퍼즐 ---------- */
  function slotsUI(id, slots, artFn) {
    const sel = slots.map(() => null);
    const draw = () => {
      $('pzBody').innerHTML = `<div class="slots${artFn ? ' with-art' : ''}">${artFn ? `<div class="slots-art">${artFn(sel)}</div>` : ''}<div class="slot-list">${slots.map((sl, si) => {
        const ord = E.order(id + ':' + si, sl.opts.length);
        return `<div class="slot"><b>${esc(sl.name)}</b><div class="seg col">${ord.map(oi => `<button type="button" class="seg-b${sel[si] === oi ? ' on' : ''}" data-s="${si}" data-o="${oi}" aria-pressed="${sel[si] === oi}">${esc(sl.opts[oi].t)}</button>`).join('')}</div></div>`;
      }).join('')}</div></div>`;
      $('pzBody').querySelectorAll('.seg-b').forEach(b => b.onclick = () => { sel[+b.dataset.s] = +b.dataset.o; draw(); });
      $('pzGo').disabled = sel.some(x => x === null);
    };
    draw();
    $('pzGo').onclick = () => submit(id, sel.slice());
  }
  const RENDER = {
    sort(id) {
      const L = LOCKS[id], ord = E.order(id, L.items.length), pick = Array(L.items.length).fill(null);
      const draw = () => {
        $('pzBody').innerHTML = ord.map(i => `<div class="sort-row"><p>${esc(L.items[i].t)}</p><div class="seg${L.bins.length > 2 ? ' many' : ''}">${L.bins.map((b, k) => `<button type="button" class="seg-b${pick[i] === k ? ' on' : ''}" data-i="${i}" data-k="${k}" aria-pressed="${pick[i] === k}">${esc(b)}</button>`).join('')}</div></div>`).join('');
        $('pzBody').querySelectorAll('.seg-b').forEach(b => b.onclick = () => { pick[+b.dataset.i] = +b.dataset.k; draw(); });
        $('pzGo').disabled = pick.some(x => x === null);
      };
      draw();
      $('pzGo').onclick = () => submit(id, pick.slice());
    },
    slots(id) { const L = LOCKS[id]; slotsUI(id, L.slots, L.art === 'farm' ? Art.farm : null); },
    plan(id) { slotsUI(id, E.persona().slots, null); },
    combo(id) {
      const L = LOCKS[id], ord = E.order(id, L.items.length), pick = [];
      const draw = () => {
        $('pzBody').innerHTML = `<p class="combo-t">고른 인증 ${pick.length} / ${L.pick}</p><div class="combo">${ord.map(i => `<button type="button" class="combo-b${pick.includes(i) ? ' on' : ''}" data-i="${i}" aria-pressed="${pick.includes(i)}">${esc(L.items[i].t)}</button>`).join('')}</div>`;
        $('pzBody').querySelectorAll('.combo-b').forEach(b => b.onclick = () => {
          const i = +b.dataset.i, at = pick.indexOf(i);
          if (at >= 0) pick.splice(at, 1); else { if (pick.length >= L.pick) pick.shift(); pick.push(i); }
          draw();
        });
        $('pzGo').disabled = pick.length !== L.pick;
      };
      draw();
      $('pzGo').onclick = () => submit(id, pick.slice());
    }
  };

  /* ---------- 생각 바이러스 전투 ---------- */
  let cardTab = 'all';
  function fight(id) {
    const M = MONSTERS.find(m => m.id === id); if (!M) return;
    const pick = [], S = E.get(), have = Object.keys(CLUES).filter(c => S.clues[c]);
    U.modal({ icon: '🦠', title: M.name, wide: true, cls: 'fight-modal', onClose: after, html: `<div class="fight">
        <div class="arena"><div class="me">${Art.avatar(S.look, 70, E.wearing())}<b>${esc(S.name)}</b></div><span class="vs">VS</span><div class="foe" id="foe">${Art.monster(M.look, 116)}</div></div>
        <blockquote class="claim">“${esc(M.claim)}”</blockquote>
        <p class="fight-ask">이 극단적인 생각을 바로잡을 <b>구체적인 근거 카드 1장</b>을 골라요.</p>
        <div class="tabs" id="cardTabs"></div>
        <div class="cards" id="cards"></div>
        <div class="pz-hint" id="pzHint" hidden></div>
        <p class="pz-msg" id="pzMsg" aria-live="polite"></p>
        <div class="pz-foot"><button type="button" class="btn small" id="pzHintBtn"></button><span class="sp"></span><button type="button" class="btn primary" id="atkGo" disabled>⚔️ 근거 제시</button></div>
      </div>` });
    const tabs = [['all', '전체'], ...Object.keys(ROOMS).map(r => [r, ROOMS[r].icon + ' ' + ROOMS[r].part])];
    const draw = () => {
      $('cardTabs').innerHTML = tabs.map(([k, n]) => `<button type="button" class="tab${cardTab === k ? ' on' : ''}" data-t="${k}">${esc(n)}</button>`).join('');
      $('cardTabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { cardTab = b.dataset.t; draw(); });
      $('cards').innerHTML = have.filter(c => cardTab === 'all' || CLUES[c].room === cardTab).map(c => {
        const C = CLUES[c], on = pick.includes(c);
        return `<button type="button" class="card-b${on ? ' on' : ''}" data-c="${c}" aria-pressed="${on}"><span class="cb-ico">${C.icon}</span><b>${esc(C.title)}</b><small>${esc(C.text)}</small></button>`;
      }).join('');
      $('cards').querySelectorAll('.card-b').forEach(b => b.onclick = () => { pick.length = 0; pick.push(b.dataset.c); draw(); });
      $('atkGo').disabled = pick.length !== 1;
    };
    draw();
    const hb = () => { $('pzHintBtn').textContent = HINT_LABEL[E.hintState(id)]; };
    hb();
    $('pzHintBtn').onclick = async () => { await hint(id); hb(); };
    if ((S.fights[id] || {}).hintSeen) { const h = $('pzHint'); h.hidden = false; h.innerHTML = `<b>💡 힌트</b> ${esc(E.hintText(id))}`; }
    $('atkGo').onclick = () => {
      const r = E.attack(id, pick.slice());
      if (r.blocked) { U.toast('지금은 맞설 수 없어요.'); return; }
      if (!r.ok) {
        if (r.general) { const m = $('pzMsg'); m.className = 'pz-msg'; m.textContent = '🤔 ' + r.why; return; }
        const foe = $('foe'); foe.classList.remove('taunt'); void foe.offsetWidth; foe.classList.add('taunt');
        wrong(r, r.why ||`바이러스가 끄떡없어요! 「${CLUES[r.card].title}」은(는) 이 주장을 바로잡는 근거가 아니에요.`);
        hb();
        return;
      }
      won(M, r);
    };
  }
  function won(M, r) {
    const foe = $('foe'); if (foe) foe.classList.add('hurt');
    U.fx('💥 생각 바로잡기 성공!', 'hit');
    setTimeout(() => {
      const next = E.fight();
      U.modal({ icon: '💥', title: `${M.name} 치료!`, wide: true, cls: 'win', onClose: after, html: `<div class="solved">
          <div class="sv-top">${stars(r.stars)}<b class="xp">+${r.xp} XP</b><b class="coin">🪙 +${r.coin}</b></div>
          <p class="sv-why">✔ ${esc(M.win)}</p>
          <div class="row end"><button type="button" class="btn primary big" data-focus id="svGo">${next ? '다음 바이러스 ▶' : '📋 마지막 의뢰 보기 ▶'}</button></div></div>` });
      $('svGo').onclick = () => { U.closeModal(); setTimeout(() => (next ? fight(next.id) : open('FINAL')), 60); };
      if (r.up) setTimeout(() => U.fx(`⬆️ 레벨 업! ${LEVELS[E.level()].name}`, 'level'), 400);
    }, 650);
  }

  return { open, fight, card, setAfter: f => { after = f; } };
})();
