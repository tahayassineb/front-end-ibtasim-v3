const FONT_STYLE_ORIGINS = ["https://fonts.googleapis.com"];
const FONT_ASSET_ORIGINS = ["https://fonts.gstatic.com"];
const IMAGE_ORIGINS = ["https://images.unsplash.com", "https://*.convex.site"];
const CONNECT_ORIGINS = ["https://*.convex.cloud", "https://*.convex.site", "wss://*.convex.cloud"];

export const APP_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  `style-src 'self' 'unsafe-inline' ${FONT_STYLE_ORIGINS.join(" ")}`,
  `font-src 'self' ${FONT_ASSET_ORIGINS.join(" ")} data:`,
  `img-src 'self' data: blob: ${IMAGE_ORIGINS.join(" ")}`,
  `connect-src 'self' ${CONNECT_ORIGINS.join(" ")}`,
  "worker-src 'self' blob:",
  "media-src 'self' data: blob: https:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const APP_BASE_SECURITY_HEADERS = {
  "Content-Security-Policy": APP_CONTENT_SECURITY_POLICY,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

export const APP_ASSET_SECURITY_HEADERS = {
  "Cache-Control": "public, max-age=31536000",
  "X-Content-Type-Options": "nosniff",
};
