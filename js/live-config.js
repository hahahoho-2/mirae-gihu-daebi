/* ==========================================================================
   실시간 학급 광장 설정 — 선생님이 한 번만 채워요
   - 비워 두면 실시간 광장은 꺼지고, 지금처럼 섬 코드로만 광장에 모여요.
   - 채우는 방법은 「실시간광장_안내.md」 3단계를 보세요.
   - apiKey와 databaseURL은 비밀번호가 아니에요. 학생 기기를 지키는 것은
     Firebase 콘솔에 붙여 넣는 보안 규칙(firebase-rules.json)이에요.
   ========================================================================== */
const LIVE_CONFIG = {
  // Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에 나오는 apiKey
  // 예: 'AIzaSyD-예시예시예시예시예시예시예시'
  apiKey: '',
  // Realtime Database 화면 맨 위에 나오는 주소
  // 예: 'https://yeoul-plaza-default-rtdb.asia-southeast1.firebasedatabase.app'
  databaseURL: ''
};
