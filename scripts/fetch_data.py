#!/usr/bin/env python3
"""Fetches Quran translations, hadith books and fonts into www/ so they ship inside the app."""
import json, os, sys, time, urllib.request, re

UA = {'User-Agent': 'Mozilla/5.0 (QuranReaderBuild)'}
ROOT = sys.argv[1] if len(sys.argv) > 1 else 'www'

def get(url, tries=7):
    err = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read()
        except Exception as e:
            err = e; time.sleep(2 + 3 * i)
    raise RuntimeError('failed %s: %s' % (url, err))

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    return os.path.getsize(path)

def fail(m):
    print('::error::' + m); sys.exit(1)

manifest = {'quran': {}, 'hadith': {}}

# ---------------- Quran ----------------
Q = 'https://api.alquran.cloud/v1/quran/'
EDITIONS = [  # file key, edition id
    ('ar', 'quran-uthmani'),
    ('en', 'en.sahih'),
    ('hi', 'hi.hindi'),
    ('ps', 'ps.abdulwali'),
    ('fa', 'fa.makarem'),
    ('ur', 'ur.jalandhry'),
    ('arT', 'ar.muyassar'),   # Arabic simplified tafsir (the "Arabic" translation option)
]
counts0 = None
for key, ed in EDITIONS:
    d = json.loads(get(Q + ed))['data']
    ss = d['surahs']
    if len(ss) != 114: fail('%s: %d surahs' % (ed, len(ss)))
    c = [len(s['ayahs']) for s in ss]
    if sum(c) != 6236: fail('%s: %d verses' % (ed, sum(c)))
    counts0 = counts0 or c
    if c != counts0: fail('%s: verse counts differ from Arabic' % ed)
    texts = [[a['text'].strip() for a in s['ayahs']] for s in ss]
    if any(not t for s in texts for t in s): fail('%s: empty verse' % ed)
    size = dump('%s/data/quran/%s.json' % (ROOT, key), texts)
    manifest['quran'][key] = {'edition': ed, 'name': d['edition']['englishName'], 'author': d['edition'].get('name', ''), 'bytes': size}
    print('quran', key, ed, size)

# ---------------- Hadith ----------------
H = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/%s.json'
BOOKS = [
    ('bukhari', 'Sahih al-Bukhari', 'صحيح البخاري'),
    ('muslim', 'Sahih Muslim', 'صحيح مسلم'),
    ('abudawud', 'Sunan Abi Dawud', 'سنن أبي داود'),
    ('tirmidhi', 'Jami at-Tirmidhi', 'جامع الترمذي'),
    ('nasai', "Sunan an-Nasa'i", 'سنن النسائي'),
    ('ibnmajah', 'Sunan Ibn Majah', 'سنن ابن ماجه'),
    ('malik', 'Muwatta Malik', 'موطأ مالك'),
    ('nawawi', '40 Hadith of Imam Nawawi', 'الأربعون النووية'),
    ('qudsi', '40 Hadith Qudsi', 'الأحاديث القدسية'),
]
clean = lambda t: re.sub(r'[ \t]+', ' ', (t or '').replace('\r', '')).strip()

def edition(code):
    try:
        return json.loads(get(H % code, tries=4))
    except Exception as e:
        print('missing edition', code, e); return None

index = []
for bk, en_name, ar_name in BOOKS:
    ara = edition('ara-' + bk); eng = edition('eng-' + bk); urd = edition('urd-' + bk)
    if not ara or not eng: fail('hadith %s: Arabic/English missing' % bk)
    def bynum(ed):
        m = {}
        if ed:
            for h in ed['hadiths']:
                m[h['hadithnumber']] = h
        return m
    A, E, U = bynum(ara), bynum(eng), bynum(urd)
    nums = sorted(set(A) | set(E), key=lambda x: float(x))
    secE = eng['metadata'].get('section', {}) or {}
    secA = ara['metadata'].get('section', {}) or {}
    groups = {}
    for n in nums:
        ref = (E.get(n) or A.get(n))['reference']
        groups.setdefault(str(ref.get('book', 0)), []).append(n)
    sections, total = [], 0
    for sid in sorted(groups, key=lambda x: float(x)):
        rows = []
        for n in groups[sid]:
            e, a, u = E.get(n), A.get(n), U.get(n)
            grades = []
            for src in (e, a):
                for g in (src or {}).get('grades', []) or []:
                    s = (g.get('grade') or '').strip()
                    if s and s not in grades: grades.append(s)
            rows.append([n, clean((a or {}).get('text')), clean((e or {}).get('text')), clean((u or {}).get('text')), ' / '.join(grades)])
        total += len(rows)
        dump('%s/data/hadith/%s/%s.json' % (ROOT, bk, sid), rows)
        sections.append({'id': sid, 'en': clean(secE.get(sid, '')) or ('Section ' + sid), 'ar': clean(secA.get(sid, '')), 'n': len(rows)})
    dump('%s/data/hadith/%s/index.json' % (ROOT, bk), {'id': bk, 'en': en_name, 'ar': ar_name, 'total': total, 'ur': bool(urd), 'sections': sections})
    index.append({'id': bk, 'en': en_name, 'ar': ar_name, 'total': total, 'ur': bool(urd), 'sections': len(sections)})
    manifest['hadith'][bk] = total
    print('hadith', bk, total, 'sections', len(sections), 'urdu' if urd else 'no-urdu')
dump('%s/data/hadith/books.json' % ROOT, index)

# ---------------- Fonts ----------------
FONTS = [
    ('AmiriQuran-Regular.ttf', 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiriquran/AmiriQuran-Regular.ttf'),
    ('NotoNaskhArabic.ttf', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf'),
]
os.makedirs(ROOT + '/fonts', exist_ok=True)
for name, url in FONTS:
    b = get(url)
    if len(b) < 50000 or b[:4] not in (b'\x00\x01\x00\x00', b'true', b'OTTO'): fail('bad font ' + name)
    open('%s/fonts/%s' % (ROOT, name), 'wb').write(b)
    print('font', name, len(b))

dump('%s/data/manifest.json' % ROOT, manifest)
tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(ROOT + '/data') for f in fs)
print('DATA TOTAL MB %.1f' % (tot / 1e6))
