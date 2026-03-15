export const metadata = { title: '법적 가이드' };

const guides = [
  {
    title: '사이버 명예훼손 신고 방법',
    icon: '🚔',
    content: [
      '경찰청 사이버수사대에 온라인 또는 방문 신고가 가능합니다.',
      '사이버범죄 신고시스템(ecrm.police.go.kr)에서 온라인 신고할 수 있습니다.',
      '가까운 경찰서 민원실 또는 사이버수사대에 직접 방문하여 신고할 수 있습니다.',
      '신고 시 피해 증거(스크린샷, URL, 작성자 정보)를 준비해주세요.',
    ],
  },
  {
    title: '정보통신망법 위반 신고',
    icon: '📋',
    content: [
      '정보통신망법 제70조: 사람을 비방할 목적으로 공공연하게 거짓의 사실을 드러내어 타인의 명예를 훼손하면 7년 이하의 징역, 10년 이하의 자격정지 또는 5,000만원 이하의 벌금에 처합니다.',
      '진실한 사실이라도 비방 목적이 있으면 3년 이하의 징역이나 3,000만원 이하의 벌금에 해당합니다.',
      '방송통신위원회 또는 한국인터넷진흥원(KISA)에 신고할 수 있습니다.',
      '불법정보 신고: 방송통신심의위원회 (www.kocsc.or.kr)',
    ],
  },
  {
    title: '고소장 작성 가이드',
    icon: '📝',
    content: [
      '고소장에는 다음 정보를 포함해야 합니다:',
      '1. 고소인(본인) 인적사항: 이름, 주소, 연락처',
      '2. 피고소인 정보: 닉네임, 계정 URL, 알려진 정보',
      '3. 고소 취지: 어떤 처벌을 원하는지 명시',
      '4. 고소 이유: 구체적인 피해 사실 기술',
      '5. 증거 자료: 스크린샷, 댓글 캡처, URL 목록',
      '6. 날짜 및 서명',
      '',
      'ShieldChat의 리포트를 증거 자료로 첨부하실 수 있습니다.',
    ],
  },
  {
    title: '증거 보존 방법',
    icon: '🔒',
    content: [
      '악성 댓글은 작성자가 삭제할 수 있으므로 발견 즉시 증거를 보존하세요.',
      '스크린샷: 날짜/시간이 포함된 전체 화면 캡처',
      'URL 기록: 해당 댓글의 정확한 URL을 저장',
      '작성자 정보: 닉네임, 프로필 URL, 가능한 경우 계정 정보',
      '웹 아카이브(web.archive.org)에 URL을 저장하면 제3자 증거가 됩니다.',
      'ShieldChat에 댓글을 등록하면 타임스탬프와 함께 자동 보존됩니다.',
    ],
  },
  {
    title: '유용한 링크',
    icon: '🔗',
    links: [
      { label: '경찰청 사이버수사대', url: 'https://ecrm.police.go.kr' },
      { label: '대한법률구조공단 (무료 법률 상담)', url: 'https://www.klac.or.kr' },
      { label: '방송통신심의위원회', url: 'https://www.kocsc.or.kr' },
      { label: '한국인터넷진흥원 (KISA)', url: 'https://www.kisa.or.kr' },
      { label: '디지털 성범죄 피해자 지원센터', url: 'https://d4u.stop.or.kr' },
      { label: '사이버폭력 예방 (방통위)', url: 'https://www.kcc.go.kr' },
    ],
  },
];

export default function LegalGuidePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">법적 대응 가이드</h1>
      <p className="text-gray-400 text-sm mb-8">
        악성 댓글에 대한 법적 대응 방법을 안내합니다. 구체적인 법률 상담은 변호사에게 문의하세요.
      </p>

      <div className="grid gap-6">
        {guides.map((guide) => (
          <div key={guide.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{guide.icon}</span>
              <h2 className="text-lg font-semibold text-white">{guide.title}</h2>
            </div>

            {'content' in guide && guide.content && (
              <ul className="space-y-2">
                {guide.content.map((item, i) => (
                  <li key={i} className={`text-sm ${item === '' ? '' : 'text-gray-300'}`}>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {'links' in guide && guide.links && (
              <div className="space-y-2">
                {guide.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition py-1"
                  >
                    <span>&#8599;</span>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-xl">
        <p className="text-sm text-yellow-400">
          <strong>면책 조항:</strong> 이 페이지의 내용은 일반적인 정보 제공 목적이며, 법률 자문을 대체하지 않습니다.
          구체적인 법적 조치를 위해서는 반드시 전문 변호사와 상담하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}
