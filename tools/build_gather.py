# Builds data/gather.json from extracted datatables.
# Usage: python tools/build_gather.py <datatables_dir> <en-us.json> data/gather.json
import json,re,sys
D,LOC,OUT=sys.argv[1].rstrip('/\\')+'/',sys.argv[2],sys.argv[3]
L={k.lower():v for k,v in json.load(open(LOC,encoding='utf-8')).items()}
lt={r['LootTableID']:r for r in json.load(open(D+'javelindata_loottables.json',encoding='utf-8'))}
g=json.load(open(D+'javelindata_gatherables.json',encoding='utf-8'))
def items(tid,seen,d=0):
    out=set();r=lt.get(tid)
    if not r or tid in seen or d>5:return out
    seen.add(tid)
    for k,v in r.items():
        if re.fullmatch(r'Item\d+',k) and v:
            v=str(v)
            if v.startswith('[LTID]'):out|=items(v[6:],seen,d+1)
            elif not v.startswith('['):out.add(v)
    return out
pretty=lambda s:re.sub(r'([a-z])([A-Z0-9])',r'\1 \2',s.replace('_',' '))
SK={'Harvesting','Mining','Logging','Skinning','Fishing'}
nodes={};by={}
for r in g:
    if r['Tradeskill'] not in SK or r.get('IsLootContainer'):continue
    gid=r['GatherableID']
    if re.search(r'dungeon|10ws|outpost',gid,re.I) or r['MaxRespawnRate']>=3600:continue
    its=items(r['FinalLootTable'],set())
    if not its:continue
    nodes[gid]=[L.get(gid.lower()+'_displayname') or L.get(gid.lower()+'_name') or pretty(gid),r['Tradeskill'],r['RequiredTradeskillLevel'],r['MinRespawnRate'],r['MaxRespawnRate'],r['BaseGatherTime'],len(its)]
    for i in its:by.setdefault(i.lower(),[]).append(gid)
json.dump({'n':nodes,'b':by},open(OUT,'w'),separators=(',',':'))
print(len(nodes),'nodes',len(by),'items')
