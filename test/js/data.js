/* ==========================================================================
   여울섬 기후 생활 RPG — 내용 자료 (선생님이 고칠 수 있는 파일)
   - 글자는 따옴표 안에, 숫자는 단위·쉼표 없이 씁니다.
   - 점수·날씨 규칙은 비교를 위한 학습용 단순화예요(실제 예측이 아님).
   ========================================================================== */

/* ---------- 기후 자료 ----------
   기상청 경기도·서울특별시 기후변화 전망보고서(2023) 행정구역 평균
   [기준 2000–2019, 2021–2040, 2041–2060, 2081–2100], low = SSP1-2.6, high = SSP5-8.5 */
const CLIMATE = {
  '용인시': {
    temp: { low: [12.2, 13.6, 13.8, 14.6], high: [12.2, 13.7, 15.2, 18.8] },
    rain: { low: [1292.6, 1352.8, 1434.9, 1397.2], high: [1292.6, 1319.6, 1383.9, 1505.5] },
    heat: { low: [11.3, 25.2, 31.6, 35.6], high: [11.3, 27.5, 47.2, 102.2] }
  },
  '서울특별시': {
    temp: { low: [13.1, 14.5, 14.8, 15.5], high: [13.1, 14.7, 16.2, 19.8] },
    rain: { low: [1269.6, 1337.3, 1435.0, 1422.1], high: [1269.6, 1331.4, 1396.8, 1521.9] },
    heat: { low: [15.0, 30.8, 37.6, 42.7], high: [15.0, 33.4, 54.7, 109.8] }
  }
};
const PERIOD_YEARS = ['2000–2019', '2021–2040', '2041–2060', '2081–2100'];
const SCENARIOS = { low: { name: '저탄소 미래', code: 'SSP1-2.6' }, high: { name: '고탄소 미래', code: 'SSP5-8.5' } };
const CHAPTERS = {
  1: { period: 1, title: '2030년대 여름' },
  2: { period: 2, title: '2050년대 여름' },
  3: { period: 3, title: '2090년대 여름' }
};
const SUMMER_DAYS = 92; // 6~8월. 폭염일수를 '여름 하루가 폭염일 확률'로 바꿀 때 써요(단순화).

/* ---------- 기후 대비 미션 공통 자료(⚡ 3분 스피드 미션이 대비 단계·대비 용품·여름 날씨를 함께 써요) ----------
   시대(2030년대 → 2050년대 → 2090년대)마다 예측 → 대비 → 여름 5일을 해요. */
const TIME_LIMIT = 180;                 // 한 판 제한 시간(초): ⚡ 3분 스피드 미션
const ERA_COINS = { 1: 30, 2: 20, 3: 20 }; // 시대마다 받는 대비 예산(코인)
const FORECAST_BONUS = 10;              // 예측 카드를 맞히면 더 받는 코인
const SUMMER_LIVE_DAYS = 5;             // 시대마다 살아 보는 여름 날 수
const STAGES = {
  predict: { no: '①', name: '예측', icon: '🔭', what: '기후 연구소에서 기상청 전망 그래프를 읽고 예측 문제를 풀어요. 그 시대 폭염일수에 따라 대비 목표가 정해져요.' },
  prepare: { no: '②', name: '준비', icon: '🧰', what: '시대마다 받는 예산(코인)으로 여울 상점에서 의·식·주 대비 용품을 사요. 예산이 모자라니 예측을 보고 무엇이 먼저인지 골라요.' },
  live: { no: '③', name: '체험', icon: '☀️', what: '「여름 맞이하기」를 누르면 여름 5일이 지나가요. 폭염일과 집중호우일에 의·식·주 대비가 충분했는지 점검해요.' },
  review: { no: '④', name: '돌아보기', icon: '📝', what: '점수와 부족했던 점을 보고 다음 시대로 가요. 산 용품은 다음 시대에도 그대로 써요.' }
};
const STAGE_ORDER = ['predict', 'prepare', 'live', 'review'];

/* 대비 목표: 그 시대의 폭염일수(한 해 평균)가 많을수록 목표가 높아져요.
   숫자는 의·식·주마다 갖춰야 할 '폭염 대비'와 '집중호우 대비' 용품 수예요.
   단계 구분과 목표 수치는 비교를 위한 학습용 기준이에요(공식 경보 단계가 아니에요). */
