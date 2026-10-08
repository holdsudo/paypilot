// Render icon + OG image with headless Chrome (real fonts, real SVG gradients).
import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
import { readFileSync } from 'fs';
const root = '/Users/championautofinance/paypilot/src/assets';
const svg = readFileSync(root + '/img/favicon.svg', 'utf8');
const font = (n, f) => `@font-face{font-family:${n};src:url(data:font/woff2;base64,${readFileSync(root + '/fonts/' + f).toString('base64')})}`;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 180, height: 180 } });
await p.setContent(`<style>html,body{margin:0;background:transparent}svg{width:180px;height:180px;display:block}</style>${svg}`);
await p.screenshot({ path: root + '/img/apple-touch-icon.png', omitBackground: true });
await p.setViewportSize({ width: 1200, height: 630 });
const mark = svg.replace('<rect width="100" height="100" rx="24" fill="#120F24"/>', '');
await p.setContent(`<style>${font('Sora', 'sora-var.woff2')}html,body{margin:0}body{width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:34px;background:radial-gradient(60% 80% at 75% 20%,#3B1F7A,transparent 60%),radial-gradient(50% 70% at 10% 100%,#1E3A8A55,transparent 60%),#06050D;font-family:Sora;color:#fff}
svg{width:190px;height:190px}h1{margin:0;font-size:120px;font-weight:600;letter-spacing:-5px}p{margin:8px 0 0;font-size:36px;color:#C4B5FD;letter-spacing:-.5px}</style>${mark}<div><h1>PayPilot</h1><p>Payments, piloted.</p></div>`);
await p.screenshot({ path: root + '/img/og.jpg', type: 'jpeg', quality: 88 });
await b.close(); console.log('ok');
