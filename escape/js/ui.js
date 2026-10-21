/* ==========================================================================
   여울 연구소 탈출 — 화면 도우미: 창(모달), 묻기, 알림, 효과
   ========================================================================== */
const U = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = sec => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };

  /* ---------- 창 ---------- */
  let onClose = null, lastFocus = null;
  function modal(o) {
    if ($('modalBack').hidden) lastFocus = document.activeElement;
    $('modalIcon').innerHTML = o.icon || '';
    $('modalTitle').textContent = o.title || '';
    $('modal').className = 'modal' + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : '');
    $('modalX').hidden = !!o.noClose;
    const body = $('modalBody');
    body.innerHTML = o.html || '';
    body.scrollTop = 0;
    $('modalBack').hidden = false;
    onClose = o.onClose || null;
    setTimeout(() => { const f = body.querySelector('[data-focus]') || (o.noClose ? body.querySelector('button') : $('modalX')); if (f) f.focus({ preventScroll: true }); }, 30);
    return body;
  }
  function closeModal() {
    if ($('modalBack').hidden) return;
    $('modalBack').hidden = true;
    $('modalBody').innerHTML = '';
    const f = onClose; onClose = null;
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }
    if (f) f();
  }
  const modalOpen = () => !$('modalBack').hidden;

  /* ---------- 묻기 (confirm·alert 대신) ---------- */
  let askDone = null;
  function ask(text, opt = {}) {
    return new Promise(res => {
      if (askDone) askDone(null);
      $('askText').innerHTML = esc(text).replace(/\n/g, '<br>');
      const btns = opt.buttons || [{ label: opt.cancel || '취소', value: false }, { label: opt.ok || '확인', value: true, primary: true }];
      $('askBtns').innerHTML = btns.map((b, i) => `<button type="button" class="btn${b.primary ? ' primary' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('');
      $('askBack').hidden = false;
      askDone = v => { $('askBack').hidden = true; askDone = null; res(v); };
      $('askBtns').querySelectorAll('button').forEach(b => { b.onclick = () => askDone && askDone(btns[+b.dataset.i].value); });
      const p = $('askBtns').querySelector('.primary') || $('askBtns').querySelector('button');
      if (p) setTimeout(() => p.focus(), 30);
    });
  }
  const askOpen = () => !$('askBack').hidden;

  /* ---------- 알림 ---------- */
  function toast(text, kind = '') {
    const box = $('toasts');
    while (box.children.length >= 2) box.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }
  /* 큰 글자 효과(레벨 업, 반박 성공 등) */
  function fx(text, kind = '') {
    const el = $('fx');
    el.className = 'fx show ' + kind; el.textContent = text;
    clearTimeout(fx.t); fx.t = setTimeout(() => { el.className = 'fx'; }, 1400);
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (askOpen()) { if (askDone) askDone(null); return; }
    if (modalOpen() && !$('modalX').hidden) closeModal();
  });
  $('modalX').onclick = closeModal;

  return { $, esc, fmt, modal, closeModal, modalOpen, ask, askOpen, toast, fx };
})();