const LEVELS = [
  { name: '대비 1단계', range: '폭염일 30일 미만', max: 30, clothHeat: 2, clothRain: 1, foodHeat: 1, foodRain: 1, houseHeat: 2, houseRain: 1 },
  { name: '대비 2단계', range: '폭염일 30~50일', max: 50, clothHeat: 3, clothRain: 1, foodHeat: 2, foodRain: 1, houseHeat: 3, houseRain: 2 },
  { name: '대비 3단계', range: '폭염일 50일 이상', max: Infinity, clothHeat: 4, clothRain: 2, foodHeat: 3, foodRain: 2, houseHeat: 4, houseRain: 2 }
];

/* ---------- 여울 상점: 의·식·주 대비 용품 ----------
   코인은 게임 속 돈이에요(진짜 돈이 아니에요). 한 번 사면 다음 시대에도 계속 써요.
   risk: heat(폭염 대비) · rain(집중호우 대비) */
const MEASURES = [
  { id: 'c_white', part: '의', risk: 'heat', name: '밝은색 옷', cost: 2, note: '밝은색은 햇빛을 더 많이 반사해 열을 덜 흡수해요.' },
  { id: 'c_loose', part: '의', risk: 'heat', name: '헐렁한 오버핏 티', cost: 3, note: '몸과 옷 사이로 바람이 지나가 땀이 잘 말라요.' },
  { id: 'c_hat', part: '의', risk: 'heat', name: '챙 넓은 모자', cost: 3, note: '얼굴과 목에 그늘을 만들어 햇볕을 가려요.' },
  { id: 'c_mesh', part: '의', risk: 'heat', name: '통풍 그물 패널', cost: 3, note: '옆구리로 더운 공기와 습기가 빠져나가요.' },
  { id: 'c_ramie', part: '의', risk: 'heat', name: '모시 원단 옷', cost: 6, note: '모시는 바람이 잘 통하고 몸에 덜 달라붙어요. 성글게 짜면 더 시원해요.' },
  { id: 'c_coat', part: '의', risk: 'rain', name: '발수 우비', cost: 7, note: '물을 튕기는 겉감이 큰비에 몸이 젖는 걸 줄여요(폐어망을 재활용한 나일론).' },
  { id: 'c_boots', part: '의', risk: 'rain', name: '장화', cost: 3, note: '물이 고인 길에서도 발이 덜 젖어요.' },
  { id: 'f_crops', part: '식', risk: 'heat', name: '더위에 강한 작물', cost: 4, note: '고구마와 수수는 더위와 가뭄에 강한 편이에요. 상추처럼 서늘한 걸 좋아하는 작물은 폭염에 약해요.' },
  { id: 'f_shade', part: '식', risk: 'heat', name: '밭 차양·볏짚 멀칭', cost: 4, note: '차양은 한낮 햇볕을 가리고, 볏짚 덮개는 흙 속 물이 덜 마르게 해요.' },
  { id: 'f_fridge', part: '식', risk: 'heat', name: '냉장 보관', cost: 5, note: '여름엔 음식이 빨리 상해요. 요리는 냉장고에 넣어 식중독을 막아요.' },
  { id: 'f_drain', part: '식', risk: 'rain', name: '두둑·배수로', cost: 3, note: '두둑을 높이고 물길을 내면 큰비에 뿌리가 물에 잠기지 않아요.' },
  { id: 'f_cover', part: '식', risk: 'rain', name: '비가림 온실', cost: 6, note: '큰비가 밭을 직접 때리지 않게 막아요. 단, 폭염 날엔 차양 없이 닫아 두면 속이 너무 뜨거워져요.' },
  { id: 'h_awning', part: '주', risk: 'heat', name: '창 바깥 차양', cost: 5, note: '창 밖에서 햇빛을 막으면 방으로 들어오는 열이 줄어요.' },
  { id: 'h_tree', part: '주', risk: 'heat', name: '그늘 나무', cost: 4, note: '나무 그늘과 잎의 증산이 집 둘레를 시원하게 해요.' },
  { id: 'h_roof', part: '주', risk: 'heat', name: '밝은 지붕', cost: 5, note: '밝은 지붕은 햇빛을 반사해 지붕이 덜 달궈져요.' },
  { id: 'h_insul', part: '주', risk: 'heat', name: '벽 속 단열재', cost: 6, note: '여름 더위와 겨울 추위가 벽을 지나 드나드는 걸 줄여요.' },
  { id: 'h_dglass', part: '주', risk: 'heat', name: '이중창', cost: 6, note: '유리 사이 공기층이 열의 이동을 줄여요.' },
  { id: 'h_base', part: '주', risk: 'rain', name: '높인 돌 기초', cost: 6, note: '집 바닥을 땅에서 띄워 큰비에 물이 덜 들어와요.' },
  { id: 'h_barrel', part: '주', risk: 'rain', name: '빗물 저금통', cost: 4, note: '지붕 빗물을 모아 두었다가 다시 써서 한꺼번에 흘러넘치는 물을 줄여요.' },
  { id: 'h_garden', part: '주', risk: 'rain', name: '빗물 정원', cost: 5, note: '빗물을 잠시 모아 땅속으로 천천히 스며들게 해요.' }
];
const PART_INFO = {
  '의': { name: '옷', icon: '👕', place: 'tailor', heat: 'clothHeat', rain: 'clothRain' },
  '식': { name: '먹거리', icon: '🍚', place: 'farm', heat: 'foodHeat', rain: 'foodRain' },
  '주': { name: '집', icon: '🏡', place: 'workshop', heat: 'houseHeat', rain: 'houseRain' }
};
/* ---------- ⚡ 3분 스피드 미션 ----------
   시대마다 ① 예측 플래시(그래프 → 대비 단계) → ② 대비 카드 러시(☀️ 폭염 대비 / ☔ 집중호우 대비 / 🚫 도움 안 돼요)
   → ③ 여름 5일(모은 대비로 버티기). 숫자는 모두 게임 규칙이에요. */
