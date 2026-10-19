'use strict';
// Recitation player (six reciters) and offline downloads.
(function () {
  var QR = window.QR, $ = QR.$, esc = QR.esc, t = QR.t, S = QR.S, pad3 = QR.pad3, META = QR.META;

  var AU = { el: new Audio(), s: 0, a: 0, on: false, tok: 0, saved: false, retried: false, rec: null };
  AU.el.preload = 'auto';
  var objUrl = null;

  var fileId = function (sn, a) { return a === 0 ? '001001' : pad3(sn) + pad3(a); };
  var keyOf = function (rec, f) { return 'au:' + rec + ':' + f; };
  var urlOf = function (rec, f) { return 'https://everyayah.com/data/' + QR.reciter(rec).dir + '/' + f + '.mp3'; };

  QR.audio = { state: AU };

  function mark() {
    QR.$$('.v.playing').forEach(function (v) { v.classList.remove('playing'); });
    var pl = $('#player');
    if (!pl) return;
    if (!AU.s) { pl.hidden = true; document.body.classList.remove('hasplayer'); return; }
    document.body.classList.add('hasplayer');
    pl.hidden = false;
    var m = META[AU.s - 1], r = QR.reciter(AU.rec);
    pl.innerHTML =
      '<div class="pi"><b>' + esc(m.en) + ' · ' + esc(AU.a === 0 ? t('bismillah') : t('verse') + ' ' + AU.a) + '</b><small>' + esc(r.name) + '</small></div>' +
      '<button class="ib" data-act="pprev" aria-label="' + esc(t('prev')) + '"><span class="flip">' + QR.ic.prev + '</span></button>' +
      '<button class="ib main" data-act="ptoggle" aria-label="' + esc(AU.on ? t('pause') : t('play')) + '">' + (AU.on ? QR.ic.pause : QR.ic.play) + '</button>' +
      '<button class="ib" data-act="pnext" aria-label="' + esc(t('next')) + '"><span class="flip">' + QR.ic.next + '</span></button>' +
      '<button class="ib" data-act="pstop" aria-label="' + esc(t('close')) + '">' + QR.ic.close + '</button>';
    if (AU.a > 0 && QR.curSurah === AU.s) {
      var el = document.getElementById('v' + AU.a);
      if (el) {
        el.classList.add('playing');
        var rc = el.getBoundingClientRect();
        if (rc.top < 70 || rc.bottom > window.innerHeight - 150) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }
  QR.audio.mark = mark;

  function load() {
    var tok = ++AU.tok, sn = AU.s, a = AU.a, rec = AU.rec, f = fileId(sn, a);
    var go = function (src) {
      if (tok !== AU.tok) return;
      AU.el.src = src;
      AU.el.playbackRate = S.speed || 1;
      var pr = AU.el.play();
      if (pr && pr.catch) pr.catch(function (e) { if (e && e.name === 'NotAllowedError') { AU.on = false; mark(); } });
    };
    QR.kvGet(keyOf(rec, f)).then(function (blob) {
      if (tok !== AU.tok) return;
      if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
      if (blob && blob.size > 1000) { objUrl = URL.createObjectURL(blob); AU.saved = true; go(objUrl); }
      else { AU.saved = false; go(urlOf(rec, f)); }
    });
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: META[sn - 1].en + (a ? ' · ' + a : ''), artist: QR.reciter(rec).name, album: t('app_name')
        });
      } catch (e) { /* optional */ }
    }
  }

  function play(sn, a) {
    AU.s = sn; AU.a = a; AU.on = true; AU.retried = false; AU.rec = S.rec;
    load(); mark();
  }
  // From verse 1 the recitation opens with the Bismillah (except surahs 1 and 9).
  function start(sn, a) { play(sn, (a === 1 && sn !== 1 && sn !== 9) ? 0 : a); }
  function stop() {
    AU.el.pause(); AU.on = false; AU.s = 0; AU.a = 0; AU.tok++;
    AU.el.removeAttribute('src');
    mark();
  }
  function next() {
    if (!AU.s) return;
    if (AU.a >= META[AU.s - 1].n) {
      var n = AU.s;
      if (S.autoNext && n < 114) {
        var viewing = QR.curSurah === n && /^#\/s\//.test(location.hash);
        start(n + 1, 1);
        if (viewing) location.hash = '#/s/' + (n + 1);
      } else stop();
      return;
    }
    play(AU.s, AU.a + 1);
  }
  function prev() {
    if (!AU.s) return;
    if (AU.a > 1) play(AU.s, AU.a - 1);
    else if (AU.a === 1 && AU.s !== 1 && AU.s !== 9) play(AU.s, 0);
    else play(AU.s, AU.a === 0 ? 0 : 1);
  }
  function toggle() {
    if (!AU.s) return;
    if (AU.on) { AU.el.pause(); AU.on = false; }
    else { AU.on = true; var pr = AU.el.play(); if (pr && pr.catch) pr.catch(function () {}); }
    mark();
  }
  QR.audio.start = start; QR.audio.stop = stop; QR.audio.toggle = toggle;
  QR.audio.restartWithCurrentReciter = function () { if (AU.s) { AU.rec = S.rec; load(); mark(); } };
  QR.audio.applySpeed = function () { AU.el.playbackRate = S.speed || 1; };

  AU.el.addEventListener('ended', next);
  AU.el.addEventListener('error', function () {
    if (!AU.s || !AU.el.getAttribute('src')) return;
    if (!AU.saved && !AU.retried && navigator.onLine !== false) { AU.retried = true; load(); return; }
    QR.toast(navigator.onLine === false ? t('no_internet_audio') : t('audio_error'));
    stop();
  });
  AU.el.addEventListener('play', function () { AU.on = true; mark(); });
  AU.el.addEventListener('pause', function () { if (AU.s && !AU.el.ended) { AU.on = false; mark(); } });
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', toggle);
      navigator.mediaSession.setActionHandler('pause', toggle);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
    } catch (e) { /* optional */ }
  }

  QR.on('play', function (b) { start(QR.curSurah, +b.dataset.a); });
  QR.on('playall', function () { if (AU.s === QR.curSurah) toggle(); else start(QR.curSurah, 1); });
  QR.on('ptoggle', toggle);
  QR.on('pnext', next);
  QR.on('pprev', prev);
  QR.on('pstop', stop);

  // ---------- Offline downloads ----------
  var AD = QR.audio.dl = { busy: false, stop: false };
  var doneMap = function () { return QR.LS.get('auDone2', {}); };
  var isDone = QR.audio.isDone = function (rec, n) { return !!doneMap()[rec + ':' + n]; };
  QR.audio.doneCount = function (rec) {
    var m = doneMap(), c = 0;
    for (var n = 1; n <= 114; n++) if (m[rec + ':' + n]) c++;
    return c;
  };
  var filesOf = function (n) {
    var out = [];
    if (n !== 1 && n !== 9) out.push('001001');
    for (var a = 1; a <= META[n - 1].n; a++) out.push(pad3(n) + pad3(a));
    return out;
  };
  function fetchBlob(url) {
    var ctl = new AbortController();
    var to = setTimeout(function () { ctl.abort(); }, 60000);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      if (!r.ok) throw new Error('Server answered ' + r.status);
      return r.blob();
    }).then(function (b) {
      clearTimeout(to);
      if (!b || b.size < 1000) throw new Error('Incomplete audio file');
      return b;
    }, function (e) { clearTimeout(to); throw e; });
  }
  function saveFile(rec, f) {
    return QR.kvHas(keyOf(rec, f)).then(function (has) {
      if (has) return true;
      var attempt = function (i) {
        return fetchBlob(urlOf(rec, f)).catch(function (e) { if (i >= 2) throw e; return attempt(i + 1); });
      };
      return attempt(0).then(function (b) {
        return QR.kvSet(keyOf(rec, f), b).then(function (ok) {
          if (!ok) throw new Error(t('no_space'));
          return true;
        });
      });
    });
  }
  // Saves every verse of one surah, then verifies each file is on the device before marking it done.
  var dlSurah = QR.audio.dlSurah = function (rec, n, progress) {
    var files = filesOf(n), i = 0, done = 0, err = null;
    var worker = function () {
      if (err || AD.stop || i >= files.length) return Promise.resolve();
      var f = files[i++];
      return saveFile(rec, f).then(function () { done++; progress(done, files.length); return worker(); }, function (e) { err = e; });
    };
    return Promise.all([worker(), worker(), worker(), worker()]).then(function () {
      if (err) throw err;
      if (AD.stop) return false;
      return Promise.all(files.map(function (f) { return QR.kvHas(keyOf(rec, f)); })).then(function (all) {
        if (all.some(function (x) { return !x; })) throw new Error('Some files did not save');
        var d = doneMap(); d[rec + ':' + n] = 1; QR.LS.set('auDone2', d);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* optional */ }
        return true;
      });
    });
  };
  QR.audio.surahLabel = function (rec, n) {
    return isDone(rec, n) ? QR.ic.check + ' ' + t('saved_offline') : QR.ic.download + ' ' + t('save_offline');
  };

  QR.on('dlsurah', function (b) {
    var sn = QR.curSurah, rec = S.rec;
    if (AD.busy) { QR.toast(t('busy')); return; }
    if (isDone(rec, sn)) { QR.toast(t('already_saved')); return; }
    AD.busy = true; AD.stop = false; b.disabled = true;
    var reset = function () {
      AD.busy = false;
      var el = $('#dls'); if (el && QR.curSurah === sn) { el.disabled = false; el.innerHTML = QR.audio.surahLabel(S.rec, sn); }
    };
    dlSurah(rec, sn, function (d, tt) {
      var el = $('#dls'); if (el && QR.curSurah === sn) el.textContent = t('saving', { d: d, t: tt });
    }).then(function (ok) { reset(); if (ok) QR.toast(t('recitation_saved')); })
      .catch(function (err) { reset(); QR.toast(t('save_failed') + ': ' + (err && err.message ? err.message : err)); });
  });

  // Whole-Quran download for the selected reciter (from the More tab)
  QR.on('dlaudio', function (b) {
    if (AD.busy) { AD.stop = true; b.textContent = t('stop') + '…'; return; }
    var rec = S.rec;
    AD.busy = true; AD.stop = false; b.textContent = t('stop');
    var show = function (m, f) { var o = $('#aus'); if (o) o.textContent = m; var pb = $('#apbar'); if (pb) pb.style.width = Math.round(f * 100) + '%'; };
    var chain = Promise.resolve();
    META.forEach(function (m, i) {
      chain = chain.then(function () {
        if (AD.stop || isDone(rec, i + 1)) return;
        return dlSurah(rec, i + 1, function (d, tt) { show(t('saving', { d: d, t: tt }) + '  ' + (i + 1) + '/114 · ' + m.en, i / 114); });
      });
    });
    var fin = function () { AD.busy = false; if (QR.refreshMore) QR.refreshMore(); };
    chain.then(fin, function (err) {
      AD.busy = false;
      var o = $('#aus'); if (o) o.textContent = t('save_failed') + ': ' + (err && err.message ? err.message : err);
      var bt = $('[data-act=dlaudio]'); if (bt) bt.textContent = t('download_all');
    });
  });
  QR.on('rmaudio', function () {
    if (AD.busy) { QR.toast(t('busy')); return; }
    if (AU.s) stop();
    QR.kvKeys().then(function (keys) {
      return QR.kvDel(keys.filter(function (k) { return String(k).indexOf('au:') === 0; }));
    }).then(function () { QR.LS.set('auDone2', {}); if (QR.refreshMore) QR.refreshMore(); QR.toast(t('removed')); });
  });
})();
