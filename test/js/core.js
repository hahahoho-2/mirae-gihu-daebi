/* ==========================================================================
   여울섬 게임 엔진: 상태·저장·대화·퀘스트·마을 이동·전체 지도·제한 시간
   ========================================================================== */
const G = (() => {
  // 5분 미션판 저장 칸(1판·온라인판의 'yeoul-island-save-v1'과 섞이지 않게 따로 써요)
  const SAVE_KEY = 'yeoul-island-save-v2';
  const $ = id => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const esc = v => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmtNum = n => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 1 });
  // 받침에 맞는 조사: josa('콩', '은/는') → '콩은'
  function josa(word, pair) {
    const [a, b] = pair.split('/');
    const ch = String(word).charCodeAt(String(word).length - 1);
    if (ch < 0xAC00 || ch > 0xD7A3) return word + b;
    return word + ((ch - 0xAC00) % 28 ? a : b);
  }
  let S = null;

  /* ---------- 상태 ---------- */
  function emptyHouse() {
    return { floors: 1, base: 'basic', walls: [null, null], windows: [[null, null], [null, null]], awnings: [[false, false], [false, false]], insulation: false, roof: null, roofTop: null, yard: [null, null, null] };
  }
  function newState(o) {
    return {
      v: 3, name: o.name, color: o.color, pet: o.pet, coins: ERA_COINS[1], owned: {}, eras: {}, seenRules: false,
      timeLeft: TIME_LIMIT, started: false, finished: false, timeUp: false, timeBonus: 0,
      region: '용인시', scenario: 'low', chapter: 1, chapterStartDay: 1, day: 1,
      seed: Math.floor(Math.random() * 1e9), quest: 0, step: 0,
      inv: {}, fridge: {},
      plots: Array.from({ length: 6 }, () => ({ crop: null, stage: 0, moisture: 0, stress: 0, stressTotal: 0, shade: false, greenhouse: false, mulch: false, drain: false, dead: false })),
      gathered: {}, table: [null, null, null, null],
      outfits: [], equipped: null, house: emptyHouse(),
      stats: { planted: 0, watered: 0, harvests: 0, cooked: 0, fabricsMade: 0, partsMade: 0, codeMade: 0, chapterHarvests: 0 },
      pos: { x: 640, y: 336 }, quizzes: {}, created: Date.now()
    };
  }
  function save() {
    if (!S) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가: 섬 코드로 백업 */ }
  }
  function loadSaved() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 3 && s.name ? s : null;
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } }

  /* ---------- 기후 · 날씨 ---------- */
  const period = () => CHAPTERS[S.chapter].period;
  const climate = (key, p = period()) => CLIMATE[S.region][key][S.scenario][p];
  function hash32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const rand01 = (...parts) => (hash32(parts.join('|')) % 100000) / 100000;
  // 마을에 보이는 날씨: 평소엔 맑음, 여름 5일이 지나갈 때만 그날 날씨를 보여 줘요
  let mapWeather = 'sunny';
  const today = () => mapWeather;

  /* ---------- 가방 ---------- */
  function itemName(id) {
    if (!id) return '기본 원단';
    if (ITEMS[id]) return ITEMS[id].name;
    if (PARTS[id]) return PARTS[id].name;
    if (id.startsWith('fab_')) { const [, f, w] = id.split('_'); return `${FIBERS[f] ? FIBERS[f].name : f} 원단(${WEAVES[w] ? WEAVES[w].name : w})`; }
    if (id.startsWith('dish_')) { const r = RECIPES.find(x => x.id === id.slice(5)); return r ? r.name : '요리'; }
    return id;
  }
  function itemCat(id) {
    if (ITEMS[id]) return ITEMS[id].cat;
    if (id === 'greenhouse_kit') return 'tool';
    if (PARTS[id]) return 'part';
    if (id.startsWith('fab_')) return 'fabric';
    if (id.startsWith('dish_')) return 'dish';
    return 'raw';
  }
  const count = id => S.inv[id] || 0;
  function add(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; }
  function take(id, n = 1) { if (count(id) < n) return false; S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id]; return true; }
  const hasAll = needs => Object.entries(needs).every(([id, n]) => count(id) >= n);
  function takeAll(needs) { if (!hasAll(needs)) return false; Object.entries(needs).forEach(([id, n]) => take(id, n)); return true; }
  const needText = needs => Object.entries(needs).map(([id, n]) => `${itemName(id)} ${n}`).join(' · ');

  /* ---------- 알림 · 동물 친구 말풍선 ---------- */
  function toast(text, kind = '') {
    const box = $('toasts');
    while (box.children.length >= 2) box.firstChild.remove(); // 알림은 한 번에 두 개까지만(산만하지 않게)
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  }
  let petTimer;
  function petSay(text, ms = 6500) {
    const b = $('petBubble');
    b.textContent = `${PETS[S.pet].name}: ${text}`;
    b.hidden = false;
    clearTimeout(petTimer);
    petTimer = setTimeout(() => { b.hidden = true; }, ms);
  }

  /* ---------- 확인 창 ----------
     브라우저의 confirm()은 일부 앱 속 브라우저·학교 기기에서 막혀 바로 '취소'가 돼요.
     그래서 화면 안에 직접 그리는 확인 창을 써요. ask(글) → Promise<true|false> */
  function ask(text, opt = {}) {
    return new Promise(resolve => {
      let box = $('askBox');
      if (!box) {
        box = document.createElement('div');
        box.id = 'askBox'; box.className = 'modal ask-modal'; box.hidden = true;
        box.innerHTML = '<div class="modal-box small-box" role="alertdialog" aria-modal="true" aria-labelledby="askText"><p id="askText" class="ask-text"></p><div class="row end"><button type="button" class="btn" id="askNo"></button><button type="button" class="btn primary" id="askYes"></button></div></div>';
        document.body.appendChild(box);
      }
      $('askText').textContent = text;
      $('askYes').textContent = opt.ok || '네';
      $('askNo').textContent = opt.cancel || '아니요';
      $('askYes').className = 'btn ' + (opt.danger ? 'danger-fill' : 'primary');
      const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); } };
      const done = v => { box.hidden = true; document.removeEventListener('keydown', onKey, true); resolve(v); };
      $('askYes').onclick = () => done(true);
      $('askNo').onclick = () => done(false);
      box.onclick = e => { if (e.target === box) done(false); };
      document.addEventListener('keydown', onKey, true);
      box.hidden = false;
      $('askNo').focus();
    });
  }

  /* ---------- 글자 채우기 ---------- */
  function fill(t) {
    const p = period();
    return t.replace(/\{name\}/g, S.name)
      .replace(/\{pet\}/g, PETS[S.pet].name)
      .replace(/\{region\}/g, S.region)
      .replace(/\{scenario\}/g, `${SCENARIOS[S.scenario].name}(${SCENARIOS[S.scenario].code})`)
      .replace(/\{chapter\}/g, `${CHAPTERS[S.chapter].title}(${PERIOD_YEARS[p]})`)
      .replace(/\{heatNow\}/g, fmtNum(climate('heat')))
      .replace(/\{heatBase\}/g, fmtNum(climate('heat', 0)))
      .replace(/\{tempNow\}/g, fmtNum(climate('temp')))
      .replace(/\{tempBase\}/g, fmtNum(climate('temp', 0)));
  }

  /* ---------- 대화 ---------- */
  let dlg = null;
  function speakerInfo(s) {
    if (s === 'pet') return { name: PETS[S.pet].name, art: Art.petSVG(S.pet, 86) };
    if (s === 'me') return { name: S.name, art: Art.avatarSVG({ color: S.color, outfit: equippedOutfit() }, 86) };
    return { name: NPCS[s].name, art: Art.npcSVG(s, 86) };
  }
  function talk(lines, onDone) {
    dlg = { lines, i: 0, onDone };
    $('dialog').hidden = false;
    $('petBubble').hidden = true;
    showLine();
  }
  function showLine() {
    const L = dlg.lines[dlg.i];
    const who = speakerInfo(L.s);
    $('dlgPortrait').innerHTML = who.art;
    $('dlgName').textContent = who.name;
    $('dlgText').textContent = fill(L.t);
    const acts = $('dlgActions');
    acts.innerHTML = '';
    if (L.choices) {
      L.choices.forEach(ch => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn choice'; b.textContent = ch.t;
        b.onclick = () => { Object.assign(S, ch.set || {}); next(); };
        acts.appendChild(b);
      });
    } else if (L.quiz) {
      L.quiz.options.forEach((opt, k) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn choice'; b.textContent = opt;
        b.onclick = () => {
          const ok = k === L.quiz.answer;
          S.quizzes[fill(L.t)] = ok;
          $('dlgText').textContent = ok ? L.quiz.right : L.quiz.wrong;
          acts.innerHTML = '';
          const nb = document.createElement('button');
          nb.type = 'button'; nb.className = 'btn primary'; nb.textContent = ok ? '좋아요!' : '알겠어요';
          nb.onclick = next;
          acts.appendChild(nb);
          nb.focus();
          if (ok) toast('정답이에요!', 'good');
        };
        acts.appendChild(b);
      });
    } else {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn primary'; b.textContent = dlg.i === dlg.lines.length - 1 ? '닫기' : '다음 ▶';
      b.onclick = next;
      acts.appendChild(b);
      b.focus();
    }
  }
  function runAction(L) {
    if (L.action === 'give') {
      Object.entries(L.give).forEach(([id, n]) => add(id, n));
      toast('받았어요: ' + needText(L.give), 'good');
    }
    if (L.action === 'questStep') advanceStep();
    if (L.action === 'questDone') completeQuest();
  }
  function next() {
    const L = dlg.lines[dlg.i];
    if (L.action) runAction(L);
    dlg.i++;
    if (dlg.i >= dlg.lines.length) {
      const done = dlg.onDone;
      dlg = null;
      $('dialog').hidden = true;
      save(); updateHUD(); refreshMap();
      if (done) done();
      return;
    }
    showLine();
  }
  const dialogOpen = () => !!dlg;

  /* ---------- 퀘스트 ---------- */
  const quest = () => QUESTS[Math.min(S.quest, QUESTS.length - 1)];
  const step = () => quest().steps[Math.min(S.step, quest().steps.length - 1)];
  const stepGoal = st => st.goal;
  // 퀘스트 목표는 그 퀘스트 시대의 기록으로 확인해요(시대를 넘어가는 순간에도 헷갈리지 않게)
  function statValue(stat) {
    if (stat === 'never') return 0;
    const e = Mission.era(quest().era);
    if (stat === 'forecast') return e.fc ? 1 : 0;
    if (['started', 'done', 'next'].includes(stat)) return e[stat] ? 1 : 0;
    return S.stats[stat] || 0;
  }
  function advanceStep() {
    S.step++;
    if (S.step >= quest().steps.length) completeQuest();
    else checkQuest();
  }
  function completeQuest() {
    const q = quest();
    if (S.quest < QUESTS.length - 1) {
      S.quest++; S.step = 0;
      if (q.reward) Mission.addCoins(q.reward);
      setTimeout(hintForStep, 900);
      save();
    }
    updateHUD();
  }
  // 이룬 목표만큼 앞으로 가요. 퀘스트가 끝나면 다음 퀘스트의 이미 이룬 목표도 이어서 확인해요.
  function checkQuest() {
    let moved = false, finished = false;
    for (let guard = 0; guard < 16; guard++) {
      const st = step();
      if (!st || st.talk || !st.stat) break;
      if (statValue(st.stat) >= stepGoal(st)) {
        const before = S.quest;
        S.step++;
        moved = true;
        if (S.step >= quest().steps.length) { completeQuest(); finished = true; if (S.quest === before) break; }
      } else break;
    }
    if (moved) save(); // 퀘스트 진행도 바로 저장해요(알림은 각 단계 화면에서 따로 보여 줘요)
    updateHUD(); refreshMarkers();
  }
  function hintForStep() {
    const st = step();
    if (!st || dlg) return;
    if (st.talk) petSay(`${NPCS[st.talk].name}께 가 보자! 전체 지도의 노란 별을 따라가.`);
    else if (st.place) petSay(`${fill(st.text)}! 전체 지도의 노란 별을 따라가.`);
    else petSay(`${fill(st.text)}!`);
  }

  /* ---------- HUD ---------- */
  function updateHUD() {
    if (!S) return;
    const q = quest(), st = step();
    const si = STAGE_ORDER.indexOf(q.stage);
    $('hudStage').textContent = `${CHAPTERS[q.era].title.replace(' 여름', '')} · ${STAGES[q.stage].icon} ${STAGES[q.stage].name}`;
    $('hudSteps').innerHTML = STAGE_ORDER.map((k, i) => `<i class="${i === si ? 'on' : i < si ? 'done' : ''}" title="${STAGES[k].no} ${STAGES[k].name}">${STAGES[k].no}</i>`).join('');
    $('hudQuestTitle').textContent = fill(q.title);
    let prog = '';
    if (st.stat && st.stat !== 'never') { const g = stepGoal(st); if (g > 1) prog = ` (${Math.min(statValue(st.stat), g)}/${g})`; }
    $('hudQuestStep').textContent = fill(st.text) + prog;
    $('hudCoinNum').textContent = S.coins;
    // 남은 시간: 1분 아래면 주황, 20초 아래면 빨강으로 깜박여요
    $('hudTime').textContent = Mission.clock(S.timeLeft);
    $('hudTimer').className = 'hud-timer' + (S.finished ? ' done' : S.timeLeft <= 20 ? ' danger' : S.timeLeft <= 60 ? ' warn' : '') + (S.started ? '' : ' wait');
    $('hudTimerNote').textContent = S.finished ? '끝' : S.started ? '남은 시간' : '시작 전';
    const sleep = $('btnSleep');
    sleep.innerHTML = S.finished ? '<span>🏆</span>결과 보기' : q.stage === 'review' ? '<span>▶</span>다음 시대로' : '<span>☀️</span>여름 맞이하기';
    sleep.classList.toggle('ready', !S.finished && q.stage === 'prepare' && !!Mission.era(q.era).fc);
    refreshTarget();
  }

  /* ---------- 패널 ---------- */
  const PANELS = {};
  let openId = null;
  function registerPanel(id, def) { PANELS[id] = def; }
  function openPanel(id, arg) {
    const def = PANELS[id];
    if (!def) return;
    openId = id;
    $('panel').hidden = false;
    $('panelTitle').textContent = typeof def.title === 'function' ? def.title(arg) : def.title;
    $('panelIcon').innerHTML = def.icon ? def.icon() : '';
    def.arg = arg;
    renderPanel();
    $('panelClose').focus();
  }
  function renderPanel() {
    if (!openId) return;
    const def = PANELS[openId];
    $('panelBody').innerHTML = '';
    def.render($('panelBody'), def.arg);
  }
  function closePanel() {
    if (!openId) return;
    const def = PANELS[openId];
    openId = null;
    $('panel').hidden = true;
    if (def.onClose) def.onClose();
    checkQuest(); save(); updateHUD(); refreshMap();
  }
  const panelOpen = () => !!openId;
  // 패널 안의 행동이 끝날 때마다 부르는 공통 마무리
  function changed() { checkQuest(); save(); updateHUD(); renderPanel(); }

  /* ---------- 옷 ---------- */
  const equippedOutfit = () => S.outfits.find(o => o.id === S.equipped) || null;

  /* ---------- 마을 지도 ---------- */
  const INTERACT = [
    { id: 'lab', x: 150, y: 286, label: '기후 연구소', act: () => openPanel('lab') },
    // 5분 미션: 재봉 공방(의)·부엌과 밭(식)·목공소(주)는 상점의 그 칸을 열어요
    { id: 'kitchen', x: 500, y: 286, label: '공동 부엌', act: () => openPanel('shop', '식') },
    { id: 'tailor', x: 830, y: 286, label: '재봉 공방', act: () => openPanel('shop', '의') },
    { id: 'shop', x: 1150, y: 286, label: '여울 상점', act: () => openPanel('shop') },
    { id: 'workshop', x: 1150, y: 566, label: '목공소', act: () => openPanel('shop', '주') },
    { id: 'board', x: 700, y: 478, label: '학급 광장', act: () => openPanel('board') },
    { id: 'farm', x: 340, y: 452, label: '밭', act: () => openPanel('shop', '식') },
    { id: 'lot', x: 765, y: 566, label: '내 집터', act: () => openPanel('ready') }
  ];
  const BUILD_POS = { lab: [150, 262], kitchen: [500, 262], tailor: [830, 262], shop: [1150, 262], workshop: [1150, 548], board: [700, 455] };
  const ROADS = '<rect x="40" y="304" width="1200" height="48" rx="24"/><rect x="128" y="258" width="44" height="60" rx="10"/><rect x="478" y="258" width="44" height="60" rx="10"/><rect x="808" y="258" width="44" height="60" rx="10"/><rect x="1128" y="258" width="44" height="60" rx="10"/><rect x="1128" y="330" width="44" height="230" rx="18"/><rect x="678" y="330" width="44" height="140" rx="18"/><rect x="540" y="330" width="44" height="160" rx="18"/><rect x="743" y="330" width="44" height="246" rx="18"/>';
  const STREAM = 'M905 380 C 960 470 1010 520 1040 600 S 1100 680 1130 700';
  function staticMap() {
    const o = [];
    o.push('<rect width="1280" height="800" fill="#BFE6A8"/>');
    o.push('<g fill="#CDEEB8">' + [[220, 420, 90, 30], [880, 260, 120, 26], [420, 760, 140, 30], [640, 600, 70, 20]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('') + '</g>');
    o.push('<rect width="1280" height="78" fill="#9ED18A"/>');
    o.push('<g>' + Array.from({ length: 18 }, (_, i) => { const x = i * 76 + 20, r = 34 + (i % 3) * 6; return `<circle cx="${x}" cy="${40 + (i % 2) * 10}" r="${r}" fill="${i % 2 ? '#6DB37C' : '#5FA36F'}"/>`; }).join('') + '</g>');
    // 길
    o.push(`<g fill="#F3E3B5" stroke="#E2CE96" stroke-width="2">${ROADS}</g>`);
    // 시냇물 · 연못
    o.push(`<path d="${STREAM}" fill="none" stroke="#9ED8F0" stroke-width="36" stroke-linecap="round"/><path d="${STREAM}" fill="none" stroke="#C6EBF8" stroke-width="6" stroke-dasharray="14 18" class="flow"/>`);
    o.push('<ellipse cx="1130" cy="716" rx="96" ry="48" fill="#9ED8F0" stroke="#7CC4E2" stroke-width="3"/><path d="M1080 712 q14 -6 28 0 M1140 728 q14 -6 28 0" stroke="#D8F2FB" stroke-width="3" fill="none"/>');
    // 밭 울타리
    o.push('<rect x="150" y="462" width="380" height="282" rx="16" fill="#D7BE91" stroke="#B88B5E" stroke-width="3"/>');
    o.push('<g stroke="#A9764A" stroke-width="5" stroke-linecap="round">' + Array.from({ length: 13 }, (_, i) => `<path d="M${158 + i * 30} 456 V470"/>`).join('') + '</g>');
    o.push('<g transform="translate(765 700)">' + Art.building('lot') + '</g>');
    // 건물
    Object.entries(BUILD_POS).forEach(([id, [x, y]]) => {
      const it = INTERACT.find(i => i.id === id);
      o.push(`<g class="tap" data-act="${id}" transform="translate(${x} ${y})" role="button" aria-label="${it.label}">${Art.building(id)}</g>`);
    });
    o.push(`<g class="tap" data-act="farm" aria-label="밭"><rect x="150" y="462" width="380" height="282" rx="16" fill="transparent"/></g>`);
    o.push(`<g class="tap" data-act="lot" aria-label="내 집터"><rect x="653" y="580" width="224" height="150" rx="10" fill="transparent"/></g>`);
    return o.join('');
  }
  function buildWorld() {
    const svg = $('world');
    svg.innerHTML = `<g id="mapStatic">${staticMap()}</g><g id="farmLayer"></g><g id="houseLayer"></g><g id="targetLayer" pointer-events="none"></g><g id="actors"></g><g id="weatherLayer" pointer-events="none"></g>`;
    const actors = $('actors');
    Object.entries(NPCS).forEach(([id, n]) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'tap actor npc');
      g.setAttribute('data-npc', id);
      g.dataset.y = n.y;
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', n.name);
      g.innerHTML = `<g transform="translate(${n.x} ${n.y}) scale(.42)"><g class="bob">${Art.npc(id)}</g><g class="marker" id="mark-${id}" hidden><circle cx="0" cy="-160" r="36" fill="#FFF3A6" stroke="#E0A92A" stroke-width="5"/><text x="0" y="-142" text-anchor="middle" font-size="52" font-weight="900" fill="#B45309">!</text></g></g><text x="${n.x}" y="${n.y + 44}" text-anchor="middle" class="map-label">${n.name}</text>`;
      actors.appendChild(g);
    });
    const petG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    petG.id = 'petActor'; petG.setAttribute('class', 'actor tap'); petG.setAttribute('data-pet', '1');
    actors.appendChild(petG);
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pl.id = 'playerActor'; pl.setAttribute('class', 'actor');
    actors.appendChild(pl);
    buildMinimap();
    refreshAvatar();
    refreshMap();
    renderMapWeather();
  }

  /* ---------- 갈 곳(노란 별) · 전체 지도 ---------- */
  function targetPoint() {
    const st = step();
    if (!st) return null;
    if (st.talk) { const n = NPCS[st.talk]; return { x: n.x, y: n.y + 10, talk: st.talk }; }
    const it = st.place && INTERACT.find(i => i.id === st.place);
    return it ? { x: it.x, y: it.y - 16, it } : null;
  }
  function refreshTarget() {
    const t = targetPoint(), g = $('targetLayer');
    if (g) g.innerHTML = t ? `<g transform="translate(${t.x} ${t.y})"><ellipse class="target-ring" rx="74" ry="26" fill="#FFE27A" fill-opacity=".35" stroke="#F2B705" stroke-width="5" stroke-dasharray="12 8"/></g>` : '';
    updateMinimap();
  }
  function goTarget() {
    const t = targetPoint();
    if (!t) { toast('지금은 오른쪽 아래 「하루 보내기」로 여름을 보내요.'); return; }
    if (t.talk) { const n = NPCS[t.talk]; walkTo(n.x + (P.x < n.x ? -50 : 50), n.y + 24, () => talkTo(t.talk)); }
    else walkTo(t.it.x, t.it.y, t.it.act);
  }
  const MM_ICON = { lab: '🔭', kitchen: '🍳', tailor: '🧵', shop: '🏪', workshop: '🔨', board: '📮' };
  let mmOpen = true;
  function buildMinimap() {
    const m = $('minimap'); if (!m) return;
    try { mmOpen = localStorage.getItem('yeoul-minimap-v1') !== '0'; } catch (e) { mmOpen = true; }
    const blds = Object.entries(BUILD_POS).map(([id, [x, y]]) => `<g transform="translate(${x} ${y - 56})"><title>${INTERACT.find(i => i.id === id).label}</title><rect x="-92" y="-62" width="184" height="124" rx="26" fill="#FFFDF7" stroke="#B88B5E" stroke-width="8"/><text y="30" text-anchor="middle" font-size="82">${MM_ICON[id]}</text></g>`).join('');
    const npcs = Object.values(NPCS).map(n => `<circle cx="${n.x}" cy="${n.y}" r="16" fill="#7C8EA3"/>`).join('');
    m.innerHTML = `<div class="mm-head"><b>🗺️ 전체 지도</b><button type="button" class="mm-toggle" id="mmToggle" aria-expanded="${mmOpen}">${mmOpen ? '접기' : '펴기'}</button></div>
      <svg id="mmSvg" viewBox="0 0 1280 800" role="img" aria-label="마을 전체 지도. 빨간 점은 나, 노란 별은 갈 곳이에요. 누르면 그곳으로 걸어가요." ${mmOpen ? '' : 'hidden'}>
        <rect width="1280" height="800" fill="#BFE6A8"/><rect width="1280" height="78" fill="#7CC48A"/>
        <g fill="#F3E3B5">${ROADS}</g><path d="${STREAM}" fill="none" stroke="#9ED8F0" stroke-width="40" stroke-linecap="round"/><ellipse cx="1130" cy="716" rx="96" ry="48" fill="#9ED8F0"/>
        <g><title>밭</title><rect x="150" y="462" width="380" height="282" rx="16" fill="#D7BE91" stroke="#B88B5E" stroke-width="8"/><text x="340" y="640" text-anchor="middle" font-size="96">🌱</text></g>
        <g><title>내 집터</title><rect x="653" y="580" width="224" height="150" rx="12" fill="#D8EBC3" stroke="#86BE73" stroke-width="8" stroke-dasharray="20 12"/><text x="765" y="690" text-anchor="middle" font-size="90">🏡</text></g>
        ${blds}${npcs}
        <rect id="mmCam" fill="none" stroke="#33475B" stroke-width="8" stroke-dasharray="24 14" visibility="hidden"/>
        <g id="mmTarget" visibility="hidden"><circle r="70" fill="#FFE27A" fill-opacity=".5" stroke="#F2B705" stroke-width="12" class="mm-pulse"/><text y="30" text-anchor="middle" font-size="86">⭐</text></g>
        <g id="mmMe"><circle r="46" fill="#E8590C" fill-opacity=".25"/><circle r="28" fill="#E8590C" stroke="#FFFFFF" stroke-width="10"/></g>
      </svg>`;
    $('mmToggle').onclick = () => {
      mmOpen = !mmOpen;
      try { localStorage.setItem('yeoul-minimap-v1', mmOpen ? '1' : '0'); } catch (e) { /* 이번만 */ }
      $('mmSvg').toggleAttribute('hidden', !mmOpen);
      $('mmToggle').textContent = mmOpen ? '접기' : '펴기';
      $('mmToggle').setAttribute('aria-expanded', mmOpen);
    };
    $('mmSvg').addEventListener('click', e => {
      if (panelOpen() || dialogOpen()) return;
      const svg = $('mmSvg'), pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const near = INTERACT.map(it => [it, Math.hypot(it.x - p.x, it.y - p.y)]).sort((a, b) => a[1] - b[1])[0];
      if (near && near[1] < 110) walkTo(near[0].x, near[0].y, near[0].act); else walkTo(p.x, p.y);
    });
    updateMinimap();
  }
  function updateMinimap() {
    const me = $('mmMe'); if (!me) return;
    me.setAttribute('transform', `translate(${P.x.toFixed(0)} ${P.y.toFixed(0)})`);
    const t = S ? targetPoint() : null, tg = $('mmTarget');
    tg.setAttribute('visibility', t ? 'visible' : 'hidden');
    if (t) tg.setAttribute('transform', `translate(${t.x} ${t.y - 40})`);
    const camR = $('mmCam');
    camR.setAttribute('visibility', cam.on ? 'visible' : 'hidden');
    if (cam.on) { camR.setAttribute('x', cam.x); camR.setAttribute('y', cam.y); camR.setAttribute('width', cam.w); camR.setAttribute('height', cam.h); }
  }
  function refreshAvatar() {
    if (!S) return;
    const pl = $('playerActor'); if (!pl) return;
    pl.innerHTML = `<g id="playerBody"><g transform="scale(.42)"><g class="walkbob">${Art.avatar({ color: S.color, outfit: equippedOutfit(), mood: today() === 'heat' && !S.owned.c_white && !S.owned.c_loose ? 'hot' : 'smile' })}</g></g></g><text x="0" y="44" text-anchor="middle" class="map-label me">${esc(S.name)}</text>`;
    $('petActor').innerHTML = `<g transform="scale(.36)"><g class="bob">${Art.pet(S.pet)}</g></g>`;
    placeActors();
  }
  function refreshMap() {
    if (!S || !$('farmLayer')) return;
    const pos = [[165, 482], [285, 482], [405, 482], [165, 612], [285, 612], [405, 612]];
    $('farmLayer').innerHTML = S.plots.map((p, i) => `<g transform="translate(${pos[i][0]} ${pos[i][1]}) scale(.92)" pointer-events="none">${Art.plot(p, { paddy: i === 5 })}</g>`).join('') + '<text x="340" y="764" text-anchor="middle" class="map-label">밭 (오른쪽 아래 칸은 논)</text>';
    const h = S.house;
    const any = h.walls.some(Boolean) || h.roof || h.yard.some(Boolean);
    $('houseLayer').innerHTML = (any ? `<g transform="translate(657 545) scale(.6)" pointer-events="none">${Art.house(h)}</g>` : '<g pointer-events="none"><path d="M765 640 V676" stroke="#8B5E3C" stroke-width="6"/><rect x="715" y="610" width="100" height="34" rx="8" fill="#FFF8E8" stroke="#B88B5E" stroke-width="2"/><text x="765" y="633" text-anchor="middle" font-size="16" font-weight="800" fill="#8B5E3C">내 집터</text></g>') + '<text x="765" y="748" text-anchor="middle" class="map-label">내 집터</text>';
    refreshMarkers();
  }
  function refreshMarkers() {
    if (!S) return;
    const st = step();
    // SVG 요소에는 .hidden 속성이 없어서 속성을 직접 바꿔요
    Object.keys(NPCS).forEach(id => { const m = $('mark-' + id); if (m) m.toggleAttribute('hidden', !(st && st.talk === id)); });
  }
  function renderMapWeather(next) {
    if (next) mapWeather = next;
    if (!$('weatherLayer')) return;
    const w = today();
    let o = '';
    if (w === 'heat') o = '<rect width="1280" height="800" fill="#FF9B3D" opacity=".13"/><g class="shimmer" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".35">' + [200, 520, 860, 1120].map(x => `<path d="M${x} 760 q10 -20 0 -40 t0 -40"/>`).join('') + '</g><g transform="translate(1210 120)"><circle r="46" fill="#FFB347" opacity=".35"/><circle r="30" fill="#FF9B3D" opacity=".6"/></g>';
    if (w === 'storm') o = '<rect width="1280" height="800" fill="#3B5878" opacity=".22"/><rect class="rainfall" y="-40" width="1280" height="880" fill="url(#rainPat)"/><rect class="rainfall r2" y="-40" width="1280" height="880" fill="url(#rainPat)" opacity=".8" transform="translate(17 9)"/>';
    if (w === 'rain') o = '<rect width="1280" height="800" fill="#5D7FA3" opacity=".12"/><rect class="rainfall" y="-40" width="1280" height="880" fill="url(#rainPat)" opacity=".6"/>';
    if (w === 'cloudy') o = '<rect width="1280" height="800" fill="#8A9AAA" opacity=".08"/><g class="cloud" fill="#fff" opacity=".7"><ellipse cx="300" cy="120" rx="90" ry="28"/><ellipse cx="340" cy="104" rx="60" ry="26"/></g>';
    if (w === 'sunny') o = '<g class="cloud" fill="#fff" opacity=".6"><ellipse cx="900" cy="110" rx="70" ry="22"/><ellipse cx="930" cy="98" rx="46" ry="20"/></g>';
    $('weatherLayer').innerHTML = o;
  }

  /* ---------- 이동 ---------- */
  const P = { x: 700, y: 390, tx: null, ty: null, cb: null, vx: 0, vy: 0, px: 660, py: 400, facing: 1 };
  const keys = new Set();
  let raf = null, lastT = 0, moving = false;
  function svgPoint(evt) {
    const svg = $('world');
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function walkTo(x, y, cb) {
    P.tx = clamp(x, 30, 1250); P.ty = clamp(y, 96, 790); P.cb = cb || null;
  }
  // 좁은 화면(휴대폰)에서는 마을 일부만 크게 보여 주고 카메라가 주인공을 따라가요
  const cam = { on: false, x: 0, y: 0, w: 1280, h: 800 };
  function fitCamera() {
    const svg = $('world'); if (!svg) return;
    const W = svg.clientWidth, H = svg.clientHeight;
    if (!W || !H) return;
    if (Math.min(W / 1280, H / 800) >= 0.62) { cam.on = false; svg.setAttribute('viewBox', '0 0 1280 800'); return; }
    const s = Math.min(1.1, Math.max(0.62, H / 800));
    cam.on = true; cam.w = Math.min(1280, W / s); cam.h = Math.min(800, H / s);
    moveCamera();
  }
  function moveCamera() {
    if (!cam.on) return;
    const x = clamp(P.x - cam.w / 2, 0, 1280 - cam.w), y = clamp(P.y - cam.h / 2, 0, 800 - cam.h);
    if (Math.abs(x - cam.x) < 0.3 && Math.abs(y - cam.y) < 0.3 && $('world').getAttribute('viewBox') !== '0 0 1280 800') return;
    cam.x = x; cam.y = y;
    $('world').setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${cam.w.toFixed(1)} ${cam.h.toFixed(1)}`);
  }
  function placeActors() {
    const pl = $('playerActor'); if (!pl) return;
    moveCamera();
    pl.setAttribute('transform', `translate(${P.x.toFixed(1)} ${P.y.toFixed(1)})`);
    pl.dataset.y = P.y;
    $('petActor').setAttribute('transform', `translate(${P.px.toFixed(1)} ${P.py.toFixed(1)})`);
    $('petActor').dataset.y = P.py;
    // 위아래 순서
    const actors = $('actors');
    const nodes = [...actors.children].sort((a, b) => (+a.dataset.y) - (+b.dataset.y));
    nodes.forEach((n, i) => { if (actors.children[i] !== n) actors.appendChild(n); });
    $('playerBody').classList.toggle('moving', moving);
    updateMinimap();
  }
  function tick(t) {
    const dt = Math.min(0.1, (t - lastT) / 1000 || 0);
    lastT = t;
    if (!panelOpen() && !dialogOpen() && S) {
      const speed = 270;
      let dx = 0, dy = 0;
      if (keys.size) {
        if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
        if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
        if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
        if (keys.has('ArrowDown') || keys.has('s')) dy += 1;
        if (dx || dy) { P.tx = null; P.cb = null; }
      }
      if (P.tx !== null) {
        const ex = P.tx - P.x, ey = P.ty - P.y, d = Math.hypot(ex, ey);
        if (d < 4) { P.tx = null; const cb = P.cb; P.cb = null; moving = false; if (cb) cb(); }
        else { dx = ex / d; dy = ey / d; }
      }
      const len = Math.hypot(dx, dy);
      moving = len > 0;
      if (moving) {
        P.x = clamp(P.x + dx / len * speed * dt, 30, 1250);
        P.y = clamp(P.y + dy / len * speed * dt, 96, 790);
        if (Math.abs(dx) > .1) P.facing = dx > 0 ? 1 : -1;
      }
      // 동물 친구는 살짝 뒤에서 따라와요
      const fx = P.x - 46 * P.facing, fy = P.y + 8;
      P.px += (fx - P.px) * Math.min(1, dt * 4);
      P.py += (fy - P.py) * Math.min(1, dt * 4);
      S.pos.x = P.x; S.pos.y = P.y;
      placeActors();
    }
    raf = requestAnimationFrame(tick);
  }
  function nearestInteract() {
    let best = null, bd = 95;
    const consider = (x, y, fn) => { const d = Math.hypot(P.x - x, P.y - y); if (d < bd) { bd = d; best = fn; } };
    INTERACT.forEach(it => consider(it.x, it.y, it.act));
    Object.entries(NPCS).forEach(([id, n]) => consider(n.x, n.y + 30, () => talkTo(id)));
    return best;
  }
  function onWorldClick(evt) {
    if (panelOpen() || dialogOpen()) return;
    const p = svgPoint(evt);
    const t = evt.target.closest('[data-act],[data-npc],[data-pet]');
    if (t && t.dataset.act) { const it = INTERACT.find(i => i.id === t.dataset.act); walkTo(it.x, it.y, it.act); return; }
    if (t && t.dataset.npc) { const n = NPCS[t.dataset.npc]; walkTo(n.x + (P.x < n.x ? -50 : 50), n.y + 24, () => talkTo(t.dataset.npc)); return; }
    if (t && t.dataset.pet) { hintForStep(); return; }
    walkTo(p.x, p.y);
  }

  /* ---------- 주민과 이야기 (짧은 도움말) ---------- */
  function talkTo(id) {
    const lines = IDLE_LINES[id] || ['안녕하세요!'];
    talk([{ s: id, t: lines[(S.quest + id.length) % lines.length] }]);
  }

  /* ---------- 아래 큰 버튼: 여름 맞이하기 · 다음 시대로 ---------- */
  function mainAction() {
    if (panelOpen() || dialogOpen()) return;
    if (S.finished) { openPanel('final'); return; }
    const q = quest();
    if (q.stage === 'prepare' && Mission.era(q.era).fc) { Mission.startSummer(); return; }
    if (q.stage === 'review' || q.stage === 'live') { openPanel('summer'); return; }
    toast(q.stage === 'predict' ? '먼저 기후 연구소에서 예측 문제를 풀어요.' : '지금 할 일을 먼저 해요.');
    goTarget();
  }

  /* ---------- 메뉴 ---------- */
  registerPanel('menu', {
    title: '메뉴',
    render(el) {
      el.innerHTML = `<div class="menu-list">
        <div class="menu-me">${Art.avatarSVG({ color: S.color, outfit: equippedOutfit() }, 90)}<div><b>${esc(S.name)}</b><br><small>${PETS[S.pet].kind} ${josa(PETS[S.pet].name, '과/와')} 함께 ·${S.region} · ${SCENARIOS[S.scenario].name}</small></div></div>
        <button class="btn" type="button" id="mnCode">내 섬 코드 만들기 (친구와 나누기·백업)</button>
        <button class="btn" type="button" id="mnPlaza">학급 광장 보기</button>
        <button class="btn" type="button" id="mnHelp">게임 방법</button>
        <button class="btn" type="button" id="mnTitle">처음 화면으로</button>
        <button class="btn danger" type="button" id="mnReset">처음부터 다시 하기 (3분 새로)</button>
        <p class="hint">기록은 이 기기의 브라우저에 자동 저장돼요. 다른 기기에서 이어 하려면 섬 코드를 만들어 두세요.</p>
      </div>`;
      $('mnCode').onclick = () => openPanel('board', 'code');
      $('mnPlaza').onclick = () => { closePanel(); Main.showPlaza(); };
      $('mnHelp').onclick = () => openPanel('rules');
      $('mnTitle').onclick = () => { closePanel(); save(); Main.showTitle(); };
      $('mnReset').onclick = async () => { if (await ask('지금 판을 그만두고 처음부터 다시 할까요? 3분 미션을 새로 시작해요.', { ok: '다시 하기', danger: true })) restart({}); };
    }
  });

  /* ---------- 다시 하기: 같은 캐릭터로 새 판(미래를 바꿀 수도 있어요) ---------- */
  function restart(opt = {}) {
    const old = S;
    const s = newState({ name: old.name, color: old.color, pet: old.pet });
    s.region = opt.region || old.region;
    s.scenario = opt.scenario || old.scenario;
    s.seenRules = true;
    closePanel();
    $('petBubble').hidden = true;
    start(s); save();
    toast(`⚡ 새 3분 미션! ${s.region} · ${SCENARIOS[s.scenario].name}`, 'big');
  }

  /* ---------- 시작 ---------- */
  let bound = false;
  function start(state) {
    S = state;
    Mission.applyAll(S); // 산 용품에 맞춰 옷·집·밭 모습을 맞춰요
    mapWeather = 'sunny';
    P.x = S.pos.x; P.y = S.pos.y; P.px = P.x - 46; P.py = P.y + 8; P.tx = null;
    buildWorld();
    checkQuest(); // 이미 이룬 목표가 있으면 이어서 진행해요
    updateHUD();
    if (!bound) {
      bound = true;
      $('world').addEventListener('click', onWorldClick);
      $('btnSleep').onclick = mainAction;
      $('btnReady').onclick = () => openPanel('ready');
      $('btnQuests').onclick = () => openPanel('quests');
      $('hudQuest').onclick = () => openPanel('quests');
      $('btnShop').onclick = () => openPanel('shop');
      $('btnRules').onclick = () => openPanel('rules');
      $('btnMenu').onclick = () => openPanel('menu');
      $('panelClose').onclick = closePanel;
      $('panel').addEventListener('click', e => { if (e.target.id === 'panel') closePanel(); });
      document.addEventListener('keydown', e => {
        if (!S || $('screen-game').hidden || Speed.isOpen()) return;
        if (e.key === 'Escape') { if (panelOpen()) closePanel(); return; }
        if (panelOpen() || dialogOpen()) return;
        if (e.target.matches('input, textarea, select')) return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(k)) { keys.add(k); e.preventDefault(); }
        if (k === ' ' || k === 'Enter') { const fn = nearestInteract(); if (fn) { e.preventDefault(); fn(); } }
      });
      document.addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.delete(k); });
      window.addEventListener('blur', () => keys.clear());
      window.addEventListener('resize', fitCamera);
      setInterval(() => Mission.second(), 1000); // 5분 타이머(게임 화면이 보이고 시작했을 때만 줄어요)
    }
    fitCamera();
    if (!raf) raf = requestAnimationFrame(tick);
    // ⚡ 3분 스피드 미션: 끝낸 판이면 결과, 아니면 시작 화면(지역·미래 고르기)을 보여 줘요
    Speed.open();
  }

  return {
    get S() { return S; },
    newState, loadSaved, save, start, clearSaved, restart,
    $, esc, clamp, fmtNum, rand01, josa,
    climate, period, today,
    itemName, itemCat, count, add, take, hasAll, takeAll, needText,
    toast, petSay, talk, fill, ask, dialogOpen,
    registerPanel, openPanel, closePanel, renderPanel, changed,
    equippedOutfit, refreshAvatar, refreshMap, renderMapWeather, updateHUD, checkQuest, statValue, emptyHouse,
    talkTo, walkTo, fitCamera, goTarget
  };
})();
