'use client';

interface InsightCard {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

interface Props {
  insights: InsightCard[];
}

export default function DonationInsights({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-500">아직 분석할 데이터가 충분하지 않습니다. 후원 데이터가 쌓이면 인사이트가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, i) => (
        <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">{insight.emoji}</div>
          <div>
            <h4 className={`font-bold text-sm ${insight.color}`}>{insight.title}</h4>
            <p className="text-gray-300 text-sm mt-1">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
