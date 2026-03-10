'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];
const RANK_MEDALS = ['👑', '🥈', '🥉'];

interface Fan {
  nickname: string;
  total_donated: number;
  affinity_level: number;
  title: string;
}

export default function FanLeaderboard({ fans }: { fans: Fan[] }) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = search
    ? fans.filter(f => f.nickname.toLowerCase().includes(search.toLowerCase()))
    : fans;

  const displayed = showAll ? filtered : filtered.slice(0, 20);
  const searchedFanRank = search
    ? fans.findIndex(f => f.nickname.toLowerCase() === search.toLowerCase()) + 1
    : 0;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="내 닉네임 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-3 pl-10 rounded-xl bg-gray-900 border border-gray-700 text-white focus:border-purple-500 focus:outline-none"
        />
        <span className="absolute left-3 top-3.5 text-gray-500">🔍</span>
      </div>

      {/* Search result badge */}
      {searchedFanRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-purple-900/30 border border-purple-500/50 text-center"
        >
          <p className="text-purple-300 text-sm">내 순위</p>
          <p className="text-3xl font-bold text-purple-400">{searchedFanRank}위</p>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-2">
        <AnimatePresence>
          {displayed.map((fan, i) => {
            const globalRank = fans.indexOf(fan);
            const isHighlighted = search && fan.nickname.toLowerCase().includes(search.toLowerCase());

            return (
              <motion.div
                key={fan.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isHighlighted ? 'bg-purple-900/40 border border-purple-500/50' :
                  globalRank === 0 ? 'bg-yellow-900/20 border border-yellow-500/30' :
                  'bg-gray-900'
                }`}
              >
                {/* Rank */}
                <span className={`w-10 text-center font-bold text-lg ${
                  globalRank === 0 ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {RANK_MEDALS[globalRank] || globalRank + 1}
                </span>

                {/* Level emoji */}
                <span className="text-xl">{LEVEL_EMOJIS[fan.affinity_level] || '👤'}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${globalRank === 0 ? 'text-yellow-200' : 'text-white'}`}>
                    {fan.nickname}
                  </p>
                  <p className="text-xs text-gray-500">{fan.title}</p>
                </div>

                {/* Amount */}
                <span className="text-purple-400 font-bold tabular-nums">
                  {fan.total_donated.toLocaleString()}원
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more */}
      {!showAll && filtered.length > 20 && (
        <button onClick={() => setShowAll(true)}
          className="w-full mt-4 py-3 bg-gray-900 rounded-xl text-gray-400 hover:text-white transition-colors">
          전체 {filtered.length}명 보기
        </button>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          {search ? '검색 결과가 없습니다' : '아직 팬이 없습니다'}
        </p>
      )}
    </div>
  );
}
