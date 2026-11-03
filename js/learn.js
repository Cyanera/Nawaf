/* صفحات التعلّم: الدرس، المسار، المراجعة، البطاقات، التقييم المبدئي، أساس المسار من السيرة */
(function () {
  var D = App.D, LES = App.LES, MOD = App.MOD;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc, md = UI.md, inl = UI.inline;
  var S = function () { return Store.get(); };
  var ALL_PARTS = ['head', 'what', 'video', 'why', 'example', 'exercise', 'interview', 'mistake', 'quiz', 'cards', 'videos', 'refs', 'nav'];

  function sec(n, title, body, cls) {
    return '<section class="step ' + (cls || '') + '"><h2><span class="num" aria-hidden="true">' + n + '</span>' + esc(title) + '</h2>' + body + '</section>';
  }
  function cvBadge(l) {
    return l.inCv ? '<span class="badge cv">مذكور في سيرتك</span>' : '<span class="badge sug">أساسية مقترحة للمراجعة</span>';
  }

  /* ملخص نتائج مجموعة أسئلة */
  App.resultSummary = function (results) {
    var ok = results.filter(function (r) { return r.correct === true; }).length;
    var idk = results.filter(function (r) { return r.idk; }).length;
    var missed = results.filter(function (r) { return r.correct !== true; });
    var h = '<div class="callout"><strong>أجبتَ صحيحًا عن ' + ok + ' من ' + results.length + '</strong>' + (idk ? '<p class="muted">«لا أتذكر»: ' + idk + '. وهذا طبيعي بعد فترة من الانقطاع.</p>' : '') + '</div>';
    if (missed.length) {
      h += '<h3>للمراجعة</h3><ul class="plain">' + missed.map(function (r) {
        var l = r.lesson ? LES[r.lesson] : null;
        return '<li><div>' + inl(r.q.q) + '</div><div class="small">الإجابة الصحيحة: ' + inl(r.correctText) + '</div><div class="small muted">' + inl(r.explain || '') + '</div>' +
          (l ? '<a class="small" href="#lesson-' + l.id + '">راجع درس «' + esc(l.title) + '»</a>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    return h;
  };

  function videoCard(id) {
    var vs = D.videos && D.videos[id]; if (!vs || !vs.length) return '';
    var v = vs[0], vid = (v[1].split('v=')[1] || '').split('&')[0];
    var embed = location.protocol.indexOf('http') === 0 && typeof window.claude === 'undefined';
    return sec('▶', 'شاهد الشرح بالعربي', '<p><strong>' + esc(v[0]) + '</strong></p><div class="vid-box" data-vid="' + esc(vid) + '" data-title="' + esc(v[0]) + '">' +
      (embed ? '<button class="btn btn-primary" data-play>شغّل الفيديو هنا</button> ' : '') +
      '<a class="btn" href="' + esc(v[1]) + '" target="_blank" rel="noopener noreferrer">افتحه على يوتيوب</a></div>' +
      '<p class="muted small">شاهده بعد قراءة الشرح أعلاه ثم جرّب التمرين. العنوان من نتائج بحث يوتيوب ولم أراجع المحتوى.</p>', 'vid-sec');
  }

  /* ================== الدرس ================== */
  App.renderLesson = function (root, id, opts) {
    opts = opts || {};
    var L = LES[id]; if (!L) { root.innerHTML = '<p>الدرس غير موجود.</p>'; return; }
    var parts = opts.parts || ALL_PARTS, rec = Store.lesson(id);
    function has(p) { return parts.indexOf(p) >= 0; }
    var h = '';
    if (has('head')) {
      var m = MOD[L.module];
      h += '<header class="lesson-head"><p class="crumb"><a href="#path">المسار</a> › ' + esc(m.title) + '</p><h1>' + inl(L.title) + '</h1>' +
        '<p class="meta">' + cvBadge(L) + '<span class="badge plain">' + L.minutes + ' دقائق تقريبًا</span></p><p class="muted small">' + esc(L.cvNote) + '</p>' +
        '<fieldset class="seg" id="st"><legend>حالتك مع هذا الدرس</legend>' + App.STATUS_ORDER.map(function (s) {
          return '<label class="seg-i"><input type="radio" name="st" value="' + s + '"' + (rec.status === s ? ' checked' : '') + '><span>' + App.STATUS[s] + '</span></label>';
        }).join('') + '</fieldset></header>';
    }
    if (has('title')) h += '<h2 class="lesson-title">' + inl(L.title) + ' ' + cvBadge(L) + '</h2>';
    var dg = D.diagrams && D.diagrams[id], fig = dg ? '<figure class="dg-fig">' + dg.svg + '<figcaption>' + esc(dg.cap) + '</figcaption></figure>' : '';
    if (has('what')) h += sec('1', 'ما هو؟', md(L.what) + fig);
    if (has('video')) h += videoCard(id);
    if (has('why')) h += sec('2', 'أين يُستخدم في العمل؟', md(L.why));
    if (has('example')) h += sec('3', 'مثال عملي', md(L.example));
    if (has('exercise')) {
      h += sec('4', 'جرّب بنفسك', '<div class="task">' + md(L.exercise.task) + '</div>' +
        '<label class="lbl" for="ex-t">محاولتك (اختيارية الكتابة)</label><textarea id="ex-t" rows="4" placeholder="اكتب محاولتك هنا قبل رؤية الإجابة"></textarea>' +
        '<label class="check"><input type="checkbox" id="ex-c"> حلّلتُه ذهنيًا أو على ورقة</label>' +
        '<button class="btn btn-primary" id="ex-b" disabled>اعرض الإجابة</button><div id="ex-a" hidden></div>' + (L.tool ? '<p class="small"><a href="#subnet">حاسبة الشبكات الفرعية</a> للتحقق من إجابتك بعد أن تحاول بنفسك.</p>' : ''));
    }
    if (has('interview')) {
      h += sec('5', 'سؤال مقابلة', '<p class="q">' + inl(L.interview.q) + '</p>' +
        '<label class="lbl" for="iv-t">أجب بأسلوبك كما ستقول في المقابلة</label><textarea id="iv-t" rows="4" placeholder="اكتب إجابتك هنا ثم اعرض الإجابة المقترحة"></textarea>' +
        '<label class="check"><input type="checkbox" id="iv-c"> أجبتُ شفهيًا بصوت مسموع</label>' +
        '<button class="btn btn-primary" id="iv-b" disabled>اعرض الإجابة المقترحة</button><div id="iv-a" hidden></div>');
    }
    if (has('mistake')) {
      h += sec('6', 'خطأ شائع', '<div class="callout warn"><p><strong>الخطأ:</strong> ' + inl(L.mistake.wrong) + '</p><p><strong>كيف تتجنبه:</strong> ' + inl(L.mistake.fix) + '</p></div>');
    }
    if (has('quiz')) h += sec('✓', 'تحقق سريع', '<div id="qz"></div>', 'quiz-sec');
    if (has('cards')) {
      h += sec('↺', 'بطاقات استرجاع', '<p class="muted small">حاول التذكّر أولًا ثم أظهر الإجابة.</p><ul class="cards-list">' + L.cards.map(function (c, i) {
        return '<li><div class="c-q">' + inl(c[0]) + '</div><button class="btn btn-ghost c-t" aria-expanded="false" data-i="' + i + '">أظهر الإجابة</button><div class="c-a" hidden>' + inl(c[1]) + '</div></li>';
      }).join('') + '</ul>');
    }
    if (has('videos') && D.videos && D.videos[id] && D.videos[id].length > 1) {
      h += sec('▶', 'شروحات إضافية', '<ul class="vids">' + D.videos[id].slice(1).map(function (v) { return '<li><a href="' + esc(v[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(v[0]) + '</a></li>'; }).join('') + '</ul><p class="muted small">الروابط من نتائج بحث يوتيوب بالعربية، والعناوين كما ظهرت. لم تُراجَع محتوياتها، فشاهد مقطعًا قصيرًا وقرّر هل يناسبك. تفتح في تبويب جديد.</p>');
    }
    if (has('refs') && L.refs.length) h += sec('↗', 'للتوسّع (مصادر رسمية)', App.refsHTML(L.refs) + '<p class="muted small">الروابط تفتح صفحات خارجية، وقد تتغيّر مساراتها مع الوقت.</p>');
    if (has('nav')) {
      var prev = D.lessons[L.idx - 1], next = D.lessons[L.idx + 1];
      h += '<nav class="pager" aria-label="التنقل بين الدروس">' + (prev ? '<a class="btn" href="#lesson-' + prev.id + '">→ ' + esc(prev.title) + '</a>' : '<span></span>') +
        (next ? '<a class="btn" href="#lesson-' + next.id + '">' + esc(next.title) + ' ←</a>' : '<span></span>') + '</nav>';
    }
    root.innerHTML = h;
    function ev(name) { opts.onEvent && opts.onEvent(name); }
    function syncStatus() { var r = $('input[name="st"][value="' + rec.status + '"]', root); if (r) r.checked = true; }

    $$('input[name="st"]', root).forEach(function (r) {
      r.addEventListener('change', function () { rec.status = r.value; Store.save(); App.checkAch(); });
    });

    /* التمرين */
    if (has('exercise')) {
      var exT = $('#ex-t', root), exC = $('#ex-c', root), exB = $('#ex-b', root), exA = $('#ex-a', root);
      exT.value = rec.ex || '';
      function showEx() {
        exA.hidden = false; exB.hidden = true;
        exA.innerHTML = '<div class="callout good"><strong>الإجابة المقترحة</strong>' + md(L.exercise.answer) + '</div><p class="muted small">قارن إجابتك بها: ما الذي أصبته، وما الذي فاتك؟</p>';
      }
      function upd() { exB.disabled = !(exT.value.trim() || exC.checked); }
      exT.addEventListener('input', function () { rec.ex = exT.value; Store.save(); upd(); });
      exC.addEventListener('change', upd);
      exB.addEventListener('click', function () {
        rec.exDone = true; if (rec.status === 'new') rec.status = 'learning'; Store.save();
        showEx(); syncStatus();
        App.log('lesson:' + id + ':exercise', 'أكملتَ تمرين «' + L.title + '»'); ev('exercise');
      });
      upd(); if (rec.exDone) { exC.checked = true; showEx(); }
    }
    /* سؤال المقابلة */
    if (has('interview')) {
      var ivT = $('#iv-t', root), ivC = $('#iv-c', root), ivB = $('#iv-b', root), ivA = $('#iv-a', root);
      ivT.value = rec.iv || '';
      function showIv() {
        ivA.hidden = false; ivB.hidden = true;
        ivA.innerHTML = '<div class="callout good"><strong>إجابة مقترحة</strong><p>' + inl(L.interview.a) + '</p></div>' +
          '<div class="callout"><strong>ما الذي يبحث عنه المحاور؟</strong><p>' + inl(L.interview.why) + '</p></div>' +
          '<fieldset class="pts"><legend>أي من هذه النقاط ذكرتَها؟ (تقييم ذاتي)</legend>' + L.interview.points.map(function (p) { return '<label class="check"><input type="checkbox"> ' + inl(p) + '</label>'; }).join('') + '</fieldset>';
      }
      function updIv() { ivB.disabled = !(ivT.value.trim() || ivC.checked); }
      ivT.addEventListener('input', function () { rec.iv = ivT.value; Store.save(); updIv(); });
      ivC.addEventListener('change', updIv);
      ivB.addEventListener('click', function () {
        rec.ivDone = true; if (rec.status === 'new') rec.status = 'learning'; Store.save();
        showIv(); syncStatus();
        App.log('lesson:' + id + ':interview', 'تدرّبتَ على سؤال مقابلة «' + L.title + '»'); ev('interview');
      });
      updIv(); if (rec.ivDone) { ivC.checked = true; showIv(); }
    }
    /* الاختبار السريع */
    if (has('quiz')) {
      var qz = $('#qz', root);
      function startQuiz() {
        UI.runQuiz(qz, App.lessonQuestions(id), {
          onDone: function (results) {
            var changed = App.recordAnswers(results);
            var ok = results.filter(function (r) { return r.correct === true; }).length;
            rec.quizDone = true; rec.quizLast = { day: Store.day(), ok: ok, total: results.length };
            Store.save(); syncStatus();
            App.log('lesson:' + id + ':quiz', 'أنهيتَ اختبار «' + L.title + '»');
            showQuizResult(results); ev('quiz');
          }
        });
      }
      function showQuizResult(results) {
        var allOk = results && results.every(function (r) { return r.correct === true; });
        qz.innerHTML = (results ? App.resultSummary(results) : '<div class="callout"><strong>آخر محاولة: ' + rec.quizLast.ok + ' من ' + rec.quizLast.total + '</strong></div>') +
          '<div class="row">' + (allOk && rec.status !== 'mastered' ? '<button class="btn" id="mk">علّم الدرس «أتقنته»</button>' : '') + '<button class="btn" id="rq">أعد الاختبار</button></div>' +
          (results && !allOk ? '<p class="muted small">سيعود هذا المفهوم في المراجعة لاحقًا بأسئلة مختلفة.</p>' : '');
        $('#rq', qz).addEventListener('click', startQuiz);
        var mk = $('#mk', qz); if (mk) mk.addEventListener('click', function () { rec.status = 'mastered'; Store.save(); syncStatus(); App.checkAch(); mk.remove(); UI.toast('حُدّثت حالة الدرس'); });
      }
      if (rec.quizLast) showQuizResult(null);
      else qz.innerHTML = '<p>ثلاثة أسئلة قصيرة بأشكال مختلفة. لا بأس بالخطأ أو بخيار «لا أتذكر».</p><button class="btn btn-primary" id="qs">ابدأ التحقق السريع</button>';
      var qs = $('#qs', qz); if (qs) qs.addEventListener('click', startQuiz);
    }
    $$('[data-play]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var box = b.parentNode, f = document.createElement('iframe');
        f.className = 'vid-frame'; f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.dataset.vid);
        f.title = box.dataset.title; f.loading = 'lazy'; f.allowFullscreen = true; f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        f.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        box.insertBefore(f, box.firstChild); b.remove();
      });
    });
    /* بطاقات الاسترجاع داخل الدرس */
    $$('.c-t', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.nextElementSibling, open = a.hidden;
        a.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'أخفِ الإجابة' : 'أظهر الإجابة';
      });
    });
  };

  App.views.lesson = function (id) {
    var L = LES[id];
    if (!L) { App.mount('<h1>الدرس غير موجود</h1><p><a href="#path">العودة إلى المسار</a></p>'); return; }
    App.mount('<article id="lesson-root"></article>', { title: L.title });
    App.renderLesson($('#lesson-root'), id, {});
    var h = $('#lesson-root h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  };

  /* ================== المسار ================== */
  App.views.path = function () {
    var next = App.nextLesson(), c = App.counts(), p = S().placement;
    var h = '<h1>مسار مراجعة الأساسيات</h1><p class="lead">خمس وحدات، كل درس يأخذ 8–12 دقيقة، ويمكنك إنجازه على جلستين. الترتيب إرشادي؛ ابدأ من أي درس.</p>';
    h += '<div class="card row between wrap"><div><strong>' + c.mastered + ' من ' + D.lessons.length + ' دروس بحالة «أتقنته»</strong><div class="muted small">قيد التعلّم: ' + c.learning + ' · أحتاج مراجعة: ' + c.review + ' · لم أبدأ: ' + c['new'] + '</div></div>' +
      (next ? '<a class="btn btn-primary" href="#lesson-' + next.id + '">' + (App.status(next.id) === 'learning' ? 'تابع: ' : 'ابدأ: ') + esc(next.title) + '</a>' : '') + '</div>';
    h += '<p class="muted small"><span class="badge cv">مذكور في سيرتك</span> الموضوع وارد في سيرتك. <span class="badge sug">أساسية مقترحة</span> أساسيات نقترح مراجعتها استعدادًا للعمل، ولم تُذكر صراحة في السيرة. وورودها في السيرة لا يعني أنك أتقنتها؛ تحقق بنفسك. <a href="#cv">كيف بُني المسار؟</a>' + (p ? ' ترتيب الوحدات يراعي نتيجة تقييمك المبدئي.' : '') + '</p>';
    App.modOrder().forEach(function (mid) {
      var m = MOD[mid];
      h += '<section class="module"><h2>' + esc(m.title) + '</h2><p class="muted">' + esc(m.blurb) + '</p><ol class="lessons">';
      D.lessons.filter(function (l) { return l.module === mid; }).forEach(function (l) {
        h += '<li><a class="lesson-row" href="#lesson-' + l.id + '"><span class="lr-t">' + inl(l.title) + '</span><span class="lr-m">' + cvBadge(l) + ' ' + App.badge(App.status(l.id)) + '<span class="small muted">' + l.minutes + ' د</span></span></a></li>';
      });
      h += '</ol></section>';
    });
    App.mount(h, { title: 'المسار' });
  };

  /* ================== أساس المسار من السيرة ================== */
  App.views.cv = function () {
    var cv = D.cv;
    var h = '<h1>كيف بُني المسار من سيرتك</h1><p class="lead">اعتمدنا على ما كُتب في سيرتك فقط. لم نضف خبرات أو مشروعات أو شهادات. وبيانات الاتصال لا تظهر في الموقع.</p>';
    h += '<div class="card"><h2>خلاصة السيرة</h2><p>' + esc(cv.summary) + '</p><p><strong>التخصص الدقيق:</strong> دبلوم إدارة نظم الشبكات، والوظائف المبتدئة المرتبطة به: دعم فني، دعم شبكات، فني شبكات مبتدئ، مراقبة شبكات (NOC) مبتدئ.</p></div>';
    h += '<div class="callout warn"><strong>تنبيه مهم</strong><p>ورود مهارة أو دورة في السيرة لا يعني أنك أتقنتها. الموقع يساعدك على اكتشاف ما تذكره وما تحتاج مراجعته، ولا يحكم على جاهزيتك. وCCNA v7 في سيرتك مذكورة كتدريب، وليست شهادة اجتياز.</p></div>';
    h += '<h2>الربط بين السيرة والدروس</h2><div class="table-wrap"><table><thead><tr><th>البند</th><th>النوع</th><th>الدروس</th><th>ملاحظة</th></tr></thead><tbody>';
    cv.items.forEach(function (it) {
      h += '<tr><td>' + esc(it.cv) + '</td><td>' + (it.kind === 'cv' ? '<span class="badge cv">مذكور في السيرة</span>' : '<span class="badge sug">مقترح للمراجعة</span>') + '</td><td>' +
        (it.lessons.length ? it.lessons.map(function (id) { return '<a href="#lesson-' + id + '">' + esc(LES[id].title) + '</a>'; }).join('<br>') : '—') + '</td><td>' + esc(it.note) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    App.mount(h, { title: 'من سيرتك' });
  };

  /* ================== التقييم المبدئي ================== */
  App.views.placement = function () {
    var p = S().placement;
    var h = '<h1>تقييم مبدئي خفيف</h1>';
    h += '<p class="lead">10 أسئلة قصيرة (نحو 5 دقائق) لترتيب ما تراجعه أولًا. اختر «لا أتذكر» متى شئت؛ لا شيء يُحسب عليك. ليس اختبارًا رسميًا ولا قياسًا نهائيًا لمستواك أو جاهزيتك للعمل. التوضيحات تظهر بعد الانتهاء.</p>';
    h += '<div id="pl"></div><div class="row"><a class="btn btn-ghost" href="#home" id="skip-pl">تخطَّ وابدأ مباشرة</a></div>';
    App.mount(h, { title: 'التقييم المبدئي' });
    var box = $('#pl');
    if (p) renderPlacementResult(box, p, true); else startPlacement(box);
  };

  function startPlacement(box) {
    box.innerHTML = '<button class="btn btn-primary" id="pl-go">ابدأ التقييم</button>';
    $('#pl-go').addEventListener('click', function () {
      var qs = D.placement.map(function (q) { return Object.assign({}, q); });
      UI.runQuiz(box, qs, {
        defer: true,
        onDone: function (results) {
          var answers = {}, score = {};
          D.modules.forEach(function (m) { score[m.id] = 0; });
          results.forEach(function (r) {
            var st = r.idk ? 'idk' : (r.correct ? 'ok' : 'wrong');
            answers[r.q.id] = st;
            if (st === 'ok') score[r.q.m]++;
          });
          var order = D.modules.map(function (m) { return m.id; }).sort(function (a, b) { return (score[a] - score[b]) || (MOD[a].idx - MOD[b].idx); });
          S().placement = { day: Store.day(), answers: answers, score: score, order: order };
          S().placementSkipped = false; Store.save();
          App.log('placement', 'أنهيتَ التقييم المبدئي');
          renderPlacementResult(box, S().placement, false);
        }
      });
    });
  }

  function renderPlacementResult(box, p, again) {
    var h = '<div class="callout"><strong>تم حفظ نتيجة تقييمك (' + UI.fmtDate(p.day) + ')</strong><p>استخدمنا نتيجتك لترتيب الوحدات فقط: ما تحتاج مراجعته أولًا يظهر في الأعلى.</p></div>';
    h += '<h2>ترتيب المراجعة المقترح</h2><ol class="plain">';
    p.order.forEach(function (mid) {
      var m = MOD[mid], sc = p.score[mid];
      h += '<li><strong>' + esc(m.title) + '</strong> — صحيح ' + sc + ' من 2 ' + (sc < 2 ? '<span class="badge sug">ابدأ بها</span>' : '') + '</li>';
    });
    h += '</ol><h2>توضيح الإجابات</h2><ul class="plain">';
    D.placement.forEach(function (q) {
      var st = p.answers[q.id];
      h += '<li><div>' + inl(q.q) + '</div><div class="small">' + (st === 'ok' ? 'أجبتَ صحيحًا.' : st === 'idk' ? 'اخترتَ «لا أتذكر».' : 'إجابتك لم تكن الصحيحة.') + ' الصحيح: ' + inl(q.o[q.a]) + '</div><div class="small muted">' + inl(q.e) + '</div></li>';
    });
    h += '</ul><div class="row"><a class="btn btn-primary" href="#path">اذهب إلى المسار</a>' + (again ? '<button class="btn" id="pl-redo">أعد التقييم</button>' : '') + '</div>';
    box.innerHTML = h;
    var sk = $('#skip-pl'); if (sk) sk.style.display = 'none';
    var rd = $('#pl-redo'); if (rd) rd.addEventListener('click', function () { startPlacement(box); var s2 = $('#skip-pl'); if (s2) s2.style.display = ''; $('#pl-go').click(); });
  }

  /* ================== المراجعة ================== */
  App.renderReviewRun = function (root, questions, opts) {
    opts = opts || {};
    UI.runQuiz(root, questions, {
      onDone: function (results) {
        var changed = App.recordAnswers(results);
        var key = 'review:' + results.map(function (r) { return r.qid; }).sort().join(',');
        App.log(key, 'أنهيتَ مراجعة ' + results.length + ' أسئلة');
        var h = App.resultSummary(results);
        if (changed.length) h += '<p class="muted small">حُدّثت حالة: ' + changed.map(function (id) { return '«' + esc(LES[id].title) + '»'; }).join('، ') + ' إلى «أحتاج مراجعة»، وستعود إليك بأسئلة مختلفة.</p>';
        root.innerHTML = h;
        opts.onDone && opts.onDone(results);
      }
    });
  };

  App.views.review = function () {
    var due = App.dueCount(), c = App.counts();
    var modOpts = D.modules.map(function (m) { return '<option value="' + m.id + '">' + esc(m.title) + '</option>'; }).join('');
    var h = '<h1>المراجعة</h1><p class="lead">المفاهيم التي تخطئ فيها أو تقول «لا أتذكر» تعود إليك لاحقًا بأسئلة مختلفة، لا بالسؤال نفسه فقط.</p>';
    h += '<div class="grid2"><div class="card"><h2>مراجعة مستحقة</h2><p><strong>' + due + '</strong> مفهومًا مستحقًا للمراجعة الآن.</p>' +
      '<button class="btn btn-primary" id="rv-due">' + (due ? 'راجع الآن (حتى 8 أسئلة)' : 'لا شيء مستحق الآن') + '</button>' +
      '<p class="muted small">تظهر المفاهيم التي بدأتَها فقط. ابدأ درسًا أولًا إن لم يكن لديك شيء.</p></div>' +
      '<div class="card"><h2>مراجعة اختيارية</h2><label class="lbl" for="rv-mod">راجع وحدة</label><select id="rv-mod">' + modOpts + '</select><button class="btn" id="rv-m">ابدأ أسئلة الوحدة</button>' +
      '<p class="muted small">أو <a href="#cards">بطاقات الاسترجاع</a> لتدريب سريع على التذكّر.</p></div></div>';
    h += '<div id="rv-run" class="card" hidden></div>';
    App.mount(h, { title: 'المراجعة' });
    var run = $('#rv-run');
    function go(qs, empty) {
      if (!qs.length) { UI.toast(empty); return; }
      run.hidden = false; run.scrollIntoView({ behavior: 'smooth', block: 'start' });
      App.renderReviewRun(run, qs, {});
    }
    $('#rv-due').addEventListener('click', function () { go(App.pickReview(8), 'لا توجد مفاهيم مستحقة الآن. جرّب مراجعة وحدة.'); });
    $('#rv-m').addEventListener('click', function () {
      var mid = $('#rv-mod').value, qs = [];
      D.lessons.filter(function (l) { return l.module === mid; }).forEach(function (l) { qs = qs.concat(App.lessonQuestions(l.id)); });
      go(UI.shuffle(qs).slice(0, 8), 'لا توجد أسئلة.');
    });
  };

  /* ================== بطاقات الاسترجاع ================== */
  App.views.cards = function () {
    var anyStudied = D.lessons.some(function (l) { return App.status(l.id) !== 'new'; });
    var h = '<h1>بطاقات الاسترجاع</h1><p class="lead">جلسات قصيرة (حتى 8 بطاقات). تذكّر الإجابة أولًا ثم أظهرها واختر بصدق: تذكرتها أم لا.</p>';
    h += '<fieldset class="card"><legend>اختر المجموعة</legend>' +
      '<label class="check"><input type="radio" name="deck" value="studied"' + (anyStudied ? ' checked' : '') + '> المفاهيم التي بدأتُها</label>' +
      D.modules.map(function (m, i) { return '<label class="check"><input type="radio" name="deck" value="' + m.id + '"' + (!anyStudied && i === 0 ? ' checked' : '') + '> ' + esc(m.title) + '</label>'; }).join('') +
      '<button class="btn btn-primary" id="cd-go">ابدأ</button></fieldset><div id="cd-run" class="card" hidden></div>';
    App.mount(h, { title: 'بطاقات الاسترجاع' });
    $('#cd-go').addEventListener('click', function () {
      var deck = $('input[name="deck"]:checked').value;
      var ls = deck === 'studied' ? D.lessons.filter(function (l) { return App.status(l.id) !== 'new'; }) : D.lessons.filter(function (l) { return l.module === deck; });
      var cards = [];
      ls.forEach(function (l) { l.cards.forEach(function (c, i) { cards.push({ id: l.id + '-c' + i, lesson: l.id, q: c[0], a: c[1] }); }); });
      if (!cards.length) { UI.toast('ابدأ درسًا أولًا أو اختر وحدة.'); return; }
      cards = UI.shuffle(cards).slice(0, 8);
      var run = $('#cd-run'); run.hidden = false; run.scrollIntoView({ behavior: 'smooth', block: 'start' });
      runCards(run, cards, deck);
    });
  };

  function runCards(root, cards, deck) {
    var i = 0, res = [];
    function show() {
      if (i >= cards.length) {
        var known = res.filter(function (r) { return r.correct; }).length;
        Store.applyResults(res.map(function (r) { return { lesson: r.lesson, correct: r.correct }; }));
        App.log('cards:' + deck, 'أنهيتَ جلسة بطاقات (' + cards.length + ')');
        root.innerHTML = '<div class="callout"><strong>تذكّرتَ ' + known + ' من ' + cards.length + '</strong><p>ما لم تتذكره سيعود في المراجعة.</p></div>';
        return;
      }
      var c = cards[i];
      root.innerHTML = '<p class="muted small">بطاقة ' + (i + 1) + ' من ' + cards.length + ' · من درس «' + esc(LES[c.lesson].title) + '»</p><h3 class="q">' + inl(c.q) + '</h3><button class="btn btn-primary" id="c-show">أظهر الإجابة</button><div id="c-ans" hidden></div>';
      $('#c-show').addEventListener('click', function () {
        this.hidden = true;
        var a = $('#c-ans'); a.hidden = false;
        a.innerHTML = '<div class="callout good">' + inl(c.a) + '</div><div class="row"><button class="btn btn-primary" id="c-y">تذكرتها</button><button class="btn" id="c-n">لم أتذكرها</button></div>';
        function rec(ok) {
          var r = S().cards[c.id] || (S().cards[c.id] = { k: 0, u: 0 }); if (ok) r.k++; else r.u++;
          Store.save(); res.push({ lesson: c.lesson, correct: ok }); i++; show();
        }
        $('#c-y').addEventListener('click', function () { rec(true); });
        $('#c-n').addEventListener('click', function () { rec(false); });
        $('#c-y').focus();
      });
      $('#c-show').focus();
    }
    show();
  }

  /* ================== حاسبة الشبكات الفرعية (للتحقق من إجابتك) ================== */
  App.views.subnet = function () {
    var h = '<h1>حاسبة الشبكات الفرعية</h1><p class="lead">أداة للتحقق من إجابتك. حاول أولًا بنفسك على ورقة، ثم قارن. الحساب اليدوي هو ما يُسأل عنه في المقابلة.</p>' +
      '<div class="card"><div class="inline-row"><div><label class="lbl" for="sn-ip">عنوان IPv4</label><input type="text" id="sn-ip" value="192.168.5.77" inputmode="decimal" autocomplete="off"></div>' +
      '<div><label class="lbl" for="sn-p">البادئة (0–32)</label><input type="number" id="sn-p" min="0" max="32" value="26"></div></div>' +
      '<p class="small" id="sn-err" role="alert"></p><dl class="res" id="sn-out"></dl></div>' +
      '<p><a href="#lesson-L5">العودة إلى درس القناع وCIDR</a></p>';
    App.mount(h, { title: 'حاسبة الشبكات الفرعية' });
    function toNum(a) { return (((a[0] * 256 + a[1]) * 256 + a[2]) * 256 + a[3]) >>> 0; }
    function toStr(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
    function calc() {
      var ipS = $('#sn-ip').value.trim(), p = parseInt($('#sn-p').value, 10), err = $('#sn-err'), out = $('#sn-out');
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ipS);
      var a = m ? m.slice(1).map(Number) : null;
      if (!a || a.some(function (x) { return x > 255; })) { err.textContent = 'اكتب عنوان IPv4 صحيحًا مثل 192.168.5.77'; out.innerHTML = ''; return; }
      if (!(p >= 0 && p <= 32)) { err.textContent = 'البادئة بين 0 و32.'; out.innerHTML = ''; return; }
      err.textContent = '';
      var mask = p === 0 ? 0 : ((0xFFFFFFFF << (32 - p)) >>> 0), ip = toNum(a), net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0, total = Math.pow(2, 32 - p);
      var hosts = p >= 31 ? (p === 31 ? 2 : 1) : total - 2;
      var kind = (a[0] === 10) || (a[0] === 172 && a[1] >= 16 && a[1] <= 31) || (a[0] === 192 && a[1] === 168) ? 'خاص (Private)' : (a[0] === 169 && a[1] === 254 ? 'APIPA (فشل DHCP)' : (a[0] === 127 ? 'Loopback' : 'عام (Public)'));
      var rows = [['القناع', toStr(mask)], ['عنوان الشبكة', toStr(net)], ['عنوان البث', toStr(bc)], ['أول جهاز', p >= 31 ? '—' : toStr(net + 1)], ['آخر جهاز', p >= 31 ? '—' : toStr(bc - 1)], ['عدد العناوين', String(total)], ['عدد الأجهزة الصالحة', String(hosts)], ['نوع العنوان', kind]];
      out.innerHTML = rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    }
    $('#sn-ip').addEventListener('input', calc); $('#sn-p').addEventListener('input', calc); calc();
  };
})();
