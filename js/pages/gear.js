// Gather > Gathering gear by level: tools and clothing for each gathering skill, explained for new players.
(function(){
"use strict";
var esc=App.esc;
var SKILLS=["Mining","Logging","Harvesting","Skinning","Fishing"];
var SLOTS=["Head","Chest","Hands","Legs","Feet","Amulet","Ring","Earring"];
// Level bands and the tool/clothing tier that fits each: a tier up every 50 levels, as new nodes open
var BANDS=[{a:0,b:49,tr:2},{a:50,b:99,tr:3},{a:100,b:149,tr:4},{a:150,b:199,tr:5},{a:200,b:250,tr:5,top:1}];
// Easiest first when picking what to recommend
var EASY=["Crafted","Drop","Faction shop","Quest reward"];
var SOURCE={
  "Crafted":"Made with a crafting skill. The skill and level are shown next to it.",
  "Drop":"Drops in the open world. It is not bound, so you can also buy it from other players.",
  "Named drop":"A named item that drops from particular enemies or chests.",
  "Quest reward":"Given by a quest.",
  "Faction shop":"Bought with faction tokens from your faction's shop.",
  "Event":"From a limited-time event.",
  "Seasonal server":"Only on seasonal servers.",
  "Season reward":"From a season's reward track.",
  "Conqueror shop":"Bought from the Conqueror shop.",
  "Not craftable":"A special version that cannot be crafted. The game files do not say where it comes from."
};

// Bag perks that help each gathering skill (perk ids from gear.json bagPerks), then ones that help any skill.
// "unsure" lists perks whose item list (food, alchemy reagents) is only assumed to cover what this skill gathers.
var BAGPERK={Mining:["PerkID_Bags_MiningOre","PerkID_Bags_StoneWeight"],Logging:["PerkID_Bags_LoggingWeight"],
  Harvesting:["PerkID_Bags_HarestingWeight","PerkID_Bags_AlchemistWeight","PerkID_Bags_CookingWeight"],
  Skinning:["PerkID_Bags_SkinningWeight","PerkID_Bags_CookingWeight"],Fishing:["PerkID_Bags_CookingWeight"]};
var BAGUNSURE={Harvesting:["PerkID_Bags_AlchemistWeight","PerkID_Bags_CookingWeight"],Skinning:["PerkID_Bags_CookingWeight"],Fishing:["PerkID_Bags_CookingWeight"]};
var BAGANY=["PerkID_Bags_WeightAdd","PerkID_Bags_AzothYield","PerkID_Bags_BonusTown"];
function recipe(x){var l=App.data.byOut[x.id];return l&&l[0]}
function link(x){return (App.data.byOut[x.id]||App.data.N[x.id])?App.itemLink(x.id,x.n):esc(x.n)}
function perkSum(x){return (x.pk||[]).reduce(function(s,p){return s+(p[3]||0)},0)}
function easy(x){var i=EASY.indexOf(x.src);return i<0?9:i}
function bestTool(tools){return tools.slice().sort(function(a,b){return b.sp-a.sp||perkSum(b)-perkSum(a)||b.gs-a.gs})[0]}
function bestWear(wear,slot){return wear.filter(function(w){return w.slot===slot}).sort(function(a,b){return perkSum(b)-perkSum(a)||b.gs-a.gs})[0]}
// What a player can realistically get at a tier: lowest gear score, then easiest source
function easyPick(list,tier,extra){
  return list.filter(function(x){return x.tr===tier&&(!extra||extra(x))}).sort(function(a,b){return a.gs-b.gs||easy(a)-easy(b)||a.pk.length-b.pk.length})[0];
}
// "Mining Yield +20.9%" from a perk row [id, name, text, value]
function shortPerk(p){
  if(p[3]==null)return esc(p[1]);
  return esc(p[1])+' <b>+'+p[3]+(/%/.test(p[2])?'%':'')+'</b>';
}
function howToGet(x){
  var r=recipe(x),h='<span class="b plain" title="'+esc(SOURCE[x.src]||"")+'">'+esc(x.src)+'</span>';
  if(x.src==="Crafted"&&r&&r.t)h+=' <span class="muted">'+esc(r.t)+' '+(r.l||0)+'</span>';
  if(x.bop)h+=' <span class="muted" title="Binds to you when picked up, so it cannot be traded">bound</span>';
  return h;
}
function perkCell(x){
  var h=(x.wt?'<b>+'+x.wt+'</b> carry weight'+((x.pk||[]).length?'<br>':''):'')+(x.pk||[]).map(shortPerk).join("<br>");
  if(x.rs)h+=(h?"<br>":"")+'<span class="muted">'+x.rs+' random perk'+(x.rs>1?'s':'')+'</span>';
  return h||'<span class="muted">None</span>';
}

App.page("gather/gear",{title:"Gathering gear",needsData:true,render:function(root,param){
  var skill=SKILLS.filter(function(s){return s.toLowerCase()===(param||"mining").toLowerCase()})[0]||"Mining";
  document.title=skill+" gear · Aeternum Crafting";
  root.innerHTML='<h1>'+esc(skill)+' gear</h1><p class="loading">Loading gear data…</p>';
  Promise.all([App.loadJSON("gear.json"),App.loadJSON("boosts.json")]).then(function(all){all[0].boosts=all[1].boosts;draw(root,skill,all[0])})
    .catch(function(){root.innerHTML='<h1>Gathering gear</h1><p class="err">The gear data did not load. Check your connection and reload the page.</p>'});
}});

function draw(root,skill,G){
  App.accent(App.SKILL_COL[skill],"#5CE1E6");
  var S=G.skills[skill],tools=S.tools,wear=S.wear,fish=skill==="Fishing",low=skill.toLowerCase();
  // the plain crafted tool of each tier sets the speed scale players compare against
  var scale=[1,2,3,4,5].map(function(t){return easyPick(tools,t,function(x){return x.src==="Crafted"&&!x.pk.length})}).filter(Boolean);

  var h='<h1>'+esc(skill)+' gear</h1><p class="sub">What to use for '+esc(low)+' as you level up, and every tool and clothing piece that helps. Read from the game files; perk values are worked out at each item\'s gear score'+App.unsure("Worked out with the game\u2019s own perk scaling formula. In-game tooltips may differ slightly.")+'.</p>';
  h+='<nav class="seg" aria-label="Gathering skill">'+SKILLS.map(function(s){return '<a style="--c:'+App.SKILL_COL[s]+'" href="#/gather/gear/'+s.toLowerCase()+'"'+(s===skill?' aria-current="page"':'')+'>'+esc(s)+'</a>'}).join("")+'</nav>';

  // How to read this page
  h+='<details class="guide card glass" open><summary><h2>How to read this page</h2></summary><dl>'+
    (fish?'':'<dt>Speed</dt><dd>How fast the tool gathers, as the game counts it. Higher is faster. Plain crafted tools go '+scale.map(function(t){return 'T'+t.tr+' <b>'+t.sp+'</b>'}).join(", ")+'.</dd>')+
    '<dt>Tier (T1 to T5)</dt><dd>The material level of the item. Higher tiers are stronger and need higher-tier materials to make.</dd>'+
    '<dt>Gear score (GS)</dt><dd>How strong one copy of an item is. Perks get stronger with gear score. Crafted items roll a gear score in a range that rises with your crafting skill, so you will often make one below the top number.</dd>'+
    '<dt>Equip level</dt><dd>The character level you need to use it. This is your normal level, not your '+esc(low)+' level.</dd>'+
    '<dt>Perks</dt><dd>Bonuses on the item. Listed perks always come with it. <i>Random perks</i> are rolled when the item is made or dropped, from a list you see when you open the row.</dd>'+
    '<dt>Luck and yield</dt><dd><i>Luck</i> is the chance of finding rare items while gathering. <i>Yield</i> means more resources from each node.</dd>'+
    '<dt>Bound</dt><dd>Binds to you when picked up, so it cannot be traded or sold.</dd>'+
  '</dl></details>';

  // What to use as you level
  var nodes=Object.keys(App.data.G.n).map(function(k){return App.data.G.n[k]}).filter(function(v){return v[1]===skill});
  var bt=bestTool(tools);
  var bp={};(G.bagPerks||[]).forEach(function(p){bp[p[0]]=p});
  var myBagPerks=(BAGPERK[skill]||[]).map(function(id){return bp[id]}).filter(Boolean);
  h+='<section class="card" aria-labelledby="h-bands"><h2 id="h-bands">What to use as you level</h2><p class="muted" style="margin:-6px 0 14px">The easiest gear of the right tier for each stage: lowest gear score first, then crafted or dropped before rarer sources. You do not need top gear score to gather well.</p><ol class="bands">';
  BANDS.forEach(function(B){
    var tl=easyPick(tools,B.tr,function(x){return x.src==="Crafted"&&!x.pk.length})||easyPick(tools,B.tr);
    var wl=SLOTS.map(function(s){return easyPick(wear.filter(function(w){return w.slot===s}),B.tr)}).filter(Boolean);
    var seen={},nl=nodes.filter(function(v){return v[2]>=B.a&&v[2]<=B.b}).map(function(v){return v[0]}).filter(function(n){return seen[n]?0:(seen[n]=1)});
    var spd=(G.levels[skill]||{})[String(B.a)];
    h+='<li class="band"><div class="lvl"><span>'+esc(skill)+' level</span><b>'+B.a+(B.top?"+":"–"+B.b)+'</b></div><div class="body">';
    h+='<p><span class="k">New nodes</span>'+(fish?'Fishing spots are not in the gathering data.':nl.length?nl.map(esc).join(", "):'None. Keep working the nodes you already have.')+'</p>';
    h+='<p><span class="k">Tool</span>'+(tl?link(tl)+' <span class="muted">('+(fish?'':'speed '+tl.sp+', ')+'gear score '+tl.gs+(tl.lv?', equip level '+tl.lv:'')+')</span> '+howToGet(tl):'<span class="muted">None in the files</span>')+'</p>';
    if(B.top&&bt&&bt!==tl)h+='<p><span class="k">Upgrade later</span>'+link(bt)+' <span class="muted">(gear score '+bt.gs+')</span> '+howToGet(bt)+'</p>';
    h+='<p><span class="k">Clothing</span>'+(wl.length?wl.map(function(w){return link(w)+' <span class="muted">'+esc(w.slot.toLowerCase())+', GS '+w.gs+'</span>'}).join(", ")+'<br><span class="muted">'+esc(SOURCE[wl[0].src]||"")+'</span>':'<span class="muted">No tier '+B.tr+' '+esc(low)+' clothing in the files.'+(B.tr===2?' It starts at tier 3, from level 50.':'')+'</span>')+'</p>';
    var bA=bagPick(G.bags,B.tr,"BagA"),bB=bagPick(G.bags,B.tr,"BagB");
    if(bA||bB)h+='<p><span class="k">Bag</span>'+[bA,bB].filter(Boolean).map(function(b){return link(b)+' <span class="muted">(+'+b.wt+' carry weight at GS '+b.gs+')</span>'}).join(" or ")+
      (bA&&bA.rs?'<br><span class="muted">Craft or buy one with '+myBagPerks.map(function(p){return esc(p[1])}).join(" or ")+' in its '+(bA.rs>1?bA.rs+' random perk slots':'random perk slot')+'. A duffel holds more but slows you down.</span>':'')+'</p>';
    if(spd)h+='<p><span class="k">Skill bonus</span>Your '+esc(low)+' level itself adds '+spd+' to gathering speed'+App.unsure("The game value from the skill table. How it combines with the tool speed is not confirmed.")+'.</p>';
    h+='</div></li>';
  });
  h+='</ol><p class="note">Tools go up a tier every 50 levels, in step with the new nodes. The game files do not say which tool to use when; this is a rule of thumb.'+App.unsure("A suggestion based on when new nodes open, not something the game files say.")+'</p></section>';

  // Boosts
  h+='<section class="card" aria-labelledby="h-bst"><h2 id="h-bst">Boosts for '+esc(low)+'</h2><p class="muted" style="margin:-6px 0 12px">Food, housing trophies, territory buffs, music and attribute bonuses that help, from the game files. Luck is shown as a percentage: the game counts 100 luck points as 1%.</p>'+App.boostTable(G.boosts,skill)+
    '</section>';

  // Bags
  var bestBag=(G.bags||[]).filter(function(b){return b.src==="Crafted"&&b.rs>=5}).sort(function(a,b){return b.wt-a.wt||b.gs-a.gs})[0];
  function bagPerkRow(p,unsure){var pc=/%/.test(p[2])?'%':'';return '<li><b>'+esc(p[1])+':</b> '+esc(p[2])+' <span class="muted">(at GS 600; '+p[4]+pc+' at GS 700)</span>'+(unsure?App.unsure("The perk lists food or alchemy items in general; that it covers what "+low+" gives you is assumed."):'')+'</li>'}
  h+='<section class="card" aria-labelledby="h-bag"><h2 id="h-bag">Bags (satchels)</h2><p class="muted" style="margin:-6px 0 12px">Bags add carry weight, so you can gather for longer before you have to empty your bags at storage. Their random perks can also cut the weight of what you gather. Satchels are light to wear; Porter’s Duffels hold more but slow you down. Carry weight and perk values from the game files; the carry weight matches nwdb.</p>';
  h+='<div class="bagcols"><div><h3 class="slot-h">Perks that help '+esc(low)+'</h3><ul class="perks">'+myBagPerks.map(function(p){return bagPerkRow(p,(BAGUNSURE[skill]||[]).indexOf(p[0])>=0)}).join("")+'</ul>'+
    '<h3 class="slot-h">Perks that help any gathering</h3><ul class="perks">'+BAGANY.map(function(id){return bp[id]}).filter(Boolean).map(function(p){return bagPerkRow(p)}).join("")+'</ul></div>';
  if(bestBag)h+='<div class="slot s-bag"><span class="sl">Best bag for '+esc(low)+'</span><b class="sn">'+link(bestBag)+'</b><span class="sv">+'+bestBag.wt+' carry weight</span><span class="muted">GS '+bestBag.gmin+' to '+bestBag.gs+', crafted, '+bestBag.rs+' random perks</span><p class="muted" style="margin:8px 0 0">Look for '+myBagPerks.slice(0,2).map(function(p){return esc(p[1])}).join(" and ")+' plus Extra Pockets in its random perks. The Infused Leather Porter’s Duffel holds the same at GS 600 but slows you down.</p></div>';
  h+='</div>'+table(G.bags||[],false,true)+'</section>';

  // Endgame best in slot
  h+='<section class="card" aria-labelledby="h-bis"><h2 id="h-bis">Endgame best in slot</h2><p class="muted" style="margin:-6px 0 14px">The strongest pieces in the game files, mostly at top gear score. A long-term goal, not what you need to start.</p><div class="doll">';
  h+=slotCard("tool","Tool",bt,fish?"":(bt?"Speed "+bt.sp:""),bt&&bt.pk.length?'<ul class="perks">'+bt.pk.map(function(p){return '<li>'+esc(p[2])+'</li>'}).join("")+'</ul>':"");
  SLOTS.forEach(function(s){var w=bestWear(wear,s);h+=slotCard(s.toLowerCase(),s,w,w&&w.pk.length?w.pk.map(shortPerk).join("<br>"):"")});
  h+='<div class="core" aria-hidden="true"></div></div><p class="note">Tools are ranked by speed, then their listed perks. Clothing by the size of its '+esc(low)+' perks. Empty slots have no '+esc(low)+' item in the files.</p></section>';

  // Full lists as tables
  h+='<section class="card" aria-labelledby="h-tools"><h2 id="h-tools">Every '+esc(low)+' tool ('+tools.length+')</h2><p class="muted" style="margin:-6px 0 12px">Fastest first. Open a row for full perk text and the random perks it can roll.</p>'+table(tools,true,fish)+'</section>';
  h+='<section class="card" aria-labelledby="h-wear"><h2 id="h-wear">Every '+esc(low)+' clothing and jewellery piece ('+wear.length+')</h2>'+SLOTS.map(function(s){
    var l=wear.filter(function(w){return w.slot===s});
    return l.length?'<h3 class="slot-h">'+esc(s)+'</h3>'+table(l,false,true):"";
  }).join("")+'</section>';
  h+='<section class="card" aria-labelledby="h-src"><h2 id="h-src">Where things come from</h2><dl class="srcs">'+Object.keys(SOURCE).filter(function(k){return tools.concat(wear).some(function(x){return x.src===k})}).map(function(k){return '<dt><span class="b plain">'+esc(k)+'</span></dt><dd>'+esc(SOURCE[k])+'</dd>'}).join("")+'</dl></section>';
  root.innerHTML=h;
}

// The plain crafted bag of a tier: kind "BagA" (Adventurer's Satchel) or "BagB" (Porter's Duffel)
function bagPick(bags,tier,kind){return (bags||[]).filter(function(b){return b.tr===tier&&b.src==="Crafted"&&b.id.indexOf(kind+"T")===0&&!b.pk.length}).sort(function(a,b){return (b.rs>0)-(a.rs>0)||a.gs-b.gs})[0]}// prefer bags with a perk slot
function table(list,isTool,noSpeed){
  var max=Math.max.apply(null,list.map(function(t){return t.sp||0}))||1;
  return '<div class="gt'+(noSpeed?' nospd':'')+'" role="table"><div class="gt-h" role="row"><span role="columnheader">'+(isTool?'Tool':'Item')+'</span>'+(noSpeed?'':'<span role="columnheader">Speed</span>')+'<span role="columnheader">Tier</span><span role="columnheader">Gear score</span><span role="columnheader">Equip level</span><span role="columnheader">Perks</span><span role="columnheader">How to get it</span></div>'+
  list.map(function(t){
    return '<details class="gt-r"><summary role="row"><span class="gt-n" role="cell">'+esc(t.n)+'</span>'+
      (noSpeed?'':'<span class="spd" role="cell"><i style="width:'+Math.round(t.sp/max*80)+'px"></i><b>'+t.sp+'</b></span>')+
      '<span role="cell" data-l="Tier">T'+t.tr+'</span><span role="cell" data-l="Gear score">'+t.gs+'</span><span role="cell" data-l="Equip level">'+(t.lv||'Any')+'</span>'+
      '<span class="gt-p" role="cell">'+perkCell(t)+'</span><span role="cell">'+howToGet(t)+'</span></summary>'+
      '<div class="gd">'+(t.pk.length?'<ul class="perks">'+t.pk.map(function(p){return '<li><b>'+esc(p[1])+':</b> '+esc(p[2])+'</li>'}).join("")+'</ul>':'')+
      (t.rs?'<p class="muted">'+t.rs+' random perk slot'+(t.rs>1?'s':'')+(t.pool&&t.pool.length?'. Can roll: '+t.pool.map(esc).join(", "):'')+'.</p>':'')+
      '<p class="muted">'+esc(SOURCE[t.src]||"")+(App.data.byOut[t.id]?' '+App.itemLink(t.id,"Open the recipe"):'')+(/drop/i.test(t.src)?' <a href="#/gather/drops/'+encodeURIComponent(t.id)+'">Where it drops</a>':'')+'</p></div></details>';
  }).join("")+'</div>';
}
function slotCard(area,label,x,val,extra){
  return '<div class="slot s-'+area+(x?'':' none')+'"><span class="sl">'+esc(label)+'</span>'+(x?'<b class="sn">'+link(x)+'</b>'+(val?'<span class="sv">'+val+'</span>':'')+'<span class="muted">GS '+x.gs+', '+esc(x.src.toLowerCase())+'</span>'+(extra||""):'<span class="muted">Nothing for this slot</span>')+'</div>';
}
})();
