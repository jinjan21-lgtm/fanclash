'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { analyzeToxicity, SEVERITY_LABELS, CATEGORY_LABELS, PLATFORM_OPTIONS, type ToxicityResult } from '@/lib/toxicity';

type InputMode = 'single' | 'bulk';

interface AnalyzedComment {
  content: string;
  result: ToxicityResult;
  author: string;
  platform: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

export default function NewCommentPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('single');
  const [content, setContent] = useState('');
  const [bulkContent, setBulkContent] = useState('');
  const [author, setAuthor] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [analyzed, setAnalyzed] = useState<AnalyzedComment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAnalyze = () => {
    if (mode === 'single') {
      if (!content.trim()) return;
      const result = analyzeToxicity(content.trim());
      setAnalyzed([{ content: content.trim(), result, author, platform }]);
    } else {
      const lines = bulkContent.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;
      const results = lines.map(line => ({
        content: line,
        result: analyzeToxicity(line),
        author,
        platform,
      }));
      setAnalyzed(results);
    }
  };

  const handleSave = async () => {
    if (analyzed.length === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rows = analyzed.map(a => ({
        user_id: user.id,
        content: a.content,
        author: a.author || null,
        platform: a.platform,
        severity: a.result.severity,
        category: a.result.category,
        score: a.result.score,
        matches: a.result.matches,
        categories: a.result.categories,
      }));

      await supabase.from('sc_comments').insert(rows);
      setSaved(true);
      setTimeout(() => router.push('/dashboard/shield/comments'), 1000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-12 md:pt-0 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">댓글 추가</h1>
      <p className="text-gray-500 text-sm mb-8">댓글 텍스트를 입력하면 독성을 자동으로 분석합니다</p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('single'); setAnalyzed([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'single' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          단건 입력
        </button>
        <button
          onClick={() => { setMode('bulk'); setAnalyzed([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'bulk' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          일괄 입력
        </button>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">작성자 (선택)</label>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-rose-500 outline-none"
            placeholder="닉네임"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">플랫폼</label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-rose-500 outline-none"
          >
            {PLATFORM_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Input area */}
      {mode === 'single' ? (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm focus:border-rose-500 outline-none resize-none mb-4"
          placeholder="분석할 댓글 내용을 입력하세요..."
        />
      ) : (
        <textarea
          value={bulkContent}
          onChange={e => setBulkContent(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm focus:border-rose-500 outline-none resize-none mb-4"
          placeholder="댓글을 한 줄에 하나씩 입력하세요...&#10;예시: 첫 번째 댓글&#10;두 번째 댓글&#10;세 번째 댓글"
        />
      )}

      <button
        onClick={handleAnalyze}
        disabled={mode === 'single' ? !content.trim() : !bulkContent.trim()}
        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors mb-8"
      >
        분석하기
      </button>

      {/* Results */}
      {analyzed.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">분석 결과 ({analyzed.length}건)</h2>
          <div className="space-y-3">
            {analyzed.map((a, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 mb-2">{a.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">점수: {a.result.score}</span>
                      {a.result.category && (
                        <>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-gray-500">{CATEGORY_LABELS[a.result.category]}</span>
                        </>
                      )}
                      {a.result.matches.length > 0 && (
                        <>
                          <span className="text-xs text-gray-600">|</span>
                          <span className="text-xs text-red-400/70">
                            감지: {a.result.matches.slice(0, 3).join(', ')}
                            {a.result.matches.length > 3 && ` 외 ${a.result.matches.length - 3}건`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${SEVERITY_COLORS[a.result.severity]}`}>
                    {SEVERITY_LABELS[a.result.severity]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full mt-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {saved ? '저장 완료!' : saving ? '저장 중...' : `${analyzed.length}건 저장하기`}
          </button>
        </div>
      )}
    </div>
  );
}
