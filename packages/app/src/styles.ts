// Base CSS for the app — just resets, fonts, and a few utility classes.
// Most styling is inline JSX matching the prototype.

export const APP_BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #F7F4ED; color: #0E1116; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
::selection { background: #FF5B3A; color: #F7F4ED; }

/* Pulse dot animation (reused by PulseDot component) */
@keyframes mv-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,91,58,0.55); } 70% { box-shadow: 0 0 0 7px rgba(255,91,58,0); } 100% { box-shadow: 0 0 0 0 rgba(255,91,58,0); } }
.pulse-dot { animation: mv-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

/* Tabular numbers in tables / metric values */
.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }

/* Inputs (for forms in settings / auth) */
input[type=text], input[type=email], input[type=password], select, textarea {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #DDD5C2;
  padding: 13px 16px;
  font-size: 15px;
  font-family: 'Inter Tight', system-ui, sans-serif;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #FF5B3A;
  box-shadow: 0 0 0 4px #FFE8E0;
}

/* Tables (for /app/reports + admin) */
table.editorial { width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #0E1116; }
table.editorial th { background: #F7F4ED; padding: 14px 18px; text-align: left; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.14em; color: #1F2429; border-bottom: 1px solid #0E1116; }
table.editorial td { padding: 14px 18px; text-align: left; font-size: 14px; border-bottom: 1px solid rgba(14,17,22,0.08); }
table.editorial tbody tr:last-child td { border-bottom: none; }
table.editorial tbody tr:hover { background: #F7F4ED; }
table.editorial td.num { font-family: 'JetBrains Mono', ui-monospace, monospace; text-align: right; font-variant-numeric: tabular-nums; }
table.editorial th.num { text-align: right; }

/* Form layout helpers */
.form-stack { display: grid; gap: 16px; }
.form-stack label { display: block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #1F2429; margin-bottom: 10px; }

/* Alerts */
.alert { padding: 12px 16px; border: 1px solid #DDD5C2; background: #EBE5D7; font-size: 13px; }
.alert.err { background: #FFE8E0; border-color: #FF5B3A; color: #C73E1D; }
.alert.ok  { background: #E8F0EC; border-color: #2D6A4F; color: #2D6A4F; }

@media (max-width: 1100px) {
  /* sidebar collapses behind scroll on narrow screens (still works in iframe previews) */
}
`;
