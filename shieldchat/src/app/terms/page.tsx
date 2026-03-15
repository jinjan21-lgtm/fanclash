export const metadata = { title: '이용약관' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">이용약관</h1>
        <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white">제1조 (목적)</h2>
            <p>
              이 약관은 ShieldChat(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">제2조 (정의)</h2>
            <p>
              &quot;서비스&quot;란 크리에이터를 위한 악성 댓글 수집, 분석, 증거 보존 및 법적 대응 안내 플랫폼을 말합니다.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">제3조 (서비스 이용)</h2>
            <p>
              회원은 서비스를 통해 수집된 데이터의 정확성에 대해 스스로 책임을 집니다.
              서비스는 법률 자문을 제공하지 않으며, 법적 가이드는 일반적인 정보 제공 목적입니다.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">제4조 (면책)</h2>
            <p>
              서비스의 독성 분석 결과는 참고용이며, 법적 증거로서의 효력을 보장하지 않습니다.
              실제 법적 조치를 위해서는 전문 법률 상담을 받으시기 바랍니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
