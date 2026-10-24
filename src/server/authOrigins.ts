// Exact application origins only; never trust arbitrary request hosts or previews.
export function authTrustedOrigins() {
  return Array.from(new Set([
    'https://businesspaddy.com.ng',
    'https://www.businesspaddy.com.ng',
    'https://business-paddy.netlify.app',
    ...(process.env.BETTER_AUTH_URL ? [new URL(process.env.BETTER_AUTH_URL).origin] : []),
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
  ]));
}
