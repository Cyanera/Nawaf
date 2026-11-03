/* التوجيه والإقلاع */
(function () {
  var NAV = { home: 'home', placement: 'home', session: 'home', cv: 'path', path: 'path', lesson: 'path', review: 'review', cards: 'review', labs: 'labs', lab: 'labs', interview: 'interview', mock: 'interview', progress: 'progress' };

  function route() {
    if (App.leave) App.leave();
    var h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('-'), name = (i < 0 ? h : h.slice(0, i)) || 'home', arg = i < 0 ? undefined : h.slice(i + 1);
    if (!App.views[name]) name = 'home';
    var active = NAV[name];
    UI.$$('#nav a').forEach(function (a) { if (a.dataset.r === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    try { App.views[name](arg); }
    catch (e) {
      console.error(e);
      App.mount('<h1>حدث خطأ غير متوقع</h1><p>جرّب العودة إلى <a href="#home">الصفحة الرئيسية</a>. تقدّمك المحفوظ لم يتأثر.</p>');
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', function () {
    var sk = document.querySelector('.skip'); if (sk) sk.addEventListener('click', function (e) { e.preventDefault(); var m = document.getElementById('app'); m.focus(); }); App.checkAch(); route(); });
})();
