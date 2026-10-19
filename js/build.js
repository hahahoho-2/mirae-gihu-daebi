/* ==========================================================================
   QUEST 04 · 목공소(부품 만들기) · 내 집터(집 짓기) · 기후 연구소(자료 보기)
   ========================================================================== */
const Build = (() => {
  const SLOT_NAMES = { base: '기초', wall: '벽', window: '창', awning: '차양', insulation: '단열', roof: '지붕', roofTop: '지붕 위', yard: '마당', farm: '밭 도구' };

  /* ---------- 목공소 ---------- */
  function craft(id) {
    const p = PARTS[id];
    if (!G.takeAll(p.from)) { G.toast('재료가 모자라요: ' + G.needText(p.from)); return; }
    G.add(id);
    G.S.stats.partsMade++;
    G.toast(`${p.name} 완성!`, 'good');
    G.changed();
  }
  function renderWorkshop(el) {
    const bySlot = {};
    Object.entries(PARTS).filter(([, p]) => !p.reward).forEach(([id, p]) => { (bySlot[p.slot] = bySlot[p.slot] || []).push(id); });
    el.innerHTML = `<p class="tip">재료를 모아 집 부품과 밭 도구를 만들어요. 만든 부품은 <b>내 집터</b>에서 집에 붙여요.</p>
      ${Object.entries(bySlot).map(([slot, ids]) => `<h4>${SLOT_NAMES[slot]}</h4><div class="parts">${ids.map(id => { const p = PARTS[id]; const ok = G.hasAll(p.from); return `<div class="part${ok ? ' ok' : ''}">${Art.itemIcon(id, 46)}<div class="p-txt"><b>${p.name}</b> <span class="own" title="가진 것">${G.count(id)}개</span><p>${G.esc(p.note)}</p><small class="need">${Object.entries(p.from).map(([k, n]) => `<span class="${G.count(k) >= n ? 'have' : 'lack'}">${G.esc(G.itemName(k))} ${G.count(k)}/${n}</span>`).join(' ')}</small></div><button type="button" class="btn small" data-craft="${id}" ${ok ? '' : 'disabled'}>만들기</button></div>`; }).join('')}</div>`).join('')}`;
    el.querySelectorAll('[data-craft]').forEach(b => b.onclick = () => craft(b.dataset.craft));
  }
  G.registerPanel('workshop', { title: '뚝딱 목수의 목공소', icon: () => Art.npcSVG('builder', 40), render: renderWorkshop });

  /* ---------- 집 ---------- */
  const isPart = v => v && v !== 'basic' && PARTS[v];
  function swap(oldV, newV) {
    if (oldV === newV) return true;
    if (isPart(newV) && !G.take(newV)) { G.toast(`${PARTS[newV].name}이 없어요. 목공소에서 만들어요.`); return false; }
    if (isPart(oldV)) G.add(oldV);
    return true;
  }
  function windowsList(h) {
    const out = [];
    for (let f = 0; f < h.floors; f++) for (let k = 0; k < 2; k++) if (h.windows[f][k]) out.push({ id: h.windows[f][k], awn: h.awnings[f][k] });
    return out;
  }
  // h를 넘기면 친구의 집도 살펴봐요(학급 광장)
  function isBuilt(h = G.S.house) {
    for (let f = 0; f < h.floors; f++) if (!h.walls[f]) return false;
    return !!h.roof && windowsList(h).length > 0;
  }
  function checks(h = G.S.house) {
    const wins = windowsList(h);
    const walls = h.walls.slice(0, h.floors);
    const heat = [
      ['창 바깥 차양', wins.some(w => w.awn), '창 밖에서 햇빛을 막으면 방으로 들어오는 열이 줄어요.'],
      ['벽 속 단열재', h.insulation, '여름 더위와 겨울 추위가 벽을 지나 드나드는 걸 줄여요.'],
      ['밝은 지붕이나 옥상 정원', h.roof === 'metalroof' || h.roofTop === 'greenroof', '지붕이 햇볕에 덜 달궈져요.'],
      ['그늘 나무', h.yard.includes('shade_tree'), '나무 그늘과 잎의 증산이 집 주변을 시원하게 해요.'],
      ['이중창', wins.some(w => w.id === 'dglass'), '유리 사이 공기층이 열의 이동을 줄여요.']
    ];
    const rain = [
      ['높인 기초', h.base === 'raised_base', '큰비에 물이 집 안으로 들어오는 걸 줄여요.'],
      ['빗물 저금통', h.yard.includes('rain_barrel'), '지붕 빗물을 모아 두었다가 다시 써요.'],
      ['빗물 정원', h.yard.includes('rain_garden'), '빗물을 잠시 모아 땅으로 천천히 스며들게 해요.']
    ];
    const warn = [];
    if (walls.includes('brick') && h.base !== 'raised_base') warn.push('흙벽돌 벽은 물에 약해요. 기초를 높이면 좋아요.');
    if (walls.includes('metalwall') && !h.insulation) warn.push('금속 벽은 열이 잘 통해요. 단열재를 넣어요.');
    if (wins.some(w => !w.awn) && h.roof) warn.push('차양 없는 창은 여름 햇빛이 그대로 들어와요.');
    return { heat, rain, warn, heatOk: heat.filter(c => c[1]).length, rainOk: rain.filter(c => c[1]).length };
  }
  function opts(slot, current, noneLabel = '없음') {
    const ids = Object.keys(PARTS).filter(id => PARTS[id].slot === slot);
    return `<option value="">${noneLabel}</option>` + ids.filter(id => G.count(id) > 0 || id === current).map(id => `<option value="${id}" ${id === current ? 'selected' : ''}>${PARTS[id].name}${id === current ? ' (설치됨)' : ` (${G.count(id)}개)`}</option>`).join('');
  }
  function renderHouse(el) {
    const S = G.S, h = S.house, c = checks();
    const floorCtl = f => `<fieldset class="floor"><legend>${f + 1}층</legend>
      <label>벽 <select data-wall="${f}">${opts('wall', h.walls[f], '벽 없음')}</select></label>
      ${[0, 1].map(k => `<label>${k ? '오른쪽' : '왼쪽'} 창 <select data-win="${f}|${k}">${opts('window', h.windows[f][k], '창 없음')}</select></label>
      <label class="check"><input type="checkbox" data-awn="${f}|${k}" ${h.awnings[f][k] ? 'checked' : ''} ${h.windows[f][k] ? '' : 'disabled'}> 차양 <small>(대나무 차양 ${G.count('bamboo_shade')}개)</small></label>`).join('')}
    </fieldset>`;
    el.innerHTML = `<div class="house-ui">
      <div class="h-view">${Art.houseSVG(h, '내 집')}
        <div class="checks"><div><h4>폭염 대비 ${c.heatOk}/${c.heat.length}</h4><ul>${c.heat.map(([nm, ok, why]) => `<li class="${ok ? 'ok' : ''}" title="${G.esc(why)}">${ok ? '✔' : '○'} ${nm}<small>${G.esc(why)}</small></li>`).join('')}</ul></div>
        <div><h4>집중호우 대비 ${c.rainOk}/${c.rain.length}</h4><ul>${c.rain.map(([nm, ok, why]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${nm}<small>${G.esc(why)}</small></li>`).join('')}</ul></div></div>
        ${c.warn.length ? `<ul class="warns">${c.warn.map(w => `<li>⚠ ${G.esc(w)}</li>`).join('')}</ul>` : ''}
        <p class="hint">${G.esc(HOUSE_NOTES[0])}</p>
      </div>
      <div class="h-ctl">
        <div class="og-row"><span class="og-label">층수</span><button type="button" class="pill${h.floors === 1 ? ' on' : ''}" data-floors="1">1층</button><button type="button" class="pill${h.floors === 2 ? ' on' : ''}" data-floors="2">2층</button></div>
        <label>기초 <select data-base="1"><option value="basic">낮은 기초 (기본)</option>${G.count('raised_base') || h.base === 'raised_base' ? `<option value="raised_base" ${h.base === 'raised_base' ? 'selected' : ''}>돌 기초(높임)${h.base === 'raised_base' ? ' (설치됨)' : ` (${G.count('raised_base')}개)`}</option>` : ''}</select></label>
        ${floorCtl(0)}${h.floors === 2 ? floorCtl(1) : ''}
        <label class="check"><input type="checkbox" data-ins="1" ${h.insulation ? 'checked' : ''}> 벽 속 볏짚 단열재 <small>(${G.count('insulation')}개)</small></label>
        <label>지붕 <select data-roof="1">${opts('roof', h.roof, '지붕 없음')}</select></label>
        <label>지붕 위 <select data-rooftop="1">${opts('roofTop', h.roofTop)}</select></label>
        ${[0, 1, 2].map(i => `<label>마당 ${['왼쪽', '오른쪽', '앞'][i]} <select data-yard="${i}">${opts('yard', h.yard[i])}</select></label>`).join('')}
        <p class="hint">부품은 목공소에서 만들어요. 떼어 낸 부품은 가방으로 돌아와요.</p>
      </div></div>`;
    const act = fn => e => { if (fn(e) !== false) G.changed(); else G.renderPanel(); };
    el.querySelectorAll('[data-floors]').forEach(b => b.onclick = act(() => {
      const n = +b.dataset.floors;
      if (n === h.floors) return false;
      if (n === 1) { // 2층 부품은 가방으로
        swap(h.walls[1], null); h.walls[1] = null;
        [0, 1].forEach(k => { swap(h.windows[1][k], null); h.windows[1][k] = null; if (h.awnings[1][k]) { G.add('bamboo_shade'); h.awnings[1][k] = false; } });
      }
      h.floors = n;
    }));
    el.querySelectorAll('[data-wall]').forEach(s => s.onchange = act(() => { const f = +s.dataset.wall; if (!swap(h.walls[f], s.value || null)) return false; h.walls[f] = s.value || null; }));
    el.querySelectorAll('[data-win]').forEach(s => s.onchange = act(() => {
      const [f, k] = s.dataset.win.split('|').map(Number);
      if (!swap(h.windows[f][k], s.value || null)) return false;
      h.windows[f][k] = s.value || null;
      if (!h.windows[f][k] && h.awnings[f][k]) { G.add('bamboo_shade'); h.awnings[f][k] = false; }
    }));
    el.querySelectorAll('[data-awn]').forEach(cb => cb.onchange = act(() => {
      const [f, k] = cb.dataset.awn.split('|').map(Number);
      if (cb.checked) { if (!G.take('bamboo_shade')) { G.toast('대나무 차양이 없어요. 목공소에서 만들어요.'); return false; } h.awnings[f][k] = true; }
      else { G.add('bamboo_shade'); h.awnings[f][k] = false; }
    }));
    el.querySelector('[data-base]').onchange = act(e => { const v = e.target.value; if (!swap(h.base, v)) return false; h.base = v; });
    el.querySelector('[data-ins]').onchange = act(e => {
      if (e.target.checked) { if (!G.take('insulation')) { G.toast('볏짚 단열재가 없어요. 목공소에서 만들어요.'); return false; } h.insulation = true; }
      else { G.add('insulation'); h.insulation = false; }
    });
    el.querySelector('[data-roof]').onchange = act(e => { const v = e.target.value || null; if (!swap(h.roof, v)) return false; h.roof = v; });
    el.querySelector('[data-rooftop]').onchange = act(e => { const v = e.target.value || null; if (!swap(h.roofTop, v)) return false; h.roofTop = v; });
    el.querySelectorAll('[data-yard]').forEach(s => s.onchange = act(() => { const i = +s.dataset.yard; if (!swap(h.yard[i], s.value || null)) return false; h.yard[i] = s.value || null; }));
  }
  G.registerPanel('house', { title: '내 집터', icon: () => '<span class="emoji-ico">🏡</span>', render: renderHouse });

  /* ---------- 기후 연구소 ---------- */
  function renderLab(el) {
    const S = G.S, rows = ['기준', '2030년대', '2050년대', '2090년대'];
    const cur = CHAPTERS[S.chapter].period;
    const heatL = CLIMATE[S.region].heat.low, heatH = CLIMATE[S.region].heat.high;
    const max = Math.max(...heatH, ...heatL);
    const bar = (x, v, color, on) => { const hgt = v / max * 150; return `<rect x="${x}" y="${190 - hgt}" width="34" height="${hgt}" rx="5" fill="${color}" opacity="${on ? 1 : .45}"/><text x="${x + 17}" y="${184 - hgt}" text-anchor="middle" font-size="13" font-weight="800" fill="#33475B">${G.fmtNum(v)}</text>`; };
    const chart = `<svg viewBox="0 0 520 230" role="img" aria-label="시기별 폭염일수 비교">${rows.map((r, i) => { const x = 40 + i * 120; return `${bar(x, heatL[i], '#3FA796', S.scenario === 'low')}${bar(x + 40, heatH[i], '#E8806A', S.scenario === 'high')}<text x="${x + 37}" y="212" text-anchor="middle" font-size="13" font-weight="${i === cur ? 900 : 600}" fill="${i === cur ? '#B45309' : '#52606D'}">${r}${i === cur ? ' ◀' : ''}</text>`; }).join('')}<path d="M30 190 H500" stroke="#B9C4CC" stroke-width="2"/></svg>`;
    const heatP = Math.round(G.clamp(G.climate('heat') / SUMMER_DAYS, 0.05, 0.8) * 100);
    el.innerHTML = `<div class="lab">
      <div class="lab-head">${Art.npcSVG('researcher', 70)}<div><b>${S.region} · ${SCENARIOS[S.scenario].name} (${SCENARIOS[S.scenario].code})</b><p>지금 탐험 중인 시대: <b>${CHAPTERS[S.chapter].title}</b> (${PERIOD_YEARS[cur]})</p></div></div>
      <h4>폭염일수 (한 해 평균, 일)</h4><div class="legend"><span class="lg low">저탄소 SSP1-2.6</span><span class="lg high">고탄소 SSP5-8.5</span></div>${chart}
      <table class="clim"><thead><tr><th>시기</th><th>연평균기온</th><th>폭염일수</th><th>연강수량</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${i === cur ? 'cur' : ''}"><td>${r}<small>${PERIOD_YEARS[i]}</small></td><td>${G.fmtNum(G.climate('temp', i))}℃</td><td>${G.fmtNum(G.climate('heat', i))}일</td><td>${G.fmtNum(G.climate('rain', i))}mm</td></tr>`).join('')}</tbody></table>
      <p class="tip">게임 속 날씨: 이 시대의 폭염일수 ${G.fmtNum(G.climate('heat'))}일을 여름 ${SUMMER_DAYS}일로 나눠, 하루가 폭염일 확률을 약 ${heatP}%로 정했어요(최대 80%). 학습을 위한 단순화이고 실제 날씨 예보가 아니에요.</p>
      <div class="lab-switch"><span class="og-label">다른 미래로 바꿔 보기</span>
        ${Object.keys(CLIMATE).map(r => `<button type="button" class="pill${S.region === r ? ' on' : ''}" data-region="${r}">${r}</button>`).join('')}
        ${Object.entries(SCENARIOS).map(([k, sc]) => `<button type="button" class="pill${S.scenario === k ? ' on' : ''}" data-scen="${k}">${sc.name}</button>`).join('')}</div>
      <p class="hint">자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023), 행정구역 평균. 기준 시기는 기후모델이 과거를 재현한 값이에요. 폭염일수는 하루 최고기온이 33℃ 이상인 날의 수예요.</p>
    </div>`;
    const reset = () => { G.changed(); G.refreshAvatar(); G.renderMapWeather(); };
    el.querySelectorAll('[data-region]').forEach(b => b.onclick = () => { S.region = b.dataset.region; reset(); });
    el.querySelectorAll('[data-scen]').forEach(b => b.onclick = () => { S.scenario = b.dataset.scen; reset(); });
  }
  G.registerPanel('lab', { title: '기후 연구소', icon: () => Art.npcSVG('researcher', 40), render: renderLab });

  return { isBuilt, checks };
})();
