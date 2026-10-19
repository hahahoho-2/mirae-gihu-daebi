/* ==========================================================================
   여울섬 게임 엔진: 상태·저장·날씨·가방·대화·퀘스트·마을 이동·하루 보내기
   ========================================================================== */
const G = (() => {
  const SAVE_KEY = 'yeoul-island-save-v1';
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
      v: 1, name: o.name, color: o.color, pet: o.pet,
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
      return s && s.v === 1 && s.name ? s : null;
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } }

  /* ---------- 기후 · 날씨 ---------- */
  const period = () => CHAPTERS[S.chapter].period;
  const climate = (key, p = period()) => CLIMATE[S.region][key][S.scenario][p];
  function hash32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const rand01 = (...parts) => (hash32(parts.join('|')) % 100000) / 100000;
  // 게임 날씨: 폭염일수 ÷ 여름 92일을 '폭염 날 확률'로 쓴 학습용 단순화
  function weatherFor(day) {
    const dc = day - S.chapterStartDay;
    if (S.chapter === 1 && dc < 5) return ['sunny', 'sunny', 'heat', 'rain', 'storm'][dc];
    if (dc === 0) return 'cloudy';
    const heatP = clamp(climate('heat') / SUMMER_DAYS, 0.05, 0.8);
    const stormP = clamp(0.1 * climate('rain') / climate('rain', 0), 0.05, 0.25);
    const r = rand01(S.seed, S.chapter, day);
    if (r < heatP) return 'heat';
    if (r < heatP + stormP) return 'storm';
    if (r < heatP + stormP + 0.15) return 'rain';
    if (r < heatP + stormP + 0.35) return 'cloudy';
    return 'sunny';
  }
  const today = () => weatherFor(S.day);

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
    if (L.action === 'chapter') {
      S.chapter = Math.min(3, S.chapter + 1);
      S.chapterStartDay = S.day;
      S.stats.chapterHarvests = 0;
      completeQuest();
      toast(`${CHAPTERS[S.chapter].title}에 왔어요!`, 'good');
      renderMapWeather(); refreshAvatar();
    }
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
  function statValue(stat) {
    if (stat === 'tableCount') return S.table.filter(Boolean).length;
    if (stat === 'bestHeat') return S.outfits.reduce((m, o) => Math.max(m, Tailor.scores(o).heat), 0);
    if (stat === 'wearing') return S.equipped && S.outfits.some(o => o.id === S.equipped) ? 1 : 0;
    if (stat === 'houseBuilt') return Build.isBuilt() ? 1 : 0;
    if (stat === 'houseChecks') { const c = Build.checks(); return c.heatOk >= 2 && c.rainOk >= 2 ? 1 : 0; }
    if (stat === 'never') return 0;
    return S.stats[stat] || 0;
  }
  function advanceStep() {
    S.step++;
    if (S.step >= quest().steps.length) completeQuest();
    else { checkQuest(); hintForStep(); }
  }
  function completeQuest() {
    const q = quest();
    if (S.quest < QUESTS.length - 1) {
      S.quest++; S.step = 0;
      toast(`퀘스트 완료: ${q.title}`, 'big');
      setTimeout(hintForStep, 900);
    }
    updateHUD();
  }
  function checkQuest() {
    let moved = false;
    for (let guard = 0; guard < 8; guard++) {
      const st = step();
      if (!st || st.talk || !st.stat) break;
      if (statValue(st.stat) >= st.goal) {
        S.step++;
        moved = true;
        if (S.step >= quest().steps.length) { completeQuest(); break; }
      } else break;
    }
    if (moved) { toast('할 일 완료!', 'good'); hintForStep(); }
    updateHUD(); refreshMarkers();
  }
  function hintForStep() {
    const st = step();
    if (!st) return;
    if (st.talk) petSay(`${NPCS[st.talk].name}께 가 보자! 머리 위에 ! 표시가 있어.`);
    else petSay(st.text + '!');
  }

  /* ---------- HUD ---------- */
  function updateHUD() {
    if (!S) return;
    const q = quest(), st = step();
    $('hudQuestTitle').textContent = q.title;
    let prog = '';
    if (st.stat && st.stat !== 'never') prog = ` (${Math.min(statValue(st.stat), st.goal)}/${st.goal})`;
    $('hudQuestStep').textContent = st.text + prog;
    const w = today();
    $('hudWeatherIcon').innerHTML = Art.weatherIcon(w, 40);
    $('hudWeatherName').textContent = WEATHER[w].name;
    $('hudDay').textContent = `${CHAPTERS[S.chapter].title} · ${S.day - S.chapterStartDay + 1}일째`;
    $('hudPlace').textContent = `${S.region} · ${SCENARIOS[S.scenario].name}`;
    $('hudWeather').className = 'hud-weather w-' + w;
    $('hudWeather').title = WEATHER[w].note;
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
    save(); updateHUD(); refreshMap(); checkQuest();
  }
  const panelOpen = () => !!openId;
  // 패널 안의 행동이 끝날 때마다 부르는 공통 마무리
  function changed() { save(); checkQuest(); updateHUD(); renderPanel(); }

  /* ---------- 옷 ---------- */
  const equippedOutfit = () => S.outfits.find(o => o.id === S.equipped) || null;

  /* ---------- 마을 지도 ---------- */
  const INTERACT = [
    { id: 'lab', x: 150, y: 286, label: '기후 연구소', act: () => openPanel('lab') },
    { id: 'kitchen', x: 500, y: 286, label: '공동 부엌', act: () => openPanel('kitchen') },
    { id: 'tailor', x: 830, y: 286, label: '재봉 공방', act: () => openPanel('tailor') },
    { id: 'workshop', x: 1150, y: 566, label: '목공소', act: () => openPanel('workshop') },
    { id: 'board', x: 700, y: 478, label: '학급 광장', act: () => openPanel('board') },
    { id: 'farm', x: 340, y: 452, label: '밭', act: () => openPanel('farm') },
    { id: 'lot', x: 765, y: 566, label: '내 집터', act: () => openPanel('house') }
  ];
  const BUILD_POS = { lab: [150, 262], kitchen: [500, 262], tailor: [830, 262], workshop: [1150, 548], board: [700, 455] };
  function staticMap() {
    const o = [];
    o.push('<rect width="1280" height="800" fill="#BFE6A8"/>');
    o.push('<g fill="#CDEEB8">' + [[220, 420, 90, 30], [880, 260, 120, 26], [420, 760, 140, 30], [1180, 300, 80, 24], [640, 600, 70, 20]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('') + '</g>');
    o.push('<rect width="1280" height="78" fill="#9ED18A"/>');
    o.push('<g>' + Array.from({ length: 18 }, (_, i) => { const x = i * 76 + 20, r = 34 + (i % 3) * 6; return `<circle cx="${x}" cy="${40 + (i % 2) * 10}" r="${r}" fill="${i % 2 ? '#6DB37C' : '#5FA36F'}"/>`; }).join('') + '</g>');
    o.push('<g class="flowers">' + Array.from({ length: 40 }, (_, i) => { const x = (i * 197) % 1240 + 20, y = 380 + (i * 131) % 400; const c = ['#FFF4B5', '#FFD0DC', '#FFFFFF', '#D9C9FF'][i % 4]; return `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`; }).join('') + '</g>');
    // 길
    o.push('<g fill="#F3E3B5" stroke="#E2CE96" stroke-width="2"><rect x="40" y="304" width="1200" height="48" rx="24"/><rect x="128" y="258" width="44" height="60" rx="10"/><rect x="478" y="258" width="44" height="60" rx="10"/><rect x="808" y="258" width="44" height="60" rx="10"/><rect x="1128" y="330" width="44" height="230" rx="18"/><rect x="678" y="330" width="44" height="140" rx="18"/><rect x="540" y="330" width="44" height="160" rx="18"/><rect x="743" y="330" width="44" height="246" rx="18"/></g>');
    // 시냇물 · 연못
    o.push('<path d="M905 380 C 960 470 1010 520 1040 600 S 1100 680 1130 700" fill="none" stroke="#9ED8F0" stroke-width="36" stroke-linecap="round"/><path d="M905 380 C 960 470 1010 520 1040 600 S 1100 680 1130 700" fill="none" stroke="#C6EBF8" stroke-width="6" stroke-dasharray="14 18" class="flow"/>');
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
    // 재료 모으는 곳
    Object.entries(GATHER).forEach(([id, g]) => {
      o.push(`<g class="tap spot" data-gather="${id}" transform="translate(${g.x} ${g.y})" role="button" aria-label="${g.name}">${Art.spot(id)}<g class="sparkle" id="spark-${id}"><path d="M28 -44 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" fill="#FFF3A6" stroke="#F2C94C"/></g><text x="0" y="${id === 'hill' ? 38 : 50}" text-anchor="middle" class="map-label">${g.name}</text></g>`);
    });
    return o.join('');
  }
  function buildWorld() {
    const svg = $('world');
    svg.innerHTML = `<g id="mapStatic">${staticMap()}</g><g id="farmLayer"></g><g id="houseLayer"></g><g id="actors"></g><g id="weatherLayer" pointer-events="none"></g>`;
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
    refreshAvatar();
    refreshMap();
    renderMapWeather();
  }
  function refreshAvatar() {
    if (!S) return;
    const pl = $('playerActor'); if (!pl) return;
    pl.innerHTML = `<g id="playerBody"><g transform="scale(.42)"><g class="walkbob">${Art.avatar({ color: S.color, outfit: equippedOutfit(), mood: today() === 'heat' && !equippedOutfit() ? 'hot' : 'smile' })}</g></g></g><text x="0" y="44" text-anchor="middle" class="map-label me">${esc(S.name)}</text>`;
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
    Object.keys(GATHER).forEach(id => { const el = $('spark-' + id); if (el) el.style.display = S.gathered[id] === S.day ? 'none' : ''; });
    refreshMarkers();
  }
  function refreshMarkers() {
    if (!S) return;
    const st = step();
    // SVG 요소에는 .hidden 속성이 없어서 속성을 직접 바꿔요
    Object.keys(NPCS).forEach(id => { const m = $('mark-' + id); if (m) m.toggleAttribute('hidden', !(st && st.talk === id)); });
  }
  function renderMapWeather() {
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
    Object.entries(GATHER).forEach(([id, g]) => consider(g.x, g.y + 40, () => gather(id)));
    return best;
  }
  function onWorldClick(evt) {
    if (panelOpen() || dialogOpen()) return;
    const p = svgPoint(evt);
    const t = evt.target.closest('[data-act],[data-npc],[data-gather],[data-pet]');
    if (t && t.dataset.act) { const it = INTERACT.find(i => i.id === t.dataset.act); walkTo(it.x, it.y, it.act); return; }
    if (t && t.dataset.npc) { const n = NPCS[t.dataset.npc]; walkTo(n.x + (P.x < n.x ? -50 : 50), n.y + 24, () => talkTo(t.dataset.npc)); return; }
    if (t && t.dataset.gather) { const g = GATHER[t.dataset.gather]; walkTo(g.x, g.y + 44, () => gather(t.dataset.gather)); return; }
    if (t && t.dataset.pet) { hintForStep(); return; }
    walkTo(p.x, p.y);
  }

  /* ---------- 주민과 이야기 · 재료 모으기 ---------- */
  function talkTo(id) {
    const st = step();
    if (st && st.talk === id) {
      talk(SCRIPTS[st.script], () => checkQuest());
      return;
    }
    if (id === 'researcher' && S.quest > 0) { talk(SCRIPTS['researcher.free']); return; }
    // 씨앗이 떨어지면 할머니가 하루 한 번 나눠 줘요(농사가 막히지 않게)
    if (id === 'grandma' && S.quest > 1) {
      const missing = Object.keys(CROPS).filter(c => !count('seed_' + c));
      if (missing.length && S.gathered.grandmaSeeds !== S.day) {
        S.gathered.grandmaSeeds = S.day;
        const give = {};
        missing.forEach(c => { give['seed_' + c] = c === 'rice' ? 1 : 2; });
        talk([{ s: 'grandma', t: '씨앗이 떨어졌군요. 지난해 받아 둔 씨앗을 나눠 줄게요. 잘 여문 작물에서 씨앗을 받아 두는 것도 농사의 한 부분이에요.', action: 'give', give }]);
        return;
      }
    }
    const lines = IDLE_LINES[id] || ['안녕하세요!'];
    talk([{ s: id, t: lines[(S.day + id.length) % lines.length] }]);
  }
  function gather(id) {
    const g = GATHER[id];
    if (S.gathered[id] === S.day) { toast(`${g.name}에서는 오늘 이미 모았어요. 내일 다시 와요.`); return; }
    S.gathered[id] = S.day;
    Object.entries(g.gives).forEach(([k, n]) => add(k, n));
    toast(`${g.name}: ${needText(g.gives)} 모았어요`, 'good');
    if (Math.random() < 0.5) petSay(g.note);
    save(); refreshMap(); checkQuest();
  }

  /* ---------- 하루 보내기 ---------- */
  function endDay() {
    if (panelOpen() || dialogOpen()) return;
    const w = today();
    const report = Farm.resolveDay(w);
    if (w === 'heat') {
      const dishes = Object.keys(S.inv).filter(k => k.startsWith('dish_'));
      dishes.forEach(k => { report.push({ kind: 'bad', text: `가방 속 ${itemName(k)} ${S.inv[k]}개가 더위에 상했어요. 요리는 냉장고에 넣거나 식탁에 차려요.` }); delete S.inv[k]; });
    }
    S.day++;
    save();
    showDaySummary(w, report);
    updateHUD(); refreshAvatar(); refreshMap(); renderMapWeather(); checkQuest();
  }
  function showDaySummary(w, report) {
    const nw = today();
    const items = report.length ? report.map(r => `<li class="${r.kind}">${esc(r.text)}</li>`).join('') : '<li>밭에 심은 작물이 없어요.</li>';
    openPanel('summary', { w, nw, items });
  }
  registerPanel('summary', {
    title: '하루를 보냈어요',
    render(el, a) {
      el.innerHTML = `<div class="day-sum">
        <div class="ds-col"><div class="ds-label">어제 날씨</div>${Art.weatherIcon(a.w, 56)}<b>${WEATHER[a.w].name}</b></div>
        <div class="ds-arrow">→</div>
        <div class="ds-col"><div class="ds-label">오늘 날씨</div>${Art.weatherIcon(a.nw, 56)}<b>${WEATHER[a.nw].name}</b></div>
      </div>
      <p class="ds-note">${esc(WEATHER[a.nw].note)}</p>
      <h4>밭 소식</h4><ul class="report">${a.items}</ul>
      <div class="panel-actions"><button class="btn primary" type="button" id="dsOk">좋아요</button></div>`;
      $('dsOk').onclick = () => { closePanel(); weatherHint(); };
    }
  });
  function weatherHint() {
    const w = today();
    const msg = {
      heat: '오늘은 폭염이야! 상추 밭에 차양을 치고, 물을 넉넉히 주자. 볏짚 멀칭도 좋아.',
      storm: '집중호우가 온대! 고구마·콩·상추 밭에 두둑과 배수로를 만들어 두자.',
      rain: '비가 와서 오늘은 밭에 물을 안 줘도 돼.',
      cloudy: '흐린 날이야. 그래도 밭에 물은 줘야 해.',
      sunny: '맑은 날이야. 밭에 물 주는 걸 잊지 말자!'
    }[w];
    petSay(msg, 8000);
  }

  /* ---------- 가방 패널 ---------- */
  registerPanel('bag', {
    title: '가방',
    icon: () => '<span class="emoji-ico">🎒</span>',
    render(el) {
      const groups = {};
      Object.entries(S.inv).forEach(([id, n]) => { if (n > 0) (groups[itemCat(id)] = groups[itemCat(id)] || []).push([id, n]); });
      const order = ['seed', 'crop', 'dish', 'raw', 'fabric', 'part', 'tool'];
      const html = order.filter(c => groups[c]).map(c => `<h4>${ITEM_CATS[c]}</h4><div class="item-grid">${groups[c].map(([id, n]) => `<div class="item"><span class="ico">${Art.itemIcon(id, 40)}</span><span class="nm">${esc(itemName(id))}</span><b class="ct">${n}</b></div>`).join('')}</div>`).join('');
      el.innerHTML = html || '<p class="empty">가방이 비어 있어요. 마을의 재료 모으는 곳(반짝이는 곳)을 눌러 보세요.</p>';
    }
  });

  /* ---------- 메뉴 ---------- */
  registerPanel('menu', {
    title: '메뉴',
    render(el) {
      el.innerHTML = `<div class="menu-list">
        <div class="menu-me">${Art.avatarSVG({ color: S.color, outfit: equippedOutfit() }, 90)}<div><b>${esc(S.name)}</b><br><small>${PETS[S.pet].kind} ${josa(PETS[S.pet].name, '과/와')} 함께 ·${S.region} · ${SCENARIOS[S.scenario].name}</small></div></div>
        <button class="btn" type="button" id="mnCode">내 섬 코드 만들기 (친구와 나누기·백업)</button>
        <button class="btn" type="button" id="mnPlaza">학급 광장 보기</button>
        <button class="btn" type="button" id="mnHelp">조작 방법</button>
        <button class="btn" type="button" id="mnTitle">처음 화면으로</button>
        <button class="btn danger" type="button" id="mnReset">이 기기의 기록 지우고 새로 시작</button>
        <p class="hint">기록은 이 기기의 브라우저에 자동 저장돼요. 다른 기기에서 이어 하려면 섬 코드를 만들어 두세요.</p>
      </div>`;
      $('mnCode').onclick = () => openPanel('board', 'code');
      $('mnPlaza').onclick = () => { closePanel(); Main.showPlaza(); };
      $('mnHelp').onclick = () => openPanel('help');
      $('mnTitle').onclick = () => { closePanel(); save(); Main.showTitle(); };
      $('mnReset').onclick = async () => { if (await ask('이 기기에 저장된 여울섬 기록을 지울까요? 섬 코드로 백업하지 않았다면 되돌릴 수 없어요.', { ok: '지우기', danger: true })) { closePanel(); clearSaved(); S = null; Main.showTitle(); } }; // 패널을 닫으면 저장되므로 닫은 뒤에 지워요
    }
  });
  registerPanel('help', {
    title: '조작 방법',
    render(el) {
      el.innerHTML = `<ul class="help">
        <li><b>이동</b> 땅을 누르면 그곳으로 걸어가요. 키보드 방향키나 W·A·S·D도 돼요.</li>
        <li><b>이야기·들어가기</b> 주민, 건물, 밭을 누르면 걸어가서 바로 열려요. 키보드는 가까이 가서 스페이스바.</li>
        <li><b>재료 모으기</b> 반짝이는 곳을 누르면 재료를 모아요. 곳마다 하루에 한 번이에요.</li>
        <li><b>하루 보내기</b> 오른쪽 아래 버튼. 밭의 작물이 자라고 다음 날 날씨가 와요.</li>
        <li><b>할 일</b> 왼쪽 위 카드를 보세요. 머리 위 <b>!</b> 표시가 있는 주민을 찾아가요.</li>
        <li><b>동물 친구</b> 따라다니는 친구를 누르면 힌트를 줘요.</li>
      </ul>`;
    }
  });

  /* ---------- 시작 ---------- */
  let bound = false;
  function start(state) {
    S = state;
    P.x = S.pos.x; P.y = S.pos.y; P.px = P.x - 46; P.py = P.y + 8; P.tx = null;
    buildWorld();
    updateHUD();
    if (!bound) {
      bound = true;
      $('world').addEventListener('click', onWorldClick);
      $('btnSleep').onclick = () => {
        const st = step();
        endDay();
        if (st && st.stat === 'harvests') { /* 수확 안내는 요약 패널에서 */ }
      };
      $('btnBag').onclick = () => openPanel('bag');
      $('btnWardrobe').onclick = () => openPanel('wardrobe');
      $('btnPlaza').onclick = () => openPanel('board');
      $('btnMenu').onclick = () => openPanel('menu');
      $('panelClose').onclick = closePanel;
      $('panel').addEventListener('click', e => { if (e.target.id === 'panel') closePanel(); });
      document.addEventListener('keydown', e => {
        if (!S || $('screen-game').hidden) return;
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
    }
    fitCamera();
    if (!raf) raf = requestAnimationFrame(tick);
    setTimeout(() => {
      if (S.quest === 0 && S.step === 0) petSay(`안녕, ${S.name}! 나는 ${PETS[S.pet].name}야. 기후 연구소 앞의 구름 연구원께 가 보자! 머리 위에 ! 표시가 있어.`, 9000);
      else hintForStep();
    }, 700);
  }

  return {
    get S() { return S; },
    newState, loadSaved, save, start, clearSaved,
    $, esc, clamp, fmtNum, rand01, josa,
    climate, period, today, weatherFor,
    itemName, itemCat, count, add, take, hasAll, takeAll, needText,
    toast, petSay, talk, fill, ask,
    registerPanel, openPanel, closePanel, renderPanel, changed,
    equippedOutfit, refreshAvatar, refreshMap, renderMapWeather, updateHUD, checkQuest, statValue, emptyHouse, endDay,
    talkTo, gather, walkTo, fitCamera
  };
})();
