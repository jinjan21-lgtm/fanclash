import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '이용약관' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
          &larr; FanClash
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">이용약관</h1>
        <p className="text-sm text-gray-500 mb-8">시행일: 2026년 3월 14일</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 FanClash(이하 &quot;회사&quot;)가 제공하는 스트리밍 오버레이 위젯 서비스(이하 &quot;서비스&quot;)의
              이용 조건 및 절차, 회사와 회원 간의 권리·의무·책임 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                <span className="text-gray-300">&quot;서비스&quot;</span>: 회사가 제공하는 스트리밍 방송용 인터랙티브 오버레이 위젯 플랫폼으로,
                외부 도네이션 플랫폼(투네이션, 스트림랩스, 틱톡, 치지직, 숲 등)의 후원 이벤트를 감지하여
                OBS 등 방송 소프트웨어에 표시하는 위젯을 제공하는 서비스를 말합니다.
              </li>
              <li>
                <span className="text-gray-300">&quot;회원&quot;</span>: 본 약관에 동의하고 서비스에 가입하여 이용 계약을 체결한 자를 말합니다.
              </li>
              <li>
                <span className="text-gray-300">&quot;위젯&quot;</span>: 서비스를 통해 생성되어 OBS 브라우저 소스로 표시되는
                인터랙티브 오버레이 요소(랭킹, 왕좌, 배틀, 호감도, 목표, 룰렛 등)를 말합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제3조 (서비스 내용)</h2>
            <p className="mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>외부 도네이션 플랫폼의 후원 이벤트 실시간 감지</li>
              <li>OBS 오버레이 위젯 생성 및 커스터마이징</li>
              <li>후원 랭킹, 왕좌 쟁탈전, 배틀, 호감도, 목표, 룰렛 등 인터랙티브 위젯 제공</li>
              <li>후원 통계 및 분석 기능</li>
            </ul>
            <p className="mt-3 bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-400">
              본 서비스는 외부 도네이션 플랫폼의 이벤트를 감지하여 위젯으로 표시하는 기능을 제공하며,
              직접적인 결제 중개나 도네이션 처리를 수행하지 않습니다. 도네이션 관련 사항은 해당 외부 플랫폼의 약관을 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제4조 (회원 가입 및 탈퇴)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>회원 가입은 이메일 인증 또는 소셜 로그인(Google 등)을 통해 이루어집니다.</li>
              <li>회원은 서비스 내 설정 페이지에서 언제든지 탈퇴를 요청할 수 있습니다.</li>
              <li>탈퇴 시 회원의 개인정보 및 서비스 데이터는 즉시 삭제됩니다. 단, 관련 법령에 따라 보관이 필요한 정보는 해당 기간 동안 보관됩니다.</li>
              <li>탈퇴 후 동일 이메일로 재가입이 가능하나, 이전 데이터는 복구되지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제5조 (유료 서비스 및 환불)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>서비스는 무료 플랜과 유료 구독 플랜을 제공하며, 유료 플랜의 요금 및 제공 기능은 서비스 내 요금제 페이지에서 확인할 수 있습니다.</li>
              <li>유료 구독의 결제는 Toss Payments를 통해 처리됩니다.</li>
              <li>회원은 결제일로부터 7일 이내에 청약을 철회할 수 있으며, 이 경우 결제 금액 전액이 환불됩니다.</li>
              <li>7일이 경과한 후에는 잔여 이용 기간에 비례하여 환불하며, 이미 이용한 기간에 대한 요금은 공제됩니다.</li>
              <li>구독은 해당 결제 주기가 끝날 때까지 유효하며, 갱신일 전에 해지하면 다음 결제가 이루어지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제6조 (금지 행위)</h2>
            <p className="mb-2">회원은 서비스 이용 시 다음 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>다른 회원이나 제3자의 개인정보를 무단으로 수집·저장·유포하는 행위</li>
              <li>타인을 사칭하여 서비스를 이용하는 행위</li>
              <li>서비스를 이용하여 불법적인 콘텐츠를 제작·유포하는 행위</li>
              <li>서비스의 소스 코드를 무단으로 복제·변경·역컴파일하는 행위</li>
              <li>서비스를 상업적으로 재판매하거나 무단으로 제3자에게 제공하는 행위</li>
              <li>기타 관련 법령에 위반되는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제7조 (면책 사항)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>
                회사는 투네이션, 스트림랩스, 틱톡, 치지직, 숲 등 외부 플랫폼의 서비스 장애, API 변경, 접속 불가 등으로 인한
                서비스 이용 제한에 대해 책임을 지지 않습니다.
              </li>
              <li>회사는 천재지변, 전쟁, 기간통신 사업자의 서비스 중단 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>회원의 귀책 사유로 인한 서비스 이용 장애에 대해서는 회사가 책임을 지지 않습니다.</li>
              <li>회사는 회원이 서비스를 통해 얻은 기대 수익이나 손실에 대해 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제8조 (지적 재산권)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>서비스의 디자인, 소스 코드, 위젯 템플릿, 로고 및 관련 콘텐츠에 대한 지적 재산권은 회사에 귀속됩니다.</li>
              <li>회원은 서비스를 통해 제공되는 콘텐츠를 개인 방송 목적으로만 사용할 수 있으며, 회사의 사전 동의 없이 복제·배포·전시·전송할 수 없습니다.</li>
              <li>회원이 서비스 내에서 직접 설정하거나 업로드한 콘텐츠에 대한 권리는 해당 회원에게 귀속됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제9조 (분쟁 해결)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>본 약관과 서비스 이용에 관한 분쟁은 대한민국 법률을 적용합니다.</li>
              <li>서비스 이용과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는 민사소송법에 따른 관할 법원에 소를 제기할 수 있습니다.</li>
              <li>회사와 회원은 분쟁 발생 시 상호 협의하여 원만히 해결하도록 노력합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">부칙</h2>
            <p>본 약관은 2026년 3월 14일부터 시행합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
