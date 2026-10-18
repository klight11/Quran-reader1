import json, urllib.request, time
def get(u,t=3):
    err=None
    for i in range(t):
        try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read()
        except Exception as e: err=e; time.sleep(2)
    return ('ERR %s'%err).encode()
for tid in ['ps.abdulwali','hi.hindi','fa.makarem','fa.ayati','en.sahih','ur.jalandhry','ar.muyassar']:
    for u in ['https://tanzil.net/trans/%s'%tid, 'https://tanzil.net/trans/?transID=%s&type=txt'%tid]:
        b=get(u,2); t=b.decode('utf8','replace'); lines=[l for l in t.split('\n') if l and not l.startswith('#')]
        print(tid,u[-30:],len(b),len(lines),lines[:1] if not t.startswith('ERR') else t[:80])
d=json.loads(get('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions.json'))
for k,v in d.items():
    if k.startswith(('hin_','fas_nasermak','fas_abdolm','eng_muhammadtaqiudd','urd_fatehmuh','ara_quranuthmanihaf')): print(k, v['name'], v['language'])
print('alq', get('https://api.alquran.cloud/v1/surah/1',2)[:60])
