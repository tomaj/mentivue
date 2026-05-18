// Sidebar + TopBar + WelcomeStrip — chrome around all authed routes.
// Translated from packages/site → dashboard-components.jsx prototype.

import type { FC } from 'hono/jsx';
import { C, LogoLockup, MonoLabel, Num, PulseDot } from './primitives.tsx';
import type { SessionKlient } from '../lib/session.ts';
import { fmtRelative } from '../lib/fmt.ts';

export type NavKey =
  | 'dashboard'
  | 'index_live'
  | 'actions'
  | 'audits'
  | 'pulse'
  | 'competition'
  | 'anomalies'
  | 'prompts'
  | 'settings'
  | 'billing'
  | 'team'
  | 'admin_klients'
  | 'admin_health';

type NavItem = { key: NavKey; label: string; href: string; badge?: string };
type NavSection = { label: string; items: NavItem[] };

function getNavSections(isAdmin: boolean, anomalyCount: number): NavSection[] {
  const sections: NavSection[] = [
    {
      label: 'Prehľad',
      items: [
        { key: 'dashboard',  label: 'Dashboard',      href: '/app/dashboard' },
        { key: 'index_live', label: 'Index Live',     href: '/app/dashboard', badge: 'live' },
      ],
    },
    {
      label: 'Reporty',
      items: [
        { key: 'actions', label: 'Action Reports', href: '/app/reports?type=action' },
        { key: 'audits',  label: 'Audity',         href: '/app/reports?type=audit' },
        { key: 'pulse',   label: 'Pulse archív',   href: '/app/reports?type=pulse' },
      ],
    },
    {
      label: 'Analýza',
      items: [
        { key: 'competition', label: 'Konkurencia',     href: '/app/dashboard' },
        { key: 'anomalies',   label: 'Anomálie',        href: '/app/dashboard#anomalies', badge: anomalyCount > 0 ? String(anomalyCount) : undefined },
        { key: 'prompts',     label: 'Vlastné prompty', href: '/app/dashboard' },
      ],
    },
    {
      label: 'Účet',
      items: [
        { key: 'settings', label: 'Nastavenia', href: '/app/settings' },
        { key: 'billing',  label: 'Fakturácia', href: '/app/settings#billing' },
        { key: 'team',     label: 'Tím',        href: '/app/settings#team' },
      ],
    },
  ];
  if (isAdmin) {
    sections.push({
      label: 'Admin',
      items: [
        { key: 'admin_klients', label: 'Klienti', href: '/admin/klients' },
        { key: 'admin_health',  label: 'Health',  href: '/admin/health' },
      ],
    });
  }
  return sections;
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (first + (last ?? '')).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ────────── Sidebar ──────────
export const Sidebar: FC<{
  active: NavKey;
  klient: SessionKlient;
  brandName: string;
  brandPeriod?: string;
  anomalyCount?: number;
}> = ({ active, klient, brandName, brandPeriod, anomalyCount = 0 }) => {
  const sections = getNavSections(klient.isAdmin, anomalyCount);
  return (
    <aside style={`width:240px;flex:none;background:${C.paper};border-right:1px solid ${C.bone};display:flex;flex-direction:column;position:sticky;top:0;height:100vh;max-height:100vh`}>
      <div style={`padding:20px 20px 16px;border-bottom:1px solid ${C.bone}`}>
        <a href="/app/dashboard" style="text-decoration:none">
          <LogoLockup size={24} />
        </a>
      </div>

      {/* Brand selector */}
      <div style={`padding:14px 16px;margin:14px 14px 8px;border:1px solid ${C.ink};background:${C.paperPure};display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:default`}>
        <div style="display:flex;flex-direction:column;gap:4px">
          <span style={`font-family:${C.fontDisplay};font-size:17px;font-weight:500;letter-spacing:-0.02em;color:${C.ink};line-height:1`}>{brandName}</span>
          <Num size={10} color={C.inkSoft}>{brandPeriod ?? 'Q2 2026'}</Num>
        </div>
        <span style={`color:${C.signal};font-size:12px`}>▼</span>
      </div>

      <nav style="flex:1;overflow-y:auto;padding:6px 8px 16px">
        {sections.map((sec) => (
          <div style="margin-top:18px">
            <div style="padding:6px 12px 8px">
              <MonoLabel size={9} tracking="0.22em">{sec.label}</MonoLabel>
            </div>
            <div style="display:flex;flex-direction:column">
              {sec.items.map((it) => {
                const isActive = it.key === active;
                return (
                  <a
                    href={it.href}
                    style={`padding:9px 12px;font-size:13.5px;font-weight:${isActive ? 500 : 400};color:${isActive ? C.ink : C.inkSoft};background:${isActive ? C.bone : 'transparent'};border-left:2px solid ${isActive ? C.signal : 'transparent'};display:flex;justify-content:space-between;align-items:center;text-decoration:none;cursor:pointer`}
                  >
                    <span>{it.label}</span>
                    {it.badge === 'live' ? (
                      <span style="display:inline-flex;align-items:center;gap:6px">
                        <PulseDot size={6} />
                        <Num size={9} color={C.signal}>LIVE</Num>
                      </span>
                    ) : it.badge ? (
                      <Num size={10} color={C.signal}>{it.badge}</Num>
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Advisor card */}
      <div style={`margin:12px;padding:14px;border:1px solid ${C.bone};background:${C.paperPure};display:flex;flex-direction:column;gap:12px`}>
        <div style="display:flex;align-items:center;gap:10px">
          <span style={`width:32px;height:32px;border-radius:50%;background:${C.ink};color:${C.paper};display:inline-flex;align-items:center;justify-content:center;font-family:${C.fontDisplay};font-size:14px;font-weight:500;letter-spacing:-0.01em;flex:none`}>TM</span>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <span style={`font-size:13px;font-weight:500;color:${C.ink}`}>Tomáš Majer</span>
            <MonoLabel size={9} tracking="0.16em">Strategic Advisor</MonoLabel>
          </div>
        </div>
        <a
          href="mailto:tomas@mentivue.sk"
          style={`font-size:12px;color:${C.signal};text-decoration:none;border-bottom:1px solid ${C.signal};padding-bottom:1px;display:inline-flex;align-items:center;gap:6px;align-self:flex-start`}
        >
          Napísať Slack →
        </a>
      </div>
    </aside>
  );
};

// ────────── TopBar ──────────
export const TopBar: FC<{ crumbs: string[]; klient: SessionKlient }> = ({ crumbs, klient }) => {
  return (
    <header style={`height:60px;padding:0 28px;border-bottom:1px solid ${C.bone};background:${C.paper};display:flex;align-items:center;justify-content:space-between;flex:none`}>
      <nav style="display:flex;align-items:center;gap:10px">
        {crumbs.map((crumb, i) => (
          <>
            {i > 0 && <span style={`color:rgba(14,17,22,0.3);font-family:${C.fontMono};font-size:12px`}>/</span>}
            <span
              style={`font-family:${i === crumbs.length - 1 ? C.fontDisplay : C.fontBody};font-size:${i === crumbs.length - 1 ? 17 : 13.5}px;color:${i === crumbs.length - 1 ? C.ink : C.inkSoft};font-weight:${i === crumbs.length - 1 ? 500 : 400};letter-spacing:${i === crumbs.length - 1 ? '-0.015em' : 'normal'}`}
            >
              {crumb}
            </span>
          </>
        ))}
      </nav>
      <div style="display:flex;align-items:center;gap:10px">
        <TopBarPill>Posledných 30 dní</TopBarPill>
        <TopBarPill>Export</TopBarPill>
        <div style={`width:1px;height:22px;background:${C.bone};margin:0 6px`} />
        <span style={`width:30px;height:30px;border-radius:50%;background:${C.ink};color:${C.paper};display:inline-flex;align-items:center;justify-content:center;font-family:${C.fontDisplay};font-size:13px;font-weight:500`}>
          {initials(klient.name, klient.email)}
        </span>
        <form method="post" action="/logout" style="margin:0">
          <button
            type="submit"
            style={`background:transparent;border:1px solid ${C.bone};font-family:${C.fontBody};font-size:12.5px;color:${C.inkSoft};padding:8px 12px;cursor:pointer`}
            title="Odhlásiť sa"
          >
            ↳ Odhlásiť
          </button>
        </form>
      </div>
    </header>
  );
};

const TopBarPill: FC<{ children: unknown }> = ({ children }) => (
  <button
    type="button"
    style={`display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:${C.paperPure};border:1px solid ${C.bone};font-family:${C.fontBody};font-size:12.5px;color:${C.ink};cursor:pointer`}
  >
    {children}
    <span style={`color:${C.inkSoft};font-size:10px;margin-left:4px`}>▼</span>
  </button>
);

// ────────── Welcome strip ──────────
export const WelcomeStrip: FC<{
  greeting: string;
  firstName: string;
  anomalyCount: number;
  brandName: string;
  lastUpdate: Date | null;
}> = ({ greeting, firstName, anomalyCount, brandName, lastUpdate }) => {
  const tagline =
    anomalyCount === 0
      ? 'Tento týždeň všetko stabilné.'
      : anomalyCount === 1
      ? '1 anomália tento týždeň.'
      : `${anomalyCount} anomálie tento týždeň.`;
  return (
    <div style={`padding:24px 28px 22px;border-bottom:1px solid ${C.bone};display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap`}>
      <div>
        <h1 style={`font-family:${C.fontDisplay};font-weight:400;font-size:32px;letter-spacing:-0.025em;line-height:1.05;margin:0;color:${C.ink}`}>
          {greeting}, {firstName}.<br />
          <em style={`font-style:italic;font-weight:400;color:${C.signal}`}>{tagline}</em>
        </h1>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <MonoLabel size={10} tracking="0.16em">{brandName} · posledná aktualizácia</MonoLabel>
        <div style="display:inline-flex;align-items:center;gap:10px">
          <PulseDot size={7} color={C.positive} />
          <Num size={13} color={C.ink}>{lastUpdate ? fmtRelative(lastUpdate) : '—'}</Num>
        </div>
      </div>
    </div>
  );
};
