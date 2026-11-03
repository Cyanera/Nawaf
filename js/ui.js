/* أدوات الواجهة: الهروب من HTML، عرض النص المنسّق، الإشعارات، الحوارات، مشغّل الأسئلة */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function inline(s) {
    return esc(s)
      .replace(/\{\{([\s\S]+?)\}\}/g, '<code dir="ltr">$1</code>')
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  }
  /* نص منسّق: فقرات، قوائم بـ "- "، كتل @@@ برمجية، {{inline}}، **bold** */
  function md(text) {
    var parts = String(text).split('@@@'), out = '';
    parts.forEach(function (p, i) {
      if (i % 2 === 1) {
        var code = p.replace(/^\n/, '').replace(/\n\s*$/, '');
        out += '<pre' + (/[\u0600-\u06FF]/.test(code) ? ' class="ar" dir="rtl"' : ' dir="ltr"') + ' tabindex="0"><code>' + esc(code) + '</code></pre>';
        return;
      }
      var lines = p.split('\n'), buf = [], list = [];
      function flushP() { if (buf.length) { out += '<p>' + buf.map(inline).join('<br>') + '</p>'; buf = []; } }
      function flushL() { if (list.length) { out += '<ul>' + list.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>'; list = []; } }
      lines.forEach(function (ln) {
        if (/^\s*-\s+/.test(ln)) { flushP(); list.push(ln.replace(/^\s*-\s+/, '')); }
        else if (!ln.trim()) { flushP(); flushL(); }
        else { flushL(); buf.push(ln); }
      });
      flushP(); flushL();
    });
    return out;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtDate(dayStr) {
    var p = dayStr.split('-').map(Number);
    try { return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return dayStr; }
  }
  function fmtDateShort(dayStr) {
    var p = dayStr.split('-').map(Number);
    try { return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long' }); }
    catch (e) { return dayStr; }
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var toastTimer;
  function toast(msg) {
    var box = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 400); }, 3200);
  }

  /* حوار تأكيد */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var dlg = document.getElementById('dlg');
      dlg.innerHTML = '<form method="dialog"><h2>' + esc(opts.title) + '</h2><p>' + esc(opts.body) + '</p>' +
        '<div class="row end"><button class="btn" value="cancel" id="dlg-no">' + esc(opts.no || 'إلغاء') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" value="ok" id="dlg-yes">' + esc(opts.yes || 'تأكيد') + '</button></div></form>';
      function done(v) { dlg.removeEventListener('close', onClose); resolve(v); }
      function onClose() { done(dlg.returnValue === 'ok'); }
      dlg.addEventListener('close', onClose);
      if (typeof dlg.showModal === 'function') { dlg.returnValue = 'cancel'; dlg.showModal(); $('#dlg-no', dlg).focus(); }
      else { done(window.confirm(opts.title + '\n' + opts.body)); }
    });
  }

  /* مشغّل الأسئلة: mcq / tf. opts: {defer, onDone(results), allowIdk, showLesson}
     كل نتيجة: {q, lesson, qid, choice, correct(true/false/null), idk, explain, correctText, chosenText} */
  function runQuiz(el, questions, opts) {
    opts = opts || {};
    var i = 0, results = [];
    function prep(q) {
      var options;
      if (q.t === 'tf') options = [{ text: 'صح', ok: q.a === true }, { text: 'خطأ', ok: q.a === false }];
      else options = shuffle(q.o.map(function (t, ix) { return { text: t, ok: ix === q.a }; }));
      return options;
    }
    function render() {
      if (i >= questions.length) { finish(); return; }
      var q = questions[i], options = prep(q);
      var html = '<div class="quiz" aria-live="polite"><p class="muted small">سؤال ' + (i + 1) + ' من ' + questions.length + '</p>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + questions.length + '" aria-valuenow="' + i + '"><span style="width:' + Math.round(i / questions.length * 100) + '%"></span></div>' +
        '<h3 class="q">' + inline(q.q) + '</h3><div class="opts" role="group" aria-label="الخيارات">' +
        options.map(function (o, ix) { return '<button class="opt" data-i="' + ix + '">' + inline(o.text) + '</button>'; }).join('') +
        '</div>' + (opts.allowIdk === false ? '' : '<button class="btn btn-ghost idk">لا أتذكر</button>') + '<div class="fb"></div></div>';
      el.innerHTML = html;
      $$('.opt', el).forEach(function (b) {
        b.addEventListener('click', function () { answer(q, options, parseInt(b.dataset.i, 10), false); });
      });
      var idk = $('.idk', el);
      if (idk) idk.addEventListener('click', function () { answer(q, options, -1, true); });
      var first = $('.opt', el); if (first && opts.focus !== false) first.focus({ preventScroll: true });
    }
    function answer(q, options, ix, idk) {
      var correctOpt = options.filter(function (o) { return o.ok; })[0];
      var res = {
        q: q, lesson: q.lesson || null, qid: q.qid || null, idk: idk,
        correct: idk ? null : !!options[ix].ok,
        chosenText: idk ? null : options[ix].text, correctText: correctOpt.text, explain: q.e, m: q.m || null
      };
      results.push(res);
      if (opts.onAnswer) opts.onAnswer(res);
      if (opts.defer) { i++; render(); return; }
      $$('.opt', el).forEach(function (b, k) {
        b.disabled = true;
        if (options[k].ok) b.classList.add('ok');
        else if (k === ix) b.classList.add('bad');
      });
      var idkb = $('.idk', el); if (idkb) idkb.disabled = true;
      var msg = idk ? 'لا بأس. هذه إشارة لما يستحق المراجعة.' : (res.correct ? 'إجابة صحيحة.' : 'ليست الإجابة الصحيحة.');
      $('.fb', el).innerHTML = '<div class="callout ' + (res.correct ? 'good' : 'soft') + '"><strong>' + msg + '</strong><p>الإجابة: ' + inline(res.correctText) + '</p><p>' + inline(q.e || '') + '</p></div>' +
        '<button class="btn btn-primary next">' + (i + 1 < questions.length ? 'السؤال التالي' : 'إنهاء') + '</button>';
      var nx = $('.next', el); nx.focus();
      nx.addEventListener('click', function () { i++; render(); });
    }
    function finish() { opts.onDone && opts.onDone(results); }
    render();
  }

  /* مؤقت تنازلي بسيط */
  function makeTimer(display, onEnd) {
    var left = 0, h = null;
    function show() { var m = Math.floor(left / 60), s = left % 60; display.textContent = m + ':' + (s < 10 ? '0' : '') + s; }
    return {
      start: function (sec) { this.stop(); left = sec; show(); h = setInterval(function () { left--; show(); if (left <= 0) { clearInterval(h); h = null; onEnd && onEnd(true); } }, 1000); },
      stop: function () { if (h) { clearInterval(h); h = null; } },
      left: function () { return left; },
      running: function () { return !!h; }
    };
  }

  window.UI = { esc: esc, md: md, inline: inline, shuffle: shuffle, fmtDate: fmtDate, fmtDateShort: fmtDateShort, $: $, $$: $$, toast: toast, confirmDialog: confirmDialog, runQuiz: runQuiz, makeTimer: makeTimer };
})();
