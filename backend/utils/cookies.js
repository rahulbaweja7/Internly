// Single source of truth for the two cookies this app sets:
// - `token` (HttpOnly JWT, read by isAuthenticated)
// - `csrf`  (non-HttpOnly double-submit token, mirrored by the client in X-CSRF-Token)
// Previously each of auth.js, app.js, gmail.js, and middleware/auth.js built/parsed
// these independently, which let their attributes drift out of sync (see setAuthCookie).

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, seconds
const CSRF_MAX_AGE = 14 * 24 * 60 * 60; // 14 days, seconds

function buildCookie(name, value, { httpOnly = false, maxAge, includeDomain = true } = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const domainPart = includeDomain && process.env.COOKIE_DOMAIN ? `Domain=${process.env.COOKIE_DOMAIN}` : '';
  const parts = [
    `${name}=${value}`,
    'Path=/',
    domainPart,
    httpOnly ? 'HttpOnly' : '',
    isProd ? 'Secure' : '',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].filter(Boolean);
  return parts.join('; ');
}

function appendSetCookie(res, cookieStr) {
  const existing = res.getHeader('Set-Cookie');
  const arr = existing ? (Array.isArray(existing) ? existing : [existing]) : [];
  res.setHeader('Set-Cookie', [...arr, cookieStr]);
}

function setAuthCookie(res, token) {
  appendSetCookie(res, buildCookie('token', encodeURIComponent(token), { httpOnly: true, maxAge: TOKEN_MAX_AGE }));
}

function setCsrfCookie(res, token) {
  appendSetCookie(res, buildCookie('csrf', encodeURIComponent(token), { httpOnly: false, maxAge: CSRF_MAX_AGE }));
}

// Clears both the host-only and domain-wide variants of each cookie, since a
// cookie may have been set under either scope depending on COOKIE_DOMAIN history.
function clearAuthCookies(res) {
  const domainConfigured = process.env.COOKIE_DOMAIN || '';
  appendSetCookie(res, buildCookie('token', '', { httpOnly: true, maxAge: 0, includeDomain: false }));
  if (domainConfigured) appendSetCookie(res, buildCookie('token', '', { httpOnly: true, maxAge: 0, includeDomain: true }));
  appendSetCookie(res, buildCookie('csrf', '', { httpOnly: false, maxAge: 0, includeDomain: false }));
  if (domainConfigured) appendSetCookie(res, buildCookie('csrf', '', { httpOnly: false, maxAge: 0, includeDomain: true }));
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : '';
}

module.exports = { buildCookie, setAuthCookie, setCsrfCookie, clearAuthCookies, getCookie, TOKEN_MAX_AGE, CSRF_MAX_AGE };
