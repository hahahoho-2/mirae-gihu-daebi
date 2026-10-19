/* Keep a classroom activity in this tab; downloadable reports are the durable copy. */
(() => {
  const KEY='climate-life-rpg-session-v1';
  const text=(value,max=180)=>typeof value==='string'?value.slice(0,max):'';
  const integer=(value,max=1000000)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.round(value))):0;
  const choose=(value,choices,fallback)=>choices.includes(value)?value:fallback;
  const cropIds=crops.map(c=>c.id),own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const list=value=>Array.isArray(value)?value:[];
  const quantities=(value,ids,max)=>Object.fromEntries(Object.entries(object(value)).filter(([id])=>ids.includes(id)).map(([id,n])=>[id,integer(n,max)]));
  const drafts={proposalName:40,proposalReason:240,proposalSource:200,proposalRisk:180,pantryItemName:28,pantryItemQuantity:2};
  const status=message=>{const el=document.getElementById('sessionStatus');if(el)el.textContent=message};
  function restore(saved){
    const s=object(saved.game);
    game.region=choose(s.region,Object.keys(climateData),'용인시');game.scenario=choose(s.scenario,['low','high'],'low');game.period=integer(s.period,3);
    game.farmTool=choose(s.farmTool,Object.keys(toolsInfo),'mulch');game.weather=choose(s.weather,Object.keys(weatherNames),'heat');
    game.cropQuantities=quantities(s.cropQuantities,cropIds,10);game.selectedCrops=cropIds.filter(id=>game.cropQuantities[id]>0);
    game.farmedCrops=quantities(s.farmedCrops,cropIds,1000000);game.harvestCount=integer(s.harvestCount);game.harvestDone=s.harvestDone===true&&Object.values(game.farmedCrops).some(n=>n>0);
    game.pantryItems=list(s.pantryItems).slice(0,100).filter(p=>p&&/^pantry_[a-zA-Z0-9_]{1,80}$/.test(p.id)&&text(p.name,28)).map(p=>({id:p.id,name:text(p.name,28)}));
    const ids=[...cropIds,...game.pantryItems.map(p=>p.id)];game.inventory=quantities(s.inventory,ids,1000000);
    game.customRecipeName=text(s.customRecipeName,24);game.customNeeds=quantities(s.customNeeds,ids,1000000);
    game.cropProposals=list(s.cropProposals).slice(0,8).filter(p=>p&&text(p.name,40)).map(p=>({name:text(p.name,40),reason:text(p.reason,240),source:text(p.source,200),risk:text(p.risk,180)}));
    game.meal=null;const meal=object(s.meal),needs=quantities(meal.needs,ids,1000000);
    if(text(meal.name,40)&&Object.values(needs).some(n=>n>0))game.meal={name:text(meal.name,40),icon:text(meal.icon,8)||'🍽️',needs,caption:Object.entries(needs).map(([id,n])=>ingredientName(id)+' × '+n).join(' · ')};
    game.mealCount=game.meal?Math.max(1,integer(s.mealCount)):0;
    game.outfit=choose(s.outfit,outfits.map(o=>o.id),null);game.fabric=choose(s.fabric,Object.keys(fabrics),'lyocell');
    game.apparelFeatures=[...new Set(list(s.apparelFeatures))].filter(id=>own(apparelDetails,id)).slice(0,2);game.outfitReason=text(s.outfitReason,180);
    game.architecture=Object.fromEntries(Object.entries(homeLabels).map(([key,values])=>[key,choose(object(s.architecture)[key],Object.keys(values),defaultHomeDesign()[key])]));
    game.homeDone=s.homeDone===true;game._homeGiven=s._homeGiven===true;game._outfitGiven=s._outfitGiven===true;game.xp=integer(s.xp,1000);
    game.buildMode=choose(s.buildMode,['quick','direct'],'quick');game.viewMode=choose(s.viewMode,['2d','3d'],'3d');game.houseYaw=Number.isFinite(s.houseYaw)?Math.max(-60,Math.min(60,Math.round(s.houseYaw))):26;
    document.getElementById('regionSelect').value=game.region;document.getElementById('outfitReason').value=game.outfitReason;
    document.querySelectorAll('.tool-choice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===game.farmTool)));
    renderCrops();renderInventory();renderClimate();setDesignMode(game.buildMode);setViewMode(game.viewMode);updateEnd();
    if(game.harvestDone){document.getElementById('fieldResult').classList.add('show');document.querySelector('#fieldResult h4').textContent='🌿 '+game.harvestCount+'회 수확 기록을 복원했어요';document.getElementById('harvestList').textContent=farmRecord();document.getElementById('growthNote').textContent='누적 재배 수량입니다. 추가로 심고 수확할 수 있어요.';document.getElementById('growthFill').style.width='0%'}
    document.getElementById('mealChip').textContent=game.meal?'요리 '+game.mealCount+'회 완성':Object.values(game.inventory).some(n=>n>0)?'재료가 가방에 있어요':'재료를 기다리는 중';
    document.getElementById('mealResult').textContent=game.meal?mealRecord()+' · 최근 요리 기록을 복원했어요.':'';
    for(const [id,max] of Object.entries(drafts)){const el=document.getElementById(id);if(el&&typeof object(saved.drafts)[id]==='string')el.value=text(saved.drafts[id],max)}
  }
  try{const raw=sessionStorage.getItem(KEY);if(raw){const saved=JSON.parse(raw);if(saved&&saved.version===1&&saved.game)restore(saved)}}catch{status('보관된 기록을 읽지 못했어요. 현재 활동은 계속할 수 있어요.');}
  const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({version:1,game,drafts:Object.fromEntries(Object.keys(drafts).map(id=>[id,document.getElementById(id)?.value||'']))}));status('이 탭에서 자동 보관 중 · 탭을 닫기 전 「기록 파일 저장」으로 보관하세요.')}catch{status('이 브라우저에서는 자동 보관을 사용할 수 없어요. 「기록 파일 저장」으로 내려받아 주세요.')}};
  let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(save,0)};
  ['input','change','click','pointerup','keyup','submit'].forEach(type=>document.addEventListener(type,schedule));
  window.addEventListener('pagehide',save);save();
})();
