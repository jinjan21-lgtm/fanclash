export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Category = 'profanity' | 'threat' | 'defamation' | 'sexual' | 'discrimination';

export interface ToxicityResult {
  severity: Severity;
  category: Category | null;
  score: number;
  matches: string[];
  categories: Category[];
}

interface PatternEntry {
  pattern: RegExp;
  category: Category;
  weight: number;
}

const PATTERNS: PatternEntry[] = [
  // 욕설 (profanity)
  { pattern: /씨발/gi, category: 'profanity', weight: 3 },
  { pattern: /시발/gi, category: 'profanity', weight: 3 },
  { pattern: /씨[ㅂ빠팔]/gi, category: 'profanity', weight: 3 },
  { pattern: /ㅅㅂ/g, category: 'profanity', weight: 2 },
  { pattern: /ㅆㅂ/g, category: 'profanity', weight: 2 },
  { pattern: /씹/gi, category: 'profanity', weight: 3 },
  { pattern: /개새끼/gi, category: 'profanity', weight: 3 },
  { pattern: /새끼/gi, category: 'profanity', weight: 2 },
  { pattern: /ㅅㅋ/g, category: 'profanity', weight: 2 },
  { pattern: /병신/gi, category: 'profanity', weight: 3 },
  { pattern: /ㅂㅅ/g, category: 'profanity', weight: 2 },
  { pattern: /지랄/gi, category: 'profanity', weight: 2 },
  { pattern: /ㅈㄹ/g, category: 'profanity', weight: 2 },
  { pattern: /미친[놈년]/gi, category: 'profanity', weight: 2 },
  { pattern: /또라이/gi, category: 'profanity', weight: 2 },
  { pattern: /꺼져/gi, category: 'profanity', weight: 1 },
  { pattern: /닥[쳐치]/gi, category: 'profanity', weight: 2 },
  { pattern: /ㄷㅊ/g, category: 'profanity', weight: 1 },
  { pattern: /좆/gi, category: 'profanity', weight: 3 },
  { pattern: /ㅈ같/gi, category: 'profanity', weight: 2 },
  { pattern: /개[같갓]은/gi, category: 'profanity', weight: 2 },
  { pattern: /니[애에]미/gi, category: 'profanity', weight: 3 },
  { pattern: /느금마/gi, category: 'profanity', weight: 3 },
  { pattern: /ㄴㄱㅁ/g, category: 'profanity', weight: 2 },
  { pattern: /엠창/gi, category: 'profanity', weight: 3 },
  { pattern: /한남/gi, category: 'profanity', weight: 1 },
  { pattern: /한녀/gi, category: 'profanity', weight: 1 },
  { pattern: /쓰레기/gi, category: 'profanity', weight: 1 },
  { pattern: /찐따/gi, category: 'profanity', weight: 2 },
  { pattern: /등신/gi, category: 'profanity', weight: 2 },
  { pattern: /멍청/gi, category: 'profanity', weight: 1 },
  { pattern: /바보/gi, category: 'profanity', weight: 1 },

  // 협박 (threat)
  { pattern: /죽[여이일을겠]|죽어라/gi, category: 'threat', weight: 5 },
  { pattern: /찾아[가갈갈게]/gi, category: 'threat', weight: 5 },
  { pattern: /신상/gi, category: 'threat', weight: 4 },
  { pattern: /털[어었]/gi, category: 'threat', weight: 3 },
  { pattern: /칼[로들]/gi, category: 'threat', weight: 5 },
  { pattern: /패[버줄죽]/gi, category: 'threat', weight: 4 },
  { pattern: /때[려릴린]/gi, category: 'threat', weight: 3 },
  { pattern: /살해/gi, category: 'threat', weight: 5 },
  { pattern: /자살/gi, category: 'threat', weight: 5 },
  { pattern: /집주소/gi, category: 'threat', weight: 5 },
  { pattern: /어디사는지/gi, category: 'threat', weight: 4 },
  { pattern: /두고\s*봐/gi, category: 'threat', weight: 3 },
  { pattern: /가만.*안.*둬/gi, category: 'threat', weight: 3 },
  { pattern: /불[태질]/gi, category: 'threat', weight: 4 },
  { pattern: /납치/gi, category: 'threat', weight: 5 },
  { pattern: /보복/gi, category: 'threat', weight: 4 },

  // 명예훼손 (defamation)
  { pattern: /사기[꾼치]/gi, category: 'defamation', weight: 2 },
  { pattern: /거짓말쟁이/gi, category: 'defamation', weight: 2 },
  { pattern: /도둑[놈년]/gi, category: 'defamation', weight: 2 },
  { pattern: /범죄자/gi, category: 'defamation', weight: 2 },
  { pattern: /전과/gi, category: 'defamation', weight: 2 },
  { pattern: /먹튀/gi, category: 'defamation', weight: 2 },
  { pattern: /사기/gi, category: 'defamation', weight: 1 },
  { pattern: /구라/gi, category: 'defamation', weight: 1 },
  { pattern: /양아치/gi, category: 'defamation', weight: 2 },

  // 성희롱 (sexual)
  { pattern: /보[지짓]/gi, category: 'sexual', weight: 4 },
  { pattern: /자[지짓]/gi, category: 'sexual', weight: 4 },
  { pattern: /가슴.*만[져지질]/gi, category: 'sexual', weight: 4 },
  { pattern: /벗[어어라겨]/gi, category: 'sexual', weight: 3 },
  { pattern: /성[관폭]계/gi, category: 'sexual', weight: 4 },
  { pattern: /강간/gi, category: 'sexual', weight: 5 },
  { pattern: /몸[매파]/gi, category: 'sexual', weight: 2 },
  { pattern: /야[동하한]/gi, category: 'sexual', weight: 2 },
  { pattern: /섹[스시]/gi, category: 'sexual', weight: 3 },
  { pattern: /창[녀년]/gi, category: 'sexual', weight: 4 },
  { pattern: /걸레/gi, category: 'sexual', weight: 4 },
  { pattern: /화냥/gi, category: 'sexual', weight: 3 },

  // 차별 (discrimination)
  { pattern: /장애[인]/gi, category: 'discrimination', weight: 3 },
  { pattern: /불[구쌍]/gi, category: 'discrimination', weight: 3 },
  { pattern: /흑[인형]/gi, category: 'discrimination', weight: 2 },
  { pattern: /깜[둥뚱]/gi, category: 'discrimination', weight: 4 },
  { pattern: /쪽[바발]/gi, category: 'discrimination', weight: 3 },
  { pattern: /조선[족징]/gi, category: 'discrimination', weight: 2 },
  { pattern: /동남아/gi, category: 'discrimination', weight: 1 },
  { pattern: /틀딱/gi, category: 'discrimination', weight: 2 },
  { pattern: /급식[충]/gi, category: 'discrimination', weight: 1 },
  { pattern: /맘충/gi, category: 'discrimination', weight: 2 },
];

