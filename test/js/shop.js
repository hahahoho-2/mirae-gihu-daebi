/* ==========================================================================
   여울 상점: 의·식·주 대비 용품 사기 (5분 미션 ② 준비)
   - 코인은 게임 속 돈이에요(진짜 돈이 아니에요). 산 용품은 다음 시대에도 그대로 써요.
   ========================================================================== */
const Shop = (() => {
  let tab = '의';

  function doBuy(id) {
    const r = Mission.buy(G.S, id);
    if (!r.ok) { G.toast(r.why); return; }
    const m = Mission.byId(id);
    G.toast(`${m.name} 갖춤! 🪙 -${r.cost}`, 'good');
    G.refreshAvatar(); G.refreshMap();
    G.changed();
  }

  function render(el, arg) {
    if (arg && PART_INFO[arg]) tab = arg; // 재봉 공방·밭·목공소에서 열면 그 칸부터
    const s = G.S, fcDone = !!Mission.era().fc, stage = QUESTS[s.quest].stage;
    const L = Mission.level(), g = Mission.goals().find(x => x.p === tab);
    const can = fcDone && stage === 'prepare' && !s.finished;
    el.innerHTML = `<div class="shop-head"><span class="coin-big">🪙 <b>${s.coins}</b> 코인</span>
        <small>${fcDone ? `${CHAPTERS[s.chapter].title} 목표: ${L.name}` : '먼저 기후 연구소에서 예측 문제를 풀어요.'} · 코인은 게임 속 돈이에요.</small></div>
      <div class="tabs">${Object.entries(PART_INFO).map(([p, info]) => { const gg = Mission.goals().find(x => x.p === p), done = fcDone && gg.heat[0] >= gg.heat[1] && gg.rain[0] >= gg.rain[1]; return `<button type="button" class="tab${tab === p ? ' on' : ''}" data-stab="${p}">${info.icon} ${p}<small> · ${info.name}</small>${done ? ' ✔' : ''}</button>`; }).join('')}</div>
      ${fcDone ? `<div class="shop-goal"><span class="${g.heat[0] >= g.heat[1] ? 'ok' : ''}">☀️ 폭염 대비 <b>${g.heat[0]}/${g.heat[1]}</b></span><span class="${g.rain[0] >= g.rain[1] ? 'ok' : ''}">☔ 집중호우 대비 <b>${g.rain[0]}/${g.rain[1]}</b></span></div>` : ''}
      <div class="shop-grid">${MEASURES.filter(m => m.part === tab).map(m => { const own = !!s.owned[m.id], afford = s.coins >= m.cost; return `<div class="shop-item${own ? ' owned' : ''}">
          <div class="si-txt"><b><span class="risk ${m.risk}">${Mission.RISK[m.risk].icon} ${Mission.RISK[m.risk].name}</span> ${G.esc(m.name)}</b><small>${G.esc(m.note)}</small></div>
          <div class="si-buy"><span class="price">🪙 ${m.cost}</span>${own ? '<span class="own-tag">✔ 갖춤</span>' : `<button type="button" class="btn small primary" data-buy="${m.id}" ${can && afford ? '' : 'disabled'}>사기</button>`}</div></div>`; }).join('')}</div>
      ${s.finished ? '<p class="hint warn">이번 판은 끝났어요. 「다시 하기」로 새 5분 미션을 시작해요.</p>' : ''}
      ${stage === 'prepare' && fcDone && !s.finished ?`<div class="panel-actions"><span class="hint">${Mission.ready() ? '이번 시대 목표를 모두 채웠어요!' : '예산이 모자라면 예측을 보고 더 중요한 것부터 골라요.'}</span><button type="button" class="btn primary" id="shopSummer">☀️ 여름 맞이하기</button></div>` : ''}`;
    el.querySelectorAll('[data-stab]').forEach(b => b.onclick = () => { tab = b.dataset.stab; G.openPanel('shop'); });
    el.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => doBuy(b.dataset.buy));
    if (G.$('shopSummer')) G.$('shopSummer').onclick = () => { G.closePanel(); Mission.startSummer(); };
  }
  G.registerPanel('shop', { title: '여울 상점 · 대비 용품', icon: () => '<span class="emoji-ico">🏪</span>', render });

  return {};
})();
