import json, urllib.request, time
def get(u,t=3):
    err=None
    for i in range(t):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=90).read()
        except Exception as e: err=e; time.sleep(2)
    return ('ERR %s'%err).encode()
for ed in ['eng-bukhari','ara-bukhari','eng-tirmidhi']:
    j=json.loads(get('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/%s.json'%ed))
    m=j['metadata']; print(ed,'metadata keys',list(m.keys()))
    print(json.dumps(m,ensure_ascii=False)[:600])
    print('hadith0',json.dumps(j['hadiths'][0],ensure_ascii=False)[:300])
    import collections
    c=collections.Counter(h['reference']['book'] for h in j['hadiths']); print('books count',len(c), list(c.items())[:6])
for u in ['https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/sections/1.json','https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json']:
    b=get(u); print(u[-40:], b[:500])
