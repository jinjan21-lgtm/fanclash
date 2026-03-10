'use client';
import { useState } from 'react';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];

interface DailyData { date: string; amount: number; }
interface Fan { nickname: string; total_donated: number; affinity_level: number; title: string; }
interface DonationRow { fan_nickname: string; amount: number; message: string; created_at: string; }

export default function StatsCharts({ dailyData, topFans, donations }: {
  dailyData: DailyData[];
  topFans: Fan[];
  donations?: DonationRow[];
}) {
  const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);
  const [showAll, setShowAll] = useState(false);

  const exportCSV = () => {
    if (!donations?.length) return;
    const header = '날짜,닉네임,금액,메시지\n';
    const rows = donations.map(d =>
      `${d.created_at.split('T')[0]},${d.fan_nickname},${d.amount},"${(d.message || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fanclash-donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Hourly distribution
  const hourlyMap = new Array(24).fill(0);
  donations?.forEach(d => {
    const hour = new Date(d.created_at).getHours();
    hourlyMap[hour] += d.amount;
  });
  const maxHourly = Math.max(...hourlyMap, 1);

  return (
    <div className="space-y-8">
      {/* Daily chart */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">일별 후원 추이</h3>
          {donations && donations.length > 0 && (
            <button onClick={exportCSV}
              className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs hover:bg-gray-700 text-gray-400">
              CSV 다운로드
            </button>
          )}
        </div>
        <div className="flex items-end gap-2 h-48">
          {dailyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 tabular-nums">
                {d.amount > 0 ? `${(d.amount / 1000).toFixed(0)}k` : ''}
              </span>
              <div className="w-full bg-gray-800 rounded-t-lg overflow-hidden flex-1 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${d.amount > 0 ? Math.max((d.amount / maxAmount) * 100, 5) : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly distribution */}
      {donations && donations.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="font-bold mb-4">시간대별 후원 분포</h3>
          <div className="flex items-end gap-px h-32">
            {hourlyMap.map((amount, h) => (
              <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full bg-gray-800 rounded-t overflow-hidden flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all"
                    style={{ height: `${amount > 0 ? Math.max((amount / maxHourly) * 100, 3) : 0}%` }}
                  />
                </div>
                {h % 3 === 0 && (
                  <span className="text-[10px] text-gray-600">{h}시</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top fans */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="font-bold mb-4">상위 팬 TOP 10</h3>
        {topFans.length === 0 ? (
          <p className="text-gray-500 text-center py-4">아직 팬 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {topFans.map((fan, i) => {
              const barWidth = (fan.total_donated / (topFans[0]?.total_donated || 1)) * 100;
              return (
                <div key={fan.nickname} className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold text-gray-500">
                    {i < 3 ? ['👑', '🥈', '🥉'][i] : i + 1}
                  </span>
                  <span className="text-lg">{LEVEL_EMOJIS[fan.affinity_level] || '👤'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{fan.nickname}</span>
                      <span className="text-sm text-purple-400 tabular-nums">{fan.total_donated.toLocaleString()}원</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{fan.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent donations table */}
      {donations && donations.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="font-bold mb-4">최근 후원 내역</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 font-medium">날짜</th>
                  <th className="text-left py-2 font-medium">닉네임</th>
                  <th className="text-right py-2 font-medium">금액</th>
                  <th className="text-left py-2 pl-4 font-medium">메시지</th>
                </tr>
              </thead>
              <tbody>
                {(showAll ? donations : donations.slice(0, 20)).map((d, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-400 tabular-nums">{d.created_at.split('T')[0]}</td>
                    <td className="py-2 font-medium">{d.fan_nickname}</td>
                    <td className="py-2 text-right text-purple-400 tabular-nums">{d.amount.toLocaleString()}원</td>
                    <td className="py-2 pl-4 text-gray-500 truncate max-w-[200px]">{d.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && donations.length > 20 && (
            <button onClick={() => setShowAll(true)}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-white transition-colors">
              전체 {donations.length}건 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
