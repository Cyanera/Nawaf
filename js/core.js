/* الأساس المشترك: خرائط البيانات، ترتيب الدروس، اختيار أسئلة المراجعة، الإنجازات */
(function () {
  var D = window.DATA, S = function () { return Store.get(); };
  var esc = UI.esc;

  var LES = {}, MOD = {};
  D.lessons.forEach(function (l, i) { l.idx = i; LES[l.id] = l; });
  D.modules.forEach(function (m, i) { m.idx = i; MOD[m.id] = m; });
  var LAB = {}; D.labs.forEach(function (l) { LAB[l.id] = l; });

  var STATUS = { 'new': 'لم أبدأ', learning: 'قيد التعلّم', review: 'أحتاج مراجعة', mastered: 'أتقنته' };
  var STATUS_ORDER = ['new', 'learning', 'review', 'mastered'];

  var App = {
    D: D, LES: LES, MOD: MOD, LAB: LAB, STATUS: STATUS, STATUS_ORDER: STATUS_ORDER, views: {},

    status: function (id) { var r = S().lessons[id]; return r ? r.status : 'new'; },
    badge: function (st) { return '<span class="badge st-' + st + '">' + STATUS[st] + '</span>'; },

    modOrder: function () {
      var p = S().placement;
      var base = D.modules.map(function (m) { return m.id; });
      if (p && p.order && p.order.length === base.length) return p.order.slice();
      return base;
    },
    ordered: function () {
      var mo = App.modOrder(), out = [];
      mo.forEach(function (m) { D.lessons.forEach(function (l) { if (l.module === m) out.push(l); }); });
      return out;
    },
    nextLesson: function () {
      var o = App.ordered(), i;
      for (i = 0; i < o.length; i++) if (App.status(o[i].id) === 'learning') return o[i];
      for (i = 0; i < o.length; i++) if (App.status(o[i].id) === 'new') return o[i];
      return null;
    },
    counts: function () {
      var c = { 'new': 0, learning: 0, review: 0, mastered: 0 };
      D.lessons.forEach(function (l) { c[App.status(l.id)]++; });
      return c;
    },

    lessonQuestions: function (id) {
      return LES[id].quiz.map(function (q, i) { return Object.assign({}, q, { lesson: id, qid: id + '-q' + i }); });
    },

    /* اختيار أسئلة المراجعة: مفاهيم مستحقة أولًا، وسؤال لم يُسأل مؤخرًا لكل مفهوم */
    pickReview: function (n, force) {
      var today = Store.day();
      var cands = D.lessons.filter(function (l) {
        var r = S().lessons[l.id];
        if (!r) return false;
        if (!(r.status !== 'new' || Object.keys(r.seen).length)) return false;
        return force || !r.due || r.due <= today;
      });
      var w = { review: 0, learning: 1, mastered: 2, 'new': 1 };
      cands.sort(function (a, b) {
        var ra = S().lessons[a.id], rb = S().lessons[b.id];
        return (w[ra.status] - w[rb.status]) || (ra.box - rb.box) || String(ra.due || '').localeCompare(String(rb.due || ''));
      });
      var picked = [], used = {};
      function choose(l, exclude) {
        var r = S().lessons[l.id], qs = App.lessonQuestions(l.id).filter(function (q) { return !exclude[q.qid]; });
        if (!qs.length) return null;
        qs = UI.shuffle(qs);
        qs.sort(function (a, b) { return (r.seen[a.qid] || 0) - (r.seen[b.qid] || 0); });
        return qs[0];
      }
      for (var pass = 0; pass < 3 && picked.length < n; pass++) {
        for (var i = 0; i < cands.length && picked.length < n; i++) {
          var q = choose(cands[i], used);
          if (q) { used[q.qid] = 1; picked.push(q); }
        }
      }
      return picked;
    },
    dueCount: function () {
      var today = Store.day();
      return D.lessons.filter(function (l) {
        var r = S().lessons[l.id];
        return r && (r.status !== 'new' || Object.keys(r.seen).length) && (!r.due || r.due <= today);
      }).length;
    },
    recordAnswers: function (results) {
      results.forEach(function (r) {
        if (r.qid && r.lesson) {
          var L = Store.lesson(r.lesson);
          L.seen[r.qid] = (L.seen[r.qid] || 0) + 1;
        }
        if (r.correct !== null) Store.countAnswer(r.correct === true);
      });
      var changed = Store.applyResults(results.filter(function (r) { return r.lesson; }).map(function (r) { return { lesson: r.lesson, correct: r.correct === true }; }));
      return changed;
    },

    /* كل أسئلة المقابلة التقنية من الدروس */
    techQuestions: function () {
      return D.lessons.map(function (l) { return { id: 'iv-' + l.id, lesson: l.id, module: l.module, q: l.interview.q, suggested: l.interview.a, look: l.interview.why, points: l.interview.points, kind: 'technical' }; });
    },

    log: function (key, label) {
      var isNew = Store.log(key, label);
      if (isNew) { UI.toast('سُجّل: ' + label); }
      App.checkAch();
      var ev = document.getElementById('stat-live'); if (ev) App.refreshStatLive();
      return isNew;
    },
    refreshStatLive: function () { },

    ACH: [
      { id: 'a_ex', title: 'أول تمرين', desc: 'أكملتَ تمرينًا واحدًا من الدروس.', test: function () { return Store.allKeys().some(function (k) { return /:exercise$/.test(k); }); } },
      { id: 'a_rev', title: 'أول مراجعة', desc: 'أنهيتَ جلسة مراجعة أسئلة.', test: function () { return Store.allKeys().some(function (k) { return k.indexOf('review:') === 0; }); } },
      { id: 'a_lab', title: 'أول مختبر منفَّذ', desc: 'سجّلتَ تنفيذ مختبر عملي بنفسك.', test: function () { return Object.keys(S().labs).some(function (k) { return S().labs[k].done; }); } },
      { id: 'a_intro', title: 'تعريفك بنفسك محفوظ', desc: 'عدّلتَ تعريفك بنفسك وحفظته في الموقع.', test: function () { var d = S().interview.drafts; return !!((d.introAr && d.introAr.trim().length > 30) || (d.introEn && d.introEn.trim().length > 30)); } },
      { id: 'a_oral', title: 'أول تدريب شفهي', desc: 'أنهيتَ تدريبًا شفهيًا بالمؤقت.', test: function () { return Store.allKeys().some(function (k) { return k.indexOf('oral:') === 0; }); } },
      { id: 'a_mock', title: 'أول مقابلة تجريبية', desc: 'أنهيتَ مقابلة تجريبية كاملة.', test: function () { return S().interview.mocks.length > 0; } },
      { id: 'a_m3', title: 'ثلاثة مفاهيم متقنة', desc: 'عيّنتَ ثلاثة دروس بحالة «أتقنته».', test: function () { return App.counts().mastered >= 3; } },
      { id: 'a_mod', title: 'وحدة كاملة متقنة', desc: 'كل دروس وحدة واحدة بحالة «أتقنته».', test: function () { return D.modules.some(function (m) { var ls = D.lessons.filter(function (l) { return l.module === m.id; }); return ls.every(function (l) { return App.status(l.id) === 'mastered'; }); }); } },
      { id: 'a_s3', title: 'ثلاثة أيام متتالية', desc: 'تعلّمتَ ثلاثة أيام متتالية.', test: function () { return Store.streak().longest >= 3; } },
      { id: 'a_s7', title: 'سبعة أيام متتالية', desc: 'تعلّمتَ سبعة أيام متتالية.', test: function () { return Store.streak().longest >= 7; } }
    ],
    checkAch: function () {
      var changed = false;
      App.ACH.forEach(function (a) {
        if (!S().ach[a.id] && a.test()) { S().ach[a.id] = Store.day(); changed = true; UI.toast('إنجاز: ' + a.title); }
      });
      if (changed) Store.save();
    },

    /* عرض الصفحة */
    mount: function (html, opts) {
      var m = document.getElementById('app');
      m.innerHTML = html;
      opts = opts || {};
      if (opts.title) document.title = opts.title + ' — رحلة نواف';
      if (!opts.keep) {
        window.scrollTo(0, 0);
        var h = m.querySelector('h1');
        // عند أول تحميل لا ننقل التركيز، ليصل أول Tab إلى رابط التخطي؛ وبعد التنقّل نركّز على العنوان لقارئات الشاشة
        if (h && App.rendered) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        App.rendered = true;
      }
      return m;
    },

    streakMessage: function () {
      var s = Store.streak();
      if (!s.total) return { big: '0', text: 'لم تبدأ سلسلتك بعد. أول نشاط تعلّم فعلي اليوم يبدأها.' };
      if (s.current > 0 && s.todayDone) return { big: String(s.current), text: 'يوم متتالٍ، وقد أنجزتَ نشاطًا اليوم.' };
      if (s.current > 0) return { big: String(s.current), text: 'يوم متتالٍ. نشاط واحد اليوم يُبقي السلسلة.' };
      return { big: '0', text: 'آخر نشاط لك كان في ' + UI.fmtDateShort(s.last) + '. ابدأ اليوم سلسلة جديدة؛ تقدّمك التعليمي كما هو لم يتغيّر.' };
    },

    refsHTML: function (keys) {
      if (!keys || !keys.length) return '';
      return '<ul class="refs">' + keys.map(function (k) { var r = D.refs[k]; return '<li><a href="' + esc(r.u) + '" target="_blank" rel="noopener noreferrer">' + esc(r.t) + '</a></li>'; }).join('') + '</ul>';
    }
  };
  window.App = App;
})();