const SPEED = {
  cardMs: { 1: 4000, 2: 3400, 3: 2800 },     // 카드 1장을 고를 시간(밀리초). 시대가 갈수록 빨라져요
  fcMs: 10000,                                // 예측 플래시 제한 시간
  deck: { 1: [4, 2, 2], 2: [4, 2, 2], 3: [5, 3, 2] }, // 시대마다 [폭염 대비, 집중호우 대비, 도움 안 되는] 카드 수
  rate: [0.5, 0.7, 0.85],                     // 대비 1·2·3단계 목표: 지금까지 나온 대비 카드 중 모아야 할 비율
  penalty: 3,                                 // 카드를 잘못 고르면 줄어드는 시간(초)
  fastMs: 1500,                               // 이 시간 안에 맞히면 ⚡번개 보너스
  points: { fc: 20, card: 10, fast: 5, combo: 5, day: 10, sec: 1 } // 점수(남은 시간은 1초에 1점)
};
/* 도움이 안 되는 행동 카드: 「🚫 도움 안 돼요」가 정답이에요 */
const BAD_CARDS = [
  { id: 'x_dark', part: '의', name: '검은색 두꺼운 긴팔 옷', note: '어두운 색은 햇빛을 더 많이 흡수하고, 두꺼운 옷은 열이 잘 빠지지 않아 폭염에 더 더워요.' },
  { id: 'x_tight', part: '의', name: '바람이 안 통하는 꽉 끼는 옷', note: '공기가 통하지 않아 땀이 잘 마르지 않고 몸의 열이 잘 빠지지 않아요.' },
  { id: 'x_room', part: '식', name: '조리한 음식을 실온에 오래 두기', note: '더운 날에는 세균이 빨리 늘어 음식이 쉽게 상해요. 바로 냉장 보관해요.' },
  { id: 'x_lettuce', part: '식', name: '서늘한 걸 좋아하는 작물만 심기', note: '상추처럼 서늘한 기후를 좋아하는 작물은 폭염에 약해요.' },
  { id: 'x_clog', part: '식', name: '밭 물길을 흙으로 막기', note: '물이 빠져나가지 못해 큰비에 뿌리가 물에 잠겨요.' },
  { id: 'x_concrete', part: '주', name: '마당을 모두 콘크리트로 덮기', note: '빗물이 땅에 스며들지 못하고 한꺼번에 흘러넘쳐요.' },
  { id: 'x_darkroof', part: '주', name: '검은 지붕으로 바꾸기', note: '어두운 지붕은 햇빛을 더 흡수해 지붕과 집 안이 더 뜨거워져요.' },
  { id: 'x_gutter', part: '주', name: '빗물받이에 낙엽 쌓아 두기', note: '빗물받이가 막히면 큰비에 물이 넘쳐 집 둘레에 고여요.' }
];

/* 점수: 폭염일·집중호우일의 점검 하나를 통과하면 10점, 예측 문제를 맞히면 10점,
   남은 시간 6초마다 1점. 순위는 얻을 수 있는 점수 중 몇 %를 얻었는지로 정해요. */
