/**
 * Cloudflare Worker — Basic Auth gate for the marketing site during pre-launch.
 *
 * Deploy:
 *   cd infra && npx wrangler deploy access-worker.js
 *   npx wrangler secret put USER --name mentivue-access
 *   npx wrangler secret put PASS --name mentivue-access
 *
 * Then in the Cloudflare dashboard:
 *   Workers & Pages → mentivue-access → Triggers → Routes
 *   Add: mentivue.sk/*   (or *.mentivue.pages.dev/*)
 *
 * Removing the route unprotects the site immediately.
 *
 * Alternative: Cloudflare Access (zero-code, email magic links, free for 50
 * users) — see README "Password-protect the site" section.
 */
export default {
  async fetch(request, env) {
    const auth = request.headers.get('authorization');
    const expected = 'Basic ' + btoa(`${env.USER}:${env.PASS}`);

    if (auth !== expected) {
      return new Response('Authentication required.', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Mentivue staging", charset="UTF-8"',
          'Cache-Control': 'no-store',
        },
      });
    }

    return fetch(request);
  },
};
