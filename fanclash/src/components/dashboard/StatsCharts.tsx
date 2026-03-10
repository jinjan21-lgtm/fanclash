'use client';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];

interface DailyData { date: string; amount: number; }
interface Fan { nickname: string; total_donated: number; affinity_level: number; title: string; }

export default function StatsCharts({ dailyData, topFans }: { dailyData: DailyData[]; topFans: Fan[] }) {
  const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);

  return (
    <div className="space-y-8">
      {/* Daily chart */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="font-bold mb-4">일별 후원 추이 (최근 7일)</h3>
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
    </div>
  );
}