const RANKS = [
  { min: 0.85, name: '기후 대비 전문가', icon: '🌳' },
  { min: 0.6, name: '기후 적응 탐험가', icon: '🌿' },
  { min: 0, name: '새싹 대비러', icon: '🌱' }
];

/* ---------- 게임 날씨 ---------- */
const WEATHER = {
  sunny: { name: '맑음', note: '평범한 여름날이에요. 밭에 물을 줘야 해요.' },
  cloudy: { name: '흐림', note: '구름이 끼어 햇볕이 조금 약해요. 그래도 밭에 물은 필요해요.' },
  heat: { name: '폭염', note: '하루 최고기온이 33℃ 이상인 무더운 날이에요. 그늘과 물이 중요해요.' },
  rain: { name: '비', note: '비가 와서 밭이 저절로 촉촉해져요.' },
  storm: { name: '집중호우', note: '짧은 시간에 큰비가 내려요. 물이 잘 빠지지 않으면 뿌리가 상할 수 있어요.' }
};

/* ---------- 몸 색 · 동물 친구 ---------- */
const BODY_COLORS = [
  { id: 'peach', name: '복숭아', fill: '#FFD9C7', stroke: '#E8A893', feet: '#F29A8E' },
  { id: 'berry', name: '딸기우유', fill: '#FFCEDB', stroke: '#E79AAE', feet: '#EE8AA3' },
  { id: 'lemon', name: '레몬', fill: '#FFF0B3', stroke: '#E1C66A', feet: '#F2B866' },
  { id: 'sky', name: '하늘', fill: '#CFE8FA', stroke: '#8DBFDF', feet: '#7FA9E0' },
  { id: 'mint', name: '민트', fill: '#CDEFDD', stroke: '#86C9A6', feet: '#7BBF9A' },
  { id: 'lilac', name: '라벤더', fill: '#E4D8FA', stroke: '#A995D9', feet: '#A58BE0' }
];
const PETS = {
  bee: { name: '붕붕', kind: '꿀벌', role: '밭의 꽃가루받이 도우미' },
  otter: { name: '퐁당', kind: '아기 수달', role: '물과 비 소식 알림이' },
  hedgehog: { name: '도토리', kind: '고슴도치', role: '흙과 재료 찾기 도우미' }
};

/* ---------- 마을 주민 ---------- */
const NPCS = {
  researcher: { name: '구름 연구원', role: '기후 연구소', x: 245, y: 300 },
  grandma: { name: '들깨 할머니', role: '농부', x: 566, y: 512 },
  chef: { name: '보글 요리사', role: '공동 부엌', x: 595, y: 298 },
  tailor: { name: '실타래 재단사', role: '재봉 공방', x: 922, y: 298 },
  builder: { name: '뚝딱 목수', role: '목공소', x: 1062, y: 566 }
};

/* ---------- 아이템 ---------- */
const ITEMS = {
  seed_lettuce: { name: '상추 씨앗', cat: 'seed', crop: 'lettuce' },
  seed_soy: { name: '콩 씨앗', cat: 'seed', crop: 'soy' },
  seed_sweet: { name: '고구마 순', cat: 'seed', crop: 'sweet' },
  seed_sorghum: { name: '수수 씨앗', cat: 'seed', crop: 'sorghum' },
  seed_rice: { name: '볍씨(모)', cat: 'seed', crop: 'rice' },
  lettuce: { name: '상추', cat: 'crop' },
  soy: { name: '콩', cat: 'crop' },
  sweet: { name: '고구마', cat: 'crop' },
  sorghum: { name: '수수', cat: 'crop' },
  rice: { name: '쌀', cat: 'crop' },
  straw: { name: '볏짚', cat: 'raw' },
  cotton: { name: '목화솜', cat: 'raw' },
  ramie: { name: '모시풀', cat: 'raw' },
  wool: { name: '양털', cat: 'raw' },
  pet: { name: '페트병', cat: 'raw' },
  net: { name: '폐어망', cat: 'raw' },
  wood: { name: '나무', cat: 'raw' },
  sapling: { name: '나무 묘목', cat: 'raw' },
  bamboo: { name: '대나무', cat: 'raw' },
  earth: { name: '흙', cat: 'raw' },
  sand: { name: '모래', cat: 'raw' },
  stone: { name: '돌', cat: 'raw' },
  metal: { name: '고철', cat: 'raw' },
  greenhouse_kit: { name: '온실 키트', cat: 'tool' }
};
const ITEM_CATS = { seed: '씨앗', crop: '농작물', dish: '요리', raw: '재료', fabric: '원단', part: '집 부품', tool: '도구' };

