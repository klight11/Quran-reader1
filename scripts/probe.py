import json, urllib.request, time
def get(u):
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'x'}),timeout=60).read()
        except Exception as e: err=e; time.sleep(3)
    return ('ERR %s'%err).encode()
b=get('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions.json')
try:
    d=json.loads(b)
    for k,v in d.items():
        if v['language'] in ('Hindi','Pashto','Persian','English','Urdu','Arabic'): print(k,'|',v['language'],'|',v.get('author'),'|',v.get('direction'))
except Exception as e: print('editions parse fail',b[:200])
print('--- alquran.cloud status', get('https://api.alquran.cloud/v1/surah/1')[:80])
print('--- sample')
for e in ['ara-quranuthmanihaf','hin-muhammadfarooqkhana','eng-ummmuhammad']:
    x=get('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/%s.json'%e)
    try:
        j=json.loads(x); print(e, len(j['quran']), j['quran'][0], j['quran'][-1]['text'][:40])
    except Exception as ex: print(e,'fail',x[:100])
