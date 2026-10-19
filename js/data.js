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

/* ---------- 재료 모으는 곳 (하루에 한 번씩) ---------- */
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
   s: 말하는 사람(researcher/grandma/chef/tailor/builder/pet/me)
   {name}{pet}{region}{scenario}{chapter}{heatNow}{heatBase}{tempNow}{tempBase} 는 게임 속 값으로 바뀌어요. */
const SCRIPTS = {
  'researcher.intro': [
    { s: 'researcher', t: '어서 와요, {name}! 저는 여울섬 기후 연구소의 구름 연구원이에요.' },
    { s: 'researcher', t: '여울섬은 앞으로 여름이 점점 더워질 거예요. 그래서 섬 사람들의 먹고, 입고, 사는 방식도 미리 준비해야 해요.' },
    { s: 'researcher', t: '먼저 우리 섬과 기후가 비슷한 곳을 골라 볼까요? 기상청 전망 자료를 가져올게요.',
      choices: [{ t: '용인시 (내륙)', set: { region: '용인시' } }, { t: '서울특별시 (도시)', set: { region: '서울특별시' } }] },
    { s: 'researcher', t: '미래 기후는 사람들이 온실가스를 얼마나 줄이느냐에 따라 달라져요. 어떤 미래를 탐험할까요?',
      choices: [{ t: '저탄소 미래 (SSP1-2.6)', set: { scenario: 'low' } }, { t: '고탄소 미래 (SSP5-8.5)', set: { scenario: 'high' } }] },
    { s: 'researcher', t: '{region}의 {scenario} 자료예요. {chapter}의 폭염일수는 한 해 평균 {heatNow}일, 기준 시기(2000–2019)는 {heatBase}일이었어요.' },
    { s: 'researcher', t: '퀴즈! 폭염일수는 어떤 날을 센 걸까요?',
      quiz: { options: ['하루 최고기온이 33℃ 이상인 날', '하루 평균기온이 30℃ 이상인 날', '밤 최저기온이 25℃ 이상인 날'], answer: 0,
        right: '맞아요! 하루 최고기온이 33℃ 이상인 날이에요. 밤에도 25℃ 이상인 날은 열대야라고 따로 세요.',
        wrong: '아쉬워요. 폭염일은 하루 최고기온이 33℃ 이상인 날이에요. 밤 최저기온이 25℃ 이상인 날은 열대야예요.' } },
    { s: 'researcher', t: '이 숫자로 게임 속 여름 날씨를 정해요. 폭염일이 많을수록 무더운 날이 자주 와요. 물론 진짜 날씨 예보는 아니에요.' },
    { s: 'pet', t: '{name}, 날씨는 화면 위쪽에 보여! 폭염이나 집중호우가 오면 내가 알려 줄게.' },
    { s: 'researcher', t: '그럼 아래쪽 밭에 계신 들깨 할머니를 찾아가 보세요. 먹거리부터 준비해야죠!', action: 'questDone' }
  ],
  'grandma.intro': [
    { s: 'grandma', t: '아이고, 반가워요. 올여름은 유난히 덥다지요? 그래서 씨앗을 고르는 것부터가 중요해요.' },
    { s: 'grandma', t: '씨앗과 대나무 차양, 볏짚을 조금 나눠 줄게요. 밭에서 써 봐요.', action: 'give', give: { seed_lettuce: 3, seed_soy: 2, seed_sweet: 2, seed_sorghum: 2, seed_rice: 1, bamboo_shade: 2, straw: 3 } },
    { s: 'grandma', t: '상추는 서늘한 걸 좋아해서 폭염엔 차양이 꼭 있어야 해요. 고구마랑 수수는 더위에 강하지만 물이 고이면 안 좋아요.' },
    { s: 'grandma', t: '퀴즈를 하나 낼게요. 흙 위에 볏짚을 덮어 주면 무엇이 좋을까요?',
      quiz: { options: ['흙의 물이 덜 말라요', '작물이 두 배로 빨리 자라요', '비가 오지 않게 막아 줘요'], answer: 0,
        right: '그렇지요! 볏짚을 덮으면(멀칭) 햇볕과 바람에 흙 속 물이 덜 날아가요.',
        wrong: '음, 볏짚을 덮는 멀칭은 흙 속 물이 덜 마르게 해 줘요. 작물이 갑자기 빨리 자라거나 비를 막지는 않아요.' } },
    { s: 'grandma', t: '밭에 씨앗을 심고 물을 준 다음, 화면 오른쪽 아래 「하루 보내기」로 하루씩 키워 봐요. 날씨를 꼭 살피고요!', action: 'questStep' }
  ],
  'grandma.done': [
    { s: 'grandma', t: '어머나, 첫 수확이네요! 날씨에 맞춰 돌보니 작물이 잘 버텼어요.' },
    { s: 'grandma', t: '선물로 온실 키트를 줄게요. 큰비를 막아 주지만, 폭염 날엔 차양 없이 닫아 두면 속이 아주 뜨거워지니 조심해요.', action: 'give', give: { greenhouse_kit: 1 } },
    { s: 'grandma', t: '거둔 작물은 위쪽 공동 부엌의 보글 요리사에게 가져가 봐요.', action: 'questDone' }
  ],
  'chef.intro': [
    { s: 'chef', t: '보글보글! 공동 부엌에 온 걸 환영해요. 밭에서 거둔 재료로 한 끼를 차려 볼까요?' },
    { s: 'chef', t: '여름엔 음식이 금방 상할 수 있어요. 특히 폭염인 날 가방에 넣어 둔 요리는 밤사이 상해 버려요.' },
    { s: 'chef', t: '그러니 만든 요리는 바로 식탁에 차리거나 부엌 냉장고에 넣어 두세요.' },
    { s: 'chef', t: '요리를 두 번 하고, 식탁에 세 가지 이상 차려 봐요. 밥, 국, 반찬을 골고루요!', action: 'questStep' }
  ],
  'chef.done': [
    { s: 'chef', t: '와, 근사한 식탁이네요! 우리 섬에서 기른 재료로 차린 밥상이라 더 든든해요.' },
    { s: 'chef', t: '이번엔 더운 날 입을 옷이 필요하겠어요. 오른쪽 재봉 공방의 실타래 재단사를 찾아가 봐요.', action: 'questDone' }
  ],
  'tailor.intro': [
    { s: 'tailor', t: '어서 와요! 옷은 원단, 색, 모양에 따라 더위와 비를 견디는 힘이 달라요.' },
    { s: 'tailor', t: '목화밭, 모시밭, 목장 창고, 재활용 정거장, 연못가에서 섬유 재료를 모을 수 있어요. 시작용으로 목화솜을 조금 줄게요.', action: 'give', give: { cotton: 2 } },
    { s: 'tailor', t: '퀴즈! 햇볕이 쨍쨍한 폭염 날, 햇빛의 열을 덜 흡수하는 옷 색은?',
      quiz: { options: ['밝은색', '진한색', '색은 상관없어요'], answer: 0,
        right: '맞아요! 밝은색은 햇빛을 더 많이 반사해요. 대신 자외선은 진한색이 더 잘 가리는 편이라 모자와 소매로 보완해요.',
        wrong: '밝은색이 햇빛을 더 많이 반사해 열을 덜 흡수해요. 대신 자외선은 진한색이 더 잘 가리는 편이에요.' } },
    { s: 'tailor', t: '재료로 원단을 두 개 만들고, 폭염에 시원한 옷(더위 ★3 이상)을 디자인해서 입어 봐요.', action: 'questStep' }
  ],
  'tailor.done': [
    { s: 'tailor', t: '정말 잘 어울려요! 옷장에 옷이 하나씩 늘어나는 걸 보니 뿌듯하네요.' },
    { s: 'tailor', t: '비 오는 날 옷도 만들어 보세요. 마지막으로 집이 남았어요. 오른쪽 아래 목공소의 뚝딱 목수에게 가 봐요!', action: 'questDone' }
  ],
  'builder.intro': [
    { s: 'builder', t: '뚝딱뚝딱! 집은 한 번 지으면 수십 년을 써요. 그러니 앞으로 올 기후를 생각해서 지어야 해요.' },
    { s: 'builder', t: '숲, 대나무 숲, 흙 언덕, 재활용 정거장, 볏짚 더미에서 재료를 모아 목공소에서 부품을 만들어요. 돌 몇 개를 먼저 줄게요.', action: 'give', give: { stone: 3 } },
    { s: 'builder', t: '퀴즈! 여름 햇빛이 창으로 들어오기 전에 막으려면 어디에 가리개를 다는 게 좋을까요?',
      quiz: { options: ['창 바깥(차양)', '창 안쪽 커튼만', '지붕 위'], answer: 0,
        right: '맞아요! 창 바깥에서 막으면 햇빛의 열이 유리를 지나 방에 들어오기 전에 가려져요.',
        wrong: '창 바깥 차양이 좋아요. 안쪽 커튼은 이미 유리를 지나 들어온 열을 막기 어려워요.' } },
    { s: 'builder', t: '부품을 네 개 만들고, 내 집터에 벽·지붕·창을 놓아 집을 지어 봐요. 폭염과 집중호우 점검도 두 개씩 통과해 보고요.', action: 'questStep' }
  ],
  'builder.done': [
    { s: 'builder', t: '튼튼하고 시원한 집이 됐네요! 이제 여울섬에서 오래 살아갈 수 있겠어요.' },
    { s: 'builder', t: '연구소에서 태양광 패널을 나눠 준대요. 구름 연구원을 찾아가 봐요.', action: 'questDone' }
  ],
  'researcher.plaza': [
    { s: 'researcher', t: '{name}, 먹거리·옷·집을 모두 준비했군요! 연구소에서 태양광 패널을 선물할게요. 지붕에 달 수 있어요.', action: 'give', give: { solar: 1 } },
    { s: 'researcher', t: '친구들은 어떤 미래를 준비했을까요? 가운데 광장 게시판에서 내 섬 코드를 만들어 친구들과 나눠 봐요.' },
    { s: 'researcher', t: '학급 광장에 코드를 모으면 친구들의 아바타가 한곳에 모여요. 옷과 식탁, 집도 구경할 수 있어요.', action: 'questStep' }
  ],
  'researcher.chapter2': [
    // 첫 줄에서 시대를 바꿔야 다음 줄의 {heatNow}가 새 시대 값으로 나와요
    { s: 'researcher', t: '이제 시간을 앞으로 돌려 볼까요? 2050년대 여름으로 가요!', action: 'chapter' },
    { s: 'researcher', t: '{region}의 {scenario}에서 {chapter}의 폭염일수는 한 해 평균 {heatNow}일이에요. 기준 시기는 {heatBase}일이었어요.' },
    { s: 'pet', t: '밭에 차양이랑 볏짚을 넉넉히 챙겨 두자, {name}!' }
  ],
  'researcher.chapter3': [
    { s: 'researcher', t: '마지막 탐험, 2090년대 여름이에요. 이 시기는 어떤 미래를 골랐는지에 따라 차이가 아주 커요.', action: 'chapter' },
    { s: 'researcher', t: '{region}의 {scenario}에서 {chapter}의 폭염일수는 한 해 평균 {heatNow}일이에요. 기준 시기 {heatBase}일과 비교해 보세요.' },
    { s: 'researcher', t: '다른 미래를 고른 친구의 섬과 비교해 보면 재미있을 거예요.' }
  ],
  'researcher.free': [
    { s: 'researcher', t: '지금은 {chapter}예요. {region}의 {scenario} 폭염일수는 한 해 평균 {heatNow}일, 기준 시기는 {heatBase}일이에요.' },
    { s: 'researcher', t: '연구소에 들어오면 기후 자료를 자세히 볼 수 있어요.' }
  ]
};