/* ---------- QUEST · 밭 ----------
   heat: low = 폭염에 차양이 꼭 필요 / mid = 폭염에 물이 두 배로 필요 / high = 더위에 강함
   wet: true = 집중호우에 두둑·배수나 온실이 필요 / 'flower' = 꽃 필 무렵(2단계 이상)부터 필요 */
const CROPS = {
  lettuce: { name: '상추', days: 3, heat: 'low', wet: true, yield: 3,
    tip: '서늘한 날씨를 좋아해요(생육 적온 15–20℃). 더우면 꽃대가 빨리 올라와 잎을 거두기 어려워져요.' },
  soy: { name: '콩', days: 4, heat: 'mid', wet: true, yield: 3,
    tip: '꽃이 피고 꼬투리가 생길 때 물을 많이 먹어요. 물이 고이는 것은 싫어해요.' },
  sweet: { name: '고구마', days: 4, heat: 'high', wet: true, yield: 2,
    tip: '따뜻한 날씨를 좋아하고 더위와 가뭄에 강한 편이지만, 물이 고이면 덩이뿌리가 상하기 쉬워요.' },
  sorghum: { name: '수수', days: 4, heat: 'high', wet: 'flower', yield: 3,
    tip: '더위와 가뭄에 강한 편이에요. 꽃 필 무렵 비가 오래 오면 열매가 잘 안 맺혀요.' },
  rice: { name: '벼', days: 5, heat: 'mid', wet: false, paddy: true, yield: 3,
    tip: '물을 댄 논에서 자라요. 큰비에도 비교적 견디지만 자라는 데 오래 걸려요. 거두면 볏짚도 생겨요.' }
};
const FARM_RULES = [
  '물: 맑음·흐림·폭염인 날에는 물을 줘야 자라요. 비·집중호우는 저절로 물이 돼요.',
  '폭염: 차양이 없으면 물이 두 배로 말라요. 상추는 차양이 꼭 필요해요. 고구마·수수는 더위에 강해요.',
  '멀칭(볏짚 덮기): 흙이 덜 말라 물 준 효과가 하루 더 가요.',
  '집중호우: 두둑·배수로나 온실이 없으면 물에 약한 작물이 상해요.',
  '온실: 큰비는 막지만, 폭염 날 차양 없이 닫혀 있으면 너무 뜨거워져요.',
  '사흘 연속 힘들면 작물이 시들어요. 이 규칙은 학습용 단순화예요.'
];

/* ---------- QUEST · 부엌 ---------- */
const RECIPES = [
  { id: 'rice_bowl', name: '흰쌀밥', cat: '밥', needs: { rice: 1 }, color: '#FFFFFF' },
  { id: 'soy_rice', name: '콩밥', cat: '밥', needs: { rice: 1, soy: 1 }, color: '#F4ECD8' },
  { id: 'sorghum_rice', name: '수수밥', cat: '밥', needs: { rice: 1, sorghum: 1 }, color: '#E8C9C0' },
  { id: 'kongguk', name: '시원한 콩국', cat: '국', needs: { soy: 2 }, color: '#F6EFD9' },
  { id: 'lettuce_salad', name: '상추겉절이', cat: '반찬', needs: { lettuce: 2 }, color: '#8FCB6E' },
  { id: 'ssam', name: '상추쌈과 쌈장', cat: '반찬', needs: { lettuce: 1, soy: 1 }, color: '#7DBE62' },
  { id: 'jeon', name: '고구마수수전', cat: '반찬', needs: { sweet: 1, sorghum: 1 }, color: '#E9B26A' },
  { id: 'steamed_sweet', name: '찐 고구마', cat: '간식', needs: { sweet: 1 }, color: '#B5677F' },
  { id: 'bukkumi', name: '수수부꾸미', cat: '간식', needs: { sorghum: 2 }, color: '#C98D86' }
];
const TABLE_SLOTS = 4;

/* ---------- QUEST · 재봉 ----------
   props 0~3: breath 통기, absorb 흡습(땀 흡수), dry 속건, warm 보온, water 발수, uv 자외선 가림
   일반적인 경향이에요. 실제 성능은 실의 굵기·짜임·두께·가공에 따라 달라요. */
