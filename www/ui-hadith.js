'use strict';
// Hadith library: books -> chapters -> hadith, with search inside a book.
(function () {
  var QR = window.QR, $ = QR.$, esc = QR.esc, t = QR.t, S = QR.S;
  var app = function () { return $('#app'); };
  var PAGE = 25;

  // Keep a few chapter files in memory (the big ones are a few MB).
  var secCache = {}, secOrder = [];
  function loadSection(book, sid) {
    var k = book + '/' + sid;
    if (secCache[k]) return Promise.resolve(secCache[k]);
    return fetch('data/hadith/' + k + '.json').then(function (r) {
      if (!r.ok) throw new Error('Missing data file: ' + k);
      return r.json();
    }).then(function (rows) {
      secCache[k] = rows; secOrder.push(k);
      if (secOrder.length > 6) delete secCache[secOrder.shift()];
      return rows;
    });
  }
  QR.hadith = { loadSection: loadSection };

  // ---------- Books ----------
  QR.views.hadithBooks = function () {
    QR.curSurah = 0; var token = ++QR.navToken;
    app().innerHTML = QR.header(t('hadith_library'), { sub: 'مكتبة الحديث', right: '<a class="ib" href="#/b" aria-label="' + esc(t('bookmarks')) + '">' + QR.ic.star + '</a>' }) +
      '<main class="wrap"><p class="sub">' + esc(t('hadith_sub')) + '</p><div id="books"><p class="state">' + esc(t('loading')) + '</p></div></main>';
    QR.json('data/hadith/books.json').then(function (books) {
      if (token !== QR.navToken) return;
      QR.hadithBooksCache = {}; books.forEach(function (b) { QR.hadithBooksCache[b.id] = b; });
      $('#books').innerHTML = books.map(function (b, i) {
        return '<a class="bookcard c' + (i % 5) + '" href="#/h/' + b.id + '"><span class="bk-ar" lang="ar" dir="rtl">' + esc(b.ar) + '</span>' +
          '<b>' + esc(b.en) + '</b><small>' + esc(t('hadith_count', { n: b.total.toLocaleString('en-US') })) + ' · ' + esc(t('chapters_count', { n: b.sections })) + '</small></a>';
      }).join('');
    }).catch(function (err) { if (token === QR.navToken) $('#books').innerHTML = QR.errorBox(err.message); });
    window.scrollTo(0, 0);
  };

  // ---------- Chapters of one book (+ search) ----------
  var indexes = {}; // book -> Promise<entries[]>
  function buildIndex(book, ix, progress) {
    if (indexes[book]) return indexes[book];
    var entries = [], i = 0, done = 0;
    var worker = function () {
      if (i >= ix.sections.length) return Promise.resolve();
      var sec = ix.sections[i++];
      return fetch('data/hadith/' + book + '/' + sec.id + '.json').then(function (r) { return r.json(); }).then(function (rows) {
        rows.forEach(function (r) {
          var en = r[2] || '';
          entries.push({ sid: sec.id, num: r[0], en: en, n: QR.normTx(en) });
        });
        done++; progress(done, ix.sections.length);
        return worker();
      });
    };
    indexes[book] = Promise.all([worker(), worker(), worker()]).then(function () { return entries; }).catch(function (e) { delete indexes[book]; throw e; });
    return indexes[book];
  }
  function snippet(text, tokens) {
    var low = text.toLowerCase(), pos = -1;
    for (var i = 0; i < tokens.length && pos < 0; i++) pos = low.indexOf(tokens[i]);
    var start = Math.max(0, pos - 60), s = text.slice(start, start + 200);
    var out = esc((start > 0 ? '…' : '') + s + (start + 200 < text.length ? '…' : ''));
    tokens.forEach(function (tk) {
      if (tk.length < 2) return;
      out = out.replace(new RegExp('(' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  QR.hadith.snippet = snippet;
  // Search one book's English text. Resolves { out: matches, toks, secName }.
  QR.hadith.search = function (book, q, progress) {
    return QR.json('data/hadith/' + book + '/index.json').then(function (ix) {
      var secName = {}; ix.sections.forEach(function (s) { secName[s.id] = s.en; });
      return buildIndex(book, ix, progress).then(function (entries) {
        var toks = QR.normTx(q).split(' ').filter(Boolean), out = [];
        for (var i = 0; i < entries.length && out.length < 60; i++) {
          var e = entries[i];
          if (String(e.num) === q || toks.every(function (tk) { return e.n.indexOf(tk) !== -1; })) out.push(e);
        }
        return { out: out, toks: toks, secName: secName };
      });
    });
  };

  QR.views.hadithBook = function (book) {
    QR.curSurah = 0; var token = ++QR.navToken;
    app().innerHTML = QR.header('…', { back: true }) + '<main class="wrap"><p class="state">' + esc(t('loading')) + '</p></main>';
    QR.json('data/hadith/' + book + '/index.json').then(function (ix) {
      if (token !== QR.navToken) return;
      app().innerHTML = QR.header(ix.en, { back: true, sub: ix.ar }) + '<main class="wrap">' +
        '<div class="searchbox">' + QR.ic.search + '<input id="hq" type="search" placeholder="' + esc(t('search_in_book')) + '" autocomplete="off"></div>' +
        '<div id="hres"></div><div id="secs">' +
        ix.sections.map(function (s) {
          return '<a class="row" href="#/h/' + book + '/' + s.id + '"><span class="num"><i>' + esc(s.id) + '</i></span><span class="nm"><b>' +
            esc(s.en) + '</b><small>' + esc(t('hadith_count', { n: s.n })) + '</small></span></a>';
        }).join('') + '</div></main>';
      var timer = null, secName = {};
      ix.sections.forEach(function (s) { secName[s.id] = s.en; });
      $('#hq').addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var q = $('#hq').value.trim(), res = $('#hres');
          if (!q) { res.innerHTML = ''; $('#secs').hidden = false; return; }
          $('#secs').hidden = true;
          res.innerHTML = '<p class="state">' + esc(t('searching', { d: 0, t: ix.sections.length })) + '</p>';
          buildIndex(book, ix, function (d, tt) {
            var st = $('#hres .state'); if (st) st.textContent = t('searching', { d: d, t: tt });
          }).then(function (entries) {
            if ($('#hq').value.trim() !== q) return;
            var qn = QR.normTx(q), toks = qn.split(' ').filter(Boolean), out = [];
            for (var i = 0; i < entries.length && out.length < 60; i++) {
              var e = entries[i];
              if (String(e.num) === q || toks.every(function (tk) { return e.n.indexOf(tk) !== -1; })) out.push(e);
            }
            res.innerHTML = out.length
              ? '<p class="sub">' + esc(t('results_n', { n: out.length + (out.length === 60 ? '+' : '') })) + '</p>' + out.map(function (e) {
                return '<a class="row hit" href="#/h/' + book + '/' + e.sid + '/' + e.num + '"><span class="nm"><b>' + esc(t('hadith')) + ' ' + esc(e.num) +
                  ' · ' + esc(secName[e.sid]) + '</b><small>' + snippet(e.en, toks) + '</small></span></a>';
              }).join('')
              : '<p class="state">' + esc(t('no_results')) + '</p>';
          }).catch(function (err) { res.innerHTML = QR.errorBox(err.message); });
        }, 350);
      });
    }).catch(function (err) {
      if (token === QR.navToken) app().innerHTML = QR.header(t('hadith_library'), { back: true }) + '<main class="wrap">' + QR.errorBox(err.message) + '</main>';
    });
    window.scrollTo(0, 0);
  };

  // ---------- Hadith of one chapter ----------
  function card(book, bookEn, sid, r) {
    var num = r[0], key = 'h|' + book + '|' + num + '|' + sid, on = QR.bm.has(key);
    var useUr = S.htr === 'ur' && r[3];
    var tr = useUr ? r[3] : r[2];
    return '<article class="h" id="hd' + esc(num) + '">' +
      '<div class="hh"><span class="hn">' + esc(num) + '</span><span class="hb">' + esc(bookEn) + '</span>' +
      (r[4] ? '<span class="chip">' + esc(r[4]) + '</span>' : '') + '</div>' +
      (r[1] ? '<div class="har" lang="ar" dir="rtl">' + esc(r[1]) + '</div>' : '') +
      (tr ? '<p class="tr' + (useUr ? ' rtl' : '') + '" lang="' + (useUr ? 'ur' : 'en') + '" dir="' + (useUr ? 'rtl' : 'ltr') + '">' + esc(tr) + '</p>' : '') +
      '<div class="vt"><button data-act="hbm" data-k="' + esc(key) + '" class="' + (on ? 'on' : '') + '">' + (on ? QR.ic.starOn : QR.ic.star) + '<span>' + esc(on ? t('bookmarked') : t('bookmark')) + '</span></button>' +
      '<button data-act="hshare" data-b="' + book + '" data-s="' + sid + '" data-n="' + esc(num) + '" aria-label="' + esc(t('share')) + '">' + QR.ic.share + '</button>' +
      '<button data-act="hcopy" data-b="' + book + '" data-s="' + sid + '" data-n="' + esc(num) + '" aria-label="' + esc(t('copy')) + '">' + QR.ic.copy + '</button>' +
      '<button data-act="askhadith" data-b="' + book + '" data-s="' + sid + '" data-n="' + esc(num) + '">' + QR.ic.spark + '<span>' + esc(t('ask_ai')) + '</span></button></div></article>';
  }

  QR.views.hadithSection = function (book, sid, num) {
    QR.curSurah = 0; var token = ++QR.navToken;
    app().innerHTML = QR.header('…', { back: true }) + '<main class="wrap"><p class="state">' + esc(t('loading')) + '</p></main>';
    Promise.all([QR.json('data/hadith/' + book + '/index.json'), loadSection(book, sid)]).then(function (x) {
      if (token !== QR.navToken) return;
      var ix = x[0], rows = x[1];
      var sec = ix.sections.filter(function (s) { return s.id === sid; })[0] || { en: t('chapter') + ' ' + sid };
      var shown = 0;
      var target = -1;
      if (num) for (var i = 0; i < rows.length; i++) if (String(rows[i][0]) === String(num)) { target = i; break; }
      var upto = Math.max(PAGE, target >= 0 ? target + 5 : 0);
      var render = function () {
        var end = Math.min(rows.length, upto), h = '';
        for (var i = shown; i < end; i++) h += card(book, ix.en, sid, rows[i]);
        shown = end;
        var box = $('#hlist'); box.insertAdjacentHTML('beforeend', h);
        var more = $('#hmore');
        if (more) more.remove();
        if (shown < rows.length) box.insertAdjacentHTML('afterend', '<button class="btn ghost wide" id="hmore" data-act="hmore">' + esc(t('load_more')) + ' (' + (rows.length - shown) + ')</button>');
      };
      app().innerHTML = QR.header(sec.en, { back: true, sub: ix.ar }) + '<main class="wrap"><div class="hsec"><small>' + esc(ix.en) + '</small><b>' + esc(sec.en) + '</b><small>' +
        esc(t('hadith_count', { n: rows.length })) + '</small></div><div id="hlist"></div></main>';
      QR.hadith.more = function () { upto = shown + PAGE; render(); };
      render();
      if (target >= 0) {
        var el = document.getElementById('hd' + num);
        if (el) { el.classList.add('flash'); el.scrollIntoView(); }
      } else window.scrollTo(0, 0);
    }).catch(function (err) {
      if (token === QR.navToken) app().innerHTML = QR.header(t('hadith_library'), { back: true }) + '<main class="wrap">' + QR.errorBox(err.message) + '</main>';
    });
  };

  // ---------- Actions ----------
  function find(b) {
    return Promise.all([QR.json('data/hadith/' + b.dataset.b + '/index.json'), loadSection(b.dataset.b, b.dataset.s)]).then(function (x) {
      var row = x[1].filter(function (r) { return String(r[0]) === b.dataset.n; })[0];
      return { ix: x[0], row: row };
    });
  }
  function plain(f, b) {
    var useUr = S.htr === 'ur' && f.row[3];
    return (f.row[1] ? f.row[1] + '\n' : '') + (useUr ? f.row[3] : f.row[2]) + '\n— ' + f.ix.en + ', ' + t('hadith') + ' ' + b.dataset.n;
  }
  QR.on('hbm', function (b) {
    var on = QR.bm.toggle(b.dataset.k);
    b.classList.toggle('on', on);
    b.innerHTML = (on ? QR.ic.starOn : QR.ic.star) + '<span>' + esc(on ? t('bookmarked') : t('bookmark')) + '</span>';
  });
  QR.on('hshare', function (b) { find(b).then(function (f) { QR.shareText(plain(f, b)); }); });
  QR.on('hcopy', function (b) {
    find(b).then(function (f) { return QR.copyText(plain(f, b)); }).then(function () { QR.toast(t('copied')); }, function () { QR.toast(t('copy_failed')); });
  });
  QR.on('hmore', function () { if (QR.hadith.more) QR.hadith.more(); });
  QR.on('askhadith', function (b) {
    find(b).then(function (f) {
      var ar = (f.row[1] || '').slice(0, 900);
      QR.aiPrefill = {
        question: t('explain_hadith') + ' — ' + f.ix.en + ' ' + b.dataset.n,
        context: f.ix.en + ', hadith ' + b.dataset.n + (f.row[4] ? ' (grade: ' + f.row[4] + ')' : '') + '\nArabic: ' + ar + '\nEnglish: ' + (f.row[2] || '').slice(0, 1500)
      };
      location.hash = '#/ask';
    });
  });
})();
