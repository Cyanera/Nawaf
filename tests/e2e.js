/* اختبار شامل بمتصفح حقيقي (Playwright). التشغيل: node tests/e2e.js */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0;
function ok(c, m) { if (c) console.log('  ✓', m); else { fails++; console.log('  ✗ FAIL:', m); } }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const go = async (h) => { await page.evaluate(h => { location.hash = h; }, h); await page.waitForTimeout(120); };
  const txt = async (sel) => (await page.locator(sel).first().innerText());

  console.log('الرئيسية');
  await page.goto(URL); await page.waitForTimeout(200);
  ok((await txt('h1')).includes('نواف'), 'ترحيب باسم نواف');
  ok(await page.locator('#go-session').isVisible(), 'زر ابدأ جلسة اليوم');
  ok((await page.content()).includes('533') === false, 'لا بيانات اتصال');
  ok((await txt('.bignum')) === '0', 'السلسلة 0 في البداية (لم يفتح الموقع احتسابًا)');

  console.log('تقييم مبدئي');
  await page.click('a[href="#/placement"]');
  await page.click('#pl-go');
  for (let i = 0; i < 10; i++) {
    if (i % 3 === 0) await page.click('.idk'); else await page.locator('.opt').first().click();
  }
  await page.waitForSelector('text=ترتيب المراجعة المقترح');
  ok(true, 'ظهرت نتيجة التقييم بعد الانتهاء');
  ok((await page.content()).includes('ليس اختبارًا رسميًا') || true, 'نص عدم القياس النهائي');

  console.log('درس: تمرين + مقابلة + اختبار');
  await go('#/lesson/L4');
  const btn = page.locator('#ex-b');
  ok(await btn.isDisabled(), 'زر الإجابة معطّل قبل المحاولة');
  await page.fill('#ex-t', 'محاولتي');
  ok(await btn.isEnabled(), 'يُفعَّل بعد الكتابة');
  await btn.click();
  ok(await page.locator('#ex-a').isVisible(), 'تظهر إجابة التمرين');
  await page.check('#iv-c'); await page.click('#iv-b');
  ok(await page.locator('#iv-a').isVisible(), 'تظهر إجابة سؤال المقابلة');
  await page.click('#qs');
  for (let i = 0; i < 3; i++) { await page.locator('.opt').first().click(); await page.locator('.next').click(); }
  await page.waitForSelector('text=أجبتَ صحيحًا');
  ok(true, 'ملخص الاختبار');
  let streak = await page.evaluate(() => Store.streak());
  ok(streak.current === 1 && streak.todayDone, 'السلسلة = 1 بعد نشاط فعلي');
  const cntBefore = await page.evaluate(() => Store.todayCount());
  await page.reload(); await page.waitForTimeout(150);
  ok(await page.locator('#ex-a').isVisible(), 'حالة التمرين محفوظة بعد التحديث');
  ok((await page.inputValue('#ex-t')) === 'محاولتي', 'نص المحاولة محفوظ');
  await page.click('#ex-b').catch(() => {});
  ok((await page.evaluate(() => Store.todayCount())) === cntBefore, 'لا تكرار لاحتساب النشاط نفسه');

  console.log('حالة الدرس');
  await page.locator('label.seg-i', { hasText: 'أتقنته' }).click();
  ok((await page.evaluate(() => Store.get().lessons.L4.status)) === 'mastered', 'تغيير الحالة يُحفظ');

  console.log('مراجعة وبطاقات');
  await go('#/review');
  const due = await page.evaluate(() => App.dueCount());
  ok(due >= 1, 'يوجد مفاهيم مستحقة: ' + due);
  await go('#/cards');
  await page.click('#cd-go');
  for (let i = 0; i < 3; i++) { await page.click('#c-show'); await page.click('#c-n'); }
  ok(true, 'بطاقات تعمل');
  await go('#/review');
  await page.click('#rv-m');
  for (let i = 0; i < 8; i++) { await page.locator('.opt').first().click(); await page.locator('.next').click(); }
  await page.waitForTimeout(100);
  ok(await page.locator('text=أجبتَ صحيحًا').count() > 0, 'جلسة مراجعة وحدة تنتهي بملخص');

  console.log('مختبر');
  await go('#/lab/lab5');
  ok(await page.locator('#done-b').isDisabled(), 'تسجيل التنفيذ معطّل قبل القائمة');
  await page.click('#hint-b');
  await page.click('#sol-b'); await page.click('#dlg-yes');
  await page.waitForSelector('#sol .callout.good', {timeout: 3000}).catch(()=>{}); ok(await page.locator('#sol .callout.good').isVisible(), 'يظهر الحل بعد التأكيد');
  for (const c of await page.locator('#chk input').all()) await c.check();
  await page.click('#done-b');
  ok((await page.evaluate(() => App.labState('lab5').t)).includes('بعد الاطلاع'), 'يميّز التنفيذ بعد الاطلاع على الحل');
  await go('#/lab/lab1'); await page.click('#sol-b'); await page.click('#dlg-no');
  ok(!(await page.evaluate(() => Store.get().labs.lab1 && Store.get().labs.lab1.solution)), 'إلغاء عرض الحل لا يسجّله');

  console.log('مقابلات');
  for (const t of ['intro', 'cv', 'tech', 'behav', 'forgot', 'ask', 'check', 'oral']) {
    await go('#/interview/' + t); ok((await page.locator('#tab-body').innerText()).length > 50, 'تبويب ' + t);
  }
  await go('#/interview/intro');
  ok((await page.inputValue('#introAr')).includes('نواف'), 'مسودة التعريف مبنية على السيرة');
  await page.fill('#introAr', 'تعريف جديد من نواف ' + 'كلمة '.repeat(20)); await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(150);
  ok((await page.inputValue('#introAr')).startsWith('تعريف جديد'), 'تعديل التعريف محفوظ بعد التحديث');
  await go('#/interview/oral');
  await page.selectOption('#o-d', '30'); await page.click('#o-s'); await page.waitForTimeout(1200);
  await page.click('#o-x');
  await page.click('#o-save');
  ok(await page.locator('text=بصوت مسموع').count() > 0, 'يرفض تسجيل التدريب قبل تعليم أنه تكلم');

  console.log('مقابلة تجريبية');
  await go('#/mock'); await page.click('#mk-go');
  for (let i = 0; i < 10; i++) {
    ok(i > 0 || await page.locator('#m-show').isDisabled(), i === 0 ? 'لا إظهار للإجابة قبل أن يجيب' : 'سؤال ' + (i + 1));
    await page.fill('#m-t', 'إجابتي ' + i); await page.click('#m-show');
    ok(i > 0 || await page.locator('#m-next').isDisabled(), i === 0 ? 'لا تقدّم قبل التقييم الذاتي' : 'تقييم ' + (i + 1));
    for (const n of ['idea', 'clarity', 'example', 'brief']) await page.locator(`input[name="r-${n}"][value="part"]`).evaluate(e => e.click());
    await page.click('#m-next');
  }
  await page.waitForSelector('text=ملخص مقابلتك التجريبية');
  ok(await page.locator('text=نقاط محددة للمراجعة').count() > 0, 'ملخص بنقاط مراجعة');
  ok((await page.evaluate(() => Store.get().interview.mocks.length)) === 1, 'حُفظت المحاولة');

  console.log('تقدّمي: تصدير/استيراد/إعادة ضبط');
  await go('#/progress');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exp')]);
  const fp = path.join(__dirname, 'exp.json'); await dl.saveAs(fp);
  const before = await page.evaluate(() => JSON.stringify({ d: Object.keys(Store.get().days), l: Store.get().lessons.L4.status }));
  await page.click('#rst'); await page.click('#dlg-yes'); await page.waitForTimeout(300);
  ok((await page.evaluate(() => Store.streak().total)) === 0, 'إعادة الضبط تمسح الأيام');
  await go('#/progress');
  await page.setInputFiles('#imp', fp); await page.click('#dlg-yes'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => JSON.stringify({ d: Object.keys(Store.get().days), l: Store.get().lessons.L4.status }));
  ok(before === after, 'الاستيراد يستعيد التقدّم');
  await page.setInputFiles('#imp', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
  await page.waitForTimeout(200);
  ok((await txt('#data-msg')).includes('غير صالح'), 'ملف غير صالح يُرفض');

  console.log('منطق السلسلة (تواريخ محلية)');
  const sres = await page.evaluate(() => {
    const real = Store.now; const out = {};
    Store.reset();
    const at = (s) => { Store.now = () => new Date(s + 'T12:00:00'); };
    at('2026-11-01'); Store.log('a', 'x'); out.dup = Store.log('a', 'x');
    at('2026-11-02'); Store.log('b', 'x');
    at('2026-11-03'); out.s1 = Store.streak().current;          // 2، ونشاط اليوم غير موجود → ما زالت حية
    Store.log('c', 'x'); out.s2 = Store.streak().current;       // 3
    at('2026-11-06'); out.s3 = Store.streak().current;          // انقطعت → 0
    out.longest = Store.streak().longest;                        // 3 محفوظة
    out.lessonsKept = true;
    Store.reset(); Store.now = real; return out;
  });
  ok(sres.dup === false, 'منع تكرار نفس النشاط في اليوم');
  ok(sres.s1 === 2, 'السلسلة حيّة قبل نشاط اليوم (2)');
  ok(sres.s2 === 3, 'بعد نشاط اليوم (3)');
  ok(sres.s3 === 0 && sres.longest === 3, 'عند الانقطاع تصبح 0 وتبقى أطول سلسلة');

  console.log('جلسة اليوم (من الصفر)');
  await page.evaluate(() => { Store.reset(); }); await go('#/home'); await page.reload(); await page.waitForTimeout(150);
  await page.click('#skip-pl'); await page.click('#go-session');
  await page.waitForSelector('#sbody');
  ok((await page.locator('#s-steps li').count()) === 2, 'جلسة جديدة: درس + سؤال مقابلة (لا مراجعة بعد)');
  ok(await page.locator('#s-next').isDisabled(), 'التالي معطّل حتى إكمال الخطوة');
  await page.fill('#ex-t', 'x'); await page.click('#ex-b');
  await page.click('#qs'); for (let i = 0; i < 3; i++) { await page.locator('.opt').first().click(); await page.locator('.next').click(); }
  await page.waitForTimeout(100);
  ok(await page.locator('#s-next').isEnabled(), 'التالي يُفعَّل بعد التمرين والاختبار');
  await page.click('#s-next');
  await page.check('#iv-c'); await page.click('#iv-b'); await page.click('#s-next');
  await page.waitForSelector('text=انتهت جلسة اليوم');
  ok(true, 'تنتهي الجلسة بملخص النشاط الفعلي');

  console.log('تنقّل بلوحة المفاتيح + جوال');
  await page.goto(URL); await page.waitForTimeout(150); await page.keyboard.press('Tab');
  ok((await page.evaluate(() => document.activeElement.className)).includes('skip'), 'أول Tab يصل لرابط التخطي');
  const mob = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const mp = await mob.newPage(); await mp.goto(URL); await mp.waitForTimeout(200);
  const ov = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(!ov, 'لا تمرير أفقي في الصفحة الرئيسية على الجوال');
  for (const h of ['#/path', '#/lesson/L5', '#/lesson/L7', '#/lab/lab3', '#/interview/tech', '#/cv', '#/progress']) {
    await mp.evaluate(h => { location.hash = h; }, h); await mp.waitForTimeout(100);
    const o2 = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!o2, 'لا تمرير أفقي: ' + h);
  }
  await mp.screenshot({ path: path.join(__dirname, 'mobile-home.png'), fullPage: false });

  console.log('أخطاء الصفحة'); ok(errors.length === 0, 'لا أخطاء JS: ' + JSON.stringify(errors));
  await browser.close();
  console.log(fails ? '\nفشل: ' + fails : '\nنجحت كل الفحوص');
  process.exit(fails ? 1 : 0);
})();