const FIBERS = {
  cotton: { name: '면', from: { cotton: 2 }, props: { breath: 2, absorb: 3, dry: 1, warm: 1, water: 0, uv: 1 },
    desc: '목화솜에서 뽑은 실이에요. 땀을 잘 흡수하지만 늦게 말라요.' },
  ramie: { name: '모시', from: { ramie: 2 }, props: { breath: 3, absorb: 3, dry: 2, warm: 0, water: 0, uv: 1 },
    desc: '모시풀 줄기 껍질에서 얻은 섬유예요. 바람이 잘 통하고 몸에 덜 달라붙어요.' },
  wool: { name: '양모', from: { wool: 2 }, props: { breath: 2, absorb: 2, dry: 1, warm: 3, water: 1, uv: 2 },
    desc: '양털 섬유예요. 섬유 사이에 공기를 품어 따뜻해요.' },
  lyocell: { name: '리오셀', from: { wood: 2 }, props: { breath: 2, absorb: 3, dry: 2, warm: 1, water: 0, uv: 1 },
    desc: '나무 펄프를 녹여 다시 뽑은 섬유예요. 부드럽고 땀을 잘 흡수해요.' },
  rpet: { name: '재생 폴리에스터', from: { pet: 3 }, props: { breath: 2, absorb: 1, dry: 3, warm: 1, water: 1, uv: 2 },
    desc: '페트병을 녹여 다시 뽑은 섬유예요. 물을 적게 머금어 빨리 말라요.' },
  rnylon: { name: '재생 나일론(발수 가공)', from: { net: 2 }, props: { breath: 1, absorb: 0, dry: 3, warm: 1, water: 3, uv: 2 },
    desc: '폐어망에서 얻은 나일론에 물을 튕기는 가공을 했어요. 비에는 강하지만 바람은 덜 통해요.' }
};
const WEAVES = {
  plain: { name: '보통 짜임', mod: {} },
  dense: { name: '촘촘한 짜임', mod: { uv: 1, breath: -1, warm: 1 } },
  mesh: { name: '성근 그물 짜임', mod: { breath: 1, uv: -1, warm: -1 } }
};
const TOPS = {
  tee: { name: '오버핏 티', note: '헐렁해서 몸과 옷 사이로 바람이 지나가요.', breath: 1, cover: 0 },
  shirt: { name: '반팔 셔츠', note: '앞을 여닫아 환기할 수 있어요.', breath: 0.5, cover: 0.5 },
  raincoat: { name: '우비', note: '몸 전체를 덮어 비를 막지만 덥고 답답할 수 있어요.', breath: -1, cover: 1, rain: 2 },
  cardigan: { name: '겹옷(가디건)', note: '얇은 옷을 겹쳐 입고 벗으며 온도를 맞춰요.', breath: 0, cover: 1, cool: 1.5 }
};
const DETAILS = {
  mesh: { name: '통풍 그물 패널', heat: 1, note: '옆구리로 더운 공기와 습기가 빠져요.' },
  sleeves: { name: '쿨토시', sun: 1, note: '팔을 덮어 햇볕을 가려요.' },
  hood: { name: '후드', rain: 1, note: '머리로 들이치는 비를 막아요.' },
  scarf: { name: '쿨스카프', heat: 0.5, sun: 0.5, note: '목 뒤를 가려 햇볕을 막아요.' }
};
const HATS = {
  none: { name: '모자 없음' },
  sunhat: { name: '챙 넓은 모자', heat: 1, sun: 1 },
  cap: { name: '캡 모자', sun: 0.5 },
  rainhat: { name: '비 모자', rain: 1 },
  beanie: { name: '털모자', cool: 1, heat: -1 }
};
const SHOES = {
  none: { name: '맨발' },
  sandals: { name: '샌들', heat: 0.5, rain: -0.5 },
  sneakers: { name: '운동화' },
  boots: { name: '장화', rain: 1.5, heat: -0.5 }
};
const CLOTH_COLORS = [
  { id: 'white', name: '흰색', fill: '#FFFFFF', stroke: '#C5D0DA', light: true },
  { id: 'sky', name: '하늘색', fill: '#D3EAF8', stroke: '#8DBFDF', light: true },
  { id: 'yellow', name: '노란색', fill: '#FFE27A', stroke: '#E0B83A', light: true },
  { id: 'lime', name: '연두색', fill: '#D6F0B5', stroke: '#9CC46A', light: true },
  { id: 'pink', name: '분홍색', fill: '#FFD0DC', stroke: '#E59AAE', light: true },
  { id: 'navy', name: '남색', fill: '#3E5C8A', stroke: '#2C4466', light: false },
  { id: 'forest', name: '짙은 초록', fill: '#3F7A5A', stroke: '#2C5A41', light: false }
];
const CLOTH_NOTES = [
  '밝은색 옷은 햇빛의 열을 덜 흡수하고, 진한색 옷은 자외선을 더 많이 흡수해 가리는 편이에요.',
  '같은 원단이라도 촘촘하게 짜면 햇볕을 더 막고, 성글게 짜면 바람이 더 잘 통해요.',
  '옷 점수는 학습용 비교 규칙이에요. 실제 성능은 원단 규격과 입는 환경에 따라 달라요.'
];

