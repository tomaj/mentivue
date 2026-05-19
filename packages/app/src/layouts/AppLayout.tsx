// Authenticated app shell: sidebar + topbar + main content area.

import type { FC, PropsWithChildren } from 'hono/jsx';
import { type NavKey, Sidebar, TopBar } from '../components/Chrome.tsx';
import { C } from '../components/primitives.tsx';
import type { SessionKlient } from '../lib/session.ts';
import { APP_BASE_CSS } from '../styles.ts';

type Props = PropsWithChildren<{
  klient: SessionKlient;
  active: NavKey;
  title?: string;
  crumbs: string[];
  brandName: string;
  brandPeriod?: string;
  anomalyCount?: number;
}>;

export const AppLayout: FC<Props> = ({
  klient,
  active,
  title,
  crumbs,
  brandName,
  brandPeriod,
  anomalyCount,
  children,
}) => {
  return (
    <html lang="sk">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ? `${title} — Mentivue` : 'Mentivue'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: APP_BASE_CSS }} />
        <script src="https://unpkg.com/htmx.org@1.9.12" defer />
      </head>
      <body
        style={`background:${C.paper};color:${C.ink};margin:0;font-family:${C.fontBody};font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased`}
      >
        <div style="display:grid;grid-template-columns:240px 1fr;min-height:100vh">
          <Sidebar
            active={active}
            klient={klient}
            brandName={brandName}
            brandPeriod={brandPeriod}
            anomalyCount={anomalyCount ?? 0}
          />
          <div style="display:flex;flex-direction:column;min-width:0">
            <TopBar crumbs={crumbs} klient={klient} />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};
