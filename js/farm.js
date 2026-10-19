/* ==========================================================================
   QUEST 01 · 밭: 씨앗 심기, 물 주기, 차양·온실·멀칭·두둑, 거두기
   ========================================================================== */
const Farm = (() => {
  let tool = null;      // 'seed' | 'water' | 'shade' | 'greenhouse' | 'mulch' | 'drain' | 'harvest' | 'clear'
  let seedCrop = null;  // 심을 작물
  const PADDY = 5;      // 오른쪽 아래 칸은 논

  /* ---------- 하루가 지날 때 ---------- */
  function resolveDay(w) {
    const S = G.S, out = [];
    S.plots.forEach((p, i) => {
      if (!p.crop || p.dead) return;
      const c = CROPS[p.crop];
      const paddy = i === PADDY && c.paddy;
      const label = `${i + 1}번 ${paddy ? '논' : '밭'} ${c.name}`;
      if (w === 'rain' || w === 'storm') p.moisture = Math.max(p.moisture, p.mulch ? 2 : 1);
      if (paddy) p.moisture = 2; // 논물
      if (p.stage >= c.days) { out.push({ kind: 'good', text: `${label}: 다 자라서 거두기를 기다려요.` }); return; }
      const hot = w === 'heat';
      const reasons = [];
      if (hot && p.greenhouse && !p.shade) reasons.push('닫힌 온실 안이 너무 뜨거웠어요(온실에도 차양이 필요해요)');
      if (hot && c.heat === 'low' && !p.shade) reasons.push(`${G.josa(c.name, '이/가')} 더위에 지쳤어요(차양이 필요해요)`);
      const need = hot && !p.shade && c.heat !== 'high' ? 2 : 1;
      if (!paddy && p.moisture < need) reasons.push(need === 2 ? '폭염에 흙이 빨리 말라 물이 모자랐어요' : '물이 모자랐어요');
      p.moisture = Math.max(0, p.moisture - need);
      const wetSens = c.wet === true || (c.wet === 'flower' && p.stage >= 2);
      if (w === 'storm' && wetSens && !p.drain && !p.greenhouse) reasons.push('큰비에 물이 고여 뿌리가 힘들었어요(두둑·배수로가 필요해요)');
      if (reasons.length) {
        p.stress++; p.stressTotal++;
        if (p.stress >= 3) { p.dead = true; out.push({ kind: 'bad', text: `${label}: 사흘 연속 힘들어 시들었어요. ${reasons[0]}.` }); }
        else out.push({ kind: 'warn', text: `${label}: 오늘은 자라지 못했어요. ${reasons.join(' / ')}.` });
      } else {
        p.stress = 0; p.stage++;
        out.push({ kind: 'good', text: p.stage >= c.days ? `${label}: 다 자랐어요! 밭에서 거둘 수 있어요.` : `${label}: 쑥쑥 자랐어요 (${p.stage}/${c.days}).` });
      }
    });
    return out;
  }

  /* ---------- 도구로 밭 한 칸 돌보기 ---------- */
  function freshCrop(p, crop) {
    Object.assign(p, { crop, stage: 0, moisture: 0, stress: 0, stressTotal: 0, dead: false });
  }
  function apply(i) {
    const S = G.S, p = S.plots[i];
    const paddy = i === PADDY;
    const say = t => G.toast(t);
    if (!tool) { info(i); return; }
    if (tool === 'seed') {
      if (!seedCrop) return say('먼저 심을 씨앗을 골라요.');
      if (p.crop && !p.dead) return say('이미 작물이 있어요. 다 자라면 거두거나 「치우기」를 써요.');
      const c = CROPS[seedCrop];
      if (paddy && !c.paddy) return say('이 칸은 물을 댄 논이에요. 벼만 심을 수 있어요.');
      if (!paddy && c.paddy) return say('벼는 물을 댄 논(오른쪽 아래 칸)에 심어요.');
      if (!G.take('seed_' + seedCrop)) return say(`${G.josa(G.itemName('seed_' + seedCrop), '이/가')} 없어요.`);
      freshCrop(p, seedCrop);
      S.stats.planted++;
      say(`${i + 1}번 칸에 ${G.josa(c.name, '을/를')} 심었어요.`);
      if (!paddy) G.petSay('심었으면 물을 줘야 해! 「물 주기」를 골라 밭을 눌러 봐.');
    } else if (tool === 'water') {
      if (!p.crop || p.dead) return say('작물이 자라는 칸에 물을 줘요.');
      if (paddy) return say('논에는 물이 늘 차 있어요.');
      p.moisture = p.mulch ? 2 : 1;
      S.stats.watered++;
      say(`${i + 1}번 칸에 물을 줬어요${p.mulch ? ' (멀칭 덕분에 이틀 촉촉해요)' : ''}.`);
    } else if (tool === 'shade') {
      if (p.shade) { p.shade = false; G.add('bamboo_shade'); say('차양을 걷었어요.'); }
      else if (G.take('bamboo_shade')) { p.shade = true; say('대나무 차양을 쳤어요. 폭염 날 햇볕을 가려요.'); }
      else say('대나무 차양이 없어요. 목공소에서 대나무로 만들 수 있어요.');
    } else if (tool === 'greenhouse') {
      if (p.greenhouse) { p.greenhouse = false; G.add('greenhouse_kit'); say('온실을 걷었어요.'); }
      else if (G.take('greenhouse_kit')) { p.greenhouse = true; say('온실을 씌웠어요. 큰비를 막지만 폭염 땐 차양을 함께 쳐요.'); }
      else say('온실 키트가 없어요. 목공소에서 모래와 대나무로 만들 수 있어요.');
    } else if (tool === 'mulch') {
      if (paddy) return say('논에는 멀칭을 하지 않아요.');
      if (p.mulch) return say('이미 볏짚을 덮었어요.');
      if (!G.take('straw')) return say('볏짚이 없어요. 볏짚 더미에서 모아 와요.');
      p.mulch = true;
      if (p.moisture > 0) p.moisture = 2;
      say('볏짚을 덮었어요. 흙의 물이 덜 말라요.');
    } else if (tool === 'drain') {
      if (paddy) return say('논은 물을 가둬 두는 곳이에요.');
      p.drain = !p.drain;
      say(p.drain ? '두둑을 높이고 배수로를 냈어요. 큰비에 물이 잘 빠져요.' : '두둑을 평평하게 했어요.');
    } else if (tool === 'harvest') {
      if (!p.crop || p.dead) return say('거둘 작물이 없어요.');
      const c = CROPS[p.crop];
      if (p.stage < c.days) return say(`${G.josa(c.name, '은/는')} 아직 자라는 중이에요 (${p.stage}/${c.days}).`);
      const n = Math.max(1, c.yield - (p.stressTotal >= 2 ? 1 : 0));
      G.add(p.crop, n);
      let extra = '';
      if (p.crop === 'rice') { G.add('straw', 2); extra = ' · 볏짚 2'; }
      if (Math.random() < 0.5) { G.add('seed_' + p.crop, 1); extra += ` · ${G.itemName('seed_' + p.crop)} 1`; }
      S.stats.harvests++; S.stats.chapterHarvests++;
      say(`${c.name} ${n}개를 거뒀어요${extra}!`);
      Object.assign(p, { crop: null, stage: 0, moisture: 0, stress: 0, stressTotal: 0, dead: false, mulch: false });
      if (S.stats.harvests === 1) G.petSay('첫 수확이다! 들깨 할머니께 보여 드리자.');
    } else if (tool === 'clear') {
      if (!p.crop) return say('비어 있는 칸이에요.');
      Object.assign(p, { crop: null, stage: 0, moisture: 0, stress: 0, stressTotal: 0, dead: false, mulch: false });
      say('칸을 치웠어요.');
    }
    G.changed();
  }
  function info(i) {
    const p = G.S.plots[i];
    if (!p.crop) { G.toast(`${i + 1}번 칸은 비어 있어요. 위에서 도구를 골라요.`); return; }
    G.toast(`${CROPS[p.crop].name}: ${CROPS[p.crop].tip}`);
  }

  /* ---------- 화면 ---------- */
  function statusText(p, i) {
    if (!p.crop) return '빈 칸';
    const c = CROPS[p.crop];
    if (p.dead) return `${c.name} · 시들었어요`;
    if (p.stage >= c.days) return `${c.name} · 다 자랐어요!`;
    const water = i === PADDY ? '논물 충분' : p.moisture > 0 ? `물 ${p.moisture}` : '물 필요';
    return `${c.name} · ${p.stage}/${c.days} · ${water}${p.stress ? ` · 힘듦 ${p.stress}` : ''}`;
  }
  const TOOLS = [
    ['seed', '씨앗 심기', () => ''],
    ['water', '물 주기', () => ''],
    ['shade', '차양', () => G.count('bamboo_shade')],
    ['greenhouse', '온실', () => G.count('greenhouse_kit')],
    ['mulch', '볏짚 멀칭', () => G.count('straw')],
    ['drain', '두둑·배수로', () => ''],
    ['harvest', '거두기', () => ''],
    ['clear', '치우기', () => '']
  ];
  function render(el) {
    const S = G.S, w = G.today();
    const seeds = Object.keys(CROPS).map(k => [k, G.count('seed_' + k)]);
    el.innerHTML = `
      <div class="farm-top">
        <div class="weather-card w-${w}">${Art.weatherIcon(w, 52)}<div><b>오늘: ${WEATHER[w].name}</b><p>${G.esc(WEATHER[w].note)}</p></div></div>
        <details class="rules"><summary>밭 규칙 보기</summary><ul>${FARM_RULES.map(r => `<li>${G.esc(r)}</li>`).join('')}</ul></details>
      </div>
      <div class="toolbar" role="toolbar" aria-label="밭 도구">${TOOLS.map(([id, nm, ct]) => { const c = ct(); return `<button type="button" class="tool${tool === id ? ' on' : ''}" data-tool="${id}" aria-pressed="${tool === id}">${nm}${c !== '' ? ` <b>${c}</b>` : ''}</button>`; }).join('')}</div>
      ${tool === 'seed' ? `<div class="seed-pick">${seeds.map(([k, n]) => `<button type="button" class="seed${seedCrop === k ? ' on' : ''}" data-seed="${k}" ${n ? '' : 'disabled'}>${Art.itemIcon('seed_' + k, 34)}<span>${CROPS[k].name}<small>${n}개</small></span></button>`).join('')}</div>
        ${seeds.some(([, n]) => !n) ? '<p class="hint">떨어진 씨앗은 들깨 할머니께 이야기하면 하루에 한 번 나눠 주세요.</p>' : ''}
        ${seedCrop ? `<p class="tip">🌱 ${G.esc(CROPS[seedCrop].name)}: ${G.esc(CROPS[seedCrop].tip)}</p>` : '<p class="tip">심을 씨앗을 고른 뒤 밭 칸을 눌러요.</p>'}` : `<p class="tip">${tool ? '도구를 고른 상태예요. 아래 밭 칸을 눌러요.' : '도구를 고른 뒤 밭 칸을 눌러요. 칸만 누르면 작물 정보를 볼 수 있어요.'}</p>`}
      <div class="plots">${S.plots.map((p, i) => `<button type="button" class="plot-card${p.dead ? ' dead' : ''}" data-plot="${i}" aria-label="${i + 1}번 칸 ${G.esc(statusText(p, i))}">
          <span class="plot-no">${i + 1}${i === PADDY ? ' 논' : ''}</span>${Art.plotSVG(p, { paddy: i === PADDY })}<span class="plot-st">${G.esc(statusText(p, i))}</span>
          <span class="plot-tags">${p.shade ? '<i>차양</i>' : ''}${p.greenhouse ? '<i>온실</i>' : ''}${p.mulch ? '<i>멀칭</i>' : ''}${p.drain ? '<i>두둑</i>' : ''}</span></button>`).join('')}</div>
      <div class="panel-actions"><span class="hint">돌보기를 마쳤으면 하루를 보내 작물을 키워요.</span><button type="button" class="btn primary" id="farmSleep">🌙 하루 보내기</button></div>`;
    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { tool = tool === b.dataset.tool ? null : b.dataset.tool; G.renderPanel(); });
    el.querySelectorAll('[data-seed]').forEach(b => b.onclick = () => { seedCrop = b.dataset.seed; G.renderPanel(); });
    el.querySelectorAll('[data-plot]').forEach(b => b.onclick = () => apply(+b.dataset.plot));
    G.$('farmSleep').onclick = () => { G.closePanel(); G.endDay(); };
  }
  G.registerPanel('farm', {
    title: '들깨 할머니네 밭',
    icon: () => Art.npcSVG('grandma', 40),
    render,
    onClose() { tool = null; }
  });

  return { resolveDay };
})();
