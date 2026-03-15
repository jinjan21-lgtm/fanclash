'use client';

import { useState, useRef, useCallback } from 'react';
import { analyzeAudio, formatTime } from '@/lib/audio-analyzer';
import type { AudioHighlight } from '@/lib/audio-analyzer';
import SubtitlePreview from '@/components/dashboard/SubtitlePreview';
import type { SubtitleStyle } from '@/lib/subtitle-styles';
import ComingSoon from '@/components/ui/ComingSoon';

interface GeneratedClip {
  id: string;
  highlight: AudioHighlight;
  blob: Blob;
  url: string;
  duration: number;
}

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function NewClipPage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [highlights, setHighlights] = useState<AudioHighlight[]>([]);
  const [generatingClip, setGeneratingClip] = useState<number | null>(null);
  const [clipProgress, setClipProgress] = useState(0);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);
  const [previewClip, setPreviewClip] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (selectedFile: File) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setError('지원되지 않는 파일 형식입니다. MP4, WebM, MOV 파일을 업로드해주세요.');
      return;
    }

    setError('');
    setHighlights([]);
    setGeneratedClips([]);
    setPreviewClip(null);
    setAnalysisState('idle');

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
  }, [videoUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalysisState('analyzing');
    setAnalysisProgress(0);
    setError('');

    try {
      const detected = await analyzeAudio(file, (p) => setAnalysisProgress(p));
      setHighlights(detected);
      setAnalysisState('done');
    } catch (err) {
      console.error('Audio analysis failed:', err);
      setError('오디오 분석에 실패했습니다. 파일 형식을 확인해주세요.');
      setAnalysisState('error');
    }
  };

  const handleCreateClip = async (index: number) => {
    if (!file) return;
    const highlight = highlights[index];
    setGeneratingClip(index);
    setClipProgress(0);

    try {
      const { extractClip } = await import('@/lib/video-processor');
      const blob = await extractClip(file, highlight.startTime, highlight.endTime, (p) => setClipProgress(p));
      const url = URL.createObjectURL(blob);
      const duration = highlight.endTime - highlight.startTime;

      setGeneratedClips((prev) => [
        ...prev,
        {
          id: `clip_${Date.now()}_${index}`,
          highlight,
          blob,
          url,
          duration,
        },
      ]);
    } catch (err) {
      console.error('Clip extraction failed:', err);
      setError('클립 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGeneratingClip(null);
      setClipProgress(0);
    }
  };

  const handleDownloadClip = (clip: GeneratedClip, index: number) => {
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = `clip_${index + 1}_${formatTime(clip.highlight.startTime)}-${formatTime(clip.highlight.endTime)}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isClipAlreadyGenerated = (index: number) => {
    const h = highlights[index];
    return generatedClips.some(
      (c) => c.highlight.startTime === h.startTime && c.highlight.endTime === h.endTime
    );
  };

  return (
    <div className="pt-12 md:pt-0 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">새 클립 만들기</h1>
      <p className="text-gray-500 text-sm mb-8">
        영상 파일을 업로드하면 오디오를 분석하여 하이라이트를 자동으로 감지합니다.
      </p>

      {/* File Upload Zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
          }`}
        >
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-gray-400 mb-2">
            영상 파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-gray-600">MP4, WebM, MOV 지원</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {/* File info + change */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (videoUrl) URL.revokeObjectURL(videoUrl);
                  setFile(null);
                  setVideoUrl(null);
                  setHighlights([]);
                  setGeneratedClips([]);
                  setAnalysisState('idle');
                  setError('');
                }}
                className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
              >
                변경
              </button>
            </div>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="mb-6">
              <video
                src={videoUrl}
                controls
                className="w-full rounded-xl bg-black max-h-[400px]"
              />
            </div>
          )}

          {/* Analyze Button */}
          {analysisState === 'idle' && (
            <button
              onClick={handleAnalyze}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors mb-6"
            >
              하이라이트 분석 시작
            </button>
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Analysis Progress */}
      {analysisState === 'analyzing' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-400">오디오 분석 중...</span>
            <span className="font-medium">{analysisProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Web Audio API로 오디오 볼륨 패턴을 분석하고 있습니다...
          </p>
        </div>
      )}

      {/* Detected Highlights */}
      {analysisState === 'done' && highlights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">
            감지된 하이라이트 ({highlights.length}개)
          </h2>
          <div className="space-y-3">
            {highlights.map((h, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        #{i + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(h.endTime - h.startTime)} 길이
                      </span>
                    </div>
                    <p className="font-medium text-sm mb-1">{h.reason}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(h.startTime)} ~ {formatTime(h.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isClipAlreadyGenerated(i) ? (
                      <span className="text-xs text-emerald-400 px-3 py-2">
                        생성 완료
                      </span>
                    ) : generatingClip === i ? (
                      <div className="text-xs text-gray-400 px-3 py-2 min-w-[80px] text-center">
                        {clipProgress}%
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCreateClip(i)}
                        disabled={generatingClip !== null}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        클립 생성
                      </button>
                    )}
                  </div>
                </div>
                {generatingClip === i && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${clipProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      FFmpeg로 클립을 추출하고 있습니다...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create all clips button */}
          {highlights.length > 1 && generatedClips.length < highlights.length && generatingClip === null && (
            <button
              onClick={async () => {
                for (let i = 0; i < highlights.length; i++) {
                  if (!isClipAlreadyGenerated(i)) {
                    await handleCreateClip(i);
                  }
                }
              }}
              className="w-full mt-4 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-medium transition-colors"
            >
              모든 클립 생성
            </button>
          )}
        </div>
      )}

      {/* Subtitle Style Selector */}
      {analysisState === 'done' && highlights.length > 0 && (
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <SubtitlePreview
            selectedId={subtitleStyle?.id ?? null}
            onSelect={setSubtitleStyle}
          />
          {subtitleStyle && (
            <p className="mt-3 text-xs text-gray-500">
              선택된 스타일: <span className="text-emerald-400">{subtitleStyle.name}</span> — 클립 메타데이터에 저장됩니다
            </p>
          )}
        </div>
      )}

      {/* No highlights */}
      {analysisState === 'done' && highlights.length === 0 && (
        <div className="text-center py-12 text-gray-500 mb-8">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <p className="mb-2">하이라이트가 감지되지 않았습니다</p>
          <p className="text-xs text-gray-600">볼륨 변화가 적은 영상일 수 있습니다.</p>
        </div>
      )}

      {/* Generated Clips */}
      {generatedClips.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            생성된 클립 ({generatedClips.length}개)
          </h2>
          <div className="space-y-3">
            {generatedClips.map((clip, i) => (
              <div
                key={clip.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      클립 #{i + 1} — {clip.highlight.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(clip.highlight.startTime)} ~ {formatTime(clip.highlight.endTime)}
                      <span className="ml-2 text-gray-600">
                        ({Math.round(clip.duration)}초 | {formatFileSize(clip.blob.size)})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setPreviewClip(previewClip === clip.url ? null : clip.url)
                      }
                      className="text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      {previewClip === clip.url ? '닫기' : '미리보기'}
                    </button>
                    <button
                      onClick={() => handleDownloadClip(clip, i)}
                      className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      다운로드
                    </button>
                  </div>
                </div>

                {previewClip === clip.url && (
                  <video
                    src={clip.url}
                    controls
                    autoPlay
                    className="w-full rounded-lg bg-black max-h-[300px]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming soon section */}
      {analysisState === 'done' && highlights.length > 0 && (
        <div className="mt-8">
          <ComingSoon
            feature="FanClash 하이라이트 자동 연동"
            description="FanClash 도네이션 피크 데이터로 하이라이트 정확도를 높일 수 있습니다"
          />
        </div>
      )}

      {/* Process Info */}
      {!file && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-6">
          <h3 className="text-sm font-medium mb-3">처리 과정</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">1</span>
              영상 파일 업로드
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">2</span>
              Web Audio API로 오디오 분석 및 하이라이트 감지
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">3</span>
              FFmpeg WASM으로 클립 추출
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">4</span>
              클립 미리보기 및 다운로드
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
