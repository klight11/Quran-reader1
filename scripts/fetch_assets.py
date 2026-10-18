#!/usr/bin/env python3
"""Downloads the Quran text and Maher Al-Muaiqly's verse audio so they can be bundled into the APK."""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

OUT = sys.argv[1]
API = 'https://api.alquran.cloud/v1'
UA = {'User-Agent': 'Mozilla/5.0 (QuranReaderBuild)'}

def get(url, tries=5):
    err = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:
            err = e
            time.sleep(1 + 2 * i)
    raise err

def fail(msg):
    print('::error::' + msg)
    sys.exit(1)

os.makedirs(OUT + '/data', exist_ok=True)
os.makedirs(OUT + '/audio', exist_ok=True)

# ---- text ----
counts = None
for ed, name in (('quran-uthmani', 'ar'), ('en.sahih', 'en')):
    d = json.loads(get(API + '/quran/' + ed))['data']
    if len(d['surahs']) != 114:
        fail('Text %s: wrong surah count' % ed)
    c = [len(s['ayahs']) for s in d['surahs']]
    if sum(c) != 6236:
        fail('Text %s: wrong verse total %d' % (ed, sum(c)))
    counts = counts or c
    with open('%s/data/%s.json' % (OUT, name), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
print('text ok', sum(counts))

# ---- audio ----
jobs, g = [], 0
for s, n in enumerate(counts, 1):
    for a in range(1, n + 1):
        g += 1
        jobs.append((s, a, g))

def urls(s, a, g):
    k = '%03d%03d' % (s, a)
    return ['https://everyayah.com/data/Maher_AlMuaiqly_64kbps/%s.mp3' % k,
            'https://everyayah.com/data/MaherAlMuaiqly128kbps/%s.mp3' % k,
            'https://cdn.islamic.network/quran/audio/64/ar.mahermuaiqly/%d.mp3' % g,
            'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/%d.mp3' % g]

def ok_mp3(b):
    return len(b) > 2000 and (b[:3] == b'ID3' or b[0] == 0xFF)

done = [0]
def work(j):
    s, a, g = j
    path = '%s/audio/%03d%03d.mp3' % (OUT, s, a)
    if os.path.exists(path) and os.path.getsize(path) > 2000:
        return None
    for u in urls(s, a, g):
        try:
            b = get(u, tries=3)
            if ok_mp3(b):
                with open(path, 'wb') as f:
                    f.write(b)
                done[0] += 1
                if done[0] % 500 == 0:
                    print('audio', done[0], flush=True)
                return None
        except Exception:
            pass
    return j

with ThreadPoolExecutor(12) as ex:
    missing = [m for m in ex.map(work, jobs) if m]
if missing:
    fail('Audio missing for %d verses, first: %s' % (len(missing), missing[:5]))

files = [f for f in os.listdir(OUT + '/audio') if f.endswith('.mp3')]
total = sum(os.path.getsize(OUT + '/audio/' + f) for f in files)
if len(files) != 6236:
    fail('Expected 6236 audio files, found %d' % len(files))
print('audio ok: %d files, %.0f MB' % (len(files), total / 1e6))
