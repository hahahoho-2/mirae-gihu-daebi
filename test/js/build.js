/* ==========================================================================
   집 점검(폭염·집중호우) · 기후 연구소(예측 문제·기후 자료)
   ========================================================================== */
const Build = (() => {
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

  /* ---------- 기후 연구소: 예측 문제 · 기후 자료 ---------- */
  let labTab = null;
  function renderLab(el) {
    const tab = labTab || 'fc';
    el.innerHTML = `<div class="tabs">${[['fc', '🔭 예측 문제'], ['data', '📊 기후 자료 표']].map(([k, nm]) => `<button type="button" class="tab${tab === k ? ' on' : ''}" data-ltab="${k}">${nm}</button>`).join('')}</div><div id="labBody"></div>`;
    el.querySelectorAll('[data-ltab]').forEach(b => b.onclick = () => { labTab = b.dataset.ltab; G.renderPanel(); });
    const body = G.$('labBody');
    if (tab === 'fc') Mission.renderForecast(body); else renderLabData(body);
  }
  // 표는 다른 지역·미래로 바꿔 볼 수 있어요(보기만 바뀌고, 내 게임의 지역·미래는 그대로예요)
  let view = null;
  function renderLabData(el) {
    const S = G.S, rows = ['기준', '2030년대', '2050년대', '2090년대'];
    if (!view) view = { region: S.region, scenario: S.scenario };
    const cur = CHAPTERS[S.chapter].period, R = view.region, sc = view.scenario, mine = R === S.region && sc === S.scenario;
    const val = (key, i) => CLIMATE[R][key][sc][i];
    const heatL = CLIMATE[R].heat.low, heatH = CLIMATE[R].heat.high;
    const max = Math.max(...heatH, ...heatL);
    const bar = (x, v, color, on) => { const hgt = v / max * 150; return `<rect x="${x}" y="${190 - hgt}" width="34" height="${hgt}" rx="5" fill="${color}" opacity="${on ? 1 : .45}"/><text x="${x + 17}" y="${184 - hgt}" text-anchor="middle" font-size="13" font-weight="800" fill="#33475B">${G.fmtNum(v)}</text>`; };
    const chart = `<svg viewBox="0 0 520 230" role="img" aria-label="${R} 시기별 폭염일수 비교">${rows.map((r, i) => { const x = 40 + i * 120; return `${bar(x, heatL[i], '#3FA796', sc === 'low')}${bar(x + 40, heatH[i], '#E8806A', sc === 'high')}<text x="${x + 37}" y="212" text-anchor="middle" font-size="13" font-weight="${i === cur ? 900 : 600}" fill="${i === cur ? '#B45309' : '#52606D'}">${r}${i === cur ? ' ◀' : ''}</text>`; }).join('')}<path d="M30 190 H500" stroke="#B9C4CC" stroke-width="2"/></svg>`;
    const heatP = Math.round(G.clamp(G.climate('heat') / SUMMER_DAYS, 0.05, 0.8) * 100);
    el.innerHTML = `<div class="lab">
      <div class="lab-head">${Art.npcSVG('researcher', 70)}<div><b>내 게임: ${S.region} · ${SCENARIOS[S.scenario].name} (${SCENARIOS[S.scenario].code})</b><p>지금 탐험 중인 시대: <b>${CHAPTERS[S.chapter].title}</b> (${PERIOD_YEARS[cur]})</p></div></div>
      <div class="lab-switch"><span class="og-label">자료 보기</span>
        ${Object.keys(CLIMATE).map(r => `<button type="button" class="pill${R === r ? ' on' : ''}" data-region="${r}">${r}</button>`).join('')}
        ${Object.entries(SCENARIOS).map(([k, s]) => `<button type="button" class="pill${sc === k ? ' on' : ''}" data-scen="${k}">${s.name}</button>`).join('')}</div>
      ${mine ? '' : '<p class="hint warn">다른 지역·미래의 자료를 보고 있어요. 내 게임의 지역·미래는 바뀌지 않아요.</p>'}
      <h4>폭염일수 (한 해 평균, 일) <small>${R}</small></h4><div class="legend"><span class="lg low">저탄소 SSP1-2.6</span><span class="lg high">고탄소 SSP5-8.5</span></div>${chart}
      <table class="clim"><thead><tr><th>시기 <small>${SCENARIOS[sc].name}</small></th><th>연평균기온</th><th>폭염일수</th><th>연강수량</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${i === cur ? 'cur' : ''}"><td>${r}<small>${PERIOD_YEARS[i]}</small></td><td>${G.fmtNum(val('temp', i))}℃</td><td>${G.fmtNum(val('heat', i))}일</td><td>${G.fmtNum(val('rain', i))}mm</td></tr>`).join('')}</tbody></table>
      <p class="tip">게임 속 날씨: 내 게임 시대의 폭염일수 ${G.fmtNum(G.climate('heat'))}일을 여름 ${SUMMER_DAYS}일로 나눠, 하루가 폭염일 확률을 약 ${heatP}%로 정했어요(최대 80%). 학습을 위한 단순화이고 실제 날씨 예보가 아니에요.</p>
      <p class="hint">자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023), 행정구역 평균. 기준 시기는 기후모델이 과거를 재현한 값이에요. 폭염일수는 하루 최고기온이 33℃ 이상인 날의 수예요.</p>
    </div>`;
    el.querySelectorAll('[data-region]').forEach(b => b.onclick = () => { view.region = b.dataset.region; G.renderPanel(); });
    el.querySelectorAll('[data-scen]').forEach(b => b.onclick = () => { view.scenario = b.dataset.scen; G.renderPanel(); });
  }
  G.registerPanel('lab', { title: '기후 연구소', icon: () => Art.npcSVG('researcher', 40), render: renderLab, onClose() { labTab = null; view = null; } });

  return { isBuilt, checks };
})();
