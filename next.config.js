// shortcut: 'unsafe-inline' em script/style porque o Next injeta scripts inline e o app usa style=; upgrade: CSP com nonce via proxy
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com", // o POST do checkout redireciona para o Stripe
  "frame-ancestors 'none'",
].join('; ')

/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // só em produção: em dev o React precisa de eval e o HMR de websocket
        ...(process.env.NODE_ENV === 'production' ? [{ key: 'Content-Security-Policy', value: csp }] : []),
      ],
    }]
  },
}
