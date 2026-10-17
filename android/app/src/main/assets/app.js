'use strict';
(function () {
  // ---------- Config ----------
  var API = (window.QURAN_API || 'https://api.alquran.cloud/v1').replace(/\/$/, '');
  var TOTAL_VERSES = 6236;

  // Arabic name | English name | meaning | M(eccan)/D(Medinan) | verse count
  var RAW = [
    '1|الفاتحة|Al-Fatihah|The Opening|M|7',
    '2|البقرة|Al-Baqarah|The Cow|D|286',
    '3|آل عمران|Ali \'Imran|Family of Imran|D|200',
    '4|النساء|An-Nisa|The Women|D|176',
    '5|المائدة|Al-Ma\'idah|The Table Spread|D|120',
    '6|الأنعام|Al-An\'am|The Cattle|M|165',
    '7|الأعراف|Al-A\'raf|The Heights|M|206',
    '8|الأنفال|Al-Anfal|The Spoils of War|D|75',
    '9|التوبة|At-Tawbah|The Repentance|D|129',
    '10|يونس|Yunus|Jonah|M|109',
    '11|هود|Hud|Hud|M|123',
    '12|يوسف|Yusuf|Joseph|M|111',
    '13|الرعد|Ar-Ra\'d|The Thunder|D|43',
    '14|إبراهيم|Ibrahim|Abraham|M|52',
    '15|الحجر|Al-Hijr|The Rocky Tract|M|99',
    '16|النحل|An-Nahl|The Bee|M|128',
    '17|الإسراء|Al-Isra|The Night Journey|M|111',
    '18|الكهف|Al-Kahf|The Cave|M|110',
    '19|مريم|Maryam|Mary|M|98',
    '20|طه|Taha|Ta-Ha|M|135',
    '21|الأنبياء|Al-Anbiya|The Prophets|M|112',
    '22|الحج|Al-Hajj|The Pilgrimage|D|78',
    '23|المؤمنون|Al-Mu\'minun|The Believers|M|118',
    '24|النور|An-Nur|The Light|D|64',
    '25|الفرقان|Al-Furqan|The Criterion|M|77',
    '26|الشعراء|Ash-Shu\'ara|The Poets|M|227',
    '27|النمل|An-Naml|The Ant|M|93',
    '28|القصص|Al-Qasas|The Stories|M|88',
    '29|العنكبوت|Al-\'Ankabut|The Spider|M|69',
    '30|الروم|Ar-Rum|The Romans|M|60',
    '31|لقمان|Luqman|Luqman|M|34',
    '32|السجدة|As-Sajdah|The Prostration|M|30',
    '33|الأحزاب|Al-Ahzab|The Combined Forces|D|73',
    '34|سبأ|Saba|Sheba|M|54',
    '35|فاطر|Fatir|The Originator|M|45',
    '36|يس|Ya-Sin|Ya Sin|M|83',
    '37|الصافات|As-Saffat|Those Ranged in Ranks|M|182',
    '38|ص|Sad|The Letter Sad|M|88',
    '39|الزمر|Az-Zumar|The Groups|M|75',
    '40|غافر|Ghafir|The Forgiver|M|85',
    '41|فصلت|Fussilat|Explained in Detail|M|54',
    '42|الشورى|Ash-Shura|The Consultation|M|53',
    '43|الزخرف|Az-Zukhruf|The Ornaments of Gold|M|89',
    '44|الدخان|Ad-Dukhan|The Smoke|M|59',
    '45|الجاثية|Al-Jathiyah|The Crouching|M|37',
    '46|الأحقاف|Al-Ahqaf|The Wind-Curved Sandhills|M|35',
    '47|محمد|Muhammad|Muhammad|D|38',
    '48|الفتح|Al-Fath|The Victory|D|29',
    '49|الحجرات|Al-Hujurat|The Rooms|D|18',
    '50|ق|Qaf|The Letter Qaf|M|45',
    '51|الذاريات|Adh-Dhariyat|The Winnowing Winds|M|60',
    '52|الطور|At-Tur|The Mount|M|49',
    '53|النجم|An-Najm|The Star|M|62',
    '54|القمر|Al-Qamar|The Moon|M|55',
    '55|الرحمن|Ar-Rahman|The Beneficent|D|78',
    '56|الواقعة|Al-Waqi\'ah|The Inevitable|M|96',
    '57|الحديد|Al-Hadid|The Iron|D|29',
    '58|المجادلة|Al-Mujadila|The Pleading Woman|D|22',
    '59|الحشر|Al-Hashr|The Exile|D|24',
    '60|الممتحنة|Al-Mumtahanah|She That Is Examined|D|13',
    '61|الصف|As-Saff|The Ranks|D|14',
    '62|الجمعة|Al-Jumu\'ah|The Congregation, Friday|D|11',
    '63|المنافقون|Al-Munafiqun|The Hypocrites|D|11',
    '64|التغابن|At-Taghabun|The Mutual Disillusion|D|18',
    '65|الطلاق|At-Talaq|The Divorce|D|12',
    '66|التحريم|At-Tahrim|The Prohibition|D|12',
    '67|الملك|Al-Mulk|The Sovereignty|M|30',
    '68|القلم|Al-Qalam|The Pen|M|52',
    '69|الحاقة|Al-Haqqah|The Reality|M|52',
    '70|المعارج|Al-Ma\'arij|The Ascending Stairways|M|44',
    '71|نوح|Nuh|Noah|M|28',
    '72|الجن|Al-Jinn|The Jinn|M|28',
    '73|المزمل|Al-Muzzammil|The Enshrouded One|M|20',
    '74|المدثر|Al-Muddaththir|The Cloaked One|M|56',
    '75|القيامة|Al-Qiyamah|The Resurrection|M|40',
    '76|الإنسان|Al-Insan|The Human|D|31',
    '77|المرسلات|Al-Mursalat|The Emissaries|M|50',
    '78|النبأ|An-Naba|The Tidings|M|40',
    '79|النازعات|An-Nazi\'at|Those Who Drag Forth|M|46',
    '80|عبس|\'Abasa|He Frowned|M|42',
    '81|التكوير|At-Takwir|The Overthrowing|M|29',
    '82|الانفطار|Al-Infitar|The Cleaving|M|19',
    '83|المطففين|Al-Mutaffifin|The Defrauding|M|36',
    '84|الانشقاق|Al-Inshiqaq|The Sundering|M|25',
    '85|البروج|Al-Buruj|The Mansions of the Stars|M|22',
    '86|الطارق|At-Tariq|The Nightcomer|M|17',
    '87|الأعلى|Al-A\'la|The Most High|M|19',
    '88|الغاشية|Al-Ghashiyah|The Overwhelming|M|26',
    '89|الفجر|Al-Fajr|The Dawn|M|30',
    '90|البلد|Al-Balad|The City|M|20',
    '91|الشمس|Ash-Shams|The Sun|M|15',
    '92|الليل|Al-Layl|The Night|M|21',
    '93|الضحى|Ad-Duha|The Morning Hours|M|11',
    '94|الشرح|Ash-Sharh|The Relief|M|8',
    '95|التين|At-Tin|The Fig|M|8',
    '96|العلق|Al-\'Alaq|The Clot|M|19',
    '97|القدر|Al-Qadr|The Power|M|5',
    '98|البينة|Al-Bayyinah|The Clear Proof|D|8',
    '99|الزلزلة|Az-Zalzalah|The Earthquake|D|8',
    '100|العاديات|Al-\'Adiyat|The Courser|M|11',
    '101|القارعة|Al-Qari\'ah|The Calamity|M|11',
    '102|التكاثر|At-Takathur|The Rivalry in World Increase|M|8',
    '103|العصر|Al-\'Asr|The Declining Day|M|3',
    '104|الهمزة|Al-Humazah|The Traducer|M|9',
    '105|الفيل|Al-Fil|The Elephant|M|5',
    '106|قريش|Quraysh|Quraysh|M|4',
    '107|الماعون|Al-Ma\'un|The Small Kindnesses|M|7',
    '108|الكوثر|Al-Kawthar|The Abundance|M|3',
    '109|الكافرون|Al-Kafirun|The Disbelievers|M|6',
    '110|النصر|An-Nasr|The Divine Support|D|3',
    '111|المسد|Al-Masad|The Palm Fiber|M|5',
    '112|الإخلاص|Al-Ikhlas|The Sincerity|M|4',
    '113|الفلق|Al-Falaq|The Daybreak|M|5',
    '114|الناس|An-Nas|Mankind|M|6'
  ];

  var META = RAW.map(function (l, i) {
    var p = l.split('|');
    if (+p[0] !== i + 1) throw new Error('Surah table out of order at ' + (i + 1));
    return { ar: p[1], en: p[2], tr: p[3], type: p[4] === 'M' ? 'Meccan' : 'Medinan', n: +p[5] };
  });
  // Built-in sanity check: the table must add up to the known verse total.
  var metaSum = META.reduce(function (a, m) { return a + m.n; }, 0);
  if (META.length !== 114 || metaSum !== TOTAL_VERSES) {
    throw new Error('Surah table is inconsistent: ' + META.length + ' surahs, ' + metaSum + ' verses');
  }

  // ---------- Small helpers ----------
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var arNum = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };
  var normAr = function (s) {
    return s.replace(/[​-‏﻿ً-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g, 'ا');
  };
  var normEn = function (s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); };

  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage may be unavailable */ } }
  };

  // IndexedDB key-value store (holds the downloaded text; much roomier than localStorage)
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
  function kvGet(k) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var q = d.transaction('kv').objectStore('kv').get(k);
        q.onsuccess = function () { res(q.result); };
        q.onerror = function () { rej(q.error); };
      });
    }).catch(function () { return undefined; });
  }
  function kvSet(k, v) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('kv', 'readwrite');
        t.objectStore('kv').put(v, k);
        t.oncomplete = function () { res(true); };
        t.onerror = function () { rej(t.error); };
      });
    }).catch(function () { return false; });
  }
  function kvKeys() {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var q = d.transaction('kv').objectStore('kv').getAllKeys();
        q.onsuccess = function () { res(q.result); };
        q.onerror = function () { rej(q.error); };
      });
    }).catch(function () { return []; });
  }

  // ---------- Settings ----------
  var S = Object.assign({ fs: 32, tr: true, theme: 'auto' }, LS.get('settings', {}));
  function applySettings() {
    var r = document.documentElement;
    r.style.setProperty('--fs', S.fs + 'px');
    if (S.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', S.theme);
    document.body.classList.toggle('no-tr', !S.tr);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) {
      var dark = S.theme === 'dark' || (S.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      meta.setAttribute('content', dark ? '#14352a' : '#1f6b52');
    }
  }
  function saveSettings() { LS.set('settings', S); applySettings(); }

  // ---------- Data layer ----------
  var G = { bism: null };      // the Bismillah text, learned from the data itself
  var mem = new Map();

  function getJSON(url) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 30000);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      if (!r.ok) throw new Error('Server answered ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || j.code !== 200) throw new Error('The Quran service returned an error');
      return j.data;
    }).catch(function (e) {
      if (e && e.name === 'AbortError') throw new Error('The request timed out');
      throw e;
    }).then(function (d) { clearTimeout(t); return d; }, function (e) { clearTimeout(t); throw e; });
  }

  function noteBism(b) {
    if (b && !G.bism) { G.bism = b; kvSet('bism', b); }
  }

  // The API prepends the Bismillah to verse 1 of every surah except 1 and 9.
  // Detect it by its first word and split off the 4 words, so it can be shown as a header.
  function build(n, arAyahs, enAyahs) {
    var m = META[n - 1];
    if (!arAyahs || arAyahs.length !== m.n) throw new Error('Unexpected verse count for surah ' + n);
    var ar = arAyahs.map(function (a) { return a.text; });
    var en = null;
    if (enAyahs) {
      if (enAyahs.length !== m.n) throw new Error('Unexpected translation length for surah ' + n);
      en = enAyahs.map(function (a) { return a.text; });
    }
    var bism = null;
    if (n === 1) {
      var t1 = ar[0].trim().split(/\s+/);
      if (t1.length === 4) noteBism(t1.join(' '));
    } else if (n !== 9) {
      var t = ar[0].trim().split(/\s+/);
      if (t.length > 4 && normAr(t[0]) === 'بسم') {
        bism = t.slice(0, 4).join(' ');
        ar[0] = t.slice(4).join(' ');
        noteBism(bism);
      }
    }
    return { n: n, ar: ar, en: en, bism: bism };
  }

  function loadSurah(n) {
    if (mem.has(n)) return Promise.resolve(mem.get(n));
    return kvGet('s:' + n).then(function (s) {
      if (s) { mem.set(n, s); return s; }
      return getJSON(API + '/surah/' + n + '/editions/quran-uthmani,en.sahih').then(function (d) {
        var a = d.filter(function (x) { return x.edition.identifier === 'quran-uthmani'; })[0];
        var e = d.filter(function (x) { return x.edition.identifier === 'en.sahih'; })[0];
        if (!a) throw new Error('Arabic text missing in the response');
        var built = build(n, a.ayahs, e && e.ayahs);
        mem.set(n, built);
        kvSet('s:' + n, built);
        return built;
      });
    });
  }

  function downloadAll(progress) {
    progress('Downloading Arabic text…', 0.05);
    return getJSON(API + '/quran/quran-uthmani').then(function (a) {
      progress('Downloading English translation…', 0.4);
      return getJSON(API + '/quran/en.sahih').then(function (e) { return [a, e]; });
    }).then(function (pair) {
      var a = pair[0], e = pair[1];
      if (!a.surahs || a.surahs.length !== 114) throw new Error('Incomplete download (surah count)');
      var total = 0, chain = Promise.resolve();
      a.surahs.forEach(function (su, i) {
        chain = chain.then(function () {
          if (su.number !== i + 1) throw new Error('Unexpected surah order');
          var s = build(i + 1, su.ayahs, e.surahs && e.surahs[i] && e.surahs[i].ayahs);
          total += s.ar.length;
          mem.set(i + 1, s);
          return kvSet('s:' + (i + 1), s).then(function (ok) {
            if (!ok) throw new Error('Could not save to this device (storage unavailable or full)');
            progress('Saving… ' + (i + 1) + ' / 114', 0.5 + 0.5 * (i + 1) / 114);
          });
        });
      });
      return chain.then(function () {
        if (total !== TOTAL_VERSES) throw new Error('Verse total mismatch (' + total + ')');
        LS.set('offlineAll', true);
        return total;
      });
    });
  }

  // ---------- Recitation (Maher Al-Muaiqly) ----------
  // Verse audio is streamed from EveryAyah.com, with the Al Quran Cloud CDN as a backup source.
  var OFF = [0];
  META.forEach(function (m, i) { OFF[i + 1] = OFF[i] + m.n; });
  var pad3 = function (n) { return ('00' + n).slice(-3); };
  function audioUrls(sn, a) {
    if (a === 0) return ['https://everyayah.com/data/Maher_AlMuaiqly_64kbps/001001.mp3',
                         'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/1.mp3'];
    return ['https://everyayah.com/data/Maher_AlMuaiqly_64kbps/' + pad3(sn) + pad3(a) + '.mp3',
            'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/' + (OFF[sn - 1] + a) + '.mp3'];
  }
  var AU = { el: new Audio(), s: 0, a: 0, on: false, src: 0 };
  AU.el.preload = 'auto';

  function auMark() {
    document.querySelectorAll('.v.playing').forEach(function (v) { v.classList.remove('playing'); });
    var pl = $('#pl');
    if (!AU.s) { if (pl) pl.hidden = true; document.body.classList.remove('hasplayer'); return; }
    document.body.classList.add('hasplayer');
    if (pl) {
      pl.hidden = false;
      $('#plt').textContent = META[AU.s - 1].en + ' · ' + (AU.a === 0 ? 'Bismillah' : 'verse ' + AU.a);
      $('#plp').textContent = AU.on ? '❚❚' : '▶';
    }
    if (AU.a > 0 && curSurah === AU.s) {
      var el = document.getElementById('v' + AU.a);
      if (el) {
        el.classList.add('playing');
        var r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }
  function auLoad() {
    var u = audioUrls(AU.s, AU.a);
    AU.el.src = u[AU.src] || u[0];
    var pr = AU.el.play();
    if (pr && pr.catch) pr.catch(function (e) { if (e && e.name === 'NotAllowedError') { AU.on = false; auMark(); } });
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: META[AU.s - 1].en + (AU.a ? ' · verse ' + AU.a : ''), artist: 'Maher Al-Muaiqly', album: 'Quran Reader'
        });
      } catch (e) { /* optional */ }
    }
  }
  function auPlay(sn, a) {
    AU.s = sn; AU.a = a; AU.on = true; AU.src = 0;
    auLoad(); auMark();
  }
  function auStart(sn, a) {
    // From verse 1 the recitation opens with the Bismillah (except surahs 1 and 9), as the reciter does.
    auPlay(sn, (a === 1 && sn !== 1 && sn !== 9) ? 0 : a);
  }
  function auStop() {
    AU.el.pause(); AU.on = false; AU.s = 0; AU.a = 0;
    AU.el.removeAttribute('src');
    auMark();
  }
  function auNext() {
    if (!AU.s) return;
    if (AU.a >= META[AU.s - 1].n) { auStop(); return; }
    auPlay(AU.s, AU.a + 1);
  }
  function auPrev() {
    if (!AU.s) return;
    if (AU.a > 1) auPlay(AU.s, AU.a - 1);
    else if (AU.a === 1 && AU.s !== 1 && AU.s !== 9) auPlay(AU.s, 0);
    else auPlay(AU.s, AU.a === 0 ? 0 : 1);
  }
  function auToggle() {
    if (!AU.s) return;
    if (AU.on) { AU.el.pause(); AU.on = false; }
    else { AU.on = true; var pr = AU.el.play(); if (pr && pr.catch) pr.catch(function () {}); }
    auMark();
  }
  AU.el.addEventListener('ended', auNext);
  AU.el.addEventListener('error', function () {
    if (!AU.s) return;
    if (AU.src === 0) { AU.src = 1; auLoad(); return; }
    toast('Could not load the recitation. Check your internet connection.');
    auStop();
  });
  AU.el.addEventListener('play', function () { AU.on = true; auMark(); });
  AU.el.addEventListener('pause', function () { if (AU.s && !AU.el.ended) { AU.on = false; auMark(); } });
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', auToggle);
      navigator.mediaSession.setActionHandler('pause', auToggle);
      navigator.mediaSession.setActionHandler('nexttrack', auNext);
      navigator.mediaSession.setActionHandler('previoustrack', auPrev);
    } catch (e) { /* optional */ }
  }

  // ---------- UI ----------
  var app = $('#app');
  var navToken = 0;
  var io = null;
  var curSurah = 0;

  function bmSet() { return new Set(LS.get('bm', [])); }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('on'); }, 1800);
  }

  function errorBox(msg) {
    return '<div class="state err"><p><b>Couldn’t load this surah.</b></p><p>' + esc(msg) +
      '</p><p>Check your internet connection. A surah you have opened once is saved on your phone and works offline.</p>' +
      '<button class="btn" data-act="retry">Try again</button></div>';
  }

  function showList() {
    auStop();
    navToken++; if (io) io.disconnect();
    document.title = 'Quran Reader';
    var last = LS.get('last', null);
    var resume = '';
    if (last && META[last.s - 1]) {
      resume = '<a class="resume" href="#/s/' + last.s + '/' + last.a + '"><small>Continue reading</small><b>' +
        esc(META[last.s - 1].en) + ' · verse ' + last.a + '</b></a>';
    }
    app.innerHTML =
      '<header class="bar"><div class="ttl"><b>Quran</b><span class="art" lang="ar">القرآن الكريم</span></div>' +
      '<a class="ib" href="#/b" aria-label="Bookmarks">★</a>' +
      '<button class="ib" data-act="settings" aria-label="Settings">Aa</button></header>' +
      '<main class="wrap">' + resume +
      '<input id="q" class="search" type="search" placeholder="Search surah name or number" autocomplete="off" aria-label="Search surahs">' +
      '<div id="list"></div></main>';
    var keys = META.map(function (m, i) { return (i + 1) + ' ' + normEn(m.en) + ' ' + normEn(m.tr) + ' ' + normAr(m.ar); });
    var draw = function () {
      var q = $('#q').value.trim();
      var qe = normEn(q), qa = normAr(q);
      var h = '';
      META.forEach(function (m, i) {
        var ok = !q || (qe && keys[i].indexOf(qe) !== -1) || (qa && normAr(m.ar).indexOf(qa) !== -1) || String(i + 1) === q;
        if (!ok) return;
        h += '<a class="row" href="#/s/' + (i + 1) + '"><span class="num">' + (i + 1) + '</span>' +
          '<span class="nm"><b>' + esc(m.en) + '</b><small>' + esc(m.tr) + ' · ' + m.type + ' · ' + m.n + ' verses</small></span>' +
          '<span class="arn" lang="ar">' + esc(m.ar) + '</span></a>';
      });
      $('#list').innerHTML = h || '<p class="state">No surah matches “' + esc(q) + '”.</p>';
    };
    $('#q').addEventListener('input', draw);
    draw();
    window.scrollTo(0, 0);
  }

  function showSurah(n, a) {
    var token = ++navToken; if (io) io.disconnect();
    if (AU.s && AU.s !== n) auStop();
    curSurah = n;
    var m = META[n - 1];
    document.title = m.en + ' – Quran Reader';
    app.innerHTML =
      '<header class="bar"><button class="ib" data-act="back" aria-label="Back">←</button>' +
      '<div class="ttl"><b>' + n + '. ' + esc(m.en) + '</b><span class="art" lang="ar">' + esc(m.ar) + '</span></div>' +
      '<button class="ib" data-act="playall" aria-label="Play recitation">🎧</button>' +
      '<button class="ib" data-act="settings" aria-label="Settings">Aa</button></header>' +
      '<main class="wrap" id="body"><p class="state">Loading…</p></main>';
    window.scrollTo(0, 0);
    LS.set('last', { s: n, a: a || 1 });

    loadSurah(n).then(function (s) {
      if (token !== navToken) return;
      var bms = bmSet();
      var bism = s.bism || G.bism;
      var h = '<section class="shead"><div class="sn" lang="ar">' + esc(m.ar) + '</div><div class="sm">' +
        esc(m.tr) + ' · ' + m.type + ' · ' + m.n + ' verses</div></section>';
      if (n !== 1 && n !== 9 && bism) h += '<div class="bism ar" lang="ar" dir="rtl">' + esc(bism) + '</div>';
      for (var i = 0; i < s.ar.length; i++) {
        var k = n + ':' + (i + 1), on = bms.has(k);
        h += '<article class="v" id="v' + (i + 1) + '" data-a="' + (i + 1) + '">' +
          '<div class="ar" lang="ar" dir="rtl">' + esc(s.ar[i]) + ' <span class="vm">' + arNum(i + 1) + '</span></div>' +
          (s.en ? '<p class="tr"><span class="tn">' + k + '</span> ' + esc(s.en[i]) + '</p>' : '') +
          '<div class="vt"><button data-act="play" data-a="' + (i + 1) + '">▶ Play</button><button data-act="bm" data-k="' + k + '" class="' + (on ? 'on' : '') + '">' + (on ? '★ Saved' : '☆ Bookmark') + '</button>' +
          '<button data-act="share" data-k="' + k + '">Share</button></div></article>';
      }
      h += '<nav class="pn">' +
        (n > 1 ? '<a class="btn ghost" href="#/s/' + (n - 1) + '">← ' + esc(META[n - 2].en) + '</a>' : '<span></span>') +
        (n < 114 ? '<a class="btn" href="#/s/' + (n + 1) + '">' + esc(META[n].en) + ' →</a>' : '<span></span>') + '</nav>';
      $('#body').innerHTML = h;
      auMark();
      if (a && a > 1) {
        var el = document.getElementById('v' + a);
        if (el) { el.classList.add('flash'); el.scrollIntoView(); }
      }
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) LS.set('last', { s: n, a: +e.target.dataset.a }); });
      }, { rootMargin: '-70px 0px -85% 0px' });
      document.querySelectorAll('.v').forEach(function (v) { io.observe(v); });
    }).catch(function (err) {
      if (token !== navToken) return;
      $('#body').innerHTML = errorBox(err && err.message ? err.message : String(err));
    });
  }

  function showBookmarks() {
    auStop();
    navToken++; if (io) io.disconnect();
    document.title = 'Bookmarks – Quran Reader';
    var list = LS.get('bm', []);
    var h = '<header class="bar"><button class="ib" data-act="back" aria-label="Back">←</button><div class="ttl"><b>Bookmarks</b></div>' +
      '<button class="ib" data-act="settings" aria-label="Settings">Aa</button></header><main class="wrap">';
    if (!list.length) h += '<p class="state">No bookmarks yet. Tap “Bookmark” under any verse to save it here.</p>';
    list.forEach(function (k) {
      var p = k.split(':'), m = META[p[0] - 1];
      if (!m) return;
      h += '<div class="row"><a class="nm" href="#/s/' + p[0] + '/' + p[1] + '"><b>' + esc(m.en) + ' · verse ' + p[1] +
        '</b><small>' + esc(m.tr) + '</small></a><button class="ib sm" data-act="rmbm" data-k="' + k + '" aria-label="Remove bookmark">✕</button></div>';
    });
    app.innerHTML = h + '</main>';
    window.scrollTo(0, 0);
  }

  function route() {
    var p = location.hash.replace(/^#\/?/, '').split('/');
    if (p[0] === 's' && +p[1] >= 1 && +p[1] <= 114) return showSurah(+p[1], +p[2] || 0);
    if (p[0] === 'b') return showBookmarks();
    return showList();
  }

  // ---------- Settings sheet ----------
  var dlBusy = false;
  function sheetEl() { return $('#sheet'); }
  function refreshSheet() {
    $('#fs').value = S.fs;
    $('#fsv').textContent = S.fs + ' px';
    $('#trt').checked = S.tr;
    document.querySelectorAll('[data-act=theme]').forEach(function (b) { b.classList.toggle('on', b.dataset.v === S.theme); });
    kvKeys().then(function (keys) {
      var c = keys.filter(function (k) { return String(k).indexOf('s:') === 0; }).length;
      if (!dlBusy) {
        $('#offs').textContent = c >= 114
          ? 'The whole Quran is saved on this device and works without internet.'
          : c + ' of 114 surahs saved on this device. Surahs you open are saved automatically.';
        $('#pbar').style.width = (c / 114 * 100) + '%';
      }
    });
  }
  function openSheet() { sheetEl().hidden = false; refreshSheet(); }
  function closeSheet() { sheetEl().hidden = true; }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t);
    }
    return new Promise(function (res, rej) {
      try {
        var ta = document.createElement('textarea');
        ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); document.body.removeChild(ta);
        ok ? res() : rej(new Error('copy failed'));
      } catch (e) { rej(e); }
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act, k = b.dataset.k;
    if (act === 'settings') openSheet();
    else if (act === 'closeSheet') closeSheet();
    else if (act === 'play') auStart(curSurah, +b.dataset.a);
    else if (act === 'playall') { if (AU.s === curSurah) auToggle(); else auStart(curSurah, 1); }
    else if (act === 'ptoggle') auToggle();
    else if (act === 'pnext') auNext();
    else if (act === 'pprev') auPrev();
    else if (act === 'pstop') auStop();
    else if (act === 'back') { if (history.length > 1) history.back(); else location.hash = '#/'; }
    else if (act === 'retry') route();
    else if (act === 'theme') { S.theme = b.dataset.v; saveSettings(); refreshSheet(); }
    else if (act === 'bm') {
      var set = bmSet(), arr = LS.get('bm', []);
      if (set.has(k)) { arr = arr.filter(function (x) { return x !== k; }); b.classList.remove('on'); b.textContent = '☆ Bookmark'; }
      else { arr.push(k); b.classList.add('on'); b.textContent = '★ Saved'; }
      LS.set('bm', arr);
    }
    else if (act === 'rmbm') { LS.set('bm', LS.get('bm', []).filter(function (x) { return x !== k; })); showBookmarks(); }
    else if (act === 'share') {
      var p = k.split(':'), s = mem.get(+p[0]);
      if (!s) return;
      var text = s.ar[p[1] - 1] + '\n' + (s.en ? s.en[p[1] - 1] + '\n' : '') + '— Quran ' + k;
      if (navigator.share) navigator.share({ text: text }).catch(function () {});
      else copyText(text).then(function () { toast('Verse copied'); }, function () { toast('Could not copy'); });
    }
    else if (act === 'dl') {
      if (dlBusy) return;
      dlBusy = true; b.disabled = true;
      var prog = function (msg, f) { $('#offs').textContent = msg; $('#pbar').style.width = Math.round(f * 100) + '%'; };
      downloadAll(prog).then(function (total) {
        dlBusy = false; b.disabled = false;
        $('#offs').textContent = 'Done. The whole Quran is saved (' + total.toLocaleString('en-US') + ' verses checked).';
        $('#pbar').style.width = '100%';
      }).catch(function (err) {
        dlBusy = false; b.disabled = false;
        $('#offs').textContent = 'Download failed: ' + (err && err.message ? err.message : err) + '. Check your connection and try again.';
      });
    }
  });
  $('#fs').addEventListener('input', function (e) { S.fs = +e.target.value; $('#fsv').textContent = S.fs + ' px'; saveSettings(); });
  $('#trt').addEventListener('change', function (e) { S.tr = e.target.checked; saveSettings(); });
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // ---------- Start ----------
  applySettings();
  kvGet('bism').then(function (b) { if (b && !G.bism) G.bism = b; }).then(function () {
    route();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) &&
        location.hostname !== 'appassets.androidplatform.net' && !window.QURAN_API) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  });

  window.QuranApp = { META: META, build: build, loadSurah: loadSurah, downloadAll: downloadAll, route: route };
})();
