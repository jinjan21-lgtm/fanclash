'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Step { done: boolean; label: string; desc: string; href: string; cta: string; }

export default function OnboardingGuide({ steps, completedSteps, allDone }: {
  steps: Step[];
  completedSteps: number;
  allDone: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fanclash_onboarding_collapsed');
    if (stored === 'true' || allDone) setCollapsed(true);
  }, [allDone]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('fanclash_onboarding_collapsed', String(next));
  };

  if (allDone && collapsed) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">시작 가이드</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{completedSteps}/{steps.length} 완료</span>
          <button onClick={toggle} className="text-xs text-gray-500 hover:text-gray-300">
            {collapsed ? '펼치기' : '접기'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="h-2 bg-gray-800 rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${step.done ? 'bg-green-900/20' : 'bg-gray-800/50'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.done ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${step.done ? 'text-green-400 line-through' : 'text-white'}`}>{step.label}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
                {!step.done && (
                  <Link href={step.href} className="px-4 py-1.5 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap">
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