/* ---------- QUEST · 목공 · 집 ---------- */
const PARTS = {
  raised_base: { name: '돌 기초(높임)', slot: 'base', from: { stone: 3 }, note: '집 바닥을 땅에서 띄워 큰비에 물이 덜 들어와요.' },
  brick: { name: '흙벽돌 벽', slot: 'wall', from: { earth: 2, straw: 1 }, note: '두꺼운 흙벽은 열을 천천히 전해요. 물에는 약해 기초와 처마가 중요해요.' },
  timber: { name: '나무 벽', slot: 'wall', from: { wood: 2 }, note: '나무는 자라며 탄소를 저장해요. 비와 습기 관리가 필요해요.' },
  metalwall: { name: '재활용 금속 벽', slot: 'wall', from: { metal: 2 }, note: '튼튼하고 다시 쓸 수 있지만 열이 잘 통해 단열재가 꼭 필요해요.' },
  glass: { name: '유리창', slot: 'window', from: { sand: 2 }, note: '빛을 들이지만 열도 쉽게 드나들어요.' },
  dglass: { name: '이중창', slot: 'window', from: { sand: 3 }, note: '유리 사이 공기층이 열의 이동을 줄여요.' },
  bamboo_shade: { name: '대나무 차양', slot: 'awning', from: { bamboo: 2 }, note: '창 밖에서 여름 햇빛을 막아요. 밭 차양으로도 써요.' },
  insulation: { name: '볏짚 단열재', slot: 'insulation', from: { straw: 2 }, note: '벽 속에 넣어 여름 더위와 겨울 추위를 함께 막아요.' },
  metalroof: { name: '밝은 금속 지붕', slot: 'roof', from: { metal: 2 }, note: '밝은 지붕은 햇빛을 반사해 지붕이 덜 뜨거워져요.' },
  woodroof: { name: '나무 지붕', slot: 'roof', from: { wood: 2 }, note: '따뜻한 느낌의 지붕이에요. 여름엔 색이 진해 더 달궈질 수 있어요.' },
  greenroof: { name: '옥상 정원', slot: 'roofTop', from: { earth: 2, straw: 1 }, note: '흙과 식물이 햇빛을 막고 빗물을 잠시 머금어요. 구조·방수 점검이 필요해요.' },
  solar: { name: '태양광 패널', slot: 'roofTop', reward: true, note: '햇빛으로 전기를 만들어요. 연구소에서 받을 수 있어요.' },
  rain_barrel: { name: '빗물 저금통', slot: 'yard', from: { metal: 1, wood: 1 }, note: '지붕 빗물을 모아 두었다가 밭이나 청소에 써요.' },
  shade_tree: { name: '그늘 나무', slot: 'yard', from: { sapling: 1 }, note: '나무 그늘과 잎의 증산이 주변을 시원하게 해요.' },
  rain_garden: { name: '빗물 정원', slot: 'yard', from: { earth: 2, stone: 1 }, note: '빗물을 잠시 모아 땅속으로 천천히 스며들게 해요.' },
  greenhouse_kit: { name: '온실 키트', slot: 'farm', from: { sand: 2, bamboo: 2 }, note: '밭 한 칸을 덮어 큰비를 막아요. 폭염엔 차양과 환기가 필요해요.' }
};
const HOUSE_NOTES = [
  '집 점검은 학습용 비교예요. 실제 집은 구조 안전, 방향, 단열 두께, 시공 품질까지 따져야 해요.',
  '흙벽돌 벽은 물에 약해서 기초를 높이고 빗물이 벽에 튀지 않게 하는 것이 중요해요.'
];

