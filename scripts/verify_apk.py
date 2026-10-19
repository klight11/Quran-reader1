#!/usr/bin/env python3
"""Opens the assets inside a built APK with no internet and checks the app really works."""
import sys, os, zipfile, threading, http.server, functools, tempfile, json
apk = sys.argv[1]
d = tempfile.mkdtemp()
z = zipfile.ZipFile(apk)
names = [n for n in z.namelist() if n.startswith('assets/')]
z.extractall(d, names)
need = ['assets/index.html', 'assets/main.js', 'assets/data/quran/ar.json', 'assets/data/quran/hi.json', 'assets/data/quran/ps.json',
        'assets/data/quran/fa.json', 'assets/data/quran/en.json', 'assets/data/hadith/books.json', 'assets/fonts/AmiriQuran-Regular.ttf']
miss = [n for n in need if n not in names]
if miss: sys.exit('APK is missing: %s' % miss)
print('APK size MB: %.1f, asset files: %d' % (os.path.getsize(apk) / 1e6, len(names)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8000), functools.partial(H, directory=d))
threading.Thread(target=srv.serve_forever, daemon=True).start()
from playwright.sync_api import sync_playwright
fails = []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    br = p.chromium.launch(args=['--host-resolver-rules=MAP appassets.androidplatform.net 127.0.0.1:8000'])
    pg = br.new_page(viewport={'width': 390, 'height': 800})
    errs = []; blocked = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    def guard(route):
        if 'appassets.androidplatform.net' in route.request.url: route.continue_()
        else: blocked.append(route.request.url); route.abort()
    pg.route('**/*', guard)
    B = 'http://appassets.androidplatform.net:8000/assets/index.html'
    pg.goto(B); pg.wait_for_selector('#list .row')
    check(pg.locator('#list .row').count() == 114, 'home shows 114 surahs')
    pg.goto(B + '#/s/2'); pg.wait_for_selector('.v'); check(pg.locator('.v').count() == 286, 'surah 2 shows 286 verses (offline)')
    pg.goto(B + '#/h'); pg.wait_for_selector('.bookcard'); check(pg.locator('.bookcard').count() == 9, '9 hadith books (offline)')
    pg.goto(B + '#/h/bukhari/1'); pg.wait_for_selector('.h'); check(pg.locator('.h').count() == 7, 'Bukhari chapter 1 loads (offline)')
    pg.goto(B + '#/ask'); pg.wait_for_selector('#sq'); pg.fill('#sq', 'patience'); pg.wait_for_selector('#sres .row', timeout=30000)
    check(pg.locator('#sres .row').count() > 5, 'smart search works (offline)')
    for lang in ['hi', 'ps', 'fa', 'ar']:
        pg.goto(B + '#/more'); pg.wait_for_selector('select[data-chg=lang]'); pg.select_option('select[data-chg=lang]', lang)
        pg.goto(B + '#/s/112'); pg.wait_for_selector('.v'); check(pg.locator('.tr').count() == 4, 'translation for %s shows' % lang)
    pg.goto(B + '#/about'); pg.wait_for_selector('.hero'); check('Dr Sohrab Ali' in pg.inner_text('.hero'), 'About shows creator')
    check(not errs, 'no page errors %s' % errs)
    br.close()
if fails: sys.exit('VERIFY FAILED: %s' % fails)
print('ALL CHECKS PASSED')
