const SCRIPT_LIKE_TAGS = /<(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\/\1>/gi;
const INLINE_HANDLER_ATTRS = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JAVASCRIPT_URL_ATTRS = /\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;

export function sanitizeRichHtml(html) {
  if (!html) return "";

  return String(html)
    .replace(SCRIPT_LIKE_TAGS, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(INLINE_HANDLER_ATTRS, "")
    .replace(JAVASCRIPT_URL_ATTRS, "");
}
