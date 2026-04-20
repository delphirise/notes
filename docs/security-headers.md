# Security Headers Deployment Plan

## Why
GitHub Pages does not let this project set response headers directly. To enforce CSP/HSTS in production, deploy behind a proxy/CDN (Cloudflare, Netlify, Fastly, or similar) and attach headers there.

## Recommended Rollout
1. Start with `Content-Security-Policy-Report-Only` and collect violations.
2. Fix violations and remove inline handlers/scripts.
3. Enforce CSP by switching to `Content-Security-Policy`.
4. Enable HSTS for HTTPS-only production domains.

## Transitional CSP (Report-Only)
Use while migration is in progress:

```http
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; report-uri https://YOUR-INTERNAL-ENDPOINT.example/csp
```

## Strict CSP (Enforced)
Use after inline script/handler migration is complete:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Notes:
- If inline styles are fully removed, also remove `'unsafe-inline'` from `style-src`.
- If you adopt script nonces/hashes for approved inline code, update `script-src` accordingly.

## HSTS
Enable only on production HTTPS hosts:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Cloudflare Worker Example

```javascript
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const headers = new Headers(response.headers);

    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
```
