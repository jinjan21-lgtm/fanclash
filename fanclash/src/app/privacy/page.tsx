import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '개인정보 처리방침' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
          &larr; FanClash
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">개인정보 처리방침</h1>
        <p className="text-sm text-gray-500 mb-8">시행일: 2026년 3월 14일</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 수집하는 개인정보 항목</h2>
            <p className="mb-2">FanClash(이하 &quot;서비스&quot;)는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>이메일 주소 (회원가입 및 로그인)</li>
              <li>닉네임 (서비스 내 식별)</li>
              <li>결제정보 (유료 구독 결제 시, Toss Payments를 통해 처리)</li>
              <li>서비스 이용 기록, 접속 로그, IP 주소 (자동 수집)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 개인정보 수집 및 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>서비스 제공: 위젯 생성, 외부 플랫폼 연동, OBS 오버레이 기능 제공</li>
              <li>결제 처리: 유료 구독 플랜의 결제 및 환불 처리</li>
              <li>고객 지원: 문의 응대, 서비스 장애 안내</li>
              <li>서비스 개선: 이용 통계 분석, 기능 개선</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <p className="mb-2">
              회원 탈퇴 시 수집된 개인정보는 즉시 파기합니다. 다만, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>전자상거래 등에서의 소비자 보호에 관한 법률: 계약 또는 청약 철회 기록 5년, 대금 결제 및 재화 등의 공급 기록 5년</li>
              <li>통신비밀보호법: 접속 로그 기록 3개월</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. 개인정보의 제3자 제공</h2>
            <p className="mb-2">서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우 예외로 합니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>
                <span className="text-gray-300">Supabase</span>: 데이터 호스팅 및 인증 처리 (이메일, 사용자 데이터)
              </li>
              <li>
                <span className="text-gray-300">Toss Payments</span>: 유료 서비스 결제 처리 (결제 정보)
              </li>
              <li>법령에 의해 요구되는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. 개인정보 보호 조치</h2>
            <p>서비스는 이용자의 개인정보를 안전하게 보호하기 위해 다음과 같은 조치를 취합니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mt-2">
              <li>모든 데이터 전송 시 SSL/TLS 암호화 적용</li>
              <li>비밀번호 등 민감 정보의 단방향 암호화 저장</li>
              <li>개인정보 접근 권한을 최소 인원으로 제한</li>
              <li>정기적인 보안 점검 실시</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. 이용자의 권리와 행사 방법</h2>
            <p className="mb-2">이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
            </ul>
            <p className="mt-2">
              위 요청은 서비스 내 설정 페이지 또는 아래 연락처를 통해 접수할 수 있으며, 요청 접수 후 지체 없이 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. 쿠키 사용</h2>
            <p>
              서비스는 인증 세션 유지를 위해 쿠키를 사용합니다. 쿠키는 로그인 상태를 유지하고 보안을 강화하는 데 사용되며,
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키를 거부할 경우 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. 개인정보 보호책임자</h2>
            <p>개인정보 보호와 관련한 문의, 불만 처리 등을 위해 아래와 같이 개인정보 보호책임자를 지정합니다.</p>
            <div className="mt-3 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p>이메일: <a href="mailto:support@fanclash.co.kr" className="text-purple-400 hover:text-purple-300">support@fanclash.co.kr</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. 개인정보 처리방침 변경</h2>
            <p>
              본 개인정보 처리방침은 법령, 정책 또는 서비스 변경 사항을 반영하기 위해 수정될 수 있습니다.
              변경 시 서비스 내 공지사항 또는 이메일을 통해 사전에 안내합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
