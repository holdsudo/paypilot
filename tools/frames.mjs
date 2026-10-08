// Viewport frames at scroll positions (how a real visitor sees it).
import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const [url, out, w = '1440', h = '900', ...stops] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
for (const s of stops) {
  const [sel, frac = '0'] = s.split('@');
  const y = await p.evaluate(([sel, frac]) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return scrollY + r.top + (el.offsetHeight - innerHeight) * +frac; }, [sel, frac]);
  await p.evaluate(v => scrollTo(0, v), Math.max(0, y)); await p.waitForTimeout(1400);
  const name = (sel + '_' + frac).replace(/[^a-z0-9_]/gi, '');
  await p.screenshot({ path: `${out}/${name}.png` });
}
console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors'); await b.close();
