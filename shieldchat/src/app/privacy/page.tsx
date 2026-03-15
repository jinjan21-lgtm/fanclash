export const metadata = { title: '개인정보처리방침' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">개인정보처리방침</h1>
        <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white">1. 수집하는 개인정보</h2>
            <p>ShieldChat은 서비스 제공을 위해 다음 정보를 수집합니다:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>이메일 주소 (회원가입 및 로그인)</li>
              <li>닉네임 (선택)</li>
              <li>사용자가 입력한 댓글 데이터</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">2. 개인정보 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 제공 및 회원 관리</li>
              <li>악성 댓글 분석 및 증거 보존</li>
              <li>서비스 개선</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">3. 보유 기간</h2>
            <p>
              회원 탈퇴 시 개인정보는 즉시 파기됩니다.
              단, 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">4. 문의</h2>
            <p>개인정보 관련 문의: support@shieldchat.kr</p>
          </section>
        </div>
      </div>
    </div>
  );
}
