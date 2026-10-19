'use strict';
// Ask tab: smart search (offline) and the optional AI helper (needs the user's own key).
(function () {
  var QR = window.QR, $ = QR.$, esc = QR.esc, t = QR.t, S = QR.S, META = QR.META, LS = QR.LS;
  var app = function () { return $('#app'); };
  var STOP = ('the a an of and or to is are was were be in on at for with by from as that this these those it its what which who whom how why does do did ' +
    'say says said about verse verses ayah ayat quran islam islamic tell me show give any there their his her him they them you your can could should would will ' +
    'am i my we our us not no if then than into over under more most some such very also but so')
    .split(' ').reduce(function (o, w) { o[w] = 1; return o; }, {});

  // ---------- Quran search over normalised text ----------
  var normCache = {};
  function norm(k) {
    if (normCache[k]) return normCache[k];
    var p = k === 'ar' ? QR.quranAr() : QR.json('data/quran/' + k + '.json');
    normCache[k] = p.then(function (d) {
      return d.map(function (s) { return s.map(function (x) { return k === 'ar' ? QR.normAr(x) : QR.normTx(x); }); });
    }).catch(function (e) { delete normCache[k]; throw e; });
    return normCache[k];
  }
  // Returns [{s, a, score}] best first.
  QR.searchQuran = function (q, opts) {
    opts = opts || {};
    var limit = opts.limit || 50;
    var qn = QR.normTx(q), qa = QR.normAr(q);
    var toks = qn.split(' ').filter(function (w) { return w && (opts.keepStop || !STOP[w]); });
    if (!toks.length) toks = qn.split(' ').filter(Boolean);
    var keys = ['ar', 'en']; if (S.tr !== 'none' && S.tr !== 'en') keys.push(S.tr);
    return Promise.all(keys.map(norm)).then(function (arrs) {
      var res = [];
      for (var s = 0; s < 114; s++) {
        for (var a = 0; a < META[s].n; a++) {
          var score = 0, hits = 0;
          var texts = arrs.map(function (x) { return x[s][a]; });
          var all = texts.join(' | ');
          if (qn.length > 2 && all.indexOf(qn) !== -1) score += 10;
          if (qa.length > 2 && texts[0].indexOf(qa) !== -1) score += 10;
          for (var i = 0; i < toks.length; i++) if (all.indexOf(toks[i]) !== -1) hits++;
          score += hits;
          var need = opts.loose ? 1 : toks.length;
          if (hits >= need && hits > 0) res.push({ s: s + 1, a: a + 1, score: score });
        }
      }
      res.sort(function (x, y) { return y.score - x.score || x.s - y.s || x.a - y.a; });
      return { toks: toks, results: res.slice(0, limit), total: res.length };
    });
  };

  // ---------- Search mode ----------
  var searchState = { q: '', scope: 'quran' };
  function highlight(text, toks) {
    var out = esc(text);
    toks.forEach(function (tk) {
      if (tk.length < 2) return;
      out = out.replace(new RegExp('(' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }
  function scopeOptions() {
    var books = QR.hadithBooksCache ? Object.keys(QR.hadithBooksCache).map(function (k) { return QR.hadithBooksCache[k]; }) : [];
    return '<option value="quran">' + esc(t('scope_quran')) + '</option>' + books.map(function (b) {
      return '<option value="' + b.id + '"' + (searchState.scope === b.id ? ' selected' : '') + '>' + esc(b.en) + '</option>';
    }).join('');
  }
  function runSearch() {
    var q = searchState.q.trim(), box = $('#sres');
    if (!box) return;
    if (!q) { box.innerHTML = ''; return; }
    var ref = /^(\d{1,3})\s*[:.]\s*(\d{1,3})$/.exec(q);
    if (searchState.scope === 'quran') {
      if (ref && +ref[1] >= 1 && +ref[1] <= 114 && +ref[2] >= 1 && +ref[2] <= META[ref[1] - 1].n) { location.hash = '#/s/' + ref[1] + '/' + ref[2]; return; }
      box.innerHTML = '<p class="state">' + esc(t('loading')) + '</p>';
      Promise.all([QR.searchQuran(q), QR.quran()]).then(function (x) {
        if (searchState.q.trim() !== q || searchState.scope !== 'quran') return;
        var r = x[0], d = x[1];
        if (!r.results.length) { box.innerHTML = '<p class="state">' + esc(t('no_results')) + '</p>'; return; }
        box.innerHTML = '<p class="sub">' + esc(t('results_n', { n: r.total > 50 ? '50+' : r.total })) + '</p>' + r.results.map(function (h) {
          var tx = d.tr ? d.tr[h.s - 1][h.a - 1] : d.ar[h.s - 1][h.a - 1];
          return '<a class="row hit" href="#/s/' + h.s + '/' + h.a + '"><span class="nm"><b>' + esc(META[h.s - 1].en) + ' ' + h.s + ':' + h.a +
            '</b><small>' + highlight(tx.length > 220 ? tx.slice(0, 220) + '…' : tx, r.toks) + '</small></span></a>';
        }).join('');
      }).catch(function (e) { box.innerHTML = QR.errorBox(e.message); });
    } else {
      box.innerHTML = '<p class="state">' + esc(t('searching', { d: 0, t: '…' })) + '</p>';
      QR.hadith.search(searchState.scope, q, function (d, tt) {
        var st = $('#sres .state'); if (st) st.textContent = t('searching', { d: d, t: tt });
      }).then(function (r) {
        if (searchState.q.trim() !== q) return;
        box.innerHTML = r.out.length
          ? '<p class="sub">' + esc(t('results_n', { n: r.out.length + (r.out.length === 60 ? '+' : '') })) + '</p>' + r.out.map(function (e) {
            return '<a class="row hit" href="#/h/' + searchState.scope + '/' + e.sid + '/' + e.num + '"><span class="nm"><b>' + esc(t('hadith')) + ' ' + esc(e.num) +
              ' · ' + esc(r.secName[e.sid] || '') + '</b><small>' + QR.hadith.snippet(e.en, r.toks) + '</small></span></a>';
          }).join('')
          : '<p class="state">' + esc(t('no_results')) + '</p>';
      }).catch(function (e) { box.innerHTML = QR.errorBox(e.message); });
    }
  }

  // ---------- AI helper ----------
  var API = 'https://api.anthropic.com/v1/messages';
  var chat = LS.get('chat', []);
  var busy = false;

  function md(s) {
    var lines = esc(s).split('\n'), out = [], list = false;
    var inline = function (l) {
      return l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\b(\d{1,3}):(\d{1,3})\b/g, function (m, a, b) {
        var si = +a, ai = +b;
        return (si >= 1 && si <= 114 && ai >= 1 && ai <= META[si - 1].n) ? '<a class="vref" href="#/s/' + si + '/' + ai + '">' + m + '</a>' : m;
      });
    };
    lines.forEach(function (l) {
      var m = /^\s*(?:[-*•]|\d+\.)\s+(.*)/.exec(l);
      if (m) { if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(m[1]) + '</li>'); }
      else { if (list) { out.push('</ul>'); list = false; } if (l.trim()) out.push('<p>' + inline(l) + '</p>'); }
    });
    if (list) out.push('</ul>');
    return out.join('');
  }
  function system() {
    return 'You are a careful, respectful Islamic study assistant inside a Quran and Hadith reading app. ' +
      'Reply in ' + QR.LANGS[S.lang].name + ' unless the user writes in another language. ' +
      'Ground answers in the Quran and cite verses as "Surah Name chapter:verse" (for example Al-Baqarah 2:255). ' +
      'When a Context block or "Relevant verses" list is provided, it comes from the app\'s own data: use it faithfully and never invent verse numbers or wording. ' +
      'You may mention hadith by collection name only when you are confident, and tell the user to verify in the Hadith library; never fabricate hadith text or numbers. ' +
      'For rulings (fiqh, fatwa) briefly explain the main scholarly views and recommend asking a qualified scholar. ' +
      'Keep answers clear and reasonably short, with simple formatting.';
  }
  function renderChat() {
    var box = $('#chat'); if (!box) return;
    if (!chat.length) {
      box.innerHTML = '<div class="aiintro">' + QR.ic.spark + '<p>' + esc(t('ai_intro')) + '</p><div class="chips">' +
        ['ex1', 'ex2', 'ex3'].map(function (k) { return '<button data-act="aiex" data-q="' + esc(t(k)) + '">' + esc(t(k)) + '</button>'; }).join('') + '</div></div>';
    } else {
      box.innerHTML = chat.map(function (m) {
        return '<div class="msg ' + (m.r === 'u' ? 'u' : 'a') + (m.e ? ' err' : '') + '">' + (m.r === 'u' ? '<p>' + esc(m.c) + '</p>' : md(m.c)) + '</div>';
      }).join('') + (busy ? '<div class="msg a think"><span class="dots"><i></i><i></i><i></i></span> ' + esc(t('thinking')) + '</div>' : '');
    }
    var last = box.lastElementChild; if (last && chat.length) last.scrollIntoView({ block: 'end' });
  }
  function save() { LS.set('chat', chat.slice(-30)); }

  function errMsg(status, j) {
    if (status === 401 || status === 403) return t('ai_err_key');
    if (status === 429 || status === 529) return t('ai_err_rate');
    return t('ai_err_other') + (j && j.error && j.error.message ? ' (' + j.error.message + ')' : '');
  }
  function callApi(key, msgs) {
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 90000);
    return fetch(API, {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: S.model, max_tokens: 1200, system: system(), messages: msgs })
    }).then(function (r) {
      clearTimeout(to);
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error(errMsg(r.status, j)); e.api = true; throw e; }
        var text = (j && j.content || []).map(function (c) { return c.text || ''; }).join('').trim();
        if (!text) throw Object.assign(new Error(t('ai_err_other')), { api: true });
        return text;
      });
    }, function () { clearTimeout(to); throw Object.assign(new Error(t('ai_err_net')), { api: true }); });
  }

  // Build the final user message: question + optional context + verses found in the app's own text.
  function grounded(question, context) {
    var base = question;
    if (context) base += '\n\n<context>\n' + context + '\n</context>';
    return QR.searchQuran(question, { limit: 6, loose: true }).then(function (r) {
      if (!r.results.length || context) return base;
      return QR.json('data/quran/en.json').then(function (en) {
        var lines = r.results.map(function (h) {
          var tx = en[h.s - 1][h.a - 1]; if (tx.length > 320) tx = tx.slice(0, 320) + '…';
          return '- ' + META[h.s - 1].en + ' ' + h.s + ':' + h.a + ' — ' + tx;
        });
        return base + '\n\n<relevant_verses source="Sahih International, from this app">\n' + lines.join('\n') + '\n</relevant_verses>';
      });
    }).catch(function () { return base; });
  }

  function send(question, context) {
    var key = LS.get('aiKey', '');
    if (!key || busy || !question.trim()) return;
    busy = true;
    chat.push({ r: 'u', c: question });
    renderChat(); setComposer(false);
    // Previous turns are sent as plain text; only the newest question carries the retrieved context.
    var hist = chat.slice(0, -1).filter(function (m) { return !m.e; }).slice(-10).map(function (m) { return { role: m.r === 'u' ? 'user' : 'assistant', content: m.c }; });
    while (hist.length && hist[0].role !== 'user') hist.shift();
    // Collapse consecutive same-role turns (can happen after an error) to keep the API happy.
    var clean = [];
    hist.forEach(function (m) { if (clean.length && clean[clean.length - 1].role === m.role) clean[clean.length - 1].content += '\n' + m.content; else clean.push(m); });
    if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
    grounded(question, context).then(function (content) {
      return callApi(key, clean.concat([{ role: 'user', content: content }]));
    }).then(function (text) {
      chat.push({ r: 'a', c: text });
    }, function (e) {
      chat.push({ r: 'a', c: e && e.message ? e.message : t('ai_err_other'), e: 1 });
    }).then(function () { busy = false; save(); renderChat(); setComposer(true); });
  }
  function setComposer(on) {
    var b = $('#aisend'), i = $('#aiin');
    if (b) b.disabled = !on; if (i) i.disabled = !on;
    if (on && i) i.focus();
  }

  function aiView() {
    var key = LS.get('aiKey', '');
    if (!key) {
      return '<div class="card setup"><h3>' + esc(t('ai_setup_title')) + '</h3><p>' + esc(t('ai_setup_help')) + '</p>' +
        '<input id="aikey" class="field" type="password" autocomplete="off" placeholder="sk-ant-…" aria-label="' + esc(t('api_key')) + '">' +
        '<button class="btn wide" data-act="aisavekey">' + esc(t('save')) + '</button>' +
        '<p class="note"><a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">' + esc(t('ai_get_key')) + '</a></p></div>';
    }
    return '<div id="chat" class="chat"></div>' +
      '<div class="composer"><textarea id="aiin" rows="1" placeholder="' + esc(t('ai_ph')) + '" aria-label="' + esc(t('ai_ph')) + '"></textarea>' +
      '<button class="ib send" id="aisend" data-act="aisend" aria-label="' + esc(t('send')) + '"><span class="flip">' + QR.ic.send + '</span></button></div>' +
      '<p class="note center">' + esc(t('ai_disclaimer')) + '</p>';
  }

  QR.views.ask = function () {
    QR.curSurah = 0; QR.navToken++;
    var pre = QR.aiPrefill;
    var mode = pre ? 'ai' : LS.get('askMode', 'search');
    LS.set('askMode', mode);
    var right = mode === 'ai' && LS.get('aiKey', '') && chat.length ? '<button class="ib" data-act="aiclear" aria-label="' + esc(t('clear_chat')) + '">' + QR.ic.trash + '</button>' : '';
    app().innerHTML = QR.header(t('ask_title'), { sub: 'اسأل', right: right }) + '<main class="wrap">' +
      '<div class="seg2" role="tablist"><button data-act="askmode" data-m="search" class="' + (mode === 'search' ? 'on' : '') + '">' + QR.ic.search + ' ' + esc(t('mode_search')) + '</button>' +
      '<button data-act="askmode" data-m="ai" class="' + (mode === 'ai' ? 'on' : '') + '">' + QR.ic.spark + ' ' + esc(t('mode_ai')) + '</button></div>' +
      (mode === 'search'
        ? '<div class="searchrow"><div class="searchbox">' + QR.ic.search + '<input id="sq" type="search" placeholder="' + esc(t('search_ph')) + '" autocomplete="off" value="' + esc(searchState.q) + '"></div>' +
          '<select id="scope" data-chg="scope" aria-label="' + esc(t('scope')) + '">' + scopeOptions() + '</select></div><div id="sres"></div>'
        : aiView()) + '</main>';
    if (mode === 'search') {
      var tm = null;
      $('#sq').addEventListener('input', function (e) { searchState.q = e.target.value; clearTimeout(tm); tm = setTimeout(runSearch, 300); });
      QR.json('data/hadith/books.json').then(function (b) {
        QR.hadithBooksCache = {}; b.forEach(function (x) { QR.hadithBooksCache[x.id] = x; });
        var sel = $('#scope'); if (sel) sel.innerHTML = scopeOptions();
      }).catch(function () {});
      runSearch();
    } else if (LS.get('aiKey', '')) {
      renderChat(); setComposer(!busy);
      var inp = $('#aiin');
      if (inp) {
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); QR.acts.aisend(); } });
        inp.addEventListener('input', function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 130) + 'px'; });
      }
      if (pre) { QR.aiPrefill = null; send(pre.question, pre.context); }
    }
    window.scrollTo(0, 0);
  };

  QR.on('askmode', function (b) { LS.set('askMode', b.dataset.m); QR.views.ask(); });
  QR.on('aisend', function () {
    var i = $('#aiin'); if (!i || !i.value.trim()) return;
    var q = i.value.trim(); i.value = ''; i.style.height = 'auto'; send(q);
  });
  QR.on('aiex', function (b) { send(b.dataset.q); });
  QR.on('aiclear', function () { chat = []; save(); QR.views.ask(); });
  QR.on('aisavekey', function () {
    var v = ($('#aikey').value || '').trim();
    if (v.length < 20) return;
    LS.set('aiKey', v); QR.toast(t('key_saved')); QR.views.ask();
  });
  QR.chg = QR.chg || {};
  QR.chg.scope = function (el) { searchState.scope = el.value; runSearch(); };
})();
