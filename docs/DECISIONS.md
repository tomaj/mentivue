# Architectural decisions — pending

Two open architectural decisions Tomas should make before scaling email/auth.
Each has a recommendation; final call is up to Tomas.

---

## 1. react-email vs custom email-shell.ts

**Current state:** Custom `packages/app/src/lib/email-shell.ts` (~190 lines, table-layout, dark-mode media queries, Outlook MSO comments) + 5 templates in `email-templates.ts`. Hand-coded HTML strings; preview happens via Mailpit.

**Option A — Keep custom shell (recommended for now)**

- ✅ Zero deps, full control over Outlook quirks (already handles `<!--[if mso]>` + dark-mode media + table-layout edge cases)
- ✅ Templates are plain TS functions — composable, type-safe, no JSX-in-email runtime
- ✅ Mailpit catches every dev send → visual QA without a separate `dev:emails` server
- ❌ Adding a template = ~80 lines of HTML. Not great for non-engineer iteration.
- ❌ No live preview server; only fully-rendered Mailpit
- ❌ No automated client compatibility check (Litmus / EmailOnAcid coverage)

**Option B — Migrate to react-email**

- ✅ Component-driven authoring (Section, Hr, Button, Text from @react-email/components)
- ✅ Built-in dev preview at `pnpm dev:emails` (changes hot-reload in browser)
- ✅ Active community + battle-tested Outlook compat (Resend team maintains it)
- ✅ Easier for marketing to iterate (`<Text>` instead of inline `<table><tr><td>`)
- ❌ Requires React in app package (currently we run Hono JSX, no React runtime)
- ❌ Two JSX worlds: Hono JSX for routes, React for emails. Mental tax.
- ❌ Adds ~10 deps (@react-email/components, @react-email/render, etc)
- ❌ Existing 5 templates need rewrite

**Recommendation:** **Keep custom shell for v1 ship.** 5 templates is too few to justify migration cost. Re-evaluate when:
- You have ≥10 templates AND marketing wants to edit them
- OR you start hitting Outlook/Gmail rendering bugs hand-coding can't fix
- OR you outsource email design and contractor expects react-email

**If we ever migrate:** Do it in one PR (`packages/emails/` workspace), keep `sendEmail` signature unchanged so call sites need no edits. The `renderEmailShell()` boundary makes this swap surgical.

---

## 2. better-auth / Lucia migration vs extend custom auth

**Current state:** Custom auth (`packages/app/src/lib/auth.ts`, `session.ts`). Argon2id via `Bun.password`, 32-byte hex session cookies, sliding 30d TTL, server-side `sessions` table, atomic magic-link consume, rate limit on /login + /magic + /signup + /password, CSRF via `hono/csrf`, Origin check. **No client-side state.** ~210 lines total.

**Option A — Extend custom auth (recommended for now)**

- ✅ Minimal surface area; every line is auditable
- ✅ Stack-aligned: Hono + server-rendered JSX + HTMX has no need for a heavyweight auth SDK
- ✅ Already handles: pw login, magic link, session cookies, CSRF, rate-limit, atomic token claim, password reset (admin-initiated), tier-based RBAC
- ❌ Will need to write: OAuth providers (Google/Microsoft), 2FA/TOTP, passkeys, refresh tokens, device list for klient
- ❌ Manual maintenance: keeping up with cookie security best practices, secure session storage

**Option B — better-auth (TypeScript-first, Hono adapter exists)**

- ✅ Built-in: OAuth (Google/GitHub/Microsoft/Discord/…), passkey/WebAuthn, 2FA TOTP/SMS, magic link, email+pw, anonymous, multi-session, account linking, role-based access, email verification, password reset
- ✅ Drizzle adapter built in (matches our stack exactly)
- ✅ TypeScript-native, ~30k downloads/week, actively maintained
- ✅ Type-safe `auth.api.signInEmail()` instead of hand-rolled handlers
- ❌ ~6-8 MB install, ~30 transitive deps
- ❌ Pulls Lucia internally; some Lucia-isms leak
- ❌ Replacing existing auth = rewrite `lib/auth.ts`, `lib/session.ts`, auth routes, and migrate sessions/magic_link_tokens tables to better-auth schema
- ❌ Less flexible for our specific flows (signup→admin approval gate, tier RBAC)

**Option C — Lucia v3 (lighter)**

- ✅ ~80 KB, no transitive bloat — Lucia is essentially "auth utility lib" not a framework
- ✅ Bring-your-own routes; just provides Session/User primitives + Drizzle adapter
- ✅ Less aggressive opinion than better-auth
- ❌ Lucia v3 is in maintenance mode (author has stepped back; better-auth is recommended successor)
- ❌ Doesn't include OAuth/passkey out of the box — you'd add `arctic` for OAuth manually

**Recommendation:** **Stay with custom auth until you need OAuth or passkeys.** Our current code matches the product requirements (curated B2B with admin approval, magic link, tier RBAC). Migrating to better-auth would let an SDK handle the cookie store but doesn't unlock new features we need.

**Migrate to better-auth when:**
- Klients ask for Google/Microsoft SSO (likely Enterprise tier request)
- You add passkeys for the admin (`tomas@mentivue.sk`)
- You hit a security review finding that a framework would have caught

When that day comes, the migration path is clear: keep `klients` table primary key as the source of truth; better-auth's `account`/`session`/`verification` tables sit alongside. Magic link flow stays largely identical (better-auth has a `magicLink` plugin).

---

## Summary

| # | Decision | Recommendation | Trigger to revisit |
|---|---|---|---|
| 1 | Email lib | **Keep custom** | ≥10 templates OR marketing edits them OR Outlook rendering bug |
| 2 | Auth lib | **Keep custom** | OAuth/passkey requirement OR security review failure |

Both decisions can be deferred to **post-launch**. Neither blocks the current GTM path (Watch tier email magic-link only).
