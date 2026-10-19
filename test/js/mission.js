/* ==========================================================================
   5분 기후 대비 미션: 대비 목표 · 대비 용품 · 예측 문제 · 여름 5일 · 점수 · 시간 · 게임 방법
   - 시대마다 ① 예측 → ② 준비(의·식·주) → ③ 여름 5일 → ④ 돌아보기
   - 목표·점수는 비교를 위한 학습용 규칙이에요(실제 예보·성능 시험값이 아니에요).
   ========================================================================== */
const Mission = (() => {
  const $ = id => document.getElementById(id);
  const S = () => G.S;
  const fmt = v => G.fmtNum(v);
  const PARTS3 = ['의', '식', '주'];
  const RISK = { heat: { name: '폭염', icon: '☀️' }, rain: { name: '집중호우', icon: '☔' } };
  const byId = id => MEASURES.find(m => m.id === id);

  /* ---------- 대비 목표 ---------- */
  const heatOf = (ch, sc, region) => CLIMATE[region].heat[sc][CHAPTERS[ch].period];
  function levelIndex(heatDays) { return LEVELS.findIndex(l => heatDays < l.max); }
  // 아래 함수들은 상태(s)를 넘기면 그 상태로 계산해요(자동 시험에서 써요)
  function level(ch, s = S()) {
    const c = ch || s.chapter;
    const i = levelIndex(heatOf(c, s.scenario, s.region));
    return { no: i + 1, ...LEVELS[i] };
  }
  function era(ch, s = S()) {
    const key = String(ch || s.chapter);
    if (!s.eras[key]) s.eras[key] = { fc: null, started: false, done: false, next: false, days: [] };
    return s.eras[key];
  }
  // 의·식·주마다 갖춘 폭염·집중호우 대비 수
  function counts(s = S()) {
    const c = { 의: { heat: 0, rain: 0 }, 식: { heat: 0, rain: 0 }, 주: { heat: 0, rain: 0 } };
    MEASURES.forEach(m => { if (s.owned[m.id] && m.part !== '주') c[m.part][m.risk]++; });
    const hc = Build.checks(s.house);
    c.주.heat = hc.heatOk; c.주.rain = hc.rainOk;
    return c;
  }
  function goals(s = S()) {
    const L = level(null, s), c = counts(s);
    return PARTS3.map(p => ({ p, heat: [c[p].heat, L[PART_INFO[p].heat]], rain: [c[p].rain, L[PART_INFO[p].rain]] }));
  }
  const ready = (s = S()) => goals(s).every(g => g.heat[0] >= g.heat[1] && g.rain[0] >= g.rain[1]);

  /* ---------- 산 용품 → 옷·집·밭·식탁 모습 ---------- */
  function applyAll(s) {
    const o = id => !!s.owned[id];
    const heatOutfit = { id: 'o_heat', name: '여름옷', top: o('c_loose') ? 'tee' : 'cardigan', color: o('c_white') ? 'white' : 'navy', fabric: o('c_ramie') ? 'fab_ramie_mesh' : 'fab_cotton_plain', details: o('c_mesh') ? ['mesh'] : [], hat: o('c_hat') ? 'sunhat' : 'none', shoes: 'sneakers' };
    s.outfits = [heatOutfit];
    if (o('c_coat') || o('c_boots')) s.outfits.push({ id: 'o_rain', name: '비옷', top: o('c_coat') ? 'raincoat' : 'shirt', color: 'yellow', fabric: o('c_coat') ? 'fab_rnylon_plain' : 'fab_cotton_plain', details: o('c_coat') ? ['hood'] : [], hat: o('c_coat') ? 'rainhat' : 'none', shoes: o('c_boots') ? 'boots' : 'sneakers' });
    s.equipped = 'o_heat';
    const h = G.emptyHouse(), win = o('h_dglass') ? 'dglass' : 'glass';
    h.walls[0] = 'timber'; h.windows[0] = [win, win]; h.awnings[0] = [o('h_awning'), o('h_awning')];
    h.roof = o('h_roof') ? 'metalroof' : 'woodroof'; h.insulation = o('h_insul'); h.base = o('h_base') ? 'raised_base' : 'basic';
    h.yard = [o('h_tree') ? 'shade_tree' : null, o('h_garden') ? 'rain_garden' : null, o('h_barrel') ? 'rain_barrel' : null];
    s.house = h;
    const crop = i => (i === 5 ? 'rice' : o('f_crops') ? ['sweet', 'sorghum', 'sweet', 'sorghum', 'sweet'][i] : ['lettuce', 'soy', 'lettuce', 'soy', 'lettuce'][i]);
    s.plots = Array.from({ length: 6 }, (_, i) => ({ crop: crop(i), stage: CROPS[crop(i)].days - 1, moisture: 1, stress: 0, stressTotal: 0, shade: o('f_shade') && i !== 5, greenhouse: o('f_cover') && i < 2, mulch: o('f_shade') && i !== 5, drain: o('f_drain') && i !== 5, dead: false }));
    s.table = [o('f_crops') ? 'sorghum_rice' : 'rice_bowl', o('f_fridge') ? 'kongguk' : null, o('f_crops') ? 'jeon' : 'lettuce_salad', null];
  }
  // 사기 규칙(순수 함수): 예측을 마친 준비 단계에서, 코인이 있으면 사요
  function buy(s, id) {
    const m = byId(id);
    if (s.finished) return { ok: false, why: '이번 판은 끝났어요. 「다시 하기」로 새로 시작해요.' };
    if (!m) return { ok: false, why: '파는 물건이 아니에요.' };
    if (s.owned[id]) return { ok: false, why: '이미 갖췄어요.' };
    if ((s.coins || 0) < m.cost) return { ok: false, why: `코인이 모자라요(필요 ${m.cost}, 가진 것 ${s.coins || 0}).` };
    s.coins -= m.cost;
    s.owned[id] = true;
    applyAll(s);
    return { ok: true, cost: m.cost };
  }

  /* ---------- 여름 5일 날씨 ----------
     5일 중 폭염일 수는 그 시대 폭염일수 비율(폭염일수 ÷ 여름 92일)에 맞춰 정해요(1~4일).
     집중호우는 하루 넣어 대비를 꼭 확인해요. 학습용 단순화예요. */
  function livePlan(ch, s = S()) {
    const c = ch || s.chapter;
    const heatP = G.clamp(heatOf(c, s.scenario, s.region) / SUMMER_DAYS, 0.05, 0.8);
    const nHeat = G.clamp(Math.round(SUMMER_LIVE_DAYS * heatP), 1, SUMMER_LIVE_DAYS - 1);
    const rest = ['sunny', 'cloudy', 'rain'];
    const days = Array.from({ length: nHeat }, () => 'heat').concat('storm');
    while (days.length < SUMMER_LIVE_DAYS) days.push(rest[Math.floor(G.rand01(s.seed, c, 'rest', days.length) * rest.length)]);
    return days.map((w, i) => [G.rand01(s.seed, c, 'order', i), w]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  }

  /* ---------- 하루 점검: 폭염일·집중호우일에 의·식·주 대비가 목표만큼 있는지 ---------- */
  const DAY_TEXT = {
    heat: { 의: ['옷이 시원해서 땀이 잘 말랐어요.', '옷이 더웠어요.'], 식: ['작물과 음식이 더위를 잘 견뎠어요.', '작물이 시들고 음식이 상하기 쉬웠어요.'], 주: ['집 안이 비교적 시원했어요.', '집 안이 무더웠어요.'] },
    rain: { 의: ['비옷 덕분에 덜 젖었어요.', '비에 흠뻑 젖었어요.'], 식: ['밭에 물이 고이지 않았어요.', '밭에 물이 고여 뿌리가 상했어요.'], 주: ['빗물을 잘 다스렸어요.', '집 둘레에 물이 고였어요.'] }
  };
  function dayCheck(w, s = S()) {
    if (w !== 'heat' && w !== 'storm') return [];
    const risk = w === 'heat' ? 'heat' : 'rain', L = level(null, s), c = counts(s);
    return PARTS3.map(p => {
      const need = L[PART_INFO[p][risk]], have = c[p][risk];
      let ok = have >= need, t = DAY_TEXT[risk][p][ok ? 0 : 1] + (ok ? '' : ` ${RISK[risk].name} 대비 ${have}/${need}개.`);
      if (risk === 'heat' && p === '식' && s.owned.f_cover && !s.owned.f_shade) { ok = false; t = '닫힌 비가림 온실이 폭염에 너무 뜨거워졌어요. 밭 차양을 함께 해요.'; }
      return { p, ok, t };
    });
  }

  /* ---------- 점수 ---------- */
  function eraScore(e) {
    const checks = e.days.flatMap(d => d.c);
    return { got: (e.fc && e.fc.correct ? 10 : 0) + checks.filter(x => x[1]).length * 10, max: 10 + checks.length * 10, pass: checks.filter(x => x[1]).length, n: checks.length };
  }
  function totals(s = S()) {
    const done = [1, 2, 3].map(c => s.eras[String(c)]).filter(e => e && e.done);
    const sum = done.reduce((a, e) => { const r = eraScore(e); return { got: a.got + r.got, max: a.max + r.max }; }, { got: 0, max: 0 });
    const ratio = sum.max ? sum.got / sum.max : 0;
    return { ...sum, bonus: s.timeBonus || 0, total: sum.got + (s.timeBonus || 0), ratio, rank: RANKS.find(r => ratio >= r.min) };
  }

  /* ---------- 코인 ---------- */
  function addCoins(n) { S().coins = G.clamp((S().coins || 0) + n, 0, 99999); G.updateHUD(); }

  /* ---------- 시간 ---------- */
  const clock = sec => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
  function second() {
    const s = S();
    if (!s || !s.started || s.finished || document.hidden || $('screen-game').hidden) return;
    s.timeLeft = Math.max(0, (s.timeLeft || 0) - 1);
    G.updateHUD();
    if (s.timeLeft === 60) G.toast('⏰ 1분 남았어요!', 'big');
    if (s.timeLeft % 10 === 0) G.save();
    if (s.timeLeft <= 0) finish(true);
  }
  function finish(timeUp) {
    const s = S();
    if (s.finished) return;
    s.finished = true; s.timeUp = !!timeUp;
    s.timeBonus = timeUp ? 0 : Math.floor(s.timeLeft / 6);
    G.save(); G.updateHUD();
    if (G.dialogOpen && G.dialogOpen()) return;
    G.openPanel('final');
  }

  /* ---------- ① 예측 문제 (연구소) ---------- */
  function shuffle(list, ...seed) { return list.map((v, i) => [G.rand01(...seed, i), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]); }
  function forecastQuestion(ch, s = S()) {
    const c = ch || s.chapter, p = CHAPTERS[c].period, H = CLIMATE[s.region].heat, sc = s.scenario;
    const now = H[sc][p], base = H[sc][0];
    if (c === 1) {
      const other = sc === 'low' ? 'high' : 'low';
      const wrong = [...new Set([base, H[other][p], H[sc][3]].filter(v => Math.abs(v - now) >= 1))].slice(0, 2);
      return {
        q: `그래프를 읽어요. ${s.region} · ${SCENARIOS[sc].name}에서 2030년대(${PERIOD_YEARS[p]})의 한 해 평균 폭염일수는 며칠일까요?`,
        options: shuffle([[`${fmt(now)}일`, true], ...wrong.map(v => [`${fmt(v)}일`, false])], s.seed, c, 'q'),
        why: `${SCENARIOS[sc].name} 막대에서 2030년대를 읽으면 ${fmt(now)}일이에요. 기준 시기(2000–2019) ${fmt(base)}일보다 늘었어요.`
      };
    }
    if (c === 2) {
      const ratio = now / base, k = Math.max(1, Math.round(ratio));
      return {
        q: `2050년대의 폭염일수(${fmt(now)}일)는 기준 시기(${fmt(base)}일)의 약 몇 배일까요?`,
        options: shuffle([...new Set([k, k + 2, k >= 3 ? k - 1 : k + 1])].map(v => [`약 ${v}배`, v === k]), s.seed, c, 'q'),
        why: `${fmt(now)} ÷ ${fmt(base)} ≈ ${fmt(ratio)}이라서 약 ${k}배예요. 여름이 점점 더 더워져요.`
      };
    }
    const lo = H.low[p], hi = H.high[p], r = Math.max(1, Math.round(hi / lo));
    return {
      q: `2090년대 고탄소 미래의 폭염일수(${fmt(hi)}일)는 저탄소 미래(${fmt(lo)}일)의 약 몇 배일까요?`,
      options: shuffle([...new Set([r, r + 2, r >= 3 ? r - 1 : r + 1])].map(v => [`약 ${v}배`, v === r]), s.seed, c, 'q'),
      why: `${fmt(hi)} ÷ ${fmt(lo)} ≈ ${fmt(hi / lo)}이라서 약 ${r}배예요. 온실가스를 줄이는 「완화」가 미래 더위를 크게 바꿔요.`
    };
  }
  let pick = null;
  function chartHTML(s) {
    const H = CLIMATE[s.region].heat, rows = ['기준', '2030년대', '2050년대', '2090년대'], cur = CHAPTERS[s.chapter].period;
    const max = Math.max(...H.high, ...H.low);
    const bar = (x, v, color, on) => { const hgt = v / max * 130; return `<rect x="${x}" y="${170 - hgt}" width="34" height="${hgt}" rx="5" fill="${color}" opacity="${on ? 1 : .4}"/><text x="${x + 17}" y="${164 - hgt}" text-anchor="middle" font-size="13" font-weight="800" fill="#33475B">${fmt(v)}</text>`; };
    return `<div class="legend"><span class="lg low">저탄소 SSP1-2.6</span><span class="lg high">고탄소 SSP5-8.5</span></div>
      <svg class="fc-chart" viewBox="0 0 520 205" role="img" aria-label="${s.region} 시기별 한 해 평균 폭염일수">${rows.map((r, i) => { const x = 40 + i * 120; return `${bar(x, H.low[i], '#3FA796', s.scenario === 'low')}${bar(x + 40, H.high[i], '#E8806A', s.scenario === 'high')}<text x="${x + 37}" y="192" text-anchor="middle" font-size="13" font-weight="${i === cur ? 900 : 600}" fill="${i === cur ? '#B45309' : '#52606D'}">${r}${i === cur ? ' ◀' : ''}</text>`; }).join('')}<path d="M30 170 H500" stroke="#B9C4CC" stroke-width="2"/></svg>
      <p class="hint">한 해 평균 폭염일수(하루 최고기온 33℃ 이상인 날). 자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023).</p>`;
  }
  function targetsHTML(L) {
    return `<div class="tgt-grid">${PARTS3.map(p => `<div><b>${PART_INFO[p].icon} ${p}</b><span>☀️ 폭염 대비 ${L[PART_INFO[p].heat]}개</span><span>☔ 집중호우 대비 ${L[PART_INFO[p].rain]}개</span></div>`).join('')}</div>`;
  }
  function renderForecast(el) {
    const s = S(), e = era(), L = level(), heat = heatOf(s.chapter, s.scenario, s.region), q = forecastQuestion();
    const lockFuture = s.chapter > 1 || e.fc;
    el.innerHTML = `<div class="fc">
      ${lockFuture ? `<p class="fc-future">${s.region} · ${SCENARIOS[s.scenario].name} (${SCENARIOS[s.scenario].code})</p>` : `<div class="lab-switch"><span class="og-label">지역</span>${Object.keys(CLIMATE).map(r => `<button type="button" class="pill${s.region === r ? ' on' : ''}" data-region="${r}">${r}</button>`).join('')}
        <span class="og-label">미래</span>${Object.entries(SCENARIOS).map(([k, sc]) => `<button type="button" class="pill${s.scenario === k ? ' on' : ''}" data-scen="${k}">${sc.name}</button>`).join('')}</div>`}
      ${chartHTML(s)}
      <div class="fc-q"><b>${G.esc(q.q)}</b>
        ${e.fc ? `<p>${q.options.map(([t, ok], k) => `<span class="fc-opt${ok ? ' right' : ''}${e.fc.answer === k && !ok ? ' wrong' : ''}">${ok ? '✔ ' : ''}${G.esc(t)}</span>`).join('')}</p><small>${G.esc(q.why)}</small>`
        : `<div class="og-row">${q.options.map(([t], k) => `<button type="button" class="pill big-pill${pick === k ? ' on' : ''}" data-pick="${k}">${G.esc(t)}</button>`).join('')}</div>`}
      </div>
      ${e.fc ? `<div class="level-card lv${L.no}"><div class="lc-head"><span class="lc-badge">${L.name}</span><b>폭염일 약 ${fmt(heat)}일/년</b><small>${L.range}</small></div>
          <p>이번 시대에 갖출 대비 용품 수예요. 여름 5일 중 폭염일은 <b>${livePlan().filter(w => w === 'heat').length}일</b>, 집중호우일은 <b>1일</b> 와요.</p>${targetsHTML(L)}</div>
        <div class="panel-actions"><span class="hint">🪙 ${s.coins}코인으로 여울 상점에서 대비 용품을 사요.</span><button type="button" class="btn primary" id="fcGo">② 대비하러 상점으로 ▶</button></div>`
      : `<div class="panel-actions"><span class="hint">맞히면 대비 예산 🪙 ${FORECAST_BONUS}코인을 더 받아요.</span><button type="button" class="btn primary" id="fcSubmit" ${pick === null ? 'disabled' : ''}>답하기</button></div>`}
    </div>`;
    el.querySelectorAll('[data-region]').forEach(b => b.onclick = () => { s.region = b.dataset.region; pick = null; G.renderPanel(); });
    el.querySelectorAll('[data-scen]').forEach(b => b.onclick = () => { s.scenario = b.dataset.scen; pick = null; G.renderPanel(); });
    el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { pick = +b.dataset.pick; G.renderPanel(); });
    if ($('fcSubmit')) $('fcSubmit').onclick = () => {
      if (s.finished) { G.openPanel('final'); return; }
      const correct = q.options[pick][1];
      e.fc = { answer: pick, correct };
      pick = null;
      if (correct) addCoins(FORECAST_BONUS);
      G.toast(correct ? `정답! 🪙 +${FORECAST_BONUS} · 이번 시대 목표: ${L.name}` : `아쉬워요. 풀이를 읽어 봐요 · 이번 시대 목표: ${L.name}`, 'big');
      G.changed();
    };
    if ($('fcGo')) $('fcGo').onclick = () => { G.closePanel(); G.goTarget(); };
  }

  /* ---------- ③ 여름 5일 (자동으로 지나가요) ---------- */
  let anim = null;
  function startSummer() {
    const s = S(), e = era();
    if (s.finished) { G.openPanel('final'); return; }
    if (QUESTS[s.quest].stage !== 'prepare' || !e.fc) { G.toast('먼저 연구소에서 예측 문제를 풀어요.'); return; }
    e.started = true;
    e.days = livePlan().map(w => ({ w, c: dayCheck(w).map(x => [x.p, x.ok ? 1 : 0]) }));
    G.changed();
    G.openPanel('summer', { animate: true });
  }
  function dayCardHTML(d, i, shown) {
    if (!shown) return `<div class="sd-card wait"><b>${i + 1}일</b><span class="sd-q">?</span></div>`;
    const checks = d.c.length ? d.c.map(([p, ok]) => `<i class="${ok ? 'ok' : 'no'}">${p} ${ok ? '✔' : '✘'}</i>`).join('') : '<small>평범한 여름날</small>';
    return `<div class="sd-card w-${d.w}">${Art.weatherIcon(d.w, 40)}<b>${i + 1}일 · ${WEATHER[d.w].name}</b><span class="sd-checks">${checks}</span></div>`;
  }
  function renderSummer(el, arg) {
    const s = S(), e = era(), sc = eraScore(e), L = level();
    const animate = arg && arg.animate && !e.done;
    let shown = animate ? 0 : e.days.length;
    const draw = () => {
      const lines = e.days.slice(0, shown).flatMap((d, i) => d.c.length ? [`<li class="${d.w}"><b>${i + 1}일 ${WEATHER[d.w].name}</b> ${dayCheck(d.w).map(x => `<span class="${x.ok ? 'ok' : 'no'}">${x.p}: ${G.esc(x.t)}</span>`).join(' ')}</li>`] : []);
      const finished = e.done; // 기록을 마친 뒤에만 결과와 「다음 시대로」를 보여 줘요
      const fails = {}; e.days.forEach(d => d.c.forEach(([p, ok]) => { if (!ok) fails[p] = (fails[p] || 0) + 1; }));
      const weak = PARTS3.filter(p => fails[p]).sort((a, b) => fails[b] - fails[a]);
      el.innerHTML = `<p class="tip">${L.name} 목표로 준비한 의·식·주가 여름을 버틸까요? 폭염일과 집중호우일에 점검해요.</p>
        <div class="sd-row">${e.days.map((d, i) => dayCardHTML(d, i, i < shown)).join('')}</div>
        <ul class="sd-lines">${lines.join('')}</ul>
        ${finished ? `<div class="sd-result"><div class="rc-box"><small>이번 시대 점수</small><b>${sc.got}점</b><span>점검 통과 ${sc.pass}/${sc.n} · 예측 ${e.fc && e.fc.correct ? '✔ +10' : '✘'}</span></div>
          <p>${weak.length ? `다음 시대엔 <b>${weak.map(p => `${p}(${PART_INFO[p].name})`).join('·')}</b> 대비를 보완해요. 산 용품은 그대로 남고, 다음 시대 목표는 더 높아질 수 있어요.` : '모든 점검을 통과했어요! 다음 시대에도 예측을 보고 대비해요.'}</p>
          <div class="panel-actions"><button type="button" class="btn primary" id="sdNext">${s.chapter < 3 ? '다음 시대로 ▶' : '최종 결과 보기 ▶'}</button></div></div>`
          : `<div class="panel-actions"><button type="button" class="btn small" id="sdSkip">바로 보기</button></div>`}`;
      if ($('sdSkip')) $('sdSkip').onclick = () => { clearTimeout(anim); shown = e.days.length; finishAnim(); };
      if ($('sdNext')) $('sdNext').onclick = nextEra;
    };
    const finishAnim = () => { if (!e.done) { e.done = true; G.save(); G.checkQuest(); } G.renderMapWeather('sunny'); draw(); };
    const stepAnim = () => {
      G.renderMapWeather(e.days[shown].w);
      shown++;
      if (shown >= e.days.length) { anim = setTimeout(finishAnim, 700); draw(); return; } // 마지막 날을 잠깐 보여 주고 결과를 띄워요
      draw();
      anim = setTimeout(stepAnim, 900);
    };
    clearTimeout(anim);
    if (animate) { draw(); anim = setTimeout(stepAnim, 500); } else draw();
  }
  function nextEra() {
    const s = S(), e = era();
    clearTimeout(anim);
    if (!e.started) return; // 여름을 보내지 않은 시대는 넘어가지 않아요
    if (!e.done) { e.done = true; G.checkQuest(); }
    e.next = true;
    if (s.chapter < 3) {
      s.chapter++;
      addCoins(ERA_COINS[s.chapter]);
      G.toast(`${CHAPTERS[s.chapter].title}로 왔어요! 🪙 +${ERA_COINS[s.chapter]} 대비 예산`, 'big');
      G.closePanel();
      G.checkQuest(); G.save();
      setTimeout(() => G.goTarget(), 300);
    } else {
      G.closePanel();
      G.checkQuest();
      finish(false);
    }
  }

  /* ---------- 최종 결과 ---------- */
  function renderFinal(el) {
    const s = S(), t = totals(s);
    const rows = [1, 2, 3].map(c => {
      const e = s.eras[String(c)], r = e && e.done ? eraScore(e) : null;
      return `<tr><td>${CHAPTERS[c].title.replace(' 여름', '')}</td><td>${fmt(heatOf(c, 'low', s.region))}일</td><td>${fmt(heatOf(c, 'high', s.region))}일</td><td>${r ? `${level(c).name.replace('대비 ', '')}` : '-'}</td><td>${r ? `${r.pass}/${r.n}` : '-'}</td><td>${r ? (e.fc && e.fc.correct ? '✔' : '✘') : '-'}</td><td>${r ? r.got + '점' : '못 했어요'}</td></tr>`;
    }).join('');
    const lo = heatOf(3, 'low', s.region), hi = heatOf(3, 'high', s.region);
    el.innerHTML = `<div class="final">
      <p class="final-head">${s.timeUp ? '⏰ 시간이 다 됐어요!' : '🎉 미션 완료!'} <small>${s.region} · ${SCENARIOS[s.scenario].name}</small></p>
      <div class="final-score"><span class="rank">${t.rank.icon} ${t.rank.name}</span><b>${t.total}점</b><small>점검·예측 ${t.got}/${t.max}점${t.bonus ? ` + 남은 시간 보너스 ${t.bonus}점` : ''}</small></div>
      <div class="table-scroll"><table class="clim"><thead><tr><th>시대</th><th>저탄소 폭염일</th><th>고탄소 폭염일</th><th>목표</th><th>점검 통과</th><th>예측</th><th>점수</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="tip">같은 2090년대라도 ${s.region}의 폭염일은 저탄소 미래 ${fmt(lo)}일, 고탄소 미래 ${fmt(hi)}일로 전망돼요. 온실가스를 줄여 변화를 늦추는 「완화」와, 다가오는 변화에 맞춰 의·식·주를 바꾸는 「적응」이 함께 필요해요.</p>
      <p class="hint">점수와 목표는 비교를 위한 학습용 규칙이에요. 순위: 얻을 수 있는 점검·예측 점수의 85% 이상 🌳, 60% 이상 🌿, 그 밖 🌱.</p>
      <div class="panel-actions"><button type="button" class="btn" id="fnPlaza">📮 섬 코드·학급 광장</button><button type="button" class="btn" id="fnOther">다른 미래로 다시 하기</button><button type="button" class="btn primary" id="fnAgain">다시 하기</button></div>
    </div>`;
    $('fnAgain').onclick = () => G.restart({});
    $('fnOther').onclick = () => G.restart({ scenario: s.scenario === 'low' ? 'high' : 'low' });
    $('fnPlaza').onclick = () => G.openPanel('board');
  }

  /* ---------- 패널 ---------- */
  G.registerPanel('summer', { title: () => `${CHAPTERS[S().chapter].title} 5일`, icon: () => '<span class="emoji-ico">☀️</span>', render: renderSummer, onClose() { clearTimeout(anim); const e = era(); if (e.started && !e.done) { e.done = true; G.checkQuest(); } G.renderMapWeather('sunny'); } });
  G.registerPanel('final', { title: '최종 결과', icon: () => '<span class="emoji-ico">🏆</span>', render: renderFinal });

  // 내 준비: 지금 옷·집·밭과 목표
  G.registerPanel('ready', {
    title: '내 준비',
    icon: () => '<span class="emoji-ico">🧰</span>',
    render(el) {
      const s = S(), L = level(), gs = goals(), fcDone = !!era().fc;
      el.innerHTML = `<p class="tip">${fcDone ? `${CHAPTERS[s.chapter].title} 목표: <b>${L.name}</b> (${L.range})` : '연구소에서 예측 문제를 풀면 이번 시대 목표가 정해져요.'} · 🪙 ${s.coins}코인</p>
        <div class="ready-grid">
          <section><h4>👕 옷</h4>${Art.avatarSVG({ color: s.color, outfit: s.outfits[0] }, 110)}${s.outfits[1] ? `<div class="ready-sub">${Art.avatarSVG({ color: s.color, outfit: s.outfits[1] }, 64)}<small>비옷</small></div>` : ''}</section>
          <section><h4>🍚 먹거리</h4><div class="ready-plots">${s.plots.slice(0, 3).map(p => Art.plotSVG(p, {})).join('')}</div><div class="card-table">${Art.tableSVG(s.table)}</div></section>
          <section><h4>🏡 집</h4><div class="card-house">${Art.houseSVG(s.house, '내 집')}</div></section>
        </div>
        ${fcDone ? `<div class="tgt-grid now">${gs.map(g => `<div><b>${PART_INFO[g.p].icon} ${g.p}</b><span class="${g.heat[0] >= g.heat[1] ? 'ok' : ''}">☀️ ${g.heat[0]}/${g.heat[1]}</span><span class="${g.rain[0] >= g.rain[1] ? 'ok' : ''}">☔ ${g.rain[0]}/${g.rain[1]}</span></div>`).join('')}</div>` : ''}
        <h4>갖춘 대비 용품</h4><p>${MEASURES.filter(m => s.owned[m.id]).map(m => `<span class="chip">${RISK[m.risk].icon} ${G.esc(m.name)}</span>`).join(' ') || '<span class="empty small">아직 없어요.</span>'}</p>`;
    }
  });

  /* ---------- 게임 방법 ---------- */
  let rulesTab = 'goal';
  const RULE_TABS = [['goal', '목표와 순서'], ['level', '대비 목표'], ['score', '점수와 시간'], ['play', '조작 방법']];
  function rulesBody(tab) {
    if (tab === 'goal') return `<p class="lead">⏱ <b>5분</b> 안에 2030년대 → 2050년대 → 2090년대 여름을 차례로 대비해요. 기후 전망 자료로 여름을 <b>예측</b>하고, 예산 안에서 <b>먹거리(식)·옷(의)·집(주)</b> 대비 용품을 골라요.</p>
      <ol class="stage-list">${STAGE_ORDER.map(k => `<li><span class="st-ico">${STAGES[k].icon}</span><div><b>${STAGES[k].no} ${STAGES[k].name}</b><p>${G.esc(STAGES[k].what)}</p></div></li>`).join('')}</ol>
      <p class="hint">기후 자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023). 게임 속 날씨·점수·목표는 학습을 위한 단순화예요.</p>`;
    if (tab === 'level') return `<p>예측한 <b>그 시대 폭염일수(한 해 평균)</b>로 대비 단계가 정해져요. 숫자는 의·식·주마다 갖출 대비 용품 수예요.</p>
      <div class="table-scroll"><table class="clim"><thead><tr><th>단계</th><th>폭염일</th><th>👕 의</th><th>🍚 식</th><th>🏡 주</th></tr></thead><tbody>${LEVELS.map(l => `<tr><td>${l.name}</td><td>${l.range.replace('폭염일 ', '')}</td>${PARTS3.map(p => `<td>☀️ ${l[PART_INFO[p].heat]} · ☔ ${l[PART_INFO[p].rain]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p>여름 5일 중 폭염일 수는 그 시대 폭염일수 비율(폭염일수 ÷ 여름 ${SUMMER_DAYS}일)에 맞춰 정해요. 집중호우는 하루 와요.</p>
      <p class="hint">공식 폭염 특보·위기경보 단계가 아니라, 비교를 위한 게임 속 기준이에요.</p>`;
    if (tab === 'score') return `<ul class="help">
      <li><b>예산</b> 시대마다 코인을 받아요(2030년대 ${ERA_COINS[1]}, 2050년대 ${ERA_COINS[2]}, 2090년대 ${ERA_COINS[3]}). 예측 문제를 맞히면 ${FORECAST_BONUS}코인을 더 받아요. 코인은 게임 속 돈이고, 진짜 돈이 아니에요.</li>
      <li><b>점수</b> 폭염일·집중호우일의 의·식·주 점검 하나를 통과하면 10점, 예측 문제를 맞히면 10점이에요.</li>
      <li><b>시간</b> 제한 시간은 5분이에요. 일찍 끝내면 남은 6초마다 1점을 더 받아요. 시간이 다 되면 그때까지의 점수로 끝나요.</li>
      <li><b>순위</b> 얻을 수 있는 점수의 85% 이상 🌳 기후 대비 전문가, 60% 이상 🌿 기후 적응 탐험가, 그 밖 🌱 새싹 대비러.</li></ul>`;
    return `<ul class="help">
      <li><b>할 일</b> 왼쪽 위 카드에 지금 할 일이 나와요. 노란 별이 갈 곳이에요.</li>
      <li><b>전체 지도</b> 왼쪽 아래 지도에서 내 위치(빨간 점)와 갈 곳(노란 별)을 봐요. 지도를 누르면 그곳으로 걸어가요.</li>
      <li><b>바로 가기</b> 아래 「상점」 버튼으로 걷지 않고 바로 살 수도 있어요. 재봉 공방(의)·밭(식)·목공소(주)를 누르면 그 칸이 열려요.</li>
      <li><b>여름 맞이하기</b> 준비를 마쳤으면 오른쪽 아래 버튼을 눌러요.</li>
      <li><b>이동</b> 땅을 누르거나 방향키·W·A·S·D로 걸어요.</li></ul>`;
  }
  G.registerPanel('rules', {
    title: '게임 방법',
    icon: () => '<span class="emoji-ico">📖</span>',
    render(el) {
      el.innerHTML = `<div class="tabs">${RULE_TABS.map(([k, nm]) => `<button type="button" class="tab${rulesTab === k ? ' on' : ''}" data-rt="${k}">${nm}</button>`).join('')}</div>
        <div class="rules-body">${rulesBody(rulesTab)}</div>
        <div class="panel-actions"><button type="button" class="btn primary" id="rulesOk">${S().started ? '닫기' : '⏱ 5분 미션 시작!'}</button></div>`;
      el.querySelectorAll('[data-rt]').forEach(b => b.onclick = () => { rulesTab = b.dataset.rt; G.renderPanel(); });
      $('rulesOk').onclick = () => G.closePanel();
    },
    onClose() {
      const s = S(); if (!s) return;
      s.seenRules = true; rulesTab = 'goal';
      if (!s.started && !s.finished) { s.started = true; G.toast('⏱ 5분 타이머가 시작됐어요!', 'big'); setTimeout(() => G.goTarget(), 400); }
    }
  });

  /* ---------- 퀘스트 목록 ---------- */
  G.registerPanel('quests', {
    title: '퀘스트',
    icon: () => '<span class="emoji-ico">📜</span>',
    render(el) {
      const s = S(), cq = QUESTS[s.quest], si = STAGE_ORDER.indexOf(cq.stage), fcDone = !!era().fc;
      el.innerHTML = `<div class="stepper big">${STAGE_ORDER.map((k, i) => `<span class="${i === si ? 'on' : i < si ? 'done' : ''}">${STAGES[k].icon} ${STAGES[k].no} ${STAGES[k].name}</span>`).join('')}</div>
        <p class="tip">${G.esc(STAGES[cq.stage].what)}</p>
        <div class="coin-line">⏱ 남은 시간 <b>${clock(s.timeLeft)}</b> · 🪙 코인 <b>${s.coins}</b></div>
        <ul class="qsteps big">${QUESTS.map((q, i) => [q, i]).filter(([q]) => q.era === s.chapter && q.id !== 'end').map(([q, i]) => `<li class="${i < s.quest ? 'ok' : i === s.quest ? 'cur' : ''}">${i < s.quest ? '✔' : i === s.quest ? '▶' : '○'} ${STAGES[q.stage].icon} ${G.esc(q.title)} <small>${G.esc(q.steps[0].text)}</small></li>`).join('')}</ul>
        ${fcDone ? `<h4>이번 시대 목표 <small>${level().name}</small></h4><div class="tgt-grid now">${goals().map(g => `<div><b>${PART_INFO[g.p].icon} ${g.p}</b><span class="${g.heat[0] >= g.heat[1] ? 'ok' : ''}">☀️ ${g.heat[0]}/${g.heat[1]}</span><span class="${g.rain[0] >= g.rain[1] ? 'ok' : ''}">☔ ${g.rain[0]}/${g.rain[1]}</span></div>`).join('')}</div>` : ''}
        <div class="panel-actions"><button type="button" class="btn" id="qGoRules">게임 방법</button><button type="button" class="btn primary" id="qGo">▶ 지금 할 일 하러 가기</button></div>`;
      $('qGoRules').onclick = () => G.openPanel('rules');
      $('qGo').onclick = () => { G.closePanel(); G.goTarget(); };
    }
  });

  return { level, levelIndex, heatOf, era, counts, goals, ready, applyAll, buy, livePlan, dayCheck, eraScore, totals, forecastQuestion, renderForecast, startSummer, nextEra, finish, second, clock, addCoins, byId, RISK };
})();