/* ---------- 1판의 재료 모으는 곳 (지금은 여울 상점에서 사요. 저장 자료와 맞추려고 남겨 둬요) ---------- */
const GATHER = {
  forest: { name: '숲', x: 96, y: 432, gives: { wood: 3, sapling: 1 }, note: '쓰러진 나무와 떨어진 가지만 모아요. 묘목은 다시 심을 거예요.' },
  recycle: { name: '재활용 정거장', x: 358, y: 420, gives: { pet: 3, metal: 2 }, note: '마을에서 모은 페트병과 고철을 다시 써요.' },
  straw: { name: '볏짚 더미', x: 612, y: 690, gives: { straw: 3 }, note: '벼를 거두고 남은 줄기를 말린 거예요.' },
  cotton: { name: '목화밭', x: 1010, y: 384, gives: { cotton: 3 }, note: '목화 꽃이 진 뒤 터진 꼬투리에서 솜을 따요.' },
  ramie: { name: '모시밭', x: 1206, y: 384, gives: { ramie: 3 }, note: '모시풀 줄기 껍질에서 섬유를 얻어요.' },
  sheep: { name: '목장 창고', x: 1150, y: 276, gives: { wool: 2 }, note: '봄에 털을 깎아 모아 둔 양털이에요.' },
  pond: { name: '연못가', x: 1062, y: 652, gives: { net: 2 }, note: '물가에 걸린 폐어망을 거둬요. 물속 생물도 안전해져요.' },
  bamboo: { name: '대나무 숲', x: 1222, y: 664, gives: { bamboo: 3 }, note: '빨리 자라는 대나무를 솎아 베어요.' },
  hill: { name: '흙 언덕', x: 952, y: 752, gives: { earth: 3, sand: 2, stone: 2 }, note: '언덕 아래 쌓인 흙·모래·돌을 모아요.' }
};

/* ---------- 이야기 ----------
   5분 미션에서는 주민이 짧은 도움말만 해요. */
const SCRIPTS = {};

/* 주민이 하는 짧은 도움말 */
const IDLE_LINES = {
  researcher: ['연구소에서 그래프를 읽고 예측 문제를 풀어요. 맞히면 예산을 더 받아요.', '폭염일수가 많은 시대일수록 대비 목표가 높아져요.'],
  grandma: ['폭염엔 더위에 강한 작물과 밭 차양이, 큰비엔 두둑과 배수로가 밭을 지켜요.', '비가림 온실은 큰비를 막지만, 폭염 날엔 차양을 함께 해야 속이 덜 뜨거워요.'],
  chef: ['여름엔 음식이 빨리 상해요. 냉장 보관은 폭염 대비예요.', '물을 자주 마시는 것도 폭염을 이기는 방법이에요.'],
  tailor: ['밝은색, 헐렁한 옷, 챙 넓은 모자가 더위를 덜어 줘요.', '큰비엔 발수 우비와 장화가 든든해요.'],
  builder: ['창 바깥 차양과 밝은 지붕은 햇볕을 집 밖에서 막아요.', '높인 기초와 빗물 정원은 집중호우에 물이 덜 들어오게 해요.']
};

/* ---------- 퀘스트 ----------
   era: 시대(1·2·3), stage: 단계(predict·prepare·live·review)
   step.stat: 이 시대 기록의 값(forecast·started·done·next), place: 지도에서 별로 알려 줄 곳 */
const QUESTS = [1, 2, 3].flatMap(era => {
  const t = ['2030년대', '2050년대', '2090년대'][era - 1];
  return [
    { id: 'p' + era, era, stage: 'predict', title: `${t} 여름 예측하기`, reward: 0, steps: [{ text: '기후 연구소에서 예측 문제 풀기', stat: 'forecast', goal: 1, place: 'lab' }] },
    { id: 'v' + era, era, stage: 'prepare', title: `${t} 의·식·주 대비하기`, reward: 0, steps: [{ text: '여울 상점에서 대비 용품을 사고 「여름 맞이하기」 누르기', stat: 'started', goal: 1, place: 'shop' }] },
    { id: 'l' + era, era, stage: 'live', title: `${t} 여름 5일 살아 보기`, reward: 0, steps: [{ text: '여름 5일이 지나가는 동안 점검 결과를 봐요', stat: 'done', goal: 1, place: null }] },
    { id: 'r' + era, era, stage: 'review', title: `${t} 돌아보기`, reward: 0, steps: [{ text: era < 3 ? '결과를 보고 다음 시대로 가기' : '결과를 보고 최종 점수 확인하기', stat: 'next', goal: 1, place: null }] }
  ];
}).concat([
  { id: 'end', era: 3, stage: 'review', title: '미션 완료! 친구들과 비교하기', reward: 0, steps: [{ text: '최종 결과를 보고, 학급 광장에서 친구 섬과 비교해요', stat: 'never', goal: 1, place: 'board' }] }
]);
