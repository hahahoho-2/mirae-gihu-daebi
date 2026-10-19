/* ==========================================================================
   옷 점수(학습용 ★): 친구 섬 카드와 비교표에서 써요
   ========================================================================== */
const Tailor = (() => {
  const PROP_NAMES = { breath: '통기', absorb: '땀 흡수', dry: '빨리 마름', warm: '보온', water: '비 튕김', uv: '햇볕 가림' };

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
  return { scores, bars, fabricProps };
})();
