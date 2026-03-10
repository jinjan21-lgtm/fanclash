'use client';
import { useState } from 'react';
import { getSocket } from '@/lib/socket/client';
import { useToast } from '@/components/ui/Toast';

export default function DonationForm({ streamerId }: { streamerId: string }) {
  const [nickname, setNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ nickname: string; amount: number; message: string; time: string }[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = getSocket();
    const amountNum = parseInt(amount);
    if (!nickname || !amountNum) return;

    socket.emit('donation:add', { streamer_id: streamerId, fan_nickname: nickname, amount: amountNum, message });
    setHistory(prev => [{ nickname, amount: amountNum, message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    setAmount('');
    setMessage('');
    toast(`${nickname}님 ${amountNum.toLocaleString()}원 입력됨`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="시청자 닉네임" value={nickname} onChange={e => setNickname(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required />
          <input type="number" placeholder="금액 (원)" value={amount} onChange={e => setAmount(e.target.value)}
            className="sm:w-40 p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required min={1} />
          <button type="submit" className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
            입력
          </button>
        </div>
        <input type="text" placeholder="메시지 (선택)" value={message} onChange={e => setMessage(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" />
        <div className="flex flex-wrap gap-2">
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
              <div key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm text-gray-300 py-1 border-b border-gray-800 last:border-0">
                <div className="flex gap-3">
                  <span className="font-medium">{h.nickname}</span>
                  <span className="text-purple-400">{h.amount.toLocaleString()}원</span>
                </div>
                {h.message && <span className="text-gray-500 text-xs">"{h.message}"</span>}
                <span className="text-gray-600 text-xs">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
