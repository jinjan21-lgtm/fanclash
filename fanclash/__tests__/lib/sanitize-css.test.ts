import { sanitizeCSS } from '@/lib/sanitize-css';

describe('sanitizeCSS', () => {
  it('allows safe CSS properties', () => {
    const input = '.widget-container { background: red; border-radius: 8px; padding: 16px; }';
    expect(sanitizeCSS(input)).toBe(input);
  });

  it('removes javascript: URLs', () => {
    const input = '.x { background: url(javascript:alert(1)); }';
    expect(sanitizeCSS(input)).not.toContain('javascript:');
  });

  it('removes expression()', () => {
    const input = '.x { width: expression(document.body.clientWidth); }';
    expect(sanitizeCSS(input)).not.toContain('expression');
  });

  it('removes @import rules', () => {
    const input = '@import url("https://evil.com/steal.css"); .x { color: red; }';
    expect(sanitizeCSS(input)).not.toContain('@import');
  });

  it('removes data: URLs', () => {
    const input = '.x { background: url(data:text/html,<script>alert(1)</script>); }';
    expect(sanitizeCSS(input)).not.toContain('data:');
  });

  it('removes -moz-binding', () => {
    const input = '.x { -moz-binding: url("http://evil.com/xbl"); }';
    expect(sanitizeCSS(input)).not.toContain('-moz-binding');
  });

  it('handles empty input', () => {
    expect(sanitizeCSS('')).toBe('');
  });

  it('handles undefined input', () => {
    expect(sanitizeCSS(undefined as unknown as string)).toBe('');
  });
});
