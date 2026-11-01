/* 실시간 워드클라우드 서버 연결 정보.
   공개용 키(publishable)라서 웹페이지에 넣어도 됩니다. 관리자 키는 절대 넣지 않습니다. */
const WC_URL = 'https://bvhabbtwryzytodbbxjl.supabase.co';
const WC_KEY = 'sb_publishable_Dc9JsS9y1_bXZ-OfZdSMUg_SztVOaEH';

async function wcRpc(name, body) {
  const res = await fetch(`${WC_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: WC_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`server ${res.status}`);
  return res.json();
}
