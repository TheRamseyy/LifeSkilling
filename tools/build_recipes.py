import json,glob,collections,re
B='/mnt/user-data/uploads/live/'
L=json.load(open(B+'localization/en-us.json'))
Ll={k.lower():v for k,v in L.items()}
def loc(k):
    if not k: return None
    k=k.lstrip('@')
    return L.get(k) or Ll.get(k.lower())
items={}
for f in sorted(glob.glob(B+'datatables/javelindata_itemdefinitions_*.json')):
    x=json.load(open(f))
    if not isinstance(x,list): continue
    for r in x:
        i=r.get('ItemID') or r.get('WeaponID') or r.get('ConsumableID') or r.get('AmmoID') or r.get('BlueprintID')
        if i and i.lower() not in items: items[i.lower()]=r
# category membership
cats=collections.defaultdict(list)
for k,r in items.items():
    ic=r.get('IngredientCategories')
    if isinstance(ic,str): ic=[c for c in re.split(r'[,|]',ic) if c]
    for c in (ic or []): cats[c].append(r.get('ItemID') or k)
def iname(i):
    r=items.get(i.lower())
    n=loc(r.get('Name')) if r else None
    return n or loc(i+'_MasterName') or loc(i+'_Name')
def cname(i):
    return loc(i+'_groupname') or loc(i+'_categoryname') or loc(i+'_MasterName')
recipes=[]
seen=set()
for f in sorted(glob.glob(B+'datatables/javelindata_crafting_*.json')):
    table=f.split('crafting_')[1][:-5]
    for x in json.load(open(f)):
        ings=[]
        for n in range(1,8):
            t=x.get(f'Type{n}'); i=x.get(f'Ingredient{n}'); q=x.get(f'Qty{n}',0)
            if not i or not t: continue
            e={'type':{'Item':'item','Category_Only':'category','Currency':'currency'}.get(t,t),'id':i,'qty':q}
            if t=='Item': e['name']=iname(i) or i
            elif t=='Currency': e['name']={'Azoth_Currency':'Azoth'}.get(i) or iname(i) or i
            else: e['name']=cname(i) or i
            ings.append(e)
        out=x.get('ItemID')
        nm=loc(x.get('RecipeNameOverride')) or (iname(out) if out else None) or x.get('RecipeID')
        st=[x[k] for k in ('StationType1','StationType2','StationType3','StationType4') if x.get(k)]
        recipes.append({'id':x['RecipeID'],'table':table,'name':nm,'output':{'id':out,'name':(iname(out) if out else None),'qty':x.get('OutputQty') or 1},
          'tradeskill':x.get('Tradeskill'),'level':x.get('RecipeLevel'),'stations':st,'category':x.get('CraftingCategory'),'group':x.get('CraftingGroup'),
          'tier':x.get('BaseTier'),'gearscore':x.get('BaseGearScore'),'fee':x.get('CraftingFee'),'procedural':x.get('IsProcedural'),'refining':x.get('IsRefining'),
          'known_by_default':x.get('bKnownByDefault'),'ingredients':ings})
used={}
def add(i):
    r=items.get(i.lower())
    if r: used[i]={'id':i,'name':loc(r.get('Name')),'tier':r.get('Tier'),'rarity':r.get('ForceRarity'),'type':r.get('ItemType'),'class':r.get('ItemClass')}
for r in recipes:
    if r['output']['id']: add(r['output']['id'])
    for g in r['ingredients']:
        if g['type']=='item': add(g['id'])
cu={}
for r in recipes:
    for g in r['ingredients']:
        if g['type']=='category': cu[g['id']]=[{'id':i,'name':iname(i)} for i in cats.get(g['id'],[])]
json.dump(recipes,open('/home/claude/out/recipes.json','w'),indent=None,separators=(',',':'),ensure_ascii=False)
json.dump(used,open('/home/claude/out/items.json','w'),separators=(',',':'),ensure_ascii=False)
json.dump(cu,open('/home/claude/out/categories.json','w'),separators=(',',':'),ensure_ascii=False)
print(len(recipes),len(used),len(cu))
nn=sum(1 for r in recipes if r['name']==r['id']); print('unnamed recipes',nn)
no=sum(1 for r in recipes if r['output']['id'] and not r['output']['name']); print('outputs no name',no)
ni=collections.Counter(g['type'] for r in recipes for g in r['ingredients'] if g['name']==g['id']); print('ings unnamed',ni)
print('empty cats',[k for k,v in cu.items() if not v][:10], sum(1 for v in cu.values() if not v))
