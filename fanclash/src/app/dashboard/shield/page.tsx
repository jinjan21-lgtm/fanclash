'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SEVERITY_LABELS, CATEGORY_LABELS, type Severity, type Category } from '@/lib/toxicity';
import ComingSoon from '@/components/ui/ComingSoon';

interface CommentRow {
  id: string;
  content: string;
  author: string;
  platform: string;
  severity: Severity;
  category: Category | null;
  score: number;
  created_at: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

export default function ShieldPage() {
  const [stats, setStats] = useState({ total: 0, low: 0, medium: 0, high: 0, critical: 0 });
  const [recentDangerous, setRecentDangerous] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: comments } = await supabase
          .from('sc_comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (comments) {
          const s = { total: comments.length, low: 0, medium: 0, high: 0, critical: 0 };
          comments.forEach((c: CommentRow) => {
            if (c.severity in s) s[c.severity as keyof typeof s]++;
          });
          setStats(s);
          setRecentDangerous(
            comments.filter((c: CommentRow) => c.severity === 'high' || c.severity === 'critical').slice(0, 10)
          );
        }
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="pt-12 md:pt-0 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">댓글 방어</h1>
          <p className="text-gray-500 text-sm mt-1">악성 댓글을 분석하고 증거를 보존하세요</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/shield/comments/new"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-colors"
          >
            댓글 추가
          </Link>
          <Link
            href="/dashboard/shield/reports/new"
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium text-sm transition-colors"
          >
            리포트 생성
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-rose-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">데이터 불러오는 중...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">전체 분석</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{stats.low}</p>
              <p className="text-xs text-gray-500 mt-1">낮음</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
              <p className="text-xs text-gray-500 mt-1">보통</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
              <p className="text-xs text-gray-500 mt-1">높음</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
              <p className="text-xs text-gray-500 mt-1">위험</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Link href="/dashboard/shield/comments" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors text-center">
              <span className="text-2xl block mb-1">&#128172;</span>
              <p className="text-sm font-medium">댓글 목록</p>
            </Link>
            <Link href="/dashboard/shield/comments/new" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors text-center">
              <span className="text-2xl block mb-1">&#10133;</span>
              <p className="text-sm font-medium">댓글 추가</p>
            </Link>
            <Link href="/dashboard/shield/reports" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors text-center">
              <span className="text-2xl block mb-1">&#128196;</span>
              <p className="text-sm font-medium">리포트</p>
            </Link>
            <Link href="/dashboard/shield/legal" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors text-center">
              <span className="text-2xl block mb-1">&#9878;&#65039;</span>
              <p className="text-sm font-medium">법적 가이드</p>
            </Link>
          </div>

          {/* Coming Soon features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <ComingSoon
              feature="유튜브 댓글 자동 수집"
              description="YouTube Data API로 댓글을 자동으로 수집합니다"
            />
            <ComingSoon
              feature="AI 문맥 분석 (Claude API)"
              description="Anthropic Claude API로 문맥 기반 독성 분석"
            />
          </div>

          {/* Recent dangerous comments */}
          {recentDangerous.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">최근 위험 댓글</h2>
              <div className="space-y-2">
                {recentDangerous.map((comment) => (
                  <div key={comment.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 line-clamp-2">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">{comment.author || '익명'}</span>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-gray-500">{comment.platform}</span>
                          {comment.category && (
                            <>
                              <span className="text-xs text-gray-600">|</span>
                              <span className="text-xs text-gray-500">{CATEGORY_LABELS[comment.category]}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${SEVERITY_COLORS[comment.severity]}`}>
                        {SEVERITY_LABELS[comment.severity]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/shield/comments"
                className="block text-center text-sm text-rose-400 hover:text-rose-300 mt-4 transition-colors"
              >
                모든 댓글 보기 &rarr;
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
