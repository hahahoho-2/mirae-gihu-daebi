/* ==========================================================================
   QUEST 03 · 재봉 공방: 원단 만들기, 옷 디자인, 옷장
   ========================================================================== */
const Tailor = (() => {
  let tab = 'fabric';
  let weave = 'plain';
  // 처음 디자인은 대표 폭염 차림(하늘색 오버핏 티 + 쿨토시 + 챙 넓은 모자)
  let draft = { name: '', top: 'tee', color: 'sky', fabric: null, details: ['sleeves'], hat: 'sunhat', shoes: 'sneakers' };
  const PROP_NAMES = { breath: '통기', absorb: '땀 흡수', dry: '빨리 마름', warm: '보온', water: '비 튕김', uv: '햇볕 가림' };
  const pp = (word, pair) => G.josa(word, pair).slice(String(word).length); // 조사만

  function fabricProps(fabId) {
    const [, f, w] = fabId.split('_');
    const base = { ...FIBERS[f].props };
    Object.entries((WEAVES[w] || WEAVES.plain).mod).forEach(([k, v]) => { base[k] = G.clamp(base[k] + v, 0, 4); });
    return base;
  }
  // 학습용 상황 점수 (0~5). 실제 의복 성능 시험값이 아니에요.
  function scores(o) {
    const pr = o.fabric ? fabricProps(o.fabric) : { breath: 2, absorb: 1, dry: 1, warm: 1, water: 0, uv: 1 };
    const top = TOPS[o.top] || TOPS.tee;
    const light = Art.clothColor(o.color).light;
    const sum = key => (o.details || []).reduce((s, d) => s + (DETAILS[d][key] || 0), 0) + ((HATS[o.hat] || {})[key] || 0) + ((SHOES[o.shoes] || {})[key] || 0);
    const st = (raw, div) => G.clamp(Math.round(raw / div * 2) / 2, 0, 5);
    return {
      heat: st(pr.breath + (pr.absorb + pr.dry) / 2 + (light ? 1 : -1) + top.breath + sum('heat'), 2.2),
      sun: st(pr.uv + (light ? 0 : 1) + top.cover + sum('sun'), 1.4),
      rain: st(pr.water * 1.2 + pr.dry * 0.5 - pr.absorb * 0.5 + (top.rain || 0) + sum('rain'), 2.2),
      cool: st(pr.warm + (top.cool || 0) + sum('cool') + (light ? 0 : 0.5), 1)
    };
  }
  function bars(sc) {
    const rows = [['heat', '폭염에 시원함'], ['sun', '햇볕 가림'], ['rain', '비 막기'], ['cool', '쌀쌀함 대비']];
    return `<div class="bars">${rows.map(([k, nm]) => `<div class="bar"><span>${nm}</span><i style="--v:${sc[k] * 20}%"></i><b>★ ${sc[k]}</b></div>`).join('')}</div>`;
  }
  function propBars(pr) {
    return `<div class="props">${Object.entries(PROP_NAMES).map(([k, nm]) => `<span>${nm}<i>${'●'.repeat(pr[k])}${'○'.repeat(Math.max(0, 4 - pr[k]))}</i></span>`).join('')}</div>`;
  }

  /* ---------- 원단 만들기 ---------- */
  function makeFabric(f) {
    const fb = FIBERS[f];
    if (!G.takeAll(fb.from)) { G.toast('재료가 모자라요: ' + G.needText(fb.from)); return; }
    const id = `fab_${f}_${weave}`;
    G.add(id);
    G.S.stats.fabricsMade++;
    G.toast(`${G.itemName(id)}을 만들었어요!`, 'good');
    G.changed();
  }
  function renderFabric(el) {
    el.innerHTML = `
      <div class="weave-pick">짜는 방법:${Object.entries(WEAVES).map(([k, w]) => `<button type="button" class="pill${weave === k ? ' on' : ''}" data-weave="${k}">${w.name}</button>`).join('')}</div>
      <p class="tip">${G.esc(CLOTH_NOTES[1])}</p>
      <div class="fibers">${Object.entries(FIBERS).map(([k, fb]) => { const ok = G.hasAll(fb.from); const rawId = Object.keys(fb.from)[0]; return `<div class="fiber${ok ? ' ok' : ''}">
          <div class="f-head">${Art.itemIcon(rawId, 40)}<div><b>${fb.name}</b><small>${G.esc(G.needText(fb.from))} (가진 것 ${G.count(rawId)})</small></div></div>
          <p>${G.esc(fb.desc)}</p>${propBars(fabricProps(`fab_${k}_${weave}`))}
          <button type="button" class="btn small" data-fab="${k}" ${ok ? '' : 'disabled'}>실 뽑고 짜기</button></div>`; }).join('')}</div>
      <p class="hint">재료는 목화밭·모시밭·목장 창고·숲·재활용 정거장·연못가에서 모아요. 성질은 일반적인 경향이고, 실제로는 실 굵기·두께·가공에 따라 달라요.</p>`;
    el.querySelectorAll('[data-weave]').forEach(b => b.onclick = () => { weave = b.dataset.weave; G.renderPanel(); });
    el.querySelectorAll('[data-fab]').forEach(b => b.onclick = () => makeFabric(b.dataset.fab));
  }

  /* ---------- 옷 디자인 ---------- */
  function makeOutfit() {
    const S = G.S;
    if (!draft.fabric) { G.toast('원단을 골라요.'); return; }
    if (G.count(draft.fabric) < 2) { G.toast('옷 한 벌에는 원단 2개가 필요해요.'); return; }
    if (S.outfits.length >= 12) { G.toast('옷장이 꽉 찼어요. 안 입는 옷을 정리해요.'); return; }
    G.take(draft.fabric, 2);
    const o = { ...draft, details: [...draft.details], id: 'o' + Date.now().toString(36), name: (draft.name || '').trim().slice(0, 16) || `${TOPS[draft.top].name} ${S.outfits.length + 1}` };
    S.outfits.push(o);
    G.toast(`「${o.name}」${pp(o.name, '을/를')} 옷장에 넣었어요!`, 'good');
    draft.name = '';
    tab = 'made';
    lastMade = o.id;
    G.changed();
  }
  let lastMade = null;
  function group(label, key, opts) {
    return `<div class="opt-group"><span class="og-label">${label}</span><div class="og-row">${opts.map(([v, nm, extra = '']) => `<button type="button" class="pill${(key === 'details' ? draft.details.includes(v) : draft[key] === v) ? ' on' : ''}" data-set="${key}|${v}" ${extra}>${nm}</button>`).join('')}</div></div>`;
  }
  function renderDesign(el) {
    const fabs = Object.keys(G.S.inv).filter(k => k.startsWith('fab_') && G.S.inv[k] > 0);
    if (draft.fabric && !G.count(draft.fabric)) draft.fabric = null;
    if (!draft.fabric && fabs.length) draft.fabric = fabs.find(f => G.count(f) >= 2) || fabs[0];
    const sc = scores(draft);
    el.innerHTML = `
      <div class="designer">
        <div class="d-preview">${Art.avatarSVG({ color: G.S.color, outfit: draft }, 200)}${bars(sc)}
          <p class="tip">${G.esc(CLOTH_NOTES[0])}</p><p class="hint">${G.esc(CLOTH_NOTES[2])}</p></div>
        <div class="d-form">
          <label class="og-label" for="oName">옷 이름</label><input id="oName" maxlength="16" placeholder="예: 시원한 여름 셋업" value="${G.esc(draft.name)}">
          ${group('모양', 'top', Object.entries(TOPS).map(([k, t]) => [k, t.name]))}
          <p class="tip small">${G.esc(TOPS[draft.top].note)}</p>
          <div class="opt-group"><span class="og-label">원단 (한 벌에 2개)</span><div class="og-row">${fabs.length ? fabs.map(f => `<button type="button" class="pill fab${draft.fabric === f ? ' on' : ''}" data-set="fabric|${f}">${Art.itemIcon(f, 22)} ${G.esc(G.itemName(f))} <b>${G.count(f)}</b></button>`).join('') : '<span class="empty small">원단이 없어요. 「원단 만들기」에서 먼저 만들어요.</span>'}</div></div>
          <div class="opt-group"><span class="og-label">색</span><div class="og-row">${CLOTH_COLORS.map(c => `<button type="button" class="swatch${draft.color === c.id ? ' on' : ''}" data-set="color|${c.id}" style="--c:${c.fill};--s:${c.stroke}" aria-label="${c.name}" title="${c.name}"></button>`).join('')}</div></div>
          ${group('디테일 (2개까지)', 'details', Object.entries(DETAILS).map(([k, d]) => [k, d.name]))}
          ${group('모자', 'hat', Object.entries(HATS).map(([k, h]) => [k, h.name]))}
          ${group('신발', 'shoes', Object.entries(SHOES).map(([k, s]) => [k, s.name]))}
          <div class="panel-actions"><button type="button" class="btn primary" id="makeOutfit" ${draft.fabric && G.count(draft.fabric) >= 2 ? '' : 'disabled'}>옷 만들기 (원단 2개)</button></div>
        </div>
      </div>`;
    G.$('oName').oninput = e => { draft.name = e.target.value; };
    el.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
      const [k, v] = b.dataset.set.split('|');
      if (k === 'details') {
        if (draft.details.includes(v)) draft.details = draft.details.filter(x => x !== v);
        else if (draft.details.length < 2) draft.details.push(v);
        else { G.toast('디테일은 두 개까지 고를 수 있어요.'); return; }
      } else draft[k] = v;
      G.renderPanel();
    });
    G.$('makeOutfit').onclick = makeOutfit;
  }

  /* ---------- 옷장 ---------- */
  function wear(id) {
    const S = G.S;
    S.equipped = S.equipped === id ? null : id;
    G.refreshAvatar();
    G.toast(S.equipped ? '갈아입었어요!' : '옷을 벗었어요.');
    G.changed();
  }
  function renderWardrobe(el) {
    const S = G.S, w = G.today();
    const key = { heat: 'heat', storm: 'rain', rain: 'rain', sunny: 'sun', cloudy: 'cool' }[w];
    const best = S.outfits.slice().sort((a, b) => scores(b)[key] - scores(a)[key])[0];
    el.innerHTML = S.outfits.length ? `
      <p class="tip">오늘 날씨는 <b>${WEATHER[w].name}</b>${pp(WEATHER[w].name, '이에요/예요')}.${best ? ` 「${G.esc(best.name)}」${pp(best.name, '이/가')} 오늘 날씨에 가장 잘 맞아요.` : ''}</p>
      <div class="closet">${S.outfits.map(o => `<div class="outfit-card${S.equipped === o.id ? ' on' : ''}${lastMade === o.id ? ' new' : ''}">
        ${Art.avatarSVG({ color: S.color, outfit: o }, 120)}
        <b>${G.esc(o.name)}</b><small>${G.esc(TOPS[o.top].name)} · ${G.esc(G.itemName(o.fabric))} · ${Art.clothColor(o.color).name}</small>
        ${bars(scores(o))}
        <div class="oc-actions"><button type="button" class="btn small ${S.equipped === o.id ? '' : 'primary'}" data-wear="${o.id}">${S.equipped === o.id ? '벗기' : '입기'}</button><button type="button" class="btn small ghost" data-del="${o.id}">버리기</button></div>
      </div>`).join('')}</div>` : '<p class="empty">아직 옷이 없어요. 재봉 공방에서 원단을 만들고 옷을 디자인해 봐요.</p>';
    el.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => wear(b.dataset.wear));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!(await G.ask('이 옷을 버릴까요? (원단은 돌아오지 않아요)', { ok: '버리기', danger: true }))) return;
      S.outfits = S.outfits.filter(o => o.id !== b.dataset.del);
      if (S.equipped === b.dataset.del) { S.equipped = null; G.refreshAvatar(); }
      G.changed();
    });
  }

  G.registerPanel('tailor', {
    title: '재봉 공방',
    icon: () => Art.npcSVG('tailor', 40),
    render(el) {
      el.innerHTML = `<div class="tabs">${[['fabric', '원단 만들기'], ['design', '옷 디자인'], ['made', '옷장']].map(([k, nm]) => `<button type="button" class="tab${tab === k ? ' on' : ''}" data-tab="${k}">${nm}</button>`).join('')}</div><div id="tailorBody"></div>`;
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; G.renderPanel(); });
      const body = G.$('tailorBody');
      if (tab === 'fabric') renderFabric(body); else if (tab === 'design') renderDesign(body); else renderWardrobe(body);
    }
  });
  G.registerPanel('wardrobe', { title: '내 옷장', icon: () => '<span class="emoji-ico">👕</span>', render: renderWardrobe });

  return { scores, bars, fabricProps };
})();
