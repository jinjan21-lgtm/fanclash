'use client';
import { useState } from 'react';
import { getSocket } from '@/lib/socket/client';

export default function DonationForm({ streamerId }: { streamerId: string }) {
  const [nickname, setNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<{ nickname: string; amount: number; time: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = getSocket();
    const amountNum = parseInt(amount);
    if (!nickname || !amountNum) return;

    socket.emit('donation:add', { streamer_id: streamerId, fan_nickname: nickname, amount: amountNum });
    setHistory(prev => [{ nickname, amount: amountNum, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex gap-4">
          <input type="text" placeholder="시청자 닉네임" value={nickname} onChange={e => setNickname(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-800 text-white" required />
          <input type="number" placeholder="금액 (원)" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-40 p-3 rounded-lg bg-gray-800 text-white" required min={1} />
          <button type="submit" className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
            입력
          </button>
        </div>
        <div className="flex gap-2">
          {[1000, 5000, 10000, 50000].map(v => (
            <button key={v} type="button" onClick={() => setAmount(String(v))}
              className="px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              {v.toLocaleString()}원
            </button>
          ))}
        </div>
      </form>
      {history.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="font-bold mb-3">최근 입력</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-300">
                <span>{h.nickname}</span>
                <span>{h.amount.toLocaleString()}원</span>
                <span className="text-gray-500">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
