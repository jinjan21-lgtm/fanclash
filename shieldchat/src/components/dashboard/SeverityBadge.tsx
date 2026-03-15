import { SEVERITY_LABELS } from '@/lib/toxicity';
import type { Severity } from '@/lib/toxicity';

const colors: Record<Severity, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50',
  high: 'bg-orange-900/50 text-orange-400 border border-orange-700/50',
  critical: 'bg-red-900/50 text-red-400 border border-red-700/50',
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
