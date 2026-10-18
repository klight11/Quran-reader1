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
# Arabic Uthmani (Hafs) text: fawazahmed0 quran-api. Translations: Tanzil.
AR_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf.json'
ar = json.loads(get(AR_URL))['quran']
if len(ar) != 6236: fail('Arabic: %d verses' % len(ar))
by = {}
for v in ar: by.setdefault(v['chapter'], []).append(v['text'].strip())
arabic = [by[i] for i in range(1, 115)]
counts0 = [len(x) for x in arabic]
if sum(counts0) != 6236 or any(not t for s_ in arabic for t in s_): fail('Arabic text incomplete')
size = dump('%s/data/quran/ar.json' % ROOT, arabic)
manifest['quran']['ar'] = {'name': 'Quran Uthmani (Hafs)', 'source': 'fawazahmed0/quran-api', 'bytes': size}
print('quran ar', size)

TANZIL = 'https://tanzil.net/trans/'
EDITIONS = [  # key, tanzil id
    ('en', 'en.sahih'), ('hi', 'hi.hindi'), ('ps', 'ps.abdulwali'), ('fa', 'fa.makarem'),
    ('ur', 'ur.jalandhry'), ('arT', 'ar.muyassar'),
]
for key, tid in EDITIONS:
    txt = get(TANZIL + tid).decode('utf-8')
    rows = {}
    for line in txt.split('\n'):
        line = line.rstrip('\r')
        if not line or line.startswith('#'): continue
        parts = line.split('|', 2)
        if len(parts) != 3: continue
        rows[(int(parts[0]), int(parts[1]))] = parts[2].strip()
    out = []
    for si, n in enumerate(counts0, 1):
        sr = []
        for a_ in range(1, n + 1):
            t = rows.get((si, a_))
            if not t: fail('%s: missing %d:%d' % (tid, si, a_))
            sr.append(t)
        out.append(sr)
    size = dump('%s/data/quran/%s.json' % (ROOT, key), out)
    manifest['quran'][key] = {'name': tid, 'source': 'tanzil.net', 'bytes': size}
    print('quran', key, tid, size)

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
    secE = eng['metadata'].get('sections', {}) or {}
    secA = ara['metadata'].get('sections', {}) or {}
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
        sections.append({'id': sid, 'en': clean(secE.get(sid, '')) or ('Introduction' if sid == '0' else 'Section ' + sid), 'ar': clean(secA.get(sid, '')), 'n': len(rows)})
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
