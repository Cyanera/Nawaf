/* المختبر العملي + الاستعداد للمقابلات + المقابلة التجريبية */
(function () {
  var D = App.D, LES = App.LES, MOD = App.MOD, LAB = App.LAB;
  var $ = UI.$, $$ = UI.$$, esc = UI.esc, md = UI.md, inl = UI.inline;
  var S = function () { return Store.get(); };

  /* ================== المختبرات ================== */
  var TYPE = { 'packet-tracer': 'Packet Tracer', paper: 'ورقة وقلم', windows: 'Windows', linux: 'لينكس', written: 'كتابي' };
  function labState(id) {
    var r = S().labs[id];
    if (!r) return { k: 'none', t: 'لم يبدأ' };
    if (r.done) return r.afterSolution ? { k: 'done2', t: 'نُفّذ بعد الاطلاع على الحل' } : { k: 'done', t: 'نُفّذ فعليًا' };
    if (r.solution) return { k: 'read', t: 'اطّلعتُ على الحل فقط' };
    if (r.hints || (r.checks || []).some(Boolean)) return { k: 'wip', t: 'قيد المحاولة' };
    return { k: 'none', t: 'لم يبدأ' };
  }
  App.labState = labState;

  App.views.labs = function () {
    var h = '<h1>المختبر العملي</h1><p class="lead">مهام صغيرة تنفّذها بنفسك. <strong>الموقع لا يحاكي الأجهزة ولا يتحقق من تنفيذك</strong>؛ الأدوات (Packet Tracer أو طرفية لينكس أو Command Prompt) تُستخدم خارج الموقع، ثم تسجّل هنا ما فعلته بصدق.</p>';
    h += '<ul class="labs">';
    D.labs.forEach(function (l, i) {
      var st = labState(l.id);
      h += '<li class="card lab-card"><div class="row between wrap"><h2><a href="#/lab/' + l.id + '">' + (i + 1) + '. ' + esc(l.title) + '</a></h2><span class="badge lab-' + st.k + '">' + st.t + '</span></div>' +
        '<p class="meta"><span class="badge plain">' + TYPE[l.type] + '</span><span class="badge plain">' + l.minutes + ' دقيقة تقريبًا</span></p><p>' + esc(l.scenario) + '</p>' +
        '<p class="small muted">يرتبط بدروس: ' + l.lessons.map(function (id) { return '<a href="#/lesson/' + id + '">' + esc(LES[id].title) + '</a>'; }).join('، ') + '</p></li>';
    });
    h += '</ul>';
    App.mount(h, { title: 'المختبر' });
  };

  App.views.lab = function (id) {
    var lab = LAB[id];
    if (!lab) { App.mount('<h1>المختبر غير موجود</h1><p><a href="#/labs">العودة</a></p>'); return; }
    var rec = Store.lab(id), n = D.labs.indexOf(lab) + 1;
    var h = '<p class="crumb"><a href="#/labs">المختبر</a> › مختبر ' + n + '</p><h1>' + esc(lab.title) + '</h1>' +
      '<p class="meta"><span class="badge plain">' + TYPE[lab.type] + '</span><span class="badge plain">' + lab.minutes + ' دقيقة تقريبًا</span><span class="badge" id="lab-badge"></span></p>';
    h += '<div class="callout warn"><strong>ما تحتاجه</strong><p>' + inl(lab.needs) + '</p></div>';
    h += '<section class="step"><h2>السيناريو</h2><p>' + inl(lab.scenario) + '</p></section>';
    h += '<section class="step"><h2>الخطوات</h2><ol class="steps-list">' + lab.steps.map(function (s) { return '<li>' + inl(s) + '</li>'; }).join('') + '</ol></section>';
    h += '<section class="step"><h2>تلميحات تدريجية</h2><div id="hints"></div><button class="btn" id="hint-b"></button></section>';
    h += '<section class="step"><h2>الحل وطريقة التفكير</h2><div id="sol"><p class="muted">جرّب أولًا قدر استطاعتك، ثم اطّلع على الحل. يُسجَّل اطلاعك عليه حتى تعرف لاحقًا هل نفّذت التمرين بنفسك.</p><button class="btn" id="sol-b">اعرض الحل</button></div></section>';
    h += '<section class="step"><h2>قائمة التحقق</h2><p class="muted small">علّم كل بند بعد أن تنفّذه فعلًا.</p><div id="chk">' + lab.checklist.map(function (c, i) { return '<label class="check"><input type="checkbox" data-i="' + i + '"> ' + inl(c) + '</label>'; }).join('') + '</div>' +
      '<button class="btn btn-primary" id="done-b" disabled>سجّلتُ أنني نفّذتُ التمرين بنفسي</button><p class="muted small" id="done-note"></p></section>';
    h += '<p class="small muted">دروس ذات صلة: ' + lab.lessons.map(function (x) { return '<a href="#/lesson/' + x + '">' + esc(LES[x].title) + '</a>'; }).join('، ') + '</p>';
    App.mount(h, { title: 'مختبر: ' + lab.title });

    function badge() { var st = labState(id); var b = $('#lab-badge'); b.className = 'badge lab-' + st.k; b.textContent = st.t; }
    function drawHints() {
      $('#hints').innerHTML = rec.hints ? '<ol class="steps-list">' + lab.hints.slice(0, rec.hints).map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol>' : '<p class="muted">لم تعرض أي تلميح بعد.</p>';
      var b = $('#hint-b');
      if (rec.hints >= lab.hints.length) { b.hidden = true; } else { b.hidden = false; b.textContent = 'اعرض التلميح ' + (rec.hints + 1) + ' من ' + lab.hints.length; }
    }
    function drawSol() {
      if (!rec.solution) return;
      $('#sol').innerHTML = '<div class="callout good">' + md(lab.solution) + '</div><div class="callout"><strong>النتيجة المتوقعة</strong><p>' + inl(lab.expected) + '</p></div>';
    }
    function drawDone() {
      var all = $$('#chk input').every(function (c) { return c.checked; });
      $('#done-b').disabled = rec.done || !all;
      $('#done-b').hidden = rec.done;
      var note = $('#done-note');
      if (rec.done) note.innerHTML = '<span class="badge lab-' + labState(id).k + '">' + labState(id).t + '</span> بتاريخ ' + UI.fmtDate(rec.doneOn) + '. هذا إقرارك الشخصي؛ الموقع لا يستطيع التحقق منه.';
      else note.textContent = all ? 'جاهز للتسجيل.' : 'يُفعَّل الزر بعد تعليم كل بنود القائمة.';
    }
    $$('#chk input').forEach(function (c, i) {
      c.checked = !!(rec.checks && rec.checks[i]);
      c.addEventListener('change', function () { rec.checks = rec.checks || []; rec.checks[i] = c.checked; Store.save(); drawDone(); badge(); });
    });
    $('#hint-b').addEventListener('click', function () { rec.hints = (rec.hints || 0) + 1; Store.save(); drawHints(); badge(); });
    $('#sol-b').addEventListener('click', function () {
      UI.confirmDialog({ title: 'عرض الحل؟', body: 'هل جرّبتَ المختبر أو فكّرتَ فيه أولًا؟ يمكنك عرض الحل متى شئت، وسيُسجَّل أنك اطّلعت عليه.', yes: 'اعرض الحل', no: 'ليس بعد' }).then(function (ok) {
        if (!ok) return;
        rec.solution = true; Store.save(); drawSol(); badge(); drawDone();
      });
    });
    $('#done-b').addEventListener('click', function () {
      rec.done = true; rec.afterSolution = !!rec.solution; rec.doneOn = Store.day(); Store.save();
      App.log('lab:' + id, 'نفّذتَ مختبر «' + lab.title + '»'); drawDone(); badge();
    });
    drawHints(); drawSol(); drawDone(); badge();
  };

  /* ================== الاستعداد للمقابلات ================== */
  var TABS = [
    ['intro', 'تعريف بالنفس'], ['cv', 'أسئلة عن سيرتي'], ['tech', 'أسئلة تقنية'], ['behav', 'أسئلة سلوكية'],
    ['forgot', 'حين أنسى'], ['ask', 'أسئلة للشركة'], ['check', 'قوائم الجاهزية'], ['oral', 'تدريب شفهي']
  ];
  var cleanup = null;
  App.leave = function () { if (cleanup) { cleanup(); cleanup = null; } };

  function draftArea(id, label, def, rows) {
    var cur = S().interview.drafts[id];
    return '<label class="lbl" for="' + id + '">' + esc(label) + '</label><textarea id="' + id + '" rows="' + (rows || 5) + '" data-draft="' + id + '" data-def="' + esc(def || '') + '">' + esc(cur != null ? cur : (def || '')) + '</textarea>' +
      '<div class="row between wrap small muted"><span class="saved" data-for="' + id + '" aria-live="polite"></span><button class="btn btn-ghost btn-sm" data-reset="' + id + '">استعادة المسودة الأصلية</button></div>';
  }
  function bindDrafts(root, onChange) {
    var timers = {};
    $$('textarea[data-draft]', root).forEach(function (t) {
      var id = t.dataset.draft;
      t.addEventListener('input', function () {
        clearTimeout(timers[id]);
        timers[id] = setTimeout(function () {
          S().interview.drafts[id] = t.value; Store.save(); App.checkAch();
          var s = $('.saved[data-for="' + id + '"]', root); if (s) s.textContent = Store.memoryOnly() ? 'لم يُحفظ: التخزين غير متاح' : 'حُفظ على هذا الجهاز';
        }, 300);
        onChange && onChange(t);
      });
    });
    $$('[data-reset]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById(b.dataset.reset); t.value = t.dataset.def; delete S().interview.drafts[t.id]; Store.save();
        onChange && onChange(t); UI.toast('أُعيدت المسودة الأصلية');
      });
    });
  }
  function wc(t) { return (t.trim().match(/\S+/g) || []).length; }

  function oralList() {
    var out = [{ g: 'تعريف', id: 'oral-intro', q: 'عرّف بنفسك (30–60 ثانية)', suggested: S().interview.drafts.introAr || D.intro.ar, points: ['الاسم والتخصص', 'التدريب أو الخبرة', 'مهارة أو شهادة', 'هدفك من الوظيفة'] }];
    D.behavioral.forEach(function (b) { out.push({ g: 'سلوكي', id: 'oral-' + b.id, q: b.q, suggested: 'جهّز إجابتك الحقيقية بالصيغة:\n' + b.starts.join('\n') + '\n\n' + b.look, points: b.points }); });
    App.techQuestions().forEach(function (t) { out.push({ g: 'تقني', id: 'oral-' + t.id, q: t.q, suggested: t.suggested, points: t.points }); });
    D.unknownQs.forEach(function (u) { out.push({ g: 'أسئلة لا أعرفها', id: 'oral-' + u.id, q: u.q, suggested: u.suggested, points: u.points }); });
    return out;
  }

  App.views.interview = function (tab) {
    tab = TABS.some(function (t) { return t[0] === tab; }) ? tab : 'intro';
    var h = '<h1>الاستعداد للمقابلات</h1><p class="lead">كل محتوى هذه الصفحة مبني على ما في سيرتك. حيث لا تتوفر التفاصيل تجد قوالب تملؤها أنت بما حدث فعلًا. لا تقل في المقابلة ما لم تفعله.</p>';
    h += '<nav class="tabs" aria-label="أقسام الاستعداد">' + TABS.map(function (t) { return '<a href="#/interview/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') + '<a class="tab-mock" href="#/mock">مقابلة تجريبية ←</a></nav>';
    h += '<div id="tab-body"></div>';
    App.mount(h, { title: 'المقابلات' });
    var body = $('#tab-body');
    ({ intro: tabIntro, cv: tabCv, tech: tabTech, behav: tabBehav, forgot: tabForgot, ask: tabAsk, check: tabCheck, oral: tabOral })[tab](body);
  };

  function tabIntro(root) {
    var h = '<h2>التعريف بالنفس (30–60 ثانية)</h2><ul>' + D.intro.tips.map(function (t) { return '<li>' + inl(t) + '</li>'; }).join('') + '</ul>';
    h += '<div class="callout"><strong>مسودة مبنية على سيرتك فقط</strong><p>عدّلها بأسلوبك، وأكمل ما بين الأقواس [ ]. كل تعديل يُحفظ تلقائيًا على هذا الجهاز.</p></div>';
    h += draftArea('introAr', 'بالعربية', D.intro.ar, 8) + '<p class="small" id="ar-stat"></p>';
    h += draftArea('introEn', 'English (simple)', D.intro.en, 8) + '<p class="small" id="en-stat"></p>';
    h += '<p><a class="btn btn-primary" href="#/interview/oral">تدرّب عليها شفهيًا مع مؤقت</a></p>';
    root.innerHTML = h;
    function stat(id, out) {
      var t = document.getElementById(id), n = wc(t.value), sec = Math.round(n / 130 * 60);
      $('#' + out).textContent = 'عدد الكلمات: ' + n + ' · زمن القراءة التقريبي: ' + sec + ' ثانية' + (sec > 70 ? ' (طويلة قليلًا، اختصر)' : '');
    }
    function all() { stat('introAr', 'ar-stat'); stat('introEn', 'en-stat'); }
    bindDrafts(root, all); all();
  }

  function tabCv(root) {
    var h = '<h2>أسئلة محتملة عن سيرتك</h2><p class="muted">اكتب في كل قالب ما فعلته أنت فعلًا فقط. هذه مسودات خاصة بك.</p>';
    D.cvQuestions.forEach(function (c) {
      h += '<section class="card"><h3>' + esc(c.title) + '</h3><ul>' + c.qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>' + draftArea('cv-' + c.id, 'قالب الإجابة (املأه)', c.template, 6) + '<div class="callout warn small">' + inl(c.warn) + '</div></section>';
    });
    root.innerHTML = h; bindDrafts(root);
  }

  function tabTech(root) {
    var h = '<h2>أسئلة تقنية أساسية</h2><p class="muted">أجب بصوتك أولًا ثم اعرض الإجابة. الإجابات النموذجية قصيرة عمدًا، وأضف إليها مثالًا من تجربتك إن وُجد.</p>';
    D.modules.forEach(function (m) {
      h += '<h3>' + esc(m.title) + '</h3>';
      D.lessons.filter(function (l) { return l.module === m.id; }).forEach(function (l) {
        var done = S().interview.qdone[l.id];
        h += '<details class="qa"><summary>' + inl(l.interview.q) + (done ? ' <span class="badge st-mastered">تدرّبتُ ×' + done + '</span>' : '') + '</summary>' +
          '<div class="callout good"><p>' + inl(l.interview.a) + '</p></div><div class="callout"><strong>ما يبحث عنه المحاور</strong><p>' + inl(l.interview.why) + '</p></div>' +
          '<div class="row"><button class="btn btn-sm" data-qd="' + l.id + '">أجبتُ عنه شفهيًا</button><a class="btn btn-ghost btn-sm" href="#/lesson/' + l.id + '">درس «' + esc(l.title) + '»</a></div></details>';
      });
    });
    root.innerHTML = h;
    $$('[data-qd]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.qd; S().interview.qdone[id] = (S().interview.qdone[id] || 0) + 1; Store.save();
        App.log('ivq:' + id, 'تدرّبتَ على سؤال: ' + LES[id].title);
        b.textContent = 'سُجّل (×' + S().interview.qdone[id] + ')';
      });
    });
  }

  function tabBehav(root) {
    var h = '<h2>الأسئلة السلوكية وطريقة STAR</h2><div class="card"><h3>ما هي STAR؟</h3><ul>' +
      '<li><strong>الموقف (Situation):</strong> ما السياق؟ جملة أو جملتان.</li><li><strong>المهمة (Task):</strong> ما المطلوب منك أنت؟</li>' +
      '<li><strong>الإجراء (Action):</strong> ماذا فعلت أنت بالتحديد؟ (هذا أهم جزء)</li><li><strong>النتيجة (Result):</strong> ماذا حدث؟ وماذا تعلمت؟</li></ul>' +
      '<p class="muted small">اختر قصة حقيقية. إن لم تكن لديك خبرة عمل كافية فمثال من التدريب أو التطوع أو مختبر نفّذته جيد ومقبول، بشرط أن يكون حقيقيًا.</p></div>';
    D.behavioral.forEach(function (b) {
      h += '<section class="card"><h3>' + esc(b.q) + '</h3><p class="muted small">' + esc(b.hint) + ' · ما يبحث عنه المحاور: ' + esc(b.look) + '</p>' + draftArea('b-' + b.id, 'مسودتك (املأ القالب بقصتك)', b.starts.join('\n'), 6) + '</section>';
    });
    root.innerHTML = h; bindDrafts(root);
  }

  function tabForgot(root) {
    var f = D.forgot;
    var h = '<h2>إذا نسيتَ معلومة أو لم تعرف الإجابة</h2><p>' + esc(f.intro) + '</p><h3>جُمل جاهزة (عدّلها)</h3>';
    f.phrases.forEach(function (p) { h += '<div class="card"><p>' + esc(p.ar) + '</p><p dir="ltr" class="en">' + esc(p.en) + '</p></div>'; });
    h += '<div class="grid2"><div class="card"><h3>كيف تشرح طريقتك في البحث عن الحل</h3><ol>' + f.how.map(function (x) { return '<li>' + inl(x) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="card"><h3>تجنّب</h3><ul>' + f.dont.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>';
    h += '<p><a class="btn btn-primary" href="#/mock">جرّب ذلك في المقابلة التجريبية</a></p>';
    root.innerHTML = h;
  }

  function checklistTab(root, key, items, title) {
    var arr = S().interview.checks[key] || (S().interview.checks[key] = []);
    return '<section class="card"><h3>' + title + '</h3><div data-ck="' + key + '">' + items.map(function (x, i) { return '<label class="check"><input type="checkbox" data-i="' + i + '"' + (arr[i] ? ' checked' : '') + '> ' + esc(x) + '</label>'; }).join('') + '</div><p class="small muted ck-count"></p></section>';
  }
  function tabAsk(root) {
    var arr = S().interview.checks.ask || (S().interview.checks.ask = []);
    root.innerHTML = '<h2>أسئلة يمكنك طرحها على جهة العمل</h2><p class="muted">اختر 2–3 تناسب الوظيفة وعلّمها. طرح الأسئلة يُظهر اهتمامك.</p><div class="card" data-ck="ask">' +
      D.askEmployer.map(function (x, i) { return '<label class="check"><input type="checkbox" data-i="' + i + '"' + (arr[i] ? ' checked' : '') + '> ' + esc(x) + '</label>'; }).join('') + '</div>';
    bindChecks(root);
  }
  function tabCheck(root) {
    root.innerHTML = '<h2>قوائم الجاهزية قبل المقابلة</h2><div class="grid2">' + checklistTab(root, 'inperson', D.checklists.inperson, 'مقابلة حضورية') + checklistTab(root, 'remote', D.checklists.remote, 'مقابلة عن بُعد') + '</div>';
    bindChecks(root);
  }
  function bindChecks(root) {
    function count(box) { var c = $$('input', box), n = c.filter(function (x) { return x.checked; }).length; var el = box.parentNode.querySelector('.ck-count'); if (el) el.textContent = 'أنجزتَ ' + n + ' من ' + c.length; }
    $$('[data-ck]', root).forEach(function (box) {
      var key = box.dataset.ck; count(box);
      $$('input', box).forEach(function (c) {
        c.addEventListener('change', function () { var a = S().interview.checks[key] || (S().interview.checks[key] = []); a[parseInt(c.dataset.i, 10)] = c.checked; Store.save(); count(box); });
      });
    });
  }

  function tabOral(root) {
    var list = oralList(), groups = {};
    list.forEach(function (o) { (groups[o.g] = groups[o.g] || []).push(o); });
    var opts = Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (o) { return '<option value="' + o.id + '">' + esc(o.q) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    root.innerHTML = '<h2>تدريب شفهي ذاتي مع مؤقت</h2><p class="muted">الموقع لا يسمعك ولا يقيّم صوتك. تتكلم بصوت مسموع، وتقيّم نفسك بصدق بعد المؤقت.</p>' +
      '<div class="card"><label class="lbl" for="o-q">السؤال</label><select id="o-q">' + opts + '</select>' +
      '<label class="lbl" for="o-d">المدة</label><select id="o-d"><option value="30">30 ثانية</option><option value="60" selected>60 ثانية</option><option value="90">90 ثانية</option><option value="120">120 ثانية</option></select>' +
      '<p class="oral-q" id="o-qt"></p><div class="timer" id="o-t" aria-hidden="true">1:00</div><div class="row"><button class="btn btn-primary" id="o-s">ابدأ المؤقت</button><button class="btn" id="o-x" hidden>أنهِ الآن</button></div><div id="o-r"></div></div>';
    var sel = $('#o-q'), disp = $('#o-t'), r = $('#o-r'), sb = $('#o-s'), xb = $('#o-x');
    function cur() { return list.filter(function (o) { return o.id === sel.value; })[0]; }
    function showQ() { $('#o-qt').textContent = cur().q; r.innerHTML = ''; }
    var timer = UI.makeTimer(disp, function (natural) { finish(natural); });
    cleanup = function () { timer.stop(); };
    function finish() {
      timer.stop(); sb.hidden = false; sb.textContent = 'ابدأ من جديد'; xb.hidden = true;
      var o = cur();
      r.innerHTML = '<div class="callout" role="status"><strong>انتهى الوقت.</strong> قيّم نفسك:</div><div class="card flat">' +
        ['تكلمتُ بصوت مسموع', 'قلتُ الفكرة الأساسية في أول جملتين', 'أعطيتُ مثالًا أو تفصيلًا واحدًا', 'التزمتُ بالوقت'].map(function (x) { return '<label class="check"><input type="checkbox" class="o-ck"> ' + x + '</label>'; }).join('') + '</div>' +
        '<div class="callout good"><strong>إجابة/هيكل مقترح</strong><p>' + esc(o.suggested).replace(/\n/g, '<br>') + '</p></div>' +
        '<fieldset class="pts"><legend>أي من هذه النقاط ذكرتَ؟</legend>' + o.points.map(function (p) { return '<label class="check"><input type="checkbox"> ' + inl(p) + '</label>'; }).join('') + '</fieldset>' +
        '<button class="btn btn-primary" id="o-save">سجّل هذا التدريب</button>';
      $('#o-save').addEventListener('click', function () {
        var spoke = $$('.o-ck', r)[0].checked;
        if (!spoke) { UI.toast('سجّل التدريب بعد أن تتكلم فعلًا بصوت مسموع.'); return; }
        S().interview.practiced[o.id] = (S().interview.practiced[o.id] || 0) + 1; Store.save();
        App.log('oral:' + o.id, 'تدرّبتَ شفهيًا: ' + o.q);
        $('#o-save').disabled = true; $('#o-save').textContent = 'سُجّل';
      });
    }
    sel.addEventListener('change', function () { timer.stop(); sb.hidden = false; sb.textContent = 'ابدأ المؤقت'; xb.hidden = true; showQ(); });
    sb.addEventListener('click', function () { r.innerHTML = ''; sb.hidden = true; xb.hidden = false; timer.start(parseInt($('#o-d').value, 10)); });
    xb.addEventListener('click', function () { finish(); });
    showQ();
  }

  /* ================== المقابلة التجريبية ================== */
  var CRIT = [['idea', 'صحة الفكرة'], ['clarity', 'وضوح الشرح'], ['example', 'وجود مثال'], ['brief', 'الاختصار']];
  var RATE = [['yes', 'نعم'], ['part', 'جزئيًا'], ['no', 'لا']];

  function buildMock() {
    var items = [];
    var d = S().interview.drafts;
    items.push({ id: 'm-intro', kind: 'تعريف بالنفس', q: 'عرّف بنفسك في 30–60 ثانية.', suggested: d.introAr || D.intro.ar, look: 'الاسم والتخصص، التدريب أو الخبرة، مهارة أو شهادة، وهدفك. مختصر ومرتب.', points: ['الاسم والتخصص', 'التدريب أو الخبرة المذكورة في سيرتي', 'مهارة أو شهادة', 'هدفي من الوظيفة'] });
    D.modules.forEach(function (m) {
      var ls = UI.shuffle(D.lessons.filter(function (l) { return l.module === m.id; }));
      var w = { review: 0, learning: 1, 'new': 2, mastered: 3 };
      ls.sort(function (a, b) { return w[App.status(a.id)] - w[App.status(b.id)]; });
      var l = ls[0], t = l.interview;
      items.push({ id: 'm-' + l.id, kind: 'تقني · ' + m.title, q: t.q, suggested: t.a, look: t.why, points: t.points, lesson: l.id });
    });
    UI.shuffle(D.behavioral).slice(0, 2).forEach(function (b) {
      items.push({ id: 'm-' + b.id, kind: 'سلوكي', q: b.q, suggested: 'لا توجد إجابة جاهزة، لأنها يجب أن تكون قصتك أنت. اتبع الهيكل:\n' + b.starts.join('\n') + '\n\n' + b.hint, look: b.look, points: b.points });
    });
    var u = UI.shuffle(D.unknownQs)[0];
    items.push({ id: 'm-' + u.id, kind: 'سؤال قد لا تعرفه', q: u.q, suggested: u.suggested, look: u.look, points: u.points });
    items.push({ id: 'm-ask', kind: 'ختام المقابلة', q: 'هل لديك أسئلة لنا؟', suggested: 'اختر 2–3 مما يلي:\n' + D.askEmployer.slice(0, 5).join('\n'), look: 'اهتمام حقيقي بالدور والتعلّم.', points: ['سؤال عن الدور أو الفريق', 'سؤال عن التدريب والتطور', 'سؤال عن الخطوات التالية'] });
    return items;
  }

  App.views.mock = function () {
    var hist = S().interview.mocks.slice(-5).reverse();
    var h = '<h1>مقابلة تجريبية</h1><p class="lead">10 أسئلة، سؤال واحد في كل مرة (نحو 15–20 دقيقة). تجيب أولًا، ثم تظهر الإجابة المقترحة، ثم تقيّم نفسك بمعايير واضحة.</p>' +
      '<div class="callout"><strong>تنبيه صريح</strong><p>لا يوجد ذكاء اصطناعي يصحّح إجاباتك هنا. المقارنة بالإجابة المقترحة وبنقاطها تقييم ذاتي، فكن صادقًا مع نفسك لتستفيد.</p></div>' +
      '<div id="mock-body"><button class="btn btn-primary" id="mk-go">ابدأ المقابلة التجريبية</button></div>';
    if (hist.length) {
      h += '<h2>آخر المحاولات</h2><ul class="plain">' + hist.map(function (m) {
        var idea = m.items.filter(function (x) { return x.idea === 'yes'; }).length;
        return '<li>' + UI.fmtDate(m.day) + ' — فكرة صحيحة في ' + idea + ' من ' + m.items.length + ' أسئلة (تقييم ذاتي)</li>';
      }).join('') + '</ul>';
    }
    App.mount(h, { title: 'مقابلة تجريبية' });
    $('#mk-go').addEventListener('click', function () { runMock($('#mock-body')); });
  };

  function runMock(root) {
    var items = buildMock(), idx = 0, data = items.map(function () { return { text: '', aloud: false, hit: [], r: {} }; }), phase = 'answer';
    function render() {
      if (idx >= items.length) { summary(); return; }
      var it = items[idx], d = data[idx];
      var h = '<div class="card"><p class="muted small">سؤال ' + (idx + 1) + ' من ' + items.length + ' · ' + esc(it.kind) + '</p>' +
        '<div class="bar"><span style="width:' + Math.round(idx / items.length * 100) + '%"></span></div><h2 class="q" id="mq">' + esc(it.q) + '</h2>';
      if (phase === 'answer') {
        h += '<label class="lbl" for="m-t">إجابتك (اكتبها، أو تكلّم بها بصوت مسموع ثم علّم الخيار)</label><textarea id="m-t" rows="6"></textarea>' +
          '<label class="check"><input type="checkbox" id="m-c"> أجبتُ شفهيًا بصوت مسموع</label><button class="btn btn-primary" id="m-show" disabled>أظهر الإجابة المقترحة</button>';
      } else {
        h += (d.text ? '<div class="callout"><strong>إجابتك</strong><p>' + esc(d.text).replace(/\n/g, '<br>') + '</p></div>' : '<p class="muted small">أجبتَ شفهيًا.</p>') +
          '<div class="callout good"><strong>إجابة / هيكل مقترح</strong><p>' + esc(it.suggested).replace(/\n/g, '<br>') + '</p></div>' +
          '<div class="callout"><strong>ما يبحث عنه المحاور</strong><p>' + inl(it.look) + '</p></div>' +
          '<fieldset class="pts"><legend>نقاط يُتوقع ذكرها: أيها ذكرتَ؟</legend>' + it.points.map(function (p, i) { return '<label class="check"><input type="checkbox" data-p="' + i + '"' + (d.hit[i] ? ' checked' : '') + '> ' + inl(p) + '</label>'; }).join('') + '</fieldset>' +
          '<fieldset class="crit"><legend>تقييمك الذاتي</legend>' + CRIT.map(function (c) {
            return '<div class="crit-row"><span>' + c[1] + '</span><span class="seg">' + RATE.map(function (r) { return '<label class="seg-i"><input type="radio" name="r-' + c[0] + '" value="' + r[0] + '"' + (d.r[c[0]] === r[0] ? ' checked' : '') + '><span>' + r[1] + '</span></label>'; }).join('') + '</span></div>';
          }).join('') + '</fieldset><button class="btn btn-primary" id="m-next" disabled>' + (idx + 1 < items.length ? 'السؤال التالي' : 'إنهاء وعرض الملخص') + '</button>';
      }
      h += '</div><button class="btn btn-ghost" id="m-quit">إنهاء دون حفظ</button>';
      root.innerHTML = h;
      var q = $('#mq'); q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true });
      $('#m-quit').addEventListener('click', function () { UI.confirmDialog({ title: 'إنهاء المقابلة؟', body: 'لن تُحفظ هذه المحاولة.', yes: 'نعم، أنهِ', danger: true }).then(function (ok) { if (ok) App.views.mock(); }); });
      if (phase === 'answer') {
        var t = $('#m-t'), c = $('#m-c'), b = $('#m-show');
        function upd() { b.disabled = !(t.value.trim() || c.checked); }
        t.addEventListener('input', upd); c.addEventListener('change', upd);
        b.addEventListener('click', function () { d.text = t.value.trim(); d.aloud = c.checked; phase = 'review'; render(); });
      } else {
        function upd2() { $('#m-next').disabled = !CRIT.every(function (c) { return d.r[c[0]]; }); }
        $$('input[data-p]', root).forEach(function (x) { x.addEventListener('change', function () { d.hit[parseInt(x.dataset.p, 10)] = x.checked; }); });
        $$('input[type=radio]', root).forEach(function (x) { x.addEventListener('change', function () { d.r[x.name.slice(2)] = x.value; upd2(); }); });
        $('#m-next').addEventListener('click', function () { idx++; phase = 'answer'; render(); });
        upd2();
      }
    }
    function summary() {
      var tally = {}, review = [];
      CRIT.forEach(function (c) { tally[c[0]] = { yes: 0, part: 0, no: 0 }; });
      items.forEach(function (it, i) {
        var d = data[i];
        CRIT.forEach(function (c) { tally[c[0]][d.r[c[0]]]++; });
        var missed = it.points.filter(function (p, k) { return !d.hit[k]; });
        if (d.r.idea !== 'yes' || missed.length > 1) review.push({ it: it, missed: missed, idea: d.r.idea });
      });
      var today = Store.day();
      var rec = { day: today, items: items.map(function (it, i) { var d = data[i]; return { id: it.id, idea: d.r.idea, clarity: d.r.clarity, example: d.r.example, brief: d.r.brief, hit: d.hit.filter(Boolean).length, total: it.points.length }; }) };
      S().interview.mocks.push(rec);
      items.forEach(function (it, i) {
        if (it.lesson && data[i].r.idea !== 'yes') { var L = Store.lesson(it.lesson); L.box = 0; L.due = today; if (L.status === 'mastered') L.status = 'review'; }
      });
      Store.save();
      App.log('mock:' + today + ':' + items.map(function (x) { return x.id; }).join(','), 'أنهيتَ مقابلة تجريبية');
      var h = '<div class="card"><h2>ملخص مقابلتك التجريبية</h2><p class="muted small">كله تقييمك الذاتي، وليس حكمًا على جاهزيتك.</p><div class="table-wrap"><table><thead><tr><th>المعيار</th><th>نعم</th><th>جزئيًا</th><th>لا</th></tr></thead><tbody>' +
        CRIT.map(function (c) { var t = tally[c[0]]; return '<tr><th scope="row">' + c[1] + '</th><td>' + t.yes + '</td><td>' + t.part + '</td><td>' + t.no + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
      h += '<h3>نقاط محددة للمراجعة</h3>';
      if (!review.length) h += '<p>لم تُسجَّل نقاط ناقصة بارزة. جرّب مقابلة جديدة بأسئلة مختلفة.</p>';
      else h += '<ul class="plain">' + review.map(function (r) {
        return '<li><strong>' + esc(r.it.q) + '</strong>' + (r.missed.length ? '<div class="small">لم تذكر: ' + r.missed.map(inl).join('، ') + '</div>' : '') +
          (r.idea !== 'yes' ? '<div class="small muted">قيّمتَ صحة الفكرة بـ «' + (r.idea === 'part' ? 'جزئيًا' : 'لا') + '»' + (r.it.lesson ? ' — أُضيف المفهوم إلى مراجعتك القادمة' : '') + '</div>' : '') +
          (r.it.lesson ? '<a class="small" href="#/lesson/' + r.it.lesson + '">راجع درس «' + esc(LES[r.it.lesson].title) + '»</a>' : '') + '</li>';
      }).join('') + '</ul>';
      h += '<div class="row"><button class="btn btn-primary" id="m-again">مقابلة جديدة</button><a class="btn" href="#/interview/intro">عدّل مسوداتك</a></div>';
      root.innerHTML = h; window.scrollTo(0, 0);
      $('#m-again').addEventListener('click', function () { runMock(root); });
    }
    render();
  }
})();
