/* ==========================================================================
   처음 화면 · 캐릭터 만들기 · 화면 바꾸기
   ========================================================================== */
const Main = (() => {
  const $ = id => document.getElementById(id);
  const SCREENS = ['screen-title', 'screen-create', 'screen-game', 'screen-plaza'];
  const HERO_OUTFIT = { top: 'tee', color: 'sky', fabric: 'fab_cotton_plain', details: ['sleeves'], hat: 'sunhat', shoes: 'sneakers' };
  let draft = { name: '', color: 'peach', pet: 'bee' };

  function show(id) {
    SCREENS.forEach(s => { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }

  /* ---------- 처음 화면 ---------- */
  function titleArt() {
    const o = [];
    o.push('<defs><linearGradient id="tSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3F4"/><stop offset="1" stop-color="#5DB7E4"/></linearGradient></defs>');
    o.push('<g transform="translate(790 70)" class="spin-slow"><circle r="44" fill="#FFD66B"/><g stroke="#FFD66B" stroke-width="6" stroke-linecap="round">' + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${Math.cos(a) * 56} ${Math.sin(a) * 56} L${Math.cos(a) * 70} ${Math.sin(a) * 70}"/>`; }).join('') + '</g></g>');
    o.push('<g fill="#fff" class="cloud"><ellipse cx="140" cy="70" rx="64" ry="20"/><ellipse cx="176" cy="56" rx="40" ry="18"/></g><g fill="#fff" class="cloud c2"><ellipse cx="560" cy="44" rx="54" ry="16"/><ellipse cx="590" cy="34" rx="34" ry="14"/></g>');
    o.push('<rect y="250" width="900" height="170" fill="url(#tSea)"/>');
    o.push('<g stroke="#D8F2FB" stroke-width="4" fill="none" stroke-linecap="round" class="flow">' + [[60, 300], [260, 360], [700, 320], [820, 390], [480, 395]].map(([x, y]) => `<path d="M${x} ${y} q12 -8 24 0 t24 0"/>`).join('') + '</g>');
    // 섬
    o.push('<ellipse cx="450" cy="300" rx="380" ry="74" fill="#F3E3B5"/><ellipse cx="450" cy="284" rx="352" ry="64" fill="#9ED18A"/><ellipse cx="450" cy="276" rx="300" ry="46" fill="#BFE6A8"/>');
    [[150, 250, 1], [740, 246, 1.1], [610, 222, .8], [280, 226, .8]].forEach(([x, y, s]) => o.push(`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-4" width="12" height="30" rx="4" fill="#9B6B43"/><circle cy="-26" r="30" fill="#5FA36F"/><circle cx="-14" cy="-38" r="17" fill="#7CC48A"/><circle cx="16" cy="-18" r="14" fill="#6DB37C"/></g>`));
    // 주민들
    [['researcher', 200, 268], ['grandma', 300, 280], ['chef', 600, 280], ['tailor', 690, 270], ['builder', 790, 278]].forEach(([id, x, y], i) => o.push(`<g transform="translate(${x} ${y}) scale(.36)"><g class="bob" style="animation-delay:${i * .3}s">${Art.npc(id)}</g></g>`));
    // 주인공과 동물 친구들
    o.push(`<g transform="translate(450 262) scale(.78)"><g class="bob">${Art.avatar({ color: draft.color, outfit: HERO_OUTFIT })}</g></g>`);
    o.push(`<g transform="translate(372 300) scale(.42)"><g class="bob" style="animation-delay:.4s">${Art.pet('otter')}</g></g>`);
    o.push(`<g transform="translate(530 304) scale(.42)"><g class="bob" style="animation-delay:.8s">${Art.pet('hedgehog')}</g></g>`);
    o.push(`<g transform="translate(520 170) scale(.4)"><g class="bob" style="animation-delay:.2s">${Art.pet('bee')}</g></g>`);
    return o.join('');
  }
  function renderTitle() {
    $('titleArt').innerHTML = titleArt();
    const saved = G.loadSaved();
    const c = $('btnContinue');
    c.hidden = !saved;
    if (saved) c.innerHTML = `▶ 이어하기 <small>${G.esc(saved.name)} · ${CHAPTERS[saved.chapter] ? CHAPTERS[saved.chapter].title : ''}</small>`;
    $('btnNew').classList.toggle('primary', !saved);
  }
  function showTitle() { renderTitle(); show('screen-title'); }

  /* ---------- 캐릭터 만들기 ---------- */
  function renderCreate() {
    $('createPreview').innerHTML = `<div class="cp-stage">${Art.avatarSVG({ color: draft.color }, 190)}<div class="cp-pet">${Art.petSVG(draft.pet, 100)}</div></div>
      <p class="cp-say"><b>${PETS[draft.pet].name}</b>: 안녕! 나는 ${PETS[draft.pet].kind} ${G.esc(PETS[draft.pet].name)}${G.josa(PETS[draft.pet].name, '이야/야').slice(PETS[draft.pet].name.length)}. ${G.esc(PETS[draft.pet].role)}가 되어 줄게!</p>`;
    $('colorPick').innerHTML = BODY_COLORS.map(c => `<button type="button" class="swatch big${draft.color === c.id ? ' on' : ''}" data-color="${c.id}" style="--c:${c.fill};--s:${c.stroke}" aria-label="${c.name}" aria-pressed="${draft.color === c.id}"><span>${c.name}</span></button>`).join('');
    $('petPick').innerHTML = Object.entries(PETS).map(([k, p]) => `<button type="button" class="pet-opt${draft.pet === k ? ' on' : ''}" data-pet="${k}" aria-pressed="${draft.pet === k}">${Art.petSVG(k, 64)}<b>${p.kind} ${p.name}</b><small>${p.role}</small></button>`).join('');
    $('colorPick').querySelectorAll('[data-color]').forEach(b => b.onclick = () => { draft.color = b.dataset.color; renderCreate(); });
    $('petPick').querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { draft.pet = b.dataset.pet; renderCreate(); });
  }
  function showCreate() {
    draft = { name: '', color: BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)].id, pet: 'bee' };
    $('nameInput').value = '';
    renderCreate();
    show('screen-create');
    $('nameInput').focus();
  }
  async function startNew() {
    const name = $('nameInput').value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 8);
    if (!name) { $('nameInput').focus(); $('nameHint').classList.add('warn'); $('nameHint').textContent = '별명을 적어 주세요. 실명 대신 게임 속 별명을 써요.'; return; }
    const saved = G.loadSaved();
    if (saved && !(await G.ask(`이 기기에 「${saved.name}」의 섬이 저장돼 있어요. 새로 시작하면 그 기록은 지워져요. (섬 코드로 백업해 두었다면 다시 불러올 수 있어요) 새로 시작할까요?`, { ok: '새로 시작', cancel: '그만두기', danger: true }))) return;
    startGame(G.newState({ name, color: draft.color, pet: draft.pet }));
  }

  /* ---------- 게임 · 광장 ---------- */
  function startGame(state) {
    show('screen-game');
    G.start(state);
    G.save();
  }
  function showPlaza() {
    if (G.S) G.save();
    show('screen-plaza');
    Plaza.open();
  }
  function leavePlaza() {
    if (G.S) { show('screen-game'); G.fitCamera(); G.refreshAvatar(); G.refreshMap(); G.updateHUD(); }
    else showTitle();
  }

  /* ---------- 섬 코드로 이어하기 ---------- */
  async function restore(text) {
    const codes = Plaza.findCodes(text);
    const msg = $('restoreMsg');
    if (!codes.length) { msg.textContent = '섬 코드를 찾지 못했어요. YS1로 시작하는 코드를 붙여 넣어요.'; msg.className = 'hint warn'; return; }
    try {
      const state = Plaza.cleanState(await Plaza.decode(codes[0]));
      const saved = G.loadSaved();
      if (saved && !(await G.ask(`이 기기에 저장된 「${saved.name}」의 섬 대신 「${state.name}」의 섬을 불러올까요? 지금 기록은 지워져요.`, { ok: '불러오기', cancel: '그만두기', danger: true }))) return;
      $('restoreBox').hidden = true;
      startGame(state);
      G.toast(`${state.name}의 섬을 불러왔어요!`, 'good');
    } catch (e) {
      msg.textContent = '코드를 읽지 못했어요. 코드가 잘리지 않았는지 확인해요.';
      msg.className = 'hint warn';
    }
  }

  function bind() {
    $('btnNew').onclick = showCreate;
    $('btnContinue').onclick = () => { const s = G.loadSaved(); if (s) startGame(s); else renderTitle(); };
    $('btnTitlePlaza').onclick = showPlaza;
    $('btnRestore').onclick = () => { $('restoreBox').hidden = false; $('restoreMsg').textContent = ''; $('restoreInput').value = ''; $('restoreInput').focus(); };
    $('restoreClose').onclick = () => { $('restoreBox').hidden = true; };
    $('restoreBox').addEventListener('click', e => { if (e.target.id === 'restoreBox') $('restoreBox').hidden = true; });
    $('restoreGo').onclick = () => restore($('restoreInput').value);
    $('restoreFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (f && f.size < 200000) restore(await f.text()); };
    $('createBack').onclick = showTitle;
    $('createGo').onclick = startNew;
    $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startNew(); });
    $('nameInput').addEventListener('input', () => { $('nameHint').classList.remove('warn'); $('nameHint').textContent = '실명 대신 게임 속 별명을 써요. (8글자까지)'; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('restoreBox').hidden) $('restoreBox').hidden = true; });
  }

  function init() {
    document.body.insertAdjacentHTML('afterbegin', Art.sharedDefs);
    bind();
    showTitle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { showTitle, showPlaza, leavePlaza, showCreate };
})();
