'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; }

export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gray-900 rounded-xl p-6 border border-red-900/30 text-center">
          <p className="text-gray-400 text-sm mb-3">
            {this.props.fallbackTitle || '이 섹션'} 로드에 실패했습니다
          </p>
          <button onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
