/* التوجيه والإقلاع */
(function () {
  /* تحميل تلقائي لخط ثمانية إن وُضعت ملفاته في fonts/ (woff2 أو otf)؛ وإلا يبقى البديل بصمت */
  (function loadFont() {
    if (!window.FontFace || !document.fonts) return;
    [['thmanyah-regular', '400'], ['thmanyah-bold', '700']].forEach(function (f) {
      var exts = ['woff2', 'otf'];
      (function next(i) {
        if (i >= exts.length) return;
        var ff = new FontFace('UserArabicFont', 'url(fonts/' + f[0] + '.' + exts[i] + ')', { weight: f[1], display: 'swap' });
        ff.load().then(function () { document.fonts.add(ff); }).catch(function () { next(i + 1); });
      })(0);
    });
  })();

  var NAV = { home: 'home', placement: 'home', session: 'home', cv: 'path', path: 'path', lesson: 'path', review: 'review', cards: 'review', labs: 'labs', lab: 'labs', interview: 'interview', mock: 'interview', progress: 'progress' };

  function route() {
    if (App.leave) App.leave();
    var parts = location.hash.replace(/^#\/?/, '').split('/'), name = parts[0] || 'home', arg = parts[1];
    if (!App.views[name]) name = 'home';
    var active = NAV[name];
    UI.$$('#nav a').forEach(function (a) { if (a.dataset.r === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    try { App.views[name](arg); }
    catch (e) {
      console.error(e);
      App.mount('<h1>حدث خطأ غير متوقع</h1><p>جرّب العودة إلى <a href="#/home">الصفحة الرئيسية</a>. تقدّمك المحفوظ لم يتأثر.</p>');
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', function () { App.checkAch(); route(); });
})();
