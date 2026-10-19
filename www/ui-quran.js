'use strict';
// Quran screens: surah list, reader, bookmarks.
(function () {
  var QR = window.QR, $ = QR.$, esc = QR.esc, t = QR.t, S = QR.S, META = QR.META, LS = QR.LS;
  var app = function () { return $('#app'); };
  QR.curSurah = 0;
  var io = null;

  function bookmarksBtn() {
    return '<a class="ib" href="#/b" aria-label="' + esc(t('bookmarks')) + '">' + QR.ic.star + '</a>';
  }

  // ---------- Surah list ----------
  QR.views.list = function () {
    QR.curSurah = 0; QR.navToken++; if (io) io.disconnect();
    var last = LS.get('last', null), resume = '';
    if (last && META[last.s - 1]) {
      resume = '<a class="resume" href="#/s/' + last.s + '/' + last.a + '"><span class="ricon">' + QR.ic.book + '</span><span><small>' +
        esc(t('continue_reading')) + '</small><b>' + esc(META[last.s - 1].en) + ' · ' + esc(t('verse')) + ' ' + last.a + '</b></span></a>';
    }
    app().innerHTML = QR.header(t('app_name'), { sub: 'القرآن الكريم', right: bookmarksBtn() }) +
      '<main class="wrap">' + resume +
      '<div class="searchbox">' + QR.ic.search + '<input id="q" type="search" placeholder="' + esc(t('search_surah')) + '" autocomplete="off" aria-label="' + esc(t('search_surah')) + '"></div>' +
      '<div id="list"></div></main>';
    var keys = META.map(function (m, i) { return (i + 1) + ' ' + QR.normTx(m.en) + ' ' + QR.normTx(m.tr) + ' ' + QR.normAr(m.ar); });
    var draw = function () {
      var q = $('#q').value.trim(), qn = QR.normTx(q), qa = QR.normAr(q), h = '';
      var ref = /^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/.exec(q);
      if (ref && +ref[1] >= 1 && +ref[1] <= 114 && +ref[2] >= 1 && +ref[2] <= META[ref[1] - 1].n) {
        h += '<a class="row go" href="#/s/' + ref[1] + '/' + ref[2] + '"><span class="num">' + ref[1] + '</span><span class="nm"><b>' +
          esc(META[ref[1] - 1].en) + ' ' + ref[1] + ':' + ref[2] + '</b></span></a>';
      }
      META.forEach(function (m, i) {
        var ok = !q || (qn && keys[i].indexOf(qn) !== -1) || (qa && QR.normAr(m.ar).indexOf(qa) !== -1) || String(i + 1) === q;
        if (!ok) return;
        h += '<a class="row" href="#/s/' + (i + 1) + '"><span class="num"><i>' + (i + 1) + '</i></span>' +
          '<span class="nm"><b>' + esc(m.en) + '</b><small>' + esc(m.tr) + ' · ' + esc(t(m.type)) + ' · ' + m.n + ' ' + esc(t('verses')) + '</small></span>' +
          '<span class="arn" lang="ar">' + esc(m.ar) + '</span></a>';
      });
      $('#list').innerHTML = h || '<p class="state">' + esc(t('no_results')) + '</p>';
    };
    $('#q').addEventListener('input', draw);
    draw();
    window.scrollTo(0, 0);
  };

  // ---------- Reader ----------
  function recOptions() {
    return QR.RECITERS.map(function (r) {
      return '<option value="' + r.id + '"' + (r.id === S.rec ? ' selected' : '') + '>' + esc(r.name) + '</option>';
    }).join('');
  }

  QR.views.surah = function (n, a) {
    var token = ++QR.navToken; if (io) io.disconnect();
    QR.curSurah = n;
    var m = META[n - 1];
    app().innerHTML = QR.header(n + '. ' + m.en, {
      back: true, sub: m.ar,
      right: '<button class="ib" data-act="playall" aria-label="' + esc(t('play_surah')) + '">' + QR.ic.play + '</button>'
    }) + '<main class="wrap" id="body"><p class="state">' + esc(t('loading')) + '</p></main>';
    window.scrollTo(0, 0);
    LS.set('last', { s: n, a: a || 1 });

    QR.quran().then(function (d) {
      if (token !== QR.navToken) return;
      var ar = d.ar[n - 1], tr = d.tr && d.tr[n - 1], info = QR.trInfo();
      if (!ar || ar.length !== m.n) throw new Error('Unexpected verse count for surah ' + n);
      var bism = d.ar[0][0];
      var h = '<section class="shead"><div class="frame"><div class="sn" lang="ar">' + esc(m.ar) + '</div>' +
        '<div class="sm">' + esc(m.tr) + ' · ' + esc(t(m.type)) + ' · ' + m.n + ' ' + esc(t('verses')) + '</div></div>' +
        '<div class="ctl"><select id="rsel" data-chg="reciter" aria-label="' + esc(t('reciter')) + '">' + recOptions() + '</select>' +
        '<button class="btn ghost sm" id="dls" data-act="dlsurah">' + QR.audio.surahLabel(S.rec, n) + '</button></div></section>';
      if (n !== 1 && n !== 9) h += '<div class="bism ar" lang="ar" dir="rtl">' + esc(bism) + '</div>';
      var rtl = info.dir === 'rtl';
      for (var i = 0; i < ar.length; i++) {
        var k = n + ':' + (i + 1), on = QR.bm.has(k);
        h += '<article class="v" id="v' + (i + 1) + '" data-a="' + (i + 1) + '">' +
          '<div class="ar" lang="ar" dir="rtl">' + esc(ar[i]) + ' <span class="vm">' + QR.arNum(i + 1) + '</span></div>' +
          (tr ? '<p class="tr' + (rtl ? ' rtl' : '') + '" lang="' + info.lang + '" dir="' + info.dir + '"><span class="tn">' + k + '</span> ' + esc(tr[i]) + '</p>' : '') +
          '<div class="vt"><button data-act="play" data-a="' + (i + 1) + '">' + QR.ic.play + '<span>' + esc(t('play')) + '</span></button>' +
          '<button data-act="bm" data-k="' + k + '" class="' + (on ? 'on' : '') + '">' + (on ? QR.ic.starOn : QR.ic.star) + '<span>' + esc(on ? t('bookmarked') : t('bookmark')) + '</span></button>' +
          '<button data-act="share" data-k="' + k + '" aria-label="' + esc(t('share')) + '">' + QR.ic.share + '</button>' +
          '<button data-act="askverse" data-k="' + k + '">' + QR.ic.spark + '<span>' + esc(t('ask_ai')) + '</span></button></div></article>';
      }
      h += '<nav class="pn">' +
        (n > 1 ? '<a class="btn ghost" href="#/s/' + (n - 1) + '"><span class="flip">←</span> ' + esc(META[n - 2].en) + '</a>' : '<span></span>') +
        (n < 114 ? '<a class="btn" href="#/s/' + (n + 1) + '">' + esc(META[n].en) + ' <span class="flip">→</span></a>' : '<span></span>') + '</nav>';
      $('#body').innerHTML = h;
      QR.audio.mark();
      if (a && a > 1) {
        var el = document.getElementById('v' + a);
        if (el) { el.classList.add('flash'); el.scrollIntoView(); }
      }
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) LS.set('last', { s: n, a: +e.target.dataset.a }); });
      }, { rootMargin: '-70px 0px -85% 0px' });
      QR.$$('.v').forEach(function (v) { io.observe(v); });
    }).catch(function (err) {
      if (token !== QR.navToken) return;
      $('#body').innerHTML = QR.errorBox(err && err.message ? err.message : String(err));
    });
  };

  // ---------- Bookmarks ----------
  QR.views.bookmarks = function () {
    QR.curSurah = 0; QR.navToken++; if (io) io.disconnect();
    var list = QR.bm.list();
    var h = QR.header(t('bookmarks'), { back: true }) + '<main class="wrap">';
    if (!list.length) h += '<p class="state">' + esc(t('no_bookmarks')) + '</p>';
    var books = QR.hadithBooksCache || {};
    list.forEach(function (k) {
      if (k.charAt(0) === 'h') {
        var p = k.split('|'); // h|book|number|section
        var bk = books[p[1]];
        h += '<div class="row"><a class="nm" href="#/h/' + p[1] + '/' + p[3] + '/' + p[2] + '"><b>' + esc(bk ? bk.en : p[1]) + ' · ' + esc(t('hadith')) + ' ' + esc(p[2]) +
          '</b><small>' + esc(bk ? bk.ar : '') + '</small></a><button class="ib sm" data-act="rmbm" data-k="' + esc(k) + '" aria-label="' + esc(t('remove_key')) + '">' + QR.ic.close + '</button></div>';
      } else {
        var q = k.split(':'), m = META[q[0] - 1];
        if (!m) return;
        h += '<div class="row"><a class="nm" href="#/s/' + q[0] + '/' + q[1] + '"><b>' + esc(m.en) + ' · ' + esc(t('verse')) + ' ' + q[1] +
          '</b><small>' + esc(m.tr) + ' · ' + esc(m.ar) + '</small></a><button class="ib sm" data-act="rmbm" data-k="' + esc(k) + '" aria-label="' + esc(t('remove_key')) + '">' + QR.ic.close + '</button></div>';
      }
    });
    app().innerHTML = h + '</main>';
    window.scrollTo(0, 0);
  };
  // Hadith book names for the bookmarks screen (loaded quietly in the background)
  QR.json('data/hadith/books.json').then(function (b) {
    QR.hadithBooksCache = {};
    b.forEach(function (x) { QR.hadithBooksCache[x.id] = x; });
  }).catch(function () {});

  // ---------- Actions ----------
  QR.on('bm', function (b) {
    var on = QR.bm.toggle(b.dataset.k);
    b.classList.toggle('on', on);
    b.innerHTML = (on ? QR.ic.starOn : QR.ic.star) + '<span>' + esc(on ? t('bookmarked') : t('bookmark')) + '</span>';
  });
  QR.on('rmbm', function (b) { QR.bm.toggle(b.dataset.k); QR.views.bookmarks(); });
  QR.on('share', function (b) {
    var p = b.dataset.k.split(':');
    QR.quran().then(function (d) {
      var s = +p[0], a = +p[1];
      var text = d.ar[s - 1][a - 1] + '\n' + (d.tr ? d.tr[s - 1][a - 1] + '\n' : '') + '— ' + META[s - 1].en + ' ' + b.dataset.k;
      QR.shareText(text);
    });
  });
  QR.on('askverse', function (b) {
    var p = b.dataset.k.split(':'), s = +p[0], a = +p[1];
    Promise.all([QR.quranAr(), QR.json('data/quran/en.json')]).then(function (x) {
      QR.aiPrefill = {
        question: t('explain_verse') + ' — ' + META[s - 1].en + ' ' + s + ':' + a,
        context: 'Verse ' + s + ':' + a + ' (' + META[s - 1].en + ')\nArabic: ' + x[0][s - 1][a - 1] + '\nEnglish: ' + x[1][s - 1][a - 1]
      };
      location.hash = '#/ask';
    });
  });
  QR.chg = QR.chg || {};
  QR.chg.reciter = function (el) {
    S.rec = el.value; QR.saveSettings();
    var b = $('#dls'); if (b && QR.curSurah) b.innerHTML = QR.audio.surahLabel(S.rec, QR.curSurah);
    QR.audio.restartWithCurrentReciter();
  };
})();
