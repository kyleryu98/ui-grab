const UI_GRAB_MARKER_PATTERNS = [
  /\bimport\s*\(\s*["'`]ui-grab(?:\/[^"'`]*)?["'`]\s*\)/i,
  /\bimport\s+[^;]*["'`]ui-grab(?:\/[^"'`]*)?["'`]/i,
  /\brequire\s*\(\s*["'`]ui-grab(?:\/[^"'`]*)?["'`]\s*\)/i,
  /\bfrom\s+["'`]ui-grab(?:\/[^"'`]*)?["'`]/i,
  /\b(?:src|href)\s*=\s*["'`][^"'`]*ui-grab(?:[^"'`]*)["'`]/i,
];

export const hasUiGrabMarker = (content: string): boolean =>
  UI_GRAB_MARKER_PATTERNS.some((pattern) => pattern.test(content));
