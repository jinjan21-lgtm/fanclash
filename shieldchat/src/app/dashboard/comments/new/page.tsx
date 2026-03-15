'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORM_OPTIONS } from '@/lib/toxicity';

type InputMode = 'single' | 'bulk';

export default function NewCommentPage() {
  const [mode, setMode] = useState<InputMode>('single');
  const router = useRouter();

  // Single mode
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [platform, setPlatform] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Bulk mode
  const [bulkText, setBulkText] = useState('');
  const [bulkPlatform, setBulkPlatform] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ added: number; highSeverity: number } | null>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: [{
            content: content.trim(),
            author_name: authorName.trim() || null,
            platform: platform || null,
            source_url: sourceUrl.trim() || null,
          }],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      const data = await res.json();
      setResult({ added: data.comments.length, highSeverity: data.comments.filter((c: { severity: string }) => c.severity === 'high' || c.severity === 'critical').length });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: lines.map((line) => ({
            content: line,
            platform: bulkPlatform || null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      const data = await res.json();
      setResult({
        added: data.comments.length,
        highSeverity: data.comments.filter((c: { severity: string }) => c.severity === 'high' || c.severity === 'critical').length,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">
            {result.highSeverity > 0 ? '🚨' : '✅'}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {result.added}건의 댓글이 추가되었습니다
          </h2>
          {result.highSeverity > 0 && (
            <p className="text-red-400 text-sm mb-4">
              이 중 {result.highSeverity}건이 높음/위험 수준입니다.
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setResult(null);
                setContent('');
                setAuthorName('');
                setSourceUrl('');
                setBulkText('');
              }}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              추가 입력
            </button>
            <button
              onClick={() => router.push('/dashboard/comments')}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-sm"
            >
              댓글 목록 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">댓글 추가</h1>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            mode === 'single' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          텍스트 입력
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            mode === 'bulk' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          일괄 입력
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">댓글 내용 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition min-h-[100px] resize-y"
              required
              placeholder="악성 댓글 내용을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">작성자</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
                placeholder="닉네임"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">플랫폼</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
              >
                <option value="">선택</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">원본 URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? '분석 중...' : '분석 및 저장'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              댓글 일괄 입력 (한 줄에 하나씩)
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition min-h-[200px] resize-y font-mono text-sm"
              required
              placeholder={"악플 내용 1\n악플 내용 2\n악플 내용 3\n..."}
            />
            <p className="text-xs text-gray-500 mt-1">
              {bulkText.split('\n').filter((l) => l.trim()).length}건 입력됨
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">플랫폼 (전체 적용)</label>
            <select
              value={bulkPlatform}
              onChange={(e) => setBulkPlatform(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
            >
              <option value="">선택</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? '분석 중...' : '일괄 분석 및 저장'}
          </button>
        </form>
      )}
    </div>
  );
}
