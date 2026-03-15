const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /@import\b/gi,
  /url\s*\(\s*['"]?\s*data\s*:/gi,
  /-moz-binding\s*:/gi,
  /behavior\s*:/gi,
  /<\/?script/gi,
  /on\w+\s*=/gi,
];

export function sanitizeCSS(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let css = raw;

  for (const pattern of DANGEROUS_PATTERNS) {
    css = css.replace(pattern, '/* removed */');
  }

  css = css.replace(/url\s*\(\s*['"]?(?!https?:\/\/|#|\.\/|\.\.\/)[^)'"]*['"]?\s*\)/gi, '/* removed */');

  return css;
}
