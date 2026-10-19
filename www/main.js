'use strict';
// Router, bottom tab bar and global event handling.
(function () {
  var QR = window.QR, $ = QR.$, t = QR.t, esc = QR.esc;
  QR.navToken = 0;

  var TABS = [
    { id: 'quran', href: '#/', icon: 'quran', label: 'tab_quran' },
    { id: 'hadith', href: '#/h', icon: 'hadith', label: 'tab_hadith' },
    { id: 'ask', href: '#/ask', icon: 'ask', label: 'tab_ask' },
    { id: 'more', href: '#/more', icon: 'more', label: 'tab_more' }
  ];
  QR.renderTabs = function () {
    $('#tabs').innerHTML = TABS.map(function (x) {
      return '<a href="' + x.href + '" data-tab="' + x.id + '">' + QR.ic[x.icon] + '<span>' + esc(t(x.label)) + '</span></a>';
    }).join('');
    setActive(currentTab());
  };
  function currentTab() {
    var p = location.hash.replace(/^#\/?/, '').split('/')[0];
    return p === 'h' ? 'hadith' : p === 'ask' ? 'ask' : (p === 'more' || p === 'about') ? 'more' : 'quran';
  }
  function setActive(id) {
    QR.$$('#tabs a').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === id); });
  }

  QR.route = function () {
    var p = location.hash.replace(/^#\/?/, '').split('/'), v = QR.views;
    setActive(currentTab());
    try {
      if (p[0] === 's' && +p[1] >= 1 && +p[1] <= 114) return v.surah(+p[1], +p[2] || 0);
      if (p[0] === 'b') return v.bookmarks();
      if (p[0] === 'h') {
        if (p[3] !== undefined || p[2] !== undefined) return v.hadithSection(p[1], p[2], p[3]);
        if (p[1]) return v.hadithBook(p[1]);
        return v.hadithBooks();
      }
      if (p[0] === 'ask') return v.ask();
      if (p[0] === 'more') return v.more();
      if (p[0] === 'about') return v.about();
      return v.list();
    } catch (e) {
      $('#app').innerHTML = QR.header(t('app_name')) + '<main class="wrap">' + QR.errorBox(e && e.message ? e.message : String(e)) + '</main>';
    }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    if (act === 'back') { e.preventDefault(); if (history.length > 1) history.back(); else location.hash = '#/'; return; }
    if (act === 'retry') { QR.route(); return; }
    var fn = QR.acts[act];
    if (fn) fn(b, e);
  });
  function onChg(e) {
    var el = e.target.closest ? e.target.closest('[data-chg]') : null;
    if (!el) return;
    var isRange = el.type === 'range';
    if ((e.type === 'input') !== isRange) return;
    var fn = QR.chg[el.dataset.chg];
    if (fn) fn(el);
  }
  document.addEventListener('change', onChg);
  document.addEventListener('input', onChg);
  window.addEventListener('hashchange', QR.route);

  // ---------- Start ----------
  QR.applySettings();
  QR.renderTabs();
  QR.route();
  QR.audio.mark();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) &&
      location.hostname !== 'appassets.androidplatform.net') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
