import type { FC, PropsWithChildren } from 'hono/jsx';
import { APP_BASE_CSS } from '../styles.ts';
import { C } from '../components/primitives.tsx';

type Props = PropsWithChildren<{ title?: string }>;

// Full-bleed shell used by /login: split into LeftPanel (ink) + RightPanel (paper).
// Children compose the two sides directly — see routes/auth.tsx.
export const AuthLayout: FC<Props> = ({ title, children }) => {
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
      </head>
      <body style={`background:${C.paper};color:${C.ink};margin:0;font-family:${C.fontBody};-webkit-font-smoothing:antialiased`}>
        <div style="min-height:100vh;display:grid;grid-template-columns:1.2fr 1fr">
          {children}
        </div>
      </body>
    </html>
  );
};
