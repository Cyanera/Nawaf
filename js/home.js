/* الصفحة الرئيسية، جلسة اليوم، صفحة التقدّم وإدارة البيانات */
(function () {
  var D = App.D, LES = App.LES, MOD = App.MOD;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc, inl = UI.inline;
  var S = function () { return Store.get(); };

  function statusBar(c) {
    var total = D.lessons.length;
    return '<div class="stackbar" role="img" aria-label="توزيع حالات الدروس: أتقنت ' + c.mastered + '، قيد التعلّم ' + c.learning + '، أحتاج مراجعة ' + c.review + '، لم أبدأ ' + c['new'] + '">' +
      ['mastered', 'review', 'learning'].map(function (k) { return c[k] ? '<span class="sb-' + k + '" style="width:' + (c[k] / total * 100) + '%"></span>' : ''; }).join('') + '</div>';
  }

  /* ================== الرئيسية ================== */
  App.views.home = function () {
    var next = App.nextLesson(), st = Store.streak(), c = App.counts(), due = App.dueCount(), msg = App.streakMessage();
    var todayActs = S().days[Store.day()] || [];
    var h = '<section class="hero"><p class="eyebrow">ابدأ من هنا</p><h1>أهلًا بك يا نواف</h1>' +
      '<p class="lead">لا يلزمك أن تتذكر كل شيء دفعة واحدة. نراجع الأساسيات بخطوات صغيرة، ونتدرّب على شرحها كما ستفعل في المقابلة.</p>' +
      '<button class="btn btn-primary btn-lg" id="go-session">ابدأ جلسة اليوم</button>' +
      '<p class="muted small">جلسة مقترحة من 15 إلى 20 دقيقة: مراجعة قصيرة، ثم درس واحد، ثم سؤال مقابلة.</p></section>';
    if (Store.memoryOnly()) h += '<div class="callout warn"><strong>تنبيه</strong><p>التخزين المحلي غير متاح في هذا المتصفح (ربما بسبب الوضع الخاص). لن يُحفظ تقدّمك بعد إغلاق الصفحة. استخدم «تصدير التقدّم» من صفحة «تقدّمي» لحفظ نسخة.</p></div>';
    if (!S().placement && !S().placementSkipped) {
      h += '<div class="card"><h2>تقييم مبدئي خفيف (اختياري)</h2><p>10 أسئلة قصيرة تقترح بما تبدأ المراجعة. لا شيء يُحسب عليك، ويمكنك تخطّيه.</p>' +
        '<div class="row"><a class="btn" href="#/placement">ابدأ التقييم</a><button class="btn btn-ghost" id="skip-pl">تخطَّ وابدأ مباشرة</button></div></div>';
    }
    h += '<div class="grid3">';
    h += '<section class="card"><h2>الخطوة التالية</h2>';
    if (next) h += '<p><strong>' + inl(next.title) + '</strong></p><p class="muted small">' + esc(MOD[next.module].title) + ' · ' + next.minutes + ' دقائق تقريبًا</p><a class="btn" href="#/lesson/' + next.id + '">' + (App.status(next.id) === 'learning' ? 'تابع الدرس' : 'ابدأ الدرس') + '</a>';
    else h += '<p>بدأتَ كل الدروس. الخطوة المفيدة الآن: مقابلة تجريبية أو مختبر عملي.</p><a class="btn" href="#/mock">مقابلة تجريبية</a>';
    if (due) h += '<p class="small muted">لديك ' + due + ' مفهومًا للمراجعة. <a href="#/review">راجعها</a></p>';
    h += '</section>';
    h += '<section class="card"><h2>أيام التعلّم المتتالية</h2><p class="bignum">' + msg.big + '</p><p class="muted small">' + esc(msg.text) + '</p>' + (st.longest > 1 ? '<p class="small muted">أطول سلسلة لك: ' + st.longest + ' أيام.</p>' : '') + '</section>';
    h += '<section class="card"><h2>تقدّمك الفعلي</h2><p><strong>' + c.mastered + '</strong> من ' + D.lessons.length + ' دروس بحالة «أتقنته»</p>' + statusBar(c) +
      '<p class="muted small">قيد التعلّم: ' + c.learning + ' · أحتاج مراجعة: ' + c.review + ' · لم أبدأ: ' + c['new'] + '</p>' +
      '<p class="small">اليوم: ' + (todayActs.length ? todayActs.length + ' نشاط تعلّم مسجّل' : 'لا نشاط مسجّلًا بعد') + '</p></section>';
    h += '</div>';
    h += '<p class="muted small note">يُحفظ تقدّمك محليًا على هذا الجهاز وهذا المتصفح فقط (LocalStorage)، ولا يُرسل إلى أي جهة. لنقله إلى جهاز آخر استخدم «تصدير التقدّم» في صفحة «تقدّمي».</p>';
    App.mount(h, { title: 'ابدأ من هنا' });
    $('#go-session').addEventListener('click', function () { location.hash = '#/session'; });
    var sk = $('#skip-pl'); if (sk) sk.addEventListener('click', function () { S().placementSkipped = true; Store.save(); App.views.home(); });
  };

  /* ================== جلسة اليوم ================== */
  function pickStudied() {
    var ls = D.lessons.filter(function (l) { return App.status(l.id) !== 'new'; });
    if (!ls.length) return null;
    var fresh = ls.filter(function (l) { return !Store.lesson(l.id).ivDone; });
    return UI.shuffle(fresh.length ? fresh : ls)[0].id;
  }
  function buildSteps() {
    var steps = [], rev = App.pickReview(4), nl = App.nextLesson();
    if (rev.length) steps.push({ type: 'review', qs: rev, title: 'مراجعة سريعة', min: 4 });
    if (nl) steps.push({ type: 'lesson', id: nl.id, title: 'درس: ' + nl.title, min: Math.min(nl.minutes, 10) });
    var iv = nl ? nl.id : pickStudied();
    if (iv) steps.push({ type: 'iv', id: iv, title: 'سؤال مقابلة', min: 4 });
    if (!steps.length) steps.push({ type: 'link', title: 'مقابلة تجريبية', min: 15 });
    return steps;
  }

  App.views.session = function () {
    var steps = buildSteps(), i = 0, done = false;
    var total = steps.reduce(function (a, s) { return a + s.min; }, 0);
    var h = '<h1>جلسة اليوم</h1><p class="muted" id="s-meta"></p><ol class="stepper" id="s-steps">' +
      steps.map(function (s, k) { return '<li data-k="' + k + '">' + esc(s.title) + '</li>'; }).join('') + '</ol>' +
      '<div id="sbody" class="card"></div><div class="row between"><button class="btn btn-ghost" id="s-skip">تخطَّ هذه الخطوة</button><button class="btn btn-primary" id="s-next" disabled>التالي</button></div>';
    App.mount(h, { title: 'جلسة اليوم' });
    $('#s-meta').textContent = 'نحو ' + total + ' دقيقة · ' + steps.length + ' ' + (steps.length === 1 ? 'خطوة' : 'خطوات') + '. التخطّي لا يُسجَّل نشاطًا ولا يضرّ تقدّمك.';

    function mark() {
      done = true; var b = $('#s-next'); b.disabled = false; b.textContent = i + 1 < steps.length ? 'التالي' : 'إنهاء الجلسة';
    }
    function show() {
      done = false;
      $$('#s-steps li').forEach(function (li, k) { li.className = k < i ? 'done' : (k === i ? 'cur' : ''); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      var b = $('#s-next'); b.disabled = true; b.textContent = i + 1 < steps.length ? 'التالي' : 'إنهاء الجلسة';
      var s = steps[i], body = $('#sbody');
      body.innerHTML = '';
      if (s.type === 'review') {
        body.innerHTML = '<h2>' + esc(s.title) + '</h2><div id="sr"></div>';
        App.renderReviewRun($('#sr'), s.qs, { onDone: mark });
      } else if (s.type === 'lesson') {
        App.renderLesson(body, s.id, {
          parts: ['title', 'what', 'why', 'example', 'exercise', 'quiz'],
          onEvent: function () { var r = Store.lesson(s.id); if (r.exDone && r.quizLast && r.quizLast.day === Store.day()) mark(); }
        });
        var r0 = Store.lesson(s.id); if (r0.exDone && r0.quizLast && r0.quizLast.day === Store.day()) mark();
      } else if (s.type === 'iv') {
        App.renderLesson(body, s.id, { parts: ['title', 'interview', 'mistake'], onEvent: function (e) { if (e === 'interview') mark(); } });
        if (Store.lesson(s.id).ivDone) mark();
      } else {
        body.innerHTML = '<h2>لا يوجد شيء مستحق</h2><p>جرّب مقابلة تجريبية أو مختبرًا عمليًا.</p><a class="btn btn-primary" href="#/mock">مقابلة تجريبية</a> <a class="btn" href="#/labs">المختبر</a>';
        mark();
      }
      window.scrollTo(0, 0);
    }
    function finish() {
      var acts = S().days[Store.day()] || [], msg = App.streakMessage();
      $('#s-steps').hidden = true; $('#s-meta').hidden = true;
      $('#sbody').innerHTML = '<h2>انتهت جلسة اليوم</h2>' + (acts.length ? '<p>المسجَّل لك اليوم:</p><ul>' + acts.map(function (a) { return '<li>' + esc(a.l) + '</li>'; }).join('') + '</ul>' : '<p>لم يُسجَّل نشاط اليوم لأن الخطوات تُركت دون إكمال. لا بأس، ابدأ بخطوة واحدة متى شئت.</p>') +
        '<p class="muted">' + esc('السلسلة: ' + msg.big + ' ' + msg.text) + '</p><a class="btn btn-primary" href="#/home">العودة للرئيسية</a>';
      document.querySelector('.row.between').hidden = true;
    }
    $('#s-next').addEventListener('click', function () { if (!done) return; i++; if (i >= steps.length) finish(); else show(); });
    $('#s-skip').addEventListener('click', function () { i++; if (i >= steps.length) finish(); else show(); });
    show();
  };

  /* ================== تقدّمي ================== */
  App.views.progress = function () {
    var c = App.counts(), st = Store.streak(), s = S();
    var exN = 0, ivN = 0, qzN = 0;
    D.lessons.forEach(function (l) { var r = s.lessons[l.id]; if (r) { if (r.exDone) exN++; if (r.ivDone) ivN++; if (r.quizDone) qzN++; } });
    var labsDone = 0, labsRead = 0;
    Object.keys(s.labs).forEach(function (k) { if (s.labs[k].done) labsDone++; else if (s.labs[k].solution) labsRead++; });
    var oral = Object.keys(s.interview.practiced).length;
    var h = '<h1>تقدّمي</h1><p class="lead">كل رقم هنا يعكس نشاطًا سجّلتَه فعلًا. لا توجد نسب تجميلية.</p>';
    h += '<div class="grid3"><section class="card"><h2>الدروس</h2><p><strong>' + c.mastered + '</strong> من ' + D.lessons.length + ' أتقنتَها</p>' + statusBar(c) + '<p class="small muted">قيد التعلّم ' + c.learning + ' · أحتاج مراجعة ' + c.review + ' · لم أبدأ ' + c['new'] + '</p></section>' +
      '<section class="card"><h2>ما أنجزته</h2><ul class="plain tight"><li>تمارين دروس: ' + exN + '</li><li>أسئلة مقابلة في الدروس: ' + ivN + '</li><li>اختبارات دروس: ' + qzN + '</li><li>مختبرات نُفّذت فعليًا: ' + labsDone + '</li><li>مختبرات اطّلعتَ على حلها فقط: ' + labsRead + '</li><li>مقابلات تجريبية: ' + s.interview.mocks.length + '</li><li>أسئلة تدرّبتَ عليها شفهيًا: ' + oral + '</li></ul></section>' +
      '<section class="card"><h2>الاستمرارية</h2><p class="bignum">' + st.current + '</p><p class="small muted">يوم متتالٍ حاليًا · أطول سلسلة ' + st.longest + ' · إجمالي أيام النشاط ' + st.total + '</p><p class="small muted">الأسئلة: صحيح ' + s.qlog.correct + ' من ' + s.qlog.answered + ' محاولة (جميع المحاولات).</p></section></div>';

    /* تقويم آخر 28 يومًا */
    var cells = '', today = Store.day(), act = 0;
    for (var k = 27; k >= 0; k--) {
      var d = Store.addDays(today, -k), n = (s.days[d] || []).length; if (n) act++;
      cells += '<li class="' + (n ? 'on' : '') + (k === 0 ? ' today' : '') + '" title="' + esc(UI.fmtDateShort(d)) + ': ' + n + ' نشاط"><span class="sr">' + esc(UI.fmtDateShort(d)) + ': ' + (n ? n + ' نشاط' : 'لا نشاط') + '</span></li>';
    }
    h += '<section class="card"><h2>آخر 28 يومًا</h2><ul class="cal" role="list">' + cells + '</ul><p class="small muted">الأيام الملوّنة فيها نشاط تعلّم فعلي (' + act + ' يومًا). فتح الموقع وحده لا يُحتسب.</p></section>';

    h += '<section class="card"><h2>الإنجازات</h2><p class="muted small">كل إنجاز مرتبط بعمل فعلي.</p><ul class="ach">' + App.ACH.map(function (a) {
      var got = s.ach[a.id];
      return '<li class="' + (got ? 'got' : '') + '"><strong>' + esc(a.title) + '</strong><span class="small">' + esc(a.desc) + '</span><span class="small muted">' + (got ? 'تحقق في ' + UI.fmtDateShort(got) : 'لم يتحقق بعد') + '</span></li>';
    }).join('') + '</ul></section>';

    h += '<section class="card"><h2>بياناتي</h2><p>يُحفظ تقدّمك في متصفحك هذا فقط. إذا مسحتَ بيانات الموقع أو غيّرتَ الجهاز فسيختفي، لذلك يُنصح بتصدير نسخة احتياطية بين فترة وأخرى.</p>' +
      '<div class="row wrap"><button class="btn" id="exp">تصدير التقدّم (ملف JSON)</button><label class="btn" for="imp" tabindex="0" id="imp-l">استيراد تقدّم</label><input type="file" id="imp" accept="application/json,.json" hidden><button class="btn btn-danger" id="rst">إعادة ضبط كل شيء</button></div><p class="small muted" id="data-msg" role="status"></p></section>';
    App.mount(h, { title: 'تقدّمي' });

    var msg = $('#data-msg');
    $('#exp').addEventListener('click', function () {
      var blob = new Blob([Store.exportJSON()], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'nawaf-progress-' + Store.day() + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
      msg.textContent = 'تم تجهيز ملف التقدّم للتنزيل.';
    });
    $('#imp-l').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#imp').click(); } });
    $('#imp').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var obj;
        try { obj = JSON.parse(rd.result); if (!obj || obj.v !== 1 || typeof obj.days !== 'object') throw new Error('bad'); }
        catch (err) { msg.textContent = 'الملف غير صالح: لم يُغيَّر أي شيء.'; return; }
        UI.confirmDialog({ title: 'استيراد التقدّم؟', body: 'سيحل التقدّم الموجود في الملف محل تقدّمك الحالي على هذا الجهاز.', yes: 'استبدل', danger: true }).then(function (ok) {
          if (!ok) return;
          try { Store.importObj(obj); App.checkAch(); UI.toast('تم استيراد التقدّم'); App.views.progress(); } catch (er) { msg.textContent = 'تعذّر الاستيراد.'; }
        });
      };
      rd.readAsText(f);
    });
    $('#rst').addEventListener('click', function () {
      UI.confirmDialog({ title: 'إعادة ضبط كل شيء؟', body: 'سيُمسح كل تقدّمك ومسوداتك على هذا الجهاز ولا يمكن التراجع. إن أردت الاحتفاظ بنسخة فصدّر التقدّم أولًا.', yes: 'نعم، امسح كل شيء', danger: true }).then(function (ok) {
        if (!ok) return; Store.reset(); UI.toast('أُعيد الضبط'); location.hash = '#/home'; App.views.home();
      });
    });
  };
})();