/* 주민이 평소에 하는 말 (이야기가 없을 때) */
const IDLE_LINES = {
  researcher: ['연구소 안에서 미래 기후 자료를 볼 수 있어요.', '폭염일수가 늘면 밤에도 더운 열대야가 함께 늘어나는 경향이 있어요.'],
  grandma: ['폭염 날엔 아침이나 저녁에 물을 주는 게 좋아요. 한낮엔 금방 말라 버리거든요.', '큰비가 온다는 소식엔 두둑을 높이고 물길을 내 둬야 해요.'],
  chef: ['더운 날 남은 음식은 냉장고에 넣어야 해요.', '물을 자주 마시는 것도 폭염을 이기는 방법이에요.'],
  tailor: ['땀을 잘 흡수하는 원단과 빨리 마르는 원단은 서로 달라요. 원단 정보를 비교해 봐요.', '비 오는 날 옷은 발수가 되는 겉감과 장화가 든든해요.'],
  builder: ['단열재는 여름 더위와 겨울 추위를 함께 막아 줘요.', '빗물 저금통에 모은 물로 밭에 물을 줄 수도 있어요.']
};

/* ---------- 퀘스트 ---------- */
const QUESTS = [
  { id: 'lab', npc: 'researcher', title: '미래 기후 읽기', steps: [
    { text: '기후 연구소 앞의 구름 연구원과 이야기하기', talk: 'researcher', script: 'researcher.intro' }
  ] },
  { id: 'farm', npc: 'grandma', title: '기후에 맞는 밭 가꾸기', steps: [
    { text: '밭 옆의 들깨 할머니와 이야기하기', talk: 'grandma', script: 'grandma.intro' },
    { text: '밭에 씨앗 3곳 심기', stat: 'planted', goal: 3 },
    { text: '심은 밭에 물 주기 (3번)', stat: 'watered', goal: 3 },
    { text: '「하루 보내기」로 키워서 첫 수확하기', stat: 'harvests', goal: 1 },
    { text: '들깨 할머니께 수확 보여 드리기', talk: 'grandma', script: 'grandma.done' }
  ] },
  { id: 'kitchen', npc: 'chef', title: '오늘의 식탁 차리기', steps: [
    { text: '공동 부엌 앞의 보글 요리사와 이야기하기', talk: 'chef', script: 'chef.intro' },
    { text: '요리 2번 하기', stat: 'cooked', goal: 2 },
    { text: '식탁에 음식 3가지 이상 차리기', stat: 'tableCount', goal: 3 },
    { text: '보글 요리사에게 식탁 보여 주기', talk: 'chef', script: 'chef.done' }
  ] },
  { id: 'tailor', npc: 'tailor', title: '기후 옷장 채우기', steps: [
    { text: '재봉 공방 앞의 실타래 재단사와 이야기하기', talk: 'tailor', script: 'tailor.intro' },
    { text: '원단 2개 만들기', stat: 'fabricsMade', goal: 2 },
    { text: '폭염 대비 옷 만들기 (더위 ★3 이상)', stat: 'bestHeat', goal: 3 },
    { text: '만든 옷 입기 (옷장)', stat: 'wearing', goal: 1 },
    { text: '실타래 재단사에게 옷 보여 주기', talk: 'tailor', script: 'tailor.done' }
  ] },
  { id: 'house', npc: 'builder', title: '오래 살아갈 집 짓기', steps: [
    { text: '목공소 앞의 뚝딱 목수와 이야기하기', talk: 'builder', script: 'builder.intro' },
    { text: '목공소에서 부품 4개 만들기', stat: 'partsMade', goal: 4 },
    { text: '내 집터에 벽·지붕·창 놓기', stat: 'houseBuilt', goal: 1 },
    { text: '폭염 점검 2개, 집중호우 점검 2개 통과하기', stat: 'houseChecks', goal: 1 },
    { text: '뚝딱 목수에게 집 보여 주기', talk: 'builder', script: 'builder.done' }
  ] },
  { id: 'plaza', npc: 'researcher', title: '친구들과 섬 나누기', steps: [
    { text: '구름 연구원과 이야기하기', talk: 'researcher', script: 'researcher.plaza' },
    { text: '광장 게시판에서 내 섬 코드 만들기', stat: 'codeMade', goal: 1 },
    { text: '구름 연구원과 2050년대로 떠나기', talk: 'researcher', script: 'researcher.chapter2' }
  ] },
  { id: 'future', npc: 'researcher', title: '2050년대 여름 살아 보기', steps: [
    { text: '2050년대에 작물 3번 더 거두기', stat: 'chapterHarvests', goal: 3 },
    { text: '구름 연구원과 2090년대로 떠나기', talk: 'researcher', script: 'researcher.chapter3' }
  ] },
  { id: 'end', npc: null, title: '나만의 미래 섬 가꾸기', steps: [
    { text: '자유롭게 섬을 가꾸고 학급 광장에서 친구 섬과 비교하기', stat: 'never', goal: 1 }
  ] }
];
