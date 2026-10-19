/* ==========================================================================
   QUEST 02 · 공동 부엌: 요리하기, 냉장고, 식탁 차리기
   ========================================================================== */
const Kitchen = (() => {
  let picked = null; // { from: 'bag'|'fridge', id: 'dish_xxx' }

  function cook(id) {
    const r = RECIPES.find(x => x.id === id);
    if (!G.takeAll(r.needs)) { G.toast('재료가 모자라요: ' + G.needText(r.needs)); return; }
    G.add('dish_' + r.id);
    G.S.stats.cooked++;
    G.toast(`${r.name} 완성! 식탁에 차리거나 냉장고에 넣어요.`, 'good');
    G.changed();
  }
  function toFridge() {
    const S = G.S;
    let n = 0;
    Object.keys(S.inv).filter(k => k.startsWith('dish_')).forEach(k => { S.fridge[k] = (S.fridge[k] || 0) + S.inv[k]; n += S.inv[k]; delete S.inv[k]; });
    G.toast(n ? `요리 ${n}개를 냉장고에 넣었어요.` : '가방에 요리가 없어요.');
    G.changed();
  }
  function placeAt(slot) {
    const S = G.S;
    if (S.table[slot]) {
      const id = 'dish_' + S.table[slot];
      S.fridge[id] = (S.fridge[id] || 0) + 1;
      S.table[slot] = null;
      G.toast('식탁에서 내려 냉장고에 넣었어요.');
      G.changed();
      return;
    }
    if (!picked) { G.toast('먼저 아래에서 차릴 요리를 골라요.'); return; }
    const src = picked.from === 'bag' ? S.inv : S.fridge;
    if (!src[picked.id]) { picked = null; G.renderPanel(); return; }
    src[picked.id]--; if (src[picked.id] <= 0) delete src[picked.id];
    S.table[slot] = picked.id.slice(5);
    if (!src[picked.id]) picked = null;
    G.toast('식탁에 차렸어요!', 'good');
    G.changed();
  }
  function mealCheck() {
    const cats = G.S.table.filter(Boolean).map(id => RECIPES.find(r => r.id === id).cat);
    return [
      ['밥', cats.includes('밥')], ['국', cats.includes('국')], ['반찬', cats.includes('반찬')]
    ];
  }
  function dishList(store, from) {
    const ids = Object.keys(store).filter(k => k.startsWith('dish_') && store[k] > 0);
    if (!ids.length) return '<p class="empty small">없어요</p>';
    return `<div class="dish-row">${ids.map(id => `<button type="button" class="dish${picked && picked.id === id && picked.from === from ? ' on' : ''}" data-pick="${from}|${id}">${Art.itemIcon(id, 44)}<span>${G.esc(G.itemName(id))}<b>${store[id]}</b></span></button>`).join('')}</div>`;
  }
  function render(el) {
    const S = G.S, w = G.today();
    const crops = Object.keys(CROPS).map(k => `<span class="chip">${Art.itemIcon(k, 26)} ${G.itemName(k)} <b>${G.count(k)}</b></span>`).join('');
    el.innerHTML = `
      <div class="kitchen">
        <section class="k-left">
          <h4>내 식재료</h4><div class="chips">${crops}</div>
          <h4>요리책</h4>
          <div class="recipes">${RECIPES.map(r => { const ok = G.hasAll(r.needs); return `<div class="recipe${ok ? ' ok' : ''}">${Art.itemIcon('dish_' + r.id, 48)}<div class="r-txt"><b>${r.name}</b><small>${r.cat} · ${G.esc(G.needText(r.needs))}</small></div><button type="button" class="btn small" data-cook="${r.id}" ${ok ? '' : 'disabled'}>요리하기</button></div>`; }).join('')}</div>
        </section>
        <section class="k-right">
          <h4>식탁 <small>칸을 누르면 고른 요리를 놓아요</small></h4>
          <div class="table-wrap">${Art.tableSVG(S.table)}${S.table.map((d, i) => `<button type="button" class="slot s${i}" data-slot="${i}" aria-label="${i + 1}번 자리 ${d ? G.esc(RECIPES.find(r => r.id === d).name) : '비어 있음'}"></button>`).join('')}</div>
          <div class="meal-check">${mealCheck().map(([k, ok]) => `<span class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${k}</span>`).join('')}</div>
          <h4>가방 속 요리 ${w === 'heat' ? '<small class="warn">오늘은 폭염! 밤사이 상할 수 있어요</small>' : ''}</h4>${dishList(S.inv, 'bag')}
          <button type="button" class="btn small" id="toFridge">가방 속 요리를 냉장고에 넣기</button>
          <h4>냉장고</h4>${dishList(S.fridge, 'fridge')}
          <p class="tip">여름엔 음식이 빨리 상할 수 있어요. 요리는 바로 먹거나 냉장 보관해요. 재료 수와 요리는 게임 단위라 실제 분량·영양과는 달라요.</p>
        </section>
      </div>`;
    el.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => cook(b.dataset.cook));
    el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { const [from, id] = b.dataset.pick.split('|'); picked = { from, id }; G.renderPanel(); });
    el.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => placeAt(+b.dataset.slot));
    G.$('toFridge').onclick = toFridge;
  }
  G.registerPanel('kitchen', {
    title: '공동 부엌',
    icon: () => Art.npcSVG('chef', 40),
    render,
    onClose() { picked = null; }
  });
  return {};
})();
