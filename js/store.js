/* الحالة والحفظ المحلي (LocalStorage) وحساب النشاط والسلسلة */
(function () {
  var KEY = 'nawaf-learning-v1';
  var INTERVALS = [0, 1, 3, 7, 14]; // أيام حتى المراجعة التالية حسب الصندوق
  var memoryOnly = false;

  function fresh() {
    return {
      v: 1, created: Date.now(), days: {}, lessons: {}, labs: {}, cards: {},
      placement: null, placementSkipped: false,
      interview: { drafts: {}, checks: {}, practiced: {}, mocks: [], qdone: {} },
      ach: {}, qlog: { answered: 0, correct: 0 }
    };
  }

  function normalize(o) {
    var f = fresh();
    o = o && typeof o === 'object' ? o : {};
    var r = Object.assign(f, o);
    r.interview = Object.assign(fresh().interview, o.interview || {});
    r.qlog = Object.assign({ answered: 0, correct: 0 }, o.qlog || {});
    ['days', 'lessons', 'labs', 'cards', 'ach'].forEach(function (k) { if (!r[k] || typeof r[k] !== 'object') r[k] = {}; });
    return r;
  }

  var S;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { memoryOnly = true; }
    return fresh();
  }
  S = load();

  var cloudRef = null, cloudTimer = null, cloudState = 'off';
  function pushCloud() {
    if (!cloudRef) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(function () {
      var json = JSON.stringify(S);
      if (json.length > 240000) { cloudState = 'big'; return; }
      cloudRef.set({ json: json, savedAt: S.savedAt || Date.now() }).then(function () { cloudState = 'on'; }, function () { cloudState = 'error'; });
    }, 1500);
  }
  function save() {
    S.savedAt = Date.now();
    var ok = true;
    try { localStorage.setItem(KEY, JSON.stringify(S)); memoryOnly = false; } catch (e) { memoryOnly = true; ok = false; }
    pushCloud();
    return ok;
  }
  // اختبار توفّر التخزين
  try { localStorage.setItem(KEY + '-t', '1'); localStorage.removeItem(KEY + '-t'); } catch (e) { memoryOnly = true; }

  var Store = {
    KEY: KEY,
    INTERVALS: INTERVALS,
    get: function () { return S; },
    cloudState: function () { return cloudState; },
    /* نسخة احتياطية خاصة بالمستخدم على الخادم (إن وُجدت قدرة db في الصفحة المنشورة). المتصفح يبقى المصدر الأول. */
    attachCloud: function (onAdopt) {
      try {
        if (!window.claude || typeof window.claude.use !== 'function') return Promise.resolve();
        return Promise.all([window.claude.use('user'), window.claude.use('db')]).then(function (r) {
          var u = r[0], db = r[1]; if (!u || !db) return null;
          return u.id().then(function (id) {
            if (!id) return null;
            cloudRef = db.collection('data/users/' + id).doc('progress');
            return cloudRef.get().then(function (snap) {
              cloudState = 'on';
              var d = snap.exists ? snap.data() : null;
              if (d && d.json) {
                var remote = JSON.parse(d.json);
                if ((remote.savedAt || 0) > (S.savedAt || 0)) {
                  S = normalize(remote);
                  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
                  if (onAdopt) onAdopt();
                  return;
                }
              }
              if (Object.keys(S.days).length || Object.keys(S.lessons).length) pushCloud();
            });
          });
        }).catch(function () { cloudState = 'error'; });
      } catch (e) { return Promise.resolve(); }
    },
    save: save,
    memoryOnly: function () { return memoryOnly; },
    now: function () { return new Date(); },
    fmt: function (d) {
      var m = d.getMonth() + 1, day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    },
    day: function () { return Store.fmt(Store.now()); },
    addDays: function (dayStr, n) {
      var p = dayStr.split('-').map(Number);
      var d = new Date(p[0], p[1] - 1, p[2]);
      d.setDate(d.getDate() + n);
      return Store.fmt(d);
    },
    dayNum: function (dayStr) {
      var p = dayStr.split('-').map(Number);
      return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
    },

    lesson: function (id) {
      if (!S.lessons[id]) {
        S.lessons[id] = { status: 'new', box: 0, due: null, seen: {}, ex: '', exDone: false, iv: '', ivDone: false, quizDone: false, quizLast: null };
      }
      return S.lessons[id];
    },
    lab: function (id) {
      if (!S.labs[id]) S.labs[id] = { hints: 0, solution: false, checks: [], done: false, afterSolution: false, doneOn: null };
      return S.labs[id];
    },

    /* تسجيل نشاط تعلّم فعلي: مرة واحدة لكل مفتاح في اليوم. يعيد true إن كان جديدًا */
    log: function (key, label) {
      var d = Store.day();
      var arr = S.days[d] || (S.days[d] = []);
      for (var i = 0; i < arr.length; i++) if (arr[i].k === key) return false;
      arr.push({ k: key, l: label, t: Store.now().getTime() });
      save();
      return true;
    },
    todayCount: function () { return (S.days[Store.day()] || []).length; },
    allKeys: function () {
      var out = [];
      Object.keys(S.days).forEach(function (d) { S.days[d].forEach(function (a) { out.push(a.k); }); });
      return out;
    },

    /* السلسلة: أيام محلية متتالية فيها نشاط فعلي */
    streak: function () {
      var set = {}, days = [];
      Object.keys(S.days).forEach(function (d) { if (S.days[d].length) { set[d] = 1; days.push(d); } });
      days.sort();
      var today = Store.day();
      var cur = 0, cursor = today;
      if (!set[today]) cursor = Store.addDays(today, -1);
      while (set[cursor]) { cur++; cursor = Store.addDays(cursor, -1); }
      var longest = 0, run = 0, prev = null;
      days.forEach(function (d) {
        var n = Store.dayNum(d);
        run = (prev !== null && n - prev === 1) ? run + 1 : 1;
        if (run > longest) longest = run;
        prev = n;
      });
      return { current: cur, longest: longest, todayDone: !!set[today], last: days.length ? days[days.length - 1] : null, total: days.length };
    },

    /* نتائج جلسة: [{lesson, correct}] تُجمَّع لكل مفهوم */
    applyResults: function (results) {
      var by = {};
      results.forEach(function (r) {
        if (!r.lesson) return;
        (by[r.lesson] = by[r.lesson] || []).push(r.correct === true);
      });
      var today = Store.day(), changed = [];
      Object.keys(by).forEach(function (id) {
        var L = Store.lesson(id), all = by[id].every(Boolean);
        if (all) { L.box = Math.min(L.box + 1, 4); L.due = Store.addDays(today, INTERVALS[L.box]); }
        else {
          L.box = 0; L.due = today;
          if (L.status === 'mastered') { L.status = 'review'; changed.push(id); }
        }
        if (L.status === 'new') L.status = 'learning';
      });
      save();
      return changed;
    },
    countAnswer: function (ok) {
      S.qlog.answered++; if (ok) S.qlog.correct++;
    },

    exportJSON: function () { return JSON.stringify(Object.assign({ app: 'nawaf-learning', exportedAt: new Date().toISOString() }, S), null, 2); },
    importObj: function (o) {
      if (!o || typeof o !== 'object' || o.v !== 1 || typeof o.days !== 'object' || typeof o.lessons !== 'object') throw new Error('invalid');
      delete o.app; delete o.exportedAt;
      S = normalize(o); save();
    },
    reset: function () { S = fresh(); save(); }
  };
  window.Store = Store;
})();
