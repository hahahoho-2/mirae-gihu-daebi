/* ==========================================================================
   ⚡ 3분 스피드 미션
   시대(2030년대 → 2050년대 → 2090년대)마다
   ① 예측 플래시: 기상청 전망 그래프에서 폭염일수를 읽고 대비 단계 고르기
   ② 대비 카드 러시: 날아오는 카드를 ☀️ 폭염 대비 / ☔ 집중호우 대비 / 🚫 도움 안 돼요 로 빨리 고르기
   ③ 여름 5일: 모은 대비 카드로 폭염일·집중호우일을 버티기
   - 시간·점수·목표는 학습을 위한 게임 규칙이에요(실제 예보·성능 시험값이 아니에요).
   ========================================================================== */
const Speed = (() => {
  const $ = id => document.getElementById(id);
  const S = () => G.S;
  const esc = s => G.esc(s);
  const fmt = v => G.fmtNum(v);
  const KIND = { heat: { icon: '☀️', name: '폭염 대비' }, rain: { icon: '☔', name: '집중호우 대비' }, bad: { icon: '🚫', name: '도움 안 돼요' } };
  const CHOICES = ['heat', 'rain', 'bad'];
  const ERA_NAME = { 1: '2030년대', 2: '2050년대', 3: '2090년대' };

  /* ---------- 규칙 (화면 없이 계산해요: 자동 시험에서 써요) ---------- */
  function cardOf(id) {
    const m = MEASURES.find(x => x.id === id);
    if (m) return { id, part: m.part, name: m.name, kind: m.risk, note: m.note };
    const b = BAD_CARDS.find(x => x.id === id);
    return b ? { id, part: b.part, name: b.name, kind: 'bad', note: b.note } : null;
  }
  const shuffle = (list, ...seed) => list.map(v => [G.rand01(...seed, v), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  // 폭염·집중호우 대비 카드는 세 시대에 나눠 한 번씩 나와요. 도움 안 되는 카드는 시대마다 몇 장 섞여요.
  function decks(seed) {
    const heat = shuffle(MEASURES.filter(m => m.risk === 'heat').map(m => m.id), seed, 'heat');
    const rain = shuffle(MEASURES.filter(m => m.risk === 'rain').map(m => m.id), seed, 'rain');
    const bad = shuffle(BAD_CARDS.map(b => b.id), seed, 'bad');
    const out = {};
    let h = 0, r = 0, b = 0;
    [1, 2, 3].forEach(era => {
      const [nh, nr, nb] = SPEED.deck[era];
      out[era] = shuffle([...heat.slice(h, h + nh), ...rain.slice(r, r + nr), ...bad.slice(b, b + nb)], seed, 'era', era);
      h += nh; r += nr; b += nb;
    });
    return out;
  }
  // 그 시대까지 나온 대비 카드 수
  function offered(era) {
    let heat = 0, rain = 0;
    for (let e = 1; e <= era; e++) { heat += SPEED.deck[e][0]; rain += SPEED.deck[e][1]; }
    return { heat, rain };
  }
  // 대비 단계가 높을수록 지금까지 나온 대비 카드 중 더 많이 모아야 해요
  function target(lv, era) {
    const o = offered(era), k = SPEED.rate[lv];
    return { heat: Math.max(1, Math.round(o.heat * k)), rain: Math.max(1, Math.round(o.rain * k)) };
  }
  const judge = (id, choice) => { const c = cardOf(id); return !!c && c.kind === choice; };
  function levelOf(era, s) {
    const heat = Mission.heatOf(era, s.scenario, s.region);
    return { lv: Mission.levelIndex(heat), heat };
  }
  // 여름 5일: 폭염일은 ☀️ 대비, 집중호우일은 ☔ 대비가 목표만큼 모였는지로 버텨요(그 밖의 날은 점검 없음)
  function summer(era, s, have) {
    const t = target(levelOf(era, s).lv, era);
    return Mission.livePlan(era, s).map(w => ({ w, ok: w === 'heat' ? have.heat >= t.heat : w === 'storm' ? have.rain >= t.rain : null }));
  }
  function cardPoints(ms, combo) {
    const P = SPEED.points;
    return P.card + (ms <= SPEED.fastMs ? P.fast : 0) + (combo >= 3 ? P.combo : 0);
  }
  // 순위는 보너스(번개·콤보·남은 시간)를 뺀 기본 점수가 만점의 몇 %인지로 정해요
  function maxBase(s) {
    const cards = [1, 2, 3].reduce((t, e) => t + SPEED.deck[e].reduce((a, b) => a + b, 0), 0);
    const days = [1, 2, 3].reduce((t, e) => t + Mission.livePlan(e, s).filter(w => w === 'heat' || w === 'storm').length, 0);
    return 3 * SPEED.points.fc + cards * SPEED.points.card + days * SPEED.points.day;
  }
  const rankOf = ratio => RANKS.find(r => ratio >= r.min);

  /* ---------- 진행 중인 판(저장하지 않아요: 3분이라 새로고침하면 처음부터) ---------- */
  let R = null, raf = 0, last = 0, timer = 0;
  const busyPhases = ['banner', 'fc', 'fcDone', 'card', 'summer', 'eraEnd'];
  const clockPhases = ['fc', 'card']; // 시계는 고르는 동안(예측·카드)만 흘러요. 시대 소개·여름 5일·결과 읽기는 멈춰요
  function newRun(s) {
    return { phase: 'intro', era: 1, deck: decks(s.seed), idx: 0, have: { heat: 0, rain: 0 }, combo: 0, best: 0, score: 0, base: 0,
      left: TIME_LIMIT * 1000, fc: {}, eras: {}, wrong: [], right: 0, total: 0, paused: false, t0: 0, answered: false, pick: null };
  }
  const isOpen = () => !$('speed').hidden;
  const running = () => R && busyPhases.includes(R.phase) && !R.paused;
  const ticking = () => running() && clockPhases.includes(R.phase);

  /* 시계: 고르는 동안만 줄어요(시작 전·시대 소개·여름 5일·결과·잠시 멈춤·다른 탭에서는 멈춰요) */
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(250, now - (last || now));
    last = now;
    if (!ticking() || document.hidden) return;
    R.left -= dt;
    if (R.left <= 0) { R.left = 0; drawClock(); finish(true); return; }
    drawClock();
    if (R.phase === 'card' && !R.answered && now - R.t0 >= cardMs()) answer(null);
    if (R.phase === 'fc' && !R.answered && now - R.t0 >= SPEED.fcMs) fcAnswer(null);
    const bar = $('spPace');
    if (bar && (R.phase === 'card' || R.phase === 'fc') && !R.answered) bar.style.width = Math.max(0, 100 - 100 * (now - R.t0) / (R.phase === 'card' ? cardMs() : SPEED.fcMs)) + '%';
  }
  const cardMs = () => SPEED.cardMs[R.era];
  function drawClock() {
    const t = $('spTime'); if (!t) return;
    const sec = Math.ceil(R.left / 1000);
    t.textContent = Mission.clock(sec);
    $('spClock').className = 'sp-clock' + (sec <= 20 ? ' danger' : sec <= 45 ? ' warn' : '');
    $('speed').classList.toggle('hurry', sec <= 20);
    $('spTbar').style.width = (100 * R.left / (TIME_LIMIT * 1000)) + '%';
  }
  function later(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (R && !R.paused) fn(); else if (R) R.resume = fn; }, ms); }

  /* ---------- 화면 ---------- */
  function shell(inner, top = true) {
    const s = S();
    $('speed').className = `speed era${R.era}`;
    $('speed').innerHTML = (top ? `<header class="sp-top">
        <div id="spClock" class="sp-clock" role="timer"><span aria-hidden="true">⏱</span><b id="spTime">${Mission.clock(Math.ceil(R.left / 1000))}</b></div>
        <div class="sp-eras" aria-label="시대 ${R.era} / 3">${[1, 2, 3].map(e => `<i class="${e < R.era ? 'done' : e === R.era ? 'on' : ''}">${ERA_NAME[e].replace('년대', '')}</i>`).join('')}</div>
        <div class="sp-score">⭐ <b id="spScore">${R.score}</b></div>
        <div id="spCombo" class="sp-combo${R.combo >= 3 ? ' hot' : ''}">${R.combo >= 2 ? `🔥 ${R.combo}콤보` : ''}</div>
        <button type="button" class="sp-pause" id="spPauseBtn" aria-label="잠시 멈춤">⏸</button>
        <i class="sp-tbar"><i id="spTbar" style="width:${100 * R.left / (TIME_LIMIT * 1000)}%"></i></i>
      </header>` : '') + `<div class="sp-stage">${inner}</div><div class="sp-me" aria-hidden="true">${Art.avatarSVG({ color: s.color, outfit: G.equippedOutfit() }, 64)}</div><div id="spFx" class="sp-fx" aria-live="polite"></div>`;
    if ($('spPauseBtn')) $('spPauseBtn').onclick = pause;
  }
  function fx(text, kind = '') {
    const el = $('spFx'); if (!el) return;
    el.className = 'sp-fx show ' + kind; el.textContent = text;
    clearTimeout(fx.t); fx.t = setTimeout(() => { if ($('spFx')) $('spFx').className = 'sp-fx'; }, 900);
  }

  /* 시작 화면: 지역·미래 고르기 */
  function intro() {
    const s = S();
    R = newRun(s);
    $('speed').hidden = false;
    shell(`<div class="sp-intro">
        <p class="sp-kicker">⚡ 3분 스피드 미션</p>
        <h2>미래 여름을 예측하고, 빠르게 대비하라!</h2>
        <div class="sp-pick"><span>지역</span>${Object.keys(CLIMATE).map(r => `<button type="button" class="pill${s.region === r ? ' on' : ''}" data-region="${r}">${r}</button>`).join('')}</div>
        <div class="sp-pick"><span>미래</span>${Object.entries(SCENARIOS).map(([k, sc]) => `<button type="button" class="pill${s.scenario === k ? ' on' : ''}" data-scen="${k}">${sc.name} <small>${sc.code}</small></button>`).join('')}</div>
        <ol class="sp-how">
          <li><b>🔭 예측 플래시</b> 그래프에서 그 시대 폭염일수를 읽고 대비 단계를 골라요. (10초)</li>
          <li><b>🃏 대비 카드 러시</b> 카드가 날아오면 <span class="k heat">☀️ 폭염 대비</span> <span class="k rain">☔ 집중호우 대비</span> <span class="k bad">🚫 도움 안 돼요</span> 중 빨리 골라요. 시대가 갈수록 빨라져요!</li>
          <li><b>☀️ 여름 5일</b> 모은 대비 카드가 목표만큼 있으면 폭염·집중호우를 버텨요.</li>
        </ol>
        <p class="sp-rule">❌ 틀리면 −${SPEED.penalty}초 · ⚡ ${SPEED.fastMs / 1000}초 안에 맞히면 번개 보너스 · 🔥 3콤보부터 콤보 보너스 · ⏱ 남은 시간도 점수!</p>
        <button type="button" class="btn primary big sp-go" id="spStart">▶ 3분 미션 시작!</button>
        <p class="hint">기후 자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023). 키보드 1·2·3 키로도 고를 수 있어요.</p>
      </div>`, false);
    $('speed').querySelectorAll('[data-region]').forEach(b => b.onclick = () => { s.region = b.dataset.region; G.save(); intro(); });
    $('speed').querySelectorAll('[data-scen]').forEach(b => b.onclick = () => { s.scenario = b.dataset.scen; G.save(); intro(); });
    $('spStart').onclick = startRun;
    setTimeout(() => { if ($('spStart')) $('spStart').focus(); }, 50);
  }
  function startRun() {
    const s = S();
    // 판마다 처음부터: 갖춘 대비·기록을 비워요
    s.owned = {}; s.eras = {}; s.speed = null; s.finished = false; s.timeUp = false; s.started = false; s.timeLeft = TIME_LIMIT; s.timeBonus = 0;
    s.chapter = 1; s.quest = 0; s.step = 0; s.coins = 0;
    Mission.applyAll(s); G.save(); G.refreshAvatar(); G.updateHUD();
    R = newRun(s);
    R.phase = 'count';
    let n = 3;
    const tick = () => {
      shell(`<div class="sp-count">${n > 0 ? n : 'GO!'}</div>`, false);
      if (n-- > 0) setTimeout(tick, 550); else setTimeout(() => banner(1), 450);
    };
    tick();
  }

  /* 시대 시작 */
  function banner(era) {
    R.era = era; R.phase = 'banner'; R.idx = 0;
    const s = S();
    shell(`<div class="sp-banner"><b>${ERA_NAME[era]} 여름</b><span>${s.region} · ${SCENARIOS[s.scenario].name}</span>${era > 1 ? '<em>⚡ 카드 속도 UP!</em>' : ''}</div>`);
    later(fcShow, 1100);
  }

  /* ① 예측 플래시 */
  function chart(s, era) {
    const H = CLIMATE[s.region].heat[s.scenario], max = Math.max(...CLIMATE[s.region].heat.high), cur = CHAPTERS[era].period;
    const names = ['기준', '2030년대', '2050년대', '2090년대'];
    return `<svg class="sp-chart" viewBox="0 0 440 200" role="img" aria-label="${s.region} ${SCENARIOS[s.scenario].name} 시기별 한 해 평균 폭염일수">
      ${[30, 50].map(v => `<path d="M24 ${170 - v / max * 140} H430" stroke="#C2410C" stroke-width="1.5" stroke-dasharray="5 5" opacity=".55"/><text x="428" y="${166 - v / max * 140}" text-anchor="end" font-size="11" fill="#C2410C">${v}일</text>`).join('')}
      ${H.map((v, i) => { const x = 40 + i * 100, h = v / max * 140, on = i === cur; return `<rect x="${x}" y="${170 - h}" width="56" height="${h}" rx="6" fill="${s.scenario === 'high' ? '#E8806A' : '#3FA796'}" opacity="${on ? 1 : 0.35}"/>
        <text x="${x + 28}" y="${164 - h}" text-anchor="middle" font-size="${on ? 16 : 12}" font-weight="900" fill="#2F3E4E">${fmt(v)}</text>
        <text x="${x + 28}" y="190" text-anchor="middle" font-size="12" font-weight="${on ? 900 : 600}" fill="${on ? '#B45309' : '#52606D'}">${names[i]}${on ? ' ◀' : ''}</text>`; }).join('')}
      <path d="M24 170 H430" stroke="#9AA8B6" stroke-width="2"/></svg>`;
  }
  function fcShow() {
    const s = S();
    R.phase = 'fc'; R.answered = false; R.t0 = performance.now();
    shell(`<div class="sp-fc">
        <p class="sp-step">🔭 예측 플래시 <small>${SPEED.fcMs / 1000}초</small></p>
        ${chart(s, R.era)}
        <p class="sp-q">그래프의 ◀ 막대를 읽어요. <b>${ERA_NAME[R.era]}</b>의 대비 단계는?</p>
        <div class="sp-opts">${LEVELS.map((L, i) => `<button type="button" class="sp-opt" data-lv="${i}"><b>${i + 1}</b> ${L.name}<small>${L.range}</small></button>`).join('')}</div>
        <i class="sp-pace"><i id="spPace"></i></i>
      </div>`);
    $('speed').querySelectorAll('[data-lv]').forEach(b => b.onclick = () => fcAnswer(+b.dataset.lv));
  }
  function fcAnswer(lv) {
    if (!R || R.phase !== 'fc' || R.answered) return;
    R.answered = true;
    const s = S(), { lv: right, heat } = levelOf(R.era, s), ok = lv === right, t = target(right, R.era);
    R.fc[R.era] = { ok, pick: lv };
    if (ok) { R.score += SPEED.points.fc; R.base += SPEED.points.fc; }
    R.phase = 'fcDone';
    shell(`<div class="sp-fc done">
        <p class="sp-verdict ${ok ? 'ok' : 'no'}">${ok ? `⭕ 정답! +${SPEED.points.fc}` : lv === null ? '⏰ 시간 초과!' : '❌ 아쉬워요!'}</p>
        <p class="sp-fact">${ERA_NAME[R.era]} 폭염일 약 <b>${fmt(heat)}일</b> → <b>${LEVELS[right].name}</b> <small>(${LEVELS[right].range})</small></p>
        <div class="sp-goal"><span>이번 여름까지 모을 대비 카드</span><b>☀️ ${t.heat}장 · ☔ ${t.rain}장</b><small>지금 ☀️ ${R.have.heat} · ☔ ${R.have.rain}</small></div>
      </div>`);
    later(cardShow, ok ? 1400 : 2000);
  }

  /* ② 대비 카드 러시 */
  function gauges() {
    const t = target(levelOf(R.era, S()).lv, R.era);
    const g = (k, have, need) => `<div class="sp-gauge ${k}${have >= need ? ' full' : ''}"><span>${KIND[k].icon}</span><i><i style="width:${Math.min(100, 100 * have / need)}%"></i></i><b>${have}/${need}</b></div>`;
    return `<div class="sp-gauges">${g('heat', R.have.heat, t.heat)}${g('rain', R.have.rain, t.rain)}</div>`;
  }
  function cardShow() {
    const deck = R.deck[R.era];
    if (R.idx >= deck.length) { summerShow(); return; }
    const c = cardOf(deck[R.idx]);
    R.phase = 'card'; R.answered = false; R.t0 = performance.now();
    shell(`<div class="sp-cards">
        <p class="sp-step">🃏 대비 카드 러시 <small>${R.idx + 1} / ${deck.length}</small></p>
        ${gauges()}
        <div class="sp-card part-${PART_INFO[c.part].place}" id="spCard"><span class="sp-part">${PART_INFO[c.part].icon} ${c.part} · ${PART_INFO[c.part].name}</span><b>${esc(c.name)}</b></div>
        <i class="sp-pace"><i id="spPace"></i></i>
        <div class="sp-choices">${CHOICES.map((k, i) => `<button type="button" class="sp-choice ${k}" data-k="${k}"><span>${KIND[k].icon}</span>${KIND[k].name}<small>${i + 1}</small></button>`).join('')}</div>
        <p class="sp-why" id="spWhy" aria-live="polite"></p>
      </div>`);
    $('speed').querySelectorAll('[data-k]').forEach(b => b.onclick = () => answer(b.dataset.k));
  }
  function answer(choice) {
    if (!R || R.phase !== 'card' || R.answered) return;
    R.answered = true;
    const s = S(), id = R.deck[R.era][R.idx], c = cardOf(id), ms = performance.now() - R.t0, ok = choice !== null && judge(id, choice);
    R.total++;
    const card = $('spCard');
    $('speed').querySelectorAll('[data-k]').forEach(b => { b.disabled = true; if (b.dataset.k === c.kind) b.classList.add('right'); if (b.dataset.k === choice && !ok) b.classList.add('wrong'); });
    if (ok) {
      R.combo++; R.best = Math.max(R.best, R.combo); R.right++;
      const p = cardPoints(ms, R.combo);
      R.score += p; R.base += SPEED.points.card;
      if (c.kind !== 'bad') { R.have[c.kind]++; s.owned[id] = true; Mission.applyAll(s); }
      card.classList.add('ok');
      fx(`+${p}${ms <= SPEED.fastMs ? ' ⚡번개' : ''}${R.combo >= 3 ? ` 🔥${R.combo}` : ''}`, 'good');
      later(() => { R.idx++; cardShow(); }, 420);
    } else {
      R.combo = 0;
      R.wrong.push(id);
      card.classList.add(choice === null ? 'miss' : 'no');
      if (choice !== null) { R.left = Math.max(0, R.left - SPEED.penalty * 1000); fx(`−${SPEED.penalty}초`, 'bad'); }
      else fx('⏰ 놓쳤어요!', 'bad');
      $('spWhy').innerHTML = `정답은 <b>${KIND[c.kind].icon} ${KIND[c.kind].name}</b> · ${esc(c.note)}`;
      if (R.left <= 0) { finish(true); return; }
      later(() => { R.idx++; cardShow(); }, 1700);
    }
    const sc = $('spScore'); if (sc) sc.textContent = R.score;
    const cb = $('spCombo'); if (cb) { cb.textContent = R.combo >= 2 ? `🔥 ${R.combo}콤보` : ''; cb.className = 'sp-combo' + (R.combo >= 3 ? ' hot' : ''); }
  }

  /* ③ 여름 5일 */
  function summerShow() {
    const s = S(), days = summer(R.era, s, R.have), t = target(levelOf(R.era, s).lv, R.era);
    R.phase = 'summer';
    let shown = 0;
    const draw = () => shell(`<div class="sp-summer">
        <p class="sp-step">☀️ ${ERA_NAME[R.era]} 여름 5일 <small>목표 ☀️ ${t.heat} · ☔ ${t.rain} / 모은 것 ☀️ ${R.have.heat} · ☔ ${R.have.rain}</small></p>
        <div class="sp-days">${days.map((d, i) => i < shown
          ? `<div class="sp-day w-${d.w} ${d.ok === null ? 'calm' : d.ok ? 'ok' : 'no'}">${Art.weatherIcon(d.w, 40)}<b>${i + 1}일 ${WEATHER[d.w].name}</b><span>${d.ok === null ? '평범' : d.ok ? '✔ 버팀' : '✘ 피해'}</span></div>`
          : `<div class="sp-day wait"><b>${i + 1}일</b><span>?</span></div>`).join('')}</div>
      </div>`);
    const step = () => {
      const d = days[shown];
      shown++;
      if (d.ok) { R.score += SPEED.points.day; R.base += SPEED.points.day; }
      G.renderMapWeather(d.w);
      draw();
      if (d.ok === false) fx(d.w === 'heat' ? '🥵 폭염 피해!' : '🌊 침수 피해!', 'bad');
      else if (d.ok) fx(`+${SPEED.points.day} 버팀!`, 'good');
      if (shown < days.length) later(step, 420);
      else later(() => eraEnd(days), 700);
    };
    draw();
    later(step, 350);
  }
  function eraEnd(days) {
    const s = S(), { lv, heat } = levelOf(R.era, s), t = target(lv, R.era);
    const checks = days.filter(d => d.ok !== null), pass = checks.filter(d => d.ok).length;
    const deck = R.deck[R.era], wrongHere = deck.filter(id => R.wrong.includes(id)).length;
    R.eras[R.era] = { lv, fc: R.fc[R.era] && R.fc[R.era].ok ? 1 : 0, heat: [R.have.heat, t.heat], rain: [R.have.rain, t.rain], right: deck.length - wrongHere, total: deck.length, days: days.map(d => [d.w, d.ok === null ? -1 : d.ok ? 1 : 0]) };
    G.renderMapWeather('sunny');
    R.phase = 'eraEnd';
    const lack = [];
    if (R.have.heat < t.heat) lack.push(`☀️ 폭염 대비 ${t.heat - R.have.heat}장`);
    if (R.have.rain < t.rain) lack.push(`☔ 집중호우 대비 ${t.rain - R.have.rain}장`);
    shell(`<div class="sp-eraend">
        <p class="sp-step">${ERA_NAME[R.era]} 결과</p>
        <div class="sp-stats"><span>🔭 예측 ${R.eras[R.era].fc ? '⭕' : '❌'}</span><span>🃏 카드 ${R.eras[R.era].right}/${deck.length}</span><span>☀️ 여름 버팀 ${pass}/${checks.length}</span></div>
        <p class="sp-fact">${s.region} · ${SCENARIOS[s.scenario].name}: 폭염일 약 ${fmt(heat)}일 → ${LEVELS[lv].name}</p>
        <p class="sp-tip">${lack.length ? `모자랐던 것: ${lack.join(', ')}. 다음 시대 목표는 지금까지 나온 카드 기준으로 계산해요.` : '목표만큼 대비해서 여름을 버텼어요!'}</p>
        <button type="button" class="btn primary" id="spNext">${R.era < 3 ? '다음 시대 ▶' : '결과 보기 ▶'}</button>
      </div>`);
    const go = () => { clearTimeout(timer); if (R.era < 3) banner(R.era + 1); else finish(false); };
    $('spNext').onclick = go;
    setTimeout(() => { if ($('spNext')) $('spNext').focus(); }, 30);
    later(go, 3200);
  }

  /* ---------- 끝 ---------- */
  function finish(timeUp) {
    if (!R || R.phase === 'result') return;
    clearTimeout(timer);
    const s = S();
    const left = Math.max(0, Math.ceil(R.left / 1000));
    const bonus = timeUp ? 0 : left * SPEED.points.sec;
    R.score += bonus;
    R.phase = 'result';
    s.speed = { done: true, timeUp: !!timeUp, score: R.score, bonus, best: R.best, right: R.right, total: R.total, base: R.base, max: maxBase(s), left, eras: R.eras, wrong: R.wrong.slice(0, 40) };
    s.finished = true; s.started = true; s.timeUp = !!timeUp; s.timeLeft = left; s.timeBonus = 0;
    s.chapter = 3; s.quest = QUESTS.length - 1; s.step = 0;
    Mission.applyAll(s);
    G.save(); G.updateHUD(); G.refreshAvatar(); G.refreshMap(); G.renderMapWeather('sunny');
    showResult();
  }
  function resultHTML(s) {
    const sp = s.speed;
    if (!sp) return '<p class="tip">아직 끝낸 판이 없어요.</p><div class="panel-actions"><button type="button" class="btn primary" data-act="again">▶ 3분 미션 시작</button></div>';
    const ratio = sp.max ? sp.base / sp.max : 0, rank = rankOf(ratio);
    const daysAll = Object.values(sp.eras).flatMap(e => e.days.filter(d => d[1] !== -1));
    const lo = Mission.heatOf(3, 'low', s.region), hi = Mission.heatOf(3, 'high', s.region);
    const rows = [1, 2, 3].map(e => {
      const r = sp.eras[e];
      if (!r) return `<tr><td>${ERA_NAME[e]}</td><td>${fmt(Mission.heatOf(e, s.scenario, s.region))}일</td><td colspan="4">못 했어요</td></tr>`;
      const d = r.days.filter(x => x[1] !== -1);
      return `<tr><td>${ERA_NAME[e]}</td><td>${fmt(Mission.heatOf(e, s.scenario, s.region))}일</td><td>${r.lv + 1}단계 ${r.fc ? '⭕' : '❌'}</td><td class="${r.heat[0] >= r.heat[1] ? 'ok' : 'no'}">${r.heat[0]}/${r.heat[1]}</td><td class="${r.rain[0] >= r.rain[1] ? 'ok' : 'no'}">${r.rain[0]}/${r.rain[1]}</td><td>${d.filter(x => x[1] === 1).length}/${d.length}</td></tr>`;
    }).join('');
    const wrong = sp.wrong.map(cardOf).filter(Boolean);
    return `<div class="sp-result">
      <p class="sp-r-head">${sp.timeUp ? '⏰ 시간 끝!' : '🎉 3분 미션 완료!'} <small>${s.region} · ${SCENARIOS[s.scenario].name}</small></p>
      <div class="sp-r-score"><span class="rank">${rank.icon} ${rank.name}</span><b>${sp.score}점</b>
        <small>기본 ${sp.base}/${sp.max}점 + ⚡🔥 보너스 ${sp.score - sp.base - sp.bonus}점${sp.bonus ? ` + 남은 시간 ${sp.left}초 보너스 ${sp.bonus}점` : ''}</small></div>
      <div class="sp-stats"><span>🃏 카드 ${sp.right}/${sp.total}</span><span>🔥 최고 ${sp.best}콤보</span><span>🔭 예측 ${Object.values(sp.eras).filter(e => e.fc).length}/3</span><span>☀️ 여름 버팀 ${daysAll.filter(d => d[1] === 1).length}/${daysAll.length}</span></div>
      <div class="table-scroll"><table class="clim"><caption class="hint">폭염일: 내가 고른 미래의 한 해 평균 · ☀️☔: 모은 대비 카드/목표</caption><thead><tr><th>시대</th><th>폭염일</th><th>단계·예측</th><th>☀️</th><th>☔</th><th>버팀</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="tip">같은 2090년대라도 ${s.region}의 한 해 평균 폭염일은 저탄소 미래 ${fmt(lo)}일, 고탄소 미래 ${fmt(hi)}일로 전망돼요. 고탄소 미래일수록 대비 단계가 높아져 더 많이 대비해야 해요. 온실가스를 줄여 변화를 늦추는 「완화」와, 바뀐 기후에 맞춰 의·식·주를 바꾸는 「적응」이 함께 필요해요.</p>
      ${wrong.length ? `<details class="sp-review" open><summary>📝 틀리거나 놓친 카드 다시 보기 (${wrong.length})</summary><ul>${wrong.map(c => `<li><b>${PART_INFO[c.part].icon} ${esc(c.name)}</b> → <span class="k ${c.kind}">${KIND[c.kind].icon} ${KIND[c.kind].name}</span><small>${esc(c.note)}</small></li>`).join('')}</ul></details>` : '<p class="sp-perfect">🎯 카드를 모두 맞혔어요!</p>'}
      <p class="hint">점수·대비 단계·목표는 비교를 위한 게임 규칙이에요. 순위: 기본 점수(예측·카드·여름 버팀)가 만점의 85% 이상 🌳, 60% 이상 🌿, 그 밖 🌱.</p>
      <div class="panel-actions"><button type="button" class="btn" data-act="island">🏝️ 섬 둘러보기</button><button type="button" class="btn" data-act="plaza">📮 섬 코드·학급 광장</button><button type="button" class="btn" data-act="other">🌏 다른 미래로</button><button type="button" class="btn primary" data-act="again">🔁 다시 하기</button></div>
    </div>`;
  }
  function bindResult(root) {
    const s = S();
    root.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const act = b.dataset.act;
      if (act === 'again') G.restart({});
      else if (act === 'other') G.restart({ scenario: s.scenario === 'low' ? 'high' : 'low' });
      else if (act === 'island') { G.closePanel(); hide(); G.toast('🏝️ 내가 갖춘 옷·집·밭을 둘러봐요. 오른쪽 아래 「결과 보기」로 돌아와요.', 'big'); }
      else if (act === 'plaza') { hide(); G.openPanel('board'); }
    });
  }
  function showResult() {
    const s = S();
    if (!R) R = newRun(s);
    R.phase = 'result';
    $('speed').hidden = false;
    shell(resultHTML(s), false);
    bindResult($('speed'));
  }
  function hide() { $('speed').hidden = true; clearTimeout(timer); }

  /* 잠시 멈춤 */
  function pause() {
    if (!running()) return;
    R.paused = true; R.pausedAt = performance.now();
    const box = document.createElement('div');
    box.className = 'sp-pausebox';
    box.innerHTML = `<div><b>⏸ 잠시 멈춤</b><p>시계가 멈췄어요.</p><div class="row"><button type="button" class="btn" id="spQuit">그만두고 처음 화면</button><button type="button" class="btn primary" id="spResume">▶ 계속하기</button></div></div>`;
    $('speed').appendChild(box);
    $('spResume').focus();
    $('spResume').onclick = () => {
      box.remove(); R.paused = false; last = 0;
      R.t0 += performance.now() - R.pausedAt; // 멈춘 동안 카드·예측 시간도 멈춰요
      if (R.resume) { const f = R.resume; R.resume = null; f(); }
    };
    $('spQuit').onclick = () => { box.remove(); R = null; hide(); G.save(); Main.showTitle(); };
  }

  /* 키보드: 1·2·3(또는 ←·↓·→)으로 고르고, Enter로 다음 */
  document.addEventListener('keydown', e => {
    if (!R || !isOpen() || R.paused || $('screen-game').hidden) return;
    if (e.target.matches('input, textarea')) return;
    const k = { 1: 0, 2: 1, 3: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }[e.key];
    if (R.phase === 'card' && k !== undefined) { e.preventDefault(); answer(CHOICES[k]); }
    else if (R.phase === 'fc' && k !== undefined && e.key.length === 1) { e.preventDefault(); fcAnswer(k); }
    else if (e.key === 'Escape' && running()) pause();
  });
  document.addEventListener('visibilitychange', () => { last = 0; });
  raf = requestAnimationFrame(loop);

  /* 게임 화면에 들어오면: 끝낸 판이면 결과, 아니면 시작 화면 */
  function open() { const s = S(); if (s.finished && s.speed) showResult(); else intro(); }

  /* 패널: 결과·게임 방법(섬 둘러보기 중에 열어요) */
  G.registerPanel('final', { title: '3분 미션 결과', icon: () => '<span class="emoji-ico">🏆</span>', render(el) { el.innerHTML = resultHTML(S()); bindResult(el); } });
  G.registerPanel('quests', { title: '3분 미션 결과', icon: () => '<span class="emoji-ico">🏆</span>', render(el) { el.innerHTML = resultHTML(S()); bindResult(el); } });
  G.registerPanel('rules', {
    title: '게임 방법',
    icon: () => '<span class="emoji-ico">📖</span>',
    render(el) {
      el.innerHTML = `<p class="lead">⚡ <b>3분</b> 안에 2030년대 → 2050년대 → 2090년대 여름을 대비해요.</p>
        <ol class="sp-how">
          <li><b>🔭 예측 플래시</b> 기상청 전망 그래프에서 그 시대 폭염일수를 읽고 대비 단계(1단계 30일 미만 · 2단계 30~50일 · 3단계 50일 이상)를 골라요.</li>
          <li><b>🃏 대비 카드 러시</b> 의·식·주 카드를 ☀️ 폭염 대비 / ☔ 집중호우 대비 / 🚫 도움 안 돼요 중에서 빨리 골라요. 맞힌 대비 카드는 내 옷·집·밭에 더해져요.</li>
          <li><b>☀️ 여름 5일</b> 폭염일에는 ☀️, 집중호우일에는 ☔ 대비 카드가 목표만큼 있어야 버텨요. 대비 단계가 높을수록 목표가 커요.</li>
        </ol>
        <ul class="help"><li>틀리면 −${SPEED.penalty}초, ${SPEED.fastMs / 1000}초 안에 맞히면 ⚡ +${SPEED.points.fast}, 3콤보부터 🔥 +${SPEED.points.combo}, 끝나고 남은 시간 1초에 1점.</li>
        <li>예측 정답 +${SPEED.points.fc}, 카드 정답 +${SPEED.points.card}, 버틴 날 +${SPEED.points.day}.</li></ul>
        <p class="hint">기후 자료: 기상청 경기도·서울특별시 기후변화 전망보고서(2023). 점수·목표·날씨는 학습을 위한 게임 규칙이에요.</p>
        <div class="panel-actions"><button type="button" class="btn primary" id="rulesOk">닫기</button></div>`;
      $('rulesOk').onclick = () => G.closePanel();
    }
  });

  return { open, intro, showResult, hide, isOpen, finish, cardOf, decks, offered, target, judge, levelOf, summer, cardPoints, maxBase, rankOf, get run() { return R; }, _answer: answer, _fcAnswer: fcAnswer };
})();