// Category weights for severity calculation
const CATEGORY_WEIGHTS: Record<Category, number> = {
  profanity: 1,
  defamation: 1.5,
  sexual: 2,
  discrimination: 2,
  threat: 3,
};

export function analyzeToxicity(text: string): ToxicityResult {
  const matches: string[] = [];
  const categoryScores: Partial<Record<Category, number>> = {};
  const detectedCategories = new Set<Category>();

  for (const entry of PATTERNS) {
    const found = text.match(entry.pattern);
    if (found) {
      found.forEach((m) => {
        if (!matches.includes(m)) matches.push(m);
      });
      detectedCategories.add(entry.category);
      categoryScores[entry.category] = (categoryScores[entry.category] || 0) + entry.weight * (found.length);
    }
  }

  if (matches.length === 0) {
    return { severity: 'low', category: null, score: 0, matches: [], categories: [] };
  }

  // Find primary category (highest weighted score)
  let primaryCategory: Category = 'profanity';
  let maxWeightedScore = 0;

  for (const [cat, score] of Object.entries(categoryScores) as [Category, number][]) {
    const weighted = score * CATEGORY_WEIGHTS[cat];
    if (weighted > maxWeightedScore) {
      maxWeightedScore = weighted;
      primaryCategory = cat;
    }
  }

  // Calculate total score (0-100)
  const totalRaw = Object.entries(categoryScores).reduce(
    (sum, [cat, score]) => sum + score * CATEGORY_WEIGHTS[cat as Category],
    0
  );
  const score = Math.min(100, totalRaw * 5);

  // Determine severity
  let severity: Severity;
  if (score >= 70 || detectedCategories.has('threat')) {
    severity = 'critical';
  } else if (score >= 40) {
    severity = 'high';
  } else if (score >= 20) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  // Threats always bump to at least high
  if (detectedCategories.has('threat') && severity === 'low') {
    severity = 'high';
  }

  return {
    severity,
    category: primaryCategory,
    score,
    matches,
    categories: Array.from(detectedCategories),
  };
}

export const CATEGORY_LABELS: Record<Category, string> = {
  profanity: '욕설',
  threat: '협박',
  defamation: '명예훼손',
  sexual: '성희롱',
  discrimination: '차별',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '위험',
};

export const PLATFORM_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'chzzk', label: '치지직' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'afreeca', label: '아프리카TV' },
  { value: 'naver', label: '네이버' },
  { value: 'other', label: '기타' },
];
