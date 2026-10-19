'use strict';
// Core: shared helpers, settings, translations, data loading, icons.
(function () {
  var QR = window.QR = { acts: {}, views: {}, VERSION: '2.0' };
  QR.on = function (name, fn) { QR.acts[name] = fn; };

  // ---------- Helpers ----------
  var $ = QR.$ = function (s, r) { return (r || document).querySelector(s); };
  QR.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  QR.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  QR.arNum = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  QR.pad3 = function (n) { return ('00' + n).slice(-3); };
  // Strip Arabic diacritics / tatweel and unify alef forms, for searching.
  QR.normAr = function (s) {
    return String(s).replace(/[​-‏﻿ً-ٰٟۖ-ۭـ]/g, '')
      .replace(/[ٱآأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  };
  // Lowercase, drop diacritics and punctuation for Latin/other scripts.
  QR.normTx = function (s) {
    var t = QR.normAr(String(s).toLowerCase());
    try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* old webview */ }
    return t.replace(/[^\p{L}\p{N}\s:]/gu, ' ').replace(/\s+/g, ' ').trim();
  };

  var LS = QR.LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage may be unavailable */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  // IndexedDB key-value store (holds the downloaded recitation audio)
  var dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise(function (res, rej) {
        try {
          var r = indexedDB.open('quran-reader', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
    }
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('kv', mode), st = t.objectStore('kv'), out;
        out = fn(st);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : true); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  QR.kvGet = function (k) { return tx('readonly', function (st) { return st.get(k); }).catch(function () { return undefined; }); };
  QR.kvSet = function (k, v) { return tx('readwrite', function (st) { st.put(v, k); }).then(function () { return true; }, function () { return false; }); };
  QR.kvHas = function (k) { return tx('readonly', function (st) { return st.count(k); }).then(function (n) { return n > 0; }, function () { return false; }); };
  QR.kvKeys = function () { return tx('readonly', function (st) { return st.getAllKeys(); }).catch(function () { return []; }); };
  QR.kvDel = function (keys) { return tx('readwrite', function (st) { keys.forEach(function (k) { st.delete(k); }); }).then(function () { return true; }, function () { return false; }); };

  // ---------- Surah table ----------
  QR.TOTAL_VERSES = 6236;
  QR.META = window.RAW_SURAHS.map(function (l, i) {
    var p = l.split('|');
    if (+p[0] !== i + 1) throw new Error('Surah table out of order at ' + (i + 1));
    return { ar: p[1], en: p[2], tr: p[3], type: p[4] === 'M' ? 'meccan' : 'medinan', n: +p[5] };
  });
  if (QR.META.length !== 114 || QR.META.reduce(function (a, m) { return a + m.n; }, 0) !== QR.TOTAL_VERSES) {
    throw new Error('Surah table is inconsistent');
  }

  // ---------- Languages, translations, reciters ----------
  QR.LANGS = {
    en: { name: 'English', dir: 'ltr', tr: 'en' },
    hi: { name: 'हिन्दी', dir: 'ltr', tr: 'hi' },
    ps: { name: 'پښتو', dir: 'rtl', tr: 'ps' },
    fa: { name: 'فارسی', dir: 'rtl', tr: 'fa' },
    ar: { name: 'العربية', dir: 'rtl', tr: 'arT' }
  };
  QR.TRANS = [
    { k: 'en', label: 'English · Sahih International', lang: 'en', dir: 'ltr' },
    { k: 'hi', label: 'हिन्दी · Hindi', lang: 'hi', dir: 'ltr' },
    { k: 'ps', label: 'پښتو · Pashto (Abdulwali Khan)', lang: 'ps', dir: 'rtl' },
    { k: 'fa', label: 'فارسی · Persian (Makarem Shirazi)', lang: 'fa', dir: 'rtl' },
    { k: 'ur', label: 'اردو · Urdu (Jalandhry)', lang: 'ur', dir: 'rtl' },
    { k: 'arT', label: 'العربية · التفسير الميسر', lang: 'ar', dir: 'rtl' },
    { k: 'none', label: '—', lang: 'en', dir: 'ltr' }
  ];
  QR.RECITERS = [
    { id: 'maher', name: 'Maher Al-Muaiqly', ar: 'ماهر المعيقلي', dir: 'Maher_AlMuaiqly_64kbps' },
    { id: 'alafasy', name: 'Mishary Alafasy', ar: 'مشاري العفاسي', dir: 'Alafasy_64kbps' },
    { id: 'basit', name: 'Abdul Basit (Murattal)', ar: 'عبد الباسط عبد الصمد', dir: 'Abdul_Basit_Murattal_64kbps' },
    { id: 'sudais', name: 'Abdur-Rahman As-Sudais', ar: 'عبد الرحمن السديس', dir: 'Abdurrahmaan_As-Sudais_64kbps' },
    { id: 'shuraim', name: 'Saud Ash-Shuraim', ar: 'سعود الشريم', dir: 'Saood_ash-Shuraym_64kbps' },
    { id: 'ghamdi', name: 'Saad Al-Ghamdi', ar: 'سعد الغامدي', dir: 'Ghamadi_40kbps' }
  ];
  QR.reciter = function (id) {
    for (var i = 0; i < QR.RECITERS.length; i++) if (QR.RECITERS[i].id === id) return QR.RECITERS[i];
    return QR.RECITERS[0];
  };

  // ---------- Settings ----------
  var S = QR.S = Object.assign({
    lang: 'en', tr: 'en', htr: 'en', fs: 32, theme: 'auto', rec: 'maher', speed: 1, autoNext: true, model: 'claude-haiku-5-5'
  }, LS.get('settings2', {}));
  if (!QR.LANGS[S.lang]) S.lang = 'en';

  QR.t = function (k, vars) {
    var d = window.I18N[S.lang] || {};
    var s = d[k] != null ? d[k] : (window.I18N.en[k] != null ? window.I18N.en[k] : k);
    if (vars) for (var x in vars) s = s.split('{' + x + '}').join(vars[x]);
    return s;
  };
  QR.isRtl = function () { return QR.LANGS[S.lang].dir === 'rtl'; };
  QR.trInfo = function () {
    for (var i = 0; i < QR.TRANS.length; i++) if (QR.TRANS[i].k === S.tr) return QR.TRANS[i];
    return QR.TRANS[0];
  };

  QR.applySettings = function () {
    var r = document.documentElement;
    r.style.setProperty('--fs', S.fs + 'px');
    r.lang = S.lang;
    r.dir = QR.LANGS[S.lang].dir;
    if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) {
      var dark = S.theme === 'dark' || (S.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      meta.setAttribute('content', dark ? '#0f2a22' : '#14634d');
    }
    document.title = QR.t('app_name');
  };
  QR.saveSettings = function () { LS.set('settings2', S); QR.applySettings(); };

  // ---------- Data loading ----------
  var cache = {};
  QR.json = function (path) {
    if (!cache[path]) {
      cache[path] = fetch(path).then(function (r) {
        if (!r.ok) throw new Error('Missing data file: ' + path);
        return r.json();
      }).catch(function (e) { delete cache[path]; throw e; });
    }
    return cache[path];
  };
  QR.quranAr = function () { return QR.json('data/quran/ar.json'); };
  QR.quranTr = function (k) { return (!k || k === 'none') ? Promise.resolve(null) : QR.json('data/quran/' + k + '.json'); };
  QR.quran = function () {
    return Promise.all([QR.quranAr(), QR.quranTr(S.tr)]).then(function (x) { return { ar: x[0], tr: x[1] }; });
  };

  // ---------- Icons ----------
  var svg = function (body, fill) {
    return '<svg class="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="' + (fill ? 'currentColor' : 'none') +
      '" stroke="' + (fill ? 'none' : 'currentColor') + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  };
  QR.ic = {
    quran: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V5.5"/><path d="M12 7v6M9 10h6"/>'),
    hadith: svg('<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M16.2 5.2l3.8 1-3.2 14-3.8-1z"/>'),
    ask: svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    more: svg('<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>', true),
    play: svg('<path d="M7 4.5v15l12.5-7.5z"/>', true),
    pause: svg('<rect x="6" y="4.5" width="4.2" height="15" rx="1"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1"/>', true),
    next: svg('<path d="M6 5v14l9-7z"/><rect x="16" y="5" width="3" height="14" rx="1"/>', true),
    prev: svg('<path d="M18 5v14l-9-7z"/><rect x="5" y="5" width="3" height="14" rx="1"/>', true),
    star: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    starOn: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', true),
    share: svg('<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 13v7h14v-7"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    download: svg('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    send: svg('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    trash: svg('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
    spark: svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>'),
    book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V5.5"/>')
  };

  // ---------- Small UI helpers ----------
  QR.toast = function (msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(QR.toast._t);
    QR.toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200);
  };
  QR.copyText = function (t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      try {
        var ta = document.createElement('textarea');
        ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); document.body.removeChild(ta);
        ok ? res() : rej(new Error('copy failed'));
      } catch (e) { rej(e); }
    });
  };
  QR.shareText = function (text) {
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else QR.copyText(text).then(function () { QR.toast(QR.t('copied')); }, function () { QR.toast(QR.t('copy_failed')); });
  };
  // Page header
  QR.header = function (title, opts) {
    opts = opts || {};
    return '<header class="bar">' +
      (opts.back ? '<button class="ib" data-act="back" aria-label="' + QR.esc(QR.t('back')) + '"><span class="flip">' + QR.ic.back + '</span></button>' : '') +
      '<div class="ttl"><b>' + QR.esc(title) + '</b>' + (opts.sub ? '<span class="art" lang="ar" dir="rtl">' + QR.esc(opts.sub) + '</span>' : '') + '</div>' +
      (opts.right || '') + '</header>';
  };
  QR.errorBox = function (msg) {
    return '<div class="state err"><p><b>' + QR.esc(QR.t('error_load')) + '</b></p><p>' + QR.esc(msg) +
      '</p><button class="btn" data-act="retry">' + QR.esc(QR.t('retry')) + '</button></div>';
  };

  // Bookmarks: verses "s:a" and hadith "h|book|number|section"
  QR.bm = {
    list: function () { return LS.get('bm', []); },
    has: function (k) { return QR.bm.list().indexOf(k) !== -1; },
    toggle: function (k) {
      var a = QR.bm.list(), i = a.indexOf(k);
      if (i === -1) a.push(k); else a.splice(i, 1);
      LS.set('bm', a);
      return i === -1;
    }
  };
})();
