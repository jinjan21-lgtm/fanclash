'use client';

interface Props {
  overlayUrl: string;
  onClose: () => void;
}

export default function OBSGuideModal({ overlayUrl, onClose }: Props) {
  const copyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">OBS 연결 가이드</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">위젯 URL 복사</h4>
                <p className="text-gray-400 text-sm mb-2">아래 URL을 복사하세요</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={overlayUrl}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono"
                  />
                  <button onClick={copyUrl}
                    className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap font-medium">
                    복사
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">OBS에서 소스 추가</h4>
                <p className="text-gray-400 text-sm">OBS 하단의 <span className="text-white font-medium">소스</span> 패널에서 <span className="text-white font-medium">+</span> 버튼을 클릭합니다</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">브라우저 소스 선택</h4>
                <p className="text-gray-400 text-sm">소스 목록에서 <span className="text-white font-medium">브라우저</span>를 선택하고 이름을 입력합니다</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm shrink-0">4</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">URL 붙여넣기</h4>
                <p className="text-gray-400 text-sm mb-2">속성 창에서 다음 설정을 적용하세요:</p>
                <div className="bg-gray-800 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">URL</span>
                    <span className="text-purple-400 font-mono text-xs">복사한 URL 붙여넣기</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">너비</span>
                    <span className="text-white">800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">높이</span>
                    <span className="text-white">600</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm shrink-0">5</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">완료!</h4>
                <p className="text-gray-400 text-sm">확인을 누르면 위젯이 방송 화면에 표시됩니다. 위치와 크기를 드래그로 조절하세요.</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4">
              <h4 className="font-bold text-yellow-400 text-sm mb-2">팁</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>- 배경이 투명하게 표시됩니다 (크로마키 불필요)</li>
                <li>- 위젯 설정을 변경하면 OBS에서 자동 반영됩니다</li>
                <li>- 여러 위젯을 각각 별도 브라우저 소스로 추가하세요</li>
                <li>- 알림류 위젯(왕좌, 호감도, 후원알림)은 이벤트 발생 시에만 표시됩니다</li>
              </ul>
            </div>
          </div>

          <button onClick={onClose}
            className="w-full mt-6 py-3 bg-purple-600 rounded-lg font-medium hover:bg-purple-700">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
