'use strict';
// More tab (settings) and the About page.
(function () {
  var QR = window.QR, $ = QR.$, esc = QR.esc, t = QR.t, S = QR.S, LS = QR.LS;
  var app = function () { return $('#app'); };
  var CREATOR = 'Dr Sohrab Ali';

  function opts(list, cur) {
    return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('');
  }
  function field(label, control) { return '<label class="set"><span>' + esc(label) + '</span>' + control + '</label>'; }

  QR.views.more = function () {
    QR.curSurah = 0; QR.navToken++;
    var hasKey = !!LS.get('aiKey', '');
    var h = QR.header(t('more'), { sub: 'المزيد' }) + '<main class="wrap">' +
      '<a class="aboutcard" href="#/about"><img src="icon-192.png" alt="" width="48" height="48"><span><b>' + esc(t('app_name')) + '</b><small>' + esc(t('created_by')) + ' ' + CREATOR + '</small></span><span class="chev flip">›</span></a>' +

      '<section class="card"><h3>' + esc(t('language')) + ' · ' + esc(t('quran_translation')) + '</h3>' +
      field(t('language'), '<select data-chg="lang">' + opts(Object.keys(QR.LANGS).map(function (k) { return [k, QR.LANGS[k].name]; }), S.lang) + '</select>') +
      field(t('quran_translation'), '<select data-chg="trans">' + opts(QR.TRANS.map(function (x) { return [x.k, x.k === 'none' ? t('no_translation') : x.label]; }), S.tr) + '</select>') +
      field(t('hadith_translation'), '<select data-chg="htr">' + opts([['en', 'English'], ['ur', 'اردو · Urdu']], S.htr) + '</select>') + '</section>' +

      '<section class="card"><h3>' + esc(t('theme')) + '</h3>' +
      '<div class="seg" role="group">' + [['auto', 'auto'], ['light', 'light'], ['dark', 'dark']].map(function (x) {
        return '<button data-act="theme" data-v="' + x[0] + '" class="' + (S.theme === x[0] ? 'on' : '') + '">' + esc(t(x[1])) + '</button>';
      }).join('') + '</div>' +
      '<label class="set col"><span>' + esc(t('text_size')) + ' <b id="fsv">' + S.fs + '</b></span><input type="range" min="22" max="56" step="2" value="' + S.fs + '" data-chg="fs"></label>' +
      '<div class="preview ar" lang="ar" dir="rtl" id="fsprev">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div></section>' +

      '<section class="card"><h3>' + esc(t('reciter')) + '</h3>' +
      field(t('reciter'), '<select data-chg="rec">' + opts(QR.RECITERS.map(function (r) { return [r.id, r.name]; }), S.rec) + '</select>') +
      field(t('speed'), '<select data-chg="speed">' + opts([[0.75, '0.75×'], [1, '1×'], [1.25, '1.25×'], [1.5, '1.5×']], S.speed) + '</select>') +
      '<label class="set"><span>' + esc(t('auto_next')) + '</span><input type="checkbox" data-chg="autonext"' + (S.autoNext ? ' checked' : '') + '></label></section>' +

      '<section class="card"><h3>' + esc(t('offline_audio')) + '</h3><p id="aus"></p><div class="prog"><i id="apbar"></i></div>' +
      '<button class="btn wide" data-act="dlaudio">' + esc(t('download_all')) + '</button>' +
      '<button class="btn ghost wide" data-act="rmaudio" style="margin-top:8px">' + esc(t('remove_audio')) + '</button>' +
      '<p class="note">' + esc(t('download_warn')) + '</p></section>' +

      '<section class="card"><h3>' + esc(t('ai_helper')) + '</h3>' +
      field(t('model'), '<select data-chg="model">' + opts([['claude-haiku-5-5', 'Claude Haiku 5.5 (fast)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (smarter)']], S.model) + '</select>') +
      (hasKey ? '<button class="btn ghost wide" data-act="rmkey">' + esc(t('remove_key')) + '</button>'
        : '<a class="btn wide" href="#/ask" data-act="goai">' + esc(t('ai_setup_title')) + '</a>') +
      '<p class="note">' + esc(t('ai_disclaimer')) + '</p></section>' +

      '<a class="row" href="#/b"><span class="nm"><b>' + esc(t('bookmarks')) + '</b></span><span class="chev flip">›</span></a>' +
      '<a class="row" href="#/about"><span class="nm"><b>' + esc(t('about')) + '</b></span><span class="chev flip">›</span></a>' +
      '<p class="credit">' + esc(t('created_by')) + ' <b>' + CREATOR + '</b> · ' + esc(t('version')) + ' ' + QR.VERSION + '</p></main>';
    app().innerHTML = h;
    QR.refreshMore();
    window.scrollTo(0, 0);
  };

  QR.refreshMore = function () {
    var o = $('#aus'); if (!o || QR.audio.dl.busy) return;
    var n = QR.audio.doneCount(S.rec);
    o.textContent = t('offline_status', { n: n, r: QR.reciter(S.rec).name });
    var pb = $('#apbar'); if (pb) pb.style.width = (n / 114 * 100) + '%';
    var bt = $('[data-act=dlaudio]'); if (bt) bt.textContent = t('download_all');
  };

  // ---------- About ----------
  QR.views.about = function () {
    QR.curSurah = 0; QR.navToken++;
    var feats = [1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<li>' + QR.ic.check + '<span>' + esc(t('feat_' + i)) + '</span></li>'; }).join('');
    app().innerHTML = QR.header(t('about'), { back: true }) + '<main class="wrap about">' +
      '<div class="hero"><img src="icon-512.png" alt="" width="96" height="96"><h1>' + esc(t('about_title')) + '</h1><p class="tag">' + esc(t('about_tag')) + '</p>' +
      '<div class="by"><small>' + esc(t('created_by')) + '</small><b>' + CREATOR + '</b></div><small class="ver">' + esc(t('version')) + ' ' + QR.VERSION + '</small></div>' +
      '<section class="card"><p class="desc">' + esc(t('about_desc')) + '</p></section>' +
      '<section class="card"><h3>' + esc(t('feat_title')) + '</h3><ul class="feats">' + feats + '</ul></section>' +
      '<section class="card"><h3>' + esc(t('credits_title')) + '</h3><p class="small">' + esc(t('credits_text')) + '</p></section>' +
      '<section class="card"><h3>' + esc(t('disclaimer_title')) + '</h3><p class="small">' + esc(t('disclaimer_text')) + '</p></section>' +
      '<p class="credit">' + esc(t('created_by')) + ' <b>' + CREATOR + '</b></p></main>';
    window.scrollTo(0, 0);
  };

  // ---------- Handlers ----------
  QR.chg = QR.chg || {};
  QR.chg.lang = function (el) {
    S.lang = el.value; S.tr = QR.LANGS[S.lang].tr; QR.saveSettings();
    QR.renderTabs(); QR.audio.mark(); QR.views.more();
  };
  QR.chg.trans = function (el) { S.tr = el.value; QR.saveSettings(); };
  QR.chg.htr = function (el) { S.htr = el.value; QR.saveSettings(); };
  QR.chg.rec = function (el) { S.rec = el.value; QR.saveSettings(); QR.refreshMore(); QR.audio.restartWithCurrentReciter(); };
  QR.chg.speed = function (el) { S.speed = +el.value; QR.saveSettings(); QR.audio.applySpeed(); };
  QR.chg.autonext = function (el) { S.autoNext = el.checked; QR.saveSettings(); };
  QR.chg.model = function (el) { S.model = el.value; QR.saveSettings(); };
  QR.chg.fs = function (el) { S.fs = +el.value; var v = $('#fsv'); if (v) v.textContent = S.fs; QR.saveSettings(); };
  QR.on('theme', function (b) { S.theme = b.dataset.v; QR.saveSettings(); QR.views.more(); });
  QR.on('rmkey', function () { LS.del('aiKey'); QR.views.more(); });
})();
