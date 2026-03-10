'use client';
import { useState } from 'react';

const AMOUNTS = [1000, 3000, 5000, 10000, 30000, 50000];

export default function DonateForm({ streamerId, streamerName }: { streamerId: string; streamerName: string }) {
  const [nickname, setNickname] = useState('');
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [loading, setLoading] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;
  const isValid = nickname.trim().length > 0 && finalAmount >= 1000;

  const handleConfirm = () => {
    if (!isValid) return;
    setStep('confirm');
  };

  const handlePay = async () => {
    setLoading(true);
    // TODO: Integrate with Toss Payments
    // For now, simulate payment and emit donation via API
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamer_id: streamerId,
          fan_nickname: nickname.trim(),
          amount: finalAmount,
          message: message.trim(),
        }),
      });
      if (res.ok) {
        setStep('done');
      }
    } catch {
      // Payment failed
    }
    setLoading(false);
  };

  if (step === 'done') {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold mb-2">후원 완료!</h3>
        <p className="text-gray-400 mb-1">
          <span className="text-purple-400 font-bold">{streamerName}</span>님에게
        </p>
        <p className="text-2xl font-bold text-yellow-400 mb-4">
          {finalAmount.toLocaleString()}원
        </p>
        <p className="text-gray-500 text-sm">감사합니다, {nickname}님!</p>
        <button onClick={() => { setStep('form'); setAmount(0); setCustomAmount(''); setMessage(''); }}
          className="mt-6 px-6 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700">
          추가 후원하기
        </button>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="font-bold text-lg mb-4 text-center">후원 확인</h3>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">받는 분</span>
            <span>{streamerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">닉네임</span>
            <span>{nickname}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">금액</span>
            <span className="text-yellow-400 font-bold">{finalAmount.toLocaleString()}원</span>
          </div>
          {message && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">메시지</span>
              <span className="text-right max-w-[200px] truncate">{message}</span>
            </div>
          )}
          <div className="border-t border-gray-800 pt-3 flex justify-between">
            <span className="text-gray-400 text-sm">수수료</span>
            <span className="text-gray-500 text-sm">무료</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep('form')}
            className="flex-1 py-3 bg-gray-800 rounded-xl font-medium hover:bg-gray-700">
            뒤로
          </button>
          <button onClick={handlePay} disabled={loading}
            className="flex-1 py-3 bg-purple-600 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50">
            {loading ? '결제 중...' : '결제하기'}
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-3">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Nickname */}
      <div className="mb-5">
        <label className="block text-sm text-gray-400 mb-1.5">닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="방송에 표시될 이름"
          maxLength={20}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Amount selection */}
      <div className="mb-5">
        <label className="block text-sm text-gray-400 mb-1.5">후원 금액</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => { setAmount(a); setCustomAmount(''); }}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                amount === a && !customAmount
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {a >= 10000 ? `${a / 10000}만` : `${a.toLocaleString()}`}원
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
            placeholder="직접 입력"
            min={1000}
            step={1000}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400">원</span>
        </div>
      </div>

      {/* Message */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1.5">메시지 (선택)</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="스트리머에게 전할 메시지"
          maxLength={200}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-purple-500 focus:outline-none resize-none"
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{message.length}/200</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleConfirm}
        disabled={!isValid}
        className="w-full py-3.5 bg-purple-600 rounded-xl font-bold text-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {finalAmount > 0 ? `${finalAmount.toLocaleString()}원 후원하기` : '금액을 선택하세요'}
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        최소 1,000원부터 후원 가능합니다
      </p>
    </div>
  );
}
