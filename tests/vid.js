/* يفحص الفيديو المميز في كل درس عبر خادم محلي (التضمين يحتاج http) */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const srv = http.createServer((q, r) => {
  const u = q.url.split('?')[0];
  fs.readFile(path.join(root, u === '/' ? 'index.html' : u), (e, d) => { if (e) { r.statusCode = 404; r.end(); return; } r.end(d); });
}).listen(8766, async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const e = [];
  p.on('pageerror', x => e.push(x.message));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(300);
  const res = await p.evaluate(() => {
    const out = {};
    return Promise.resolve().then(() => out);
  });
  const ids = []; for (let i = 1; i <= 15; i++) ids.push('L' + i);
  const report = {};
  for (const id of ids) {
    await p.evaluate(i => { location.hash = '#lesson-' + i; }, id); await p.waitForTimeout(80);
    report[id] = await p.locator('.vid-sec').count();
  }
  console.log('featured video per lesson:', JSON.stringify(report));
  await p.evaluate(() => { location.hash = '#lesson-L8'; }); await p.waitForTimeout(100);
  await p.click('[data-play]');
  console.log('iframe src:', await p.locator('iframe.vid-frame').getAttribute('src'));
  await p.evaluate(() => { location.hash = '#lesson-L9'; }); await p.waitForTimeout(100);
  console.log('L9 extra links:', await p.locator('.vids a').count());
  console.log('errors:', e);
  await b.close(); srv.close();
});
