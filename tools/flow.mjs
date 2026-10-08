import { createRequire } from 'module';
const require = createRequire('/Users/championautofinance/guallpas-million-site/package.json');
const { chromium } = require('playwright-core');
const S = process.argv[2], base = 'http://localhost:8768';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errs = []; const mk = async (vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(p.url() + ' ' + e.message)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(p.url() + ' ' + m.text())); return p; };
let p = await mk({ width: 1440, height: 900 });
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#pos').scrollIntoView()); await p.waitForTimeout(600);
console.log('pos seeded total', await p.textContent('.pos__total [data-total]'));
await p.click('.pos__tabs [data-menu=cafe]'); await p.click('.pos__item[data-i="0"]'); await p.click('.pos__item[data-i="3"]');
console.log('after adds', await p.textContent('.pos__total [data-total]'), await p.$$eval('.pos__line', a => a.length));
await p.click('.pos__pay'); await p.waitForTimeout(2200); console.log('overlay', (await p.textContent('.pos__overlay')).trim().slice(0, 40));
await p.screenshot({ path: S + '/pos-approved.png' }); await p.waitForTimeout(1800);
await p.evaluate(() => document.querySelector('#wallet').scrollIntoView()); await p.waitForTimeout(400);
await p.click('[data-k=del]'); await p.click('[data-k=del]'); await p.click('[data-k="4"]'); await p.click('[data-k="0"]');
console.log('wallet amt', await p.textContent('.w-amt')); await p.click('.w-send'); await p.waitForTimeout(1400);
console.log('balances', await p.textContent('.phone.a .w-bal'), '|', await p.textContent('.phone.b .w-bal'), '| feed', await p.$$eval('.feed__item', a => a.length));
await p.evaluate(() => document.querySelector('#hardware').scrollIntoView()); await p.waitForTimeout(800); await p.click('[data-hw="1"]'); await p.waitForTimeout(1200);
await p.screenshot({ path: S + '/hw-go.png' }); await p.click('[data-hw="2"]'); await p.waitForTimeout(1200); await p.screenshot({ path: S + '/hw-reader.png' });
await p.goto(base + '/get-started/', { waitUntil: 'networkidle' });
await p.check('input[name=type][value=retail]', { force: true }); await p.click('.fstep.on [data-next]'); await p.click('.fstep.on [data-next]');
await p.fill('#g-name', 'Ana'); await p.fill('#g-biz', 'Ana Co'); await p.fill('#g-email', 'a@b.co'); await p.fill('#g-phone', '5555555555'); await p.click('.fstep.on [type=submit]'); await p.waitForTimeout(400);
console.log('wizard done', await p.isVisible('#gs-done'));
await p.goto(base + '/pricing/', { waitUntil: 'networkidle' }); console.log('calc', await p.textContent('#o-today'));
for (const u of ['/', '/pos/', '/wallet/', '/hardware/', '/online/', '/pricing/', '/get-started/']) {
  const q = await mk({ width: 390, height: 844 }); await q.goto(base + u, { waitUntil: 'networkidle' }); await q.waitForTimeout(800);
  const ov = await q.evaluate(() => document.documentElement.scrollWidth > innerWidth); console.log('mobile', u, 'overflow', ov);
  if (u === '/' ) { await q.screenshot({ path: S + '/m-home.png' }); await q.evaluate(() => document.querySelector('#pos').scrollIntoView()); await q.waitForTimeout(500); await q.screenshot({ path: S + '/m-pos.png' }); await q.evaluate(() => document.querySelector('#wallet').scrollIntoView()); await q.waitForTimeout(500); await q.screenshot({ path: S + '/m-wallet.png' }); }
  await q.close();
}
for (const u of ['/pos/', '/hardware/', '/online/', '/pricing/']) { const q = await mk({ width: 1440, height: 900 }); await q.goto(base + u, { waitUntil: 'networkidle' }); await q.waitForTimeout(1500); await q.screenshot({ path: S + '/d' + u.replace(/\//g, '_') + '.png' }); await q.close(); }
console.log(errs.length ? 'ERRORS\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'no errors'); await b.close();
