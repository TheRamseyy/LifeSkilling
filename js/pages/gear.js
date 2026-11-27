// Gather > Gathering gear by level: tools and clothing for each gathering skill.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt;
var SKILLS=["Mining","Logging","Harvesting","Skinning","Fishing"];
var SLOTS=["Head","Chest","Hands","Legs","Feet","Amulet","Ring","Earring"];
// Level bands and the tool/clothing tier that fits each: a tier up every 50 levels, as new nodes open
var BANDS=[{a:0,b:49,tr:2},{a:50,b:99,tr:3},{a:100,b:149,tr:4},{a:150,b:199,tr:5},{a:200,b:250,tr:0}];

function link(x){return (App.data.byOut[x.id]||App.data.N[x.id])?App.itemLink(x.id,x.n):esc(x.n)}
function perkSum(x){return (x.pk||[]).reduce(function(s,p){return s+(p[3]||0)},0)}
// Strongest tool: speed first, then the fixed perks it comes with, then gear score
function bestTool(tools){return tools.slice().sort(function(a,b){return b.sp-a.sp||perkSum(b)-perkSum(a)||b.gs-a.gs})[0]}
// Strongest clothing piece for a slot: its gathering perks added up, then gear score
function bestWear(wear,slot,tier){
  var l=wear.filter(function(w){return w.slot===slot&&(!tier||w.tr===tier)});
  return l.sort(function(a,b){return perkSum(b)-perkSum(a)||b.gs-a.gs})[0];
}
function perkLine(p){return '<li><b>'+esc(p[1])+'</b> '+esc(p[2])+'</li>'}
// Short summary of an item's main perk: its number if it has one ("+4.7% chance at finding rare items"), else its name
function headline(x){var p=(x.pk||[]).filter(function(p){return p[3]!=null})[0];if(p)return esc(p[2].replace(/ while \w+\.?$/,""));return x.pk&&x.pk.length?esc(x.pk.map(function(p){return p[1]}).join(", ")):""}

App.page("gather/gear",{title:"Gathering gear",needsData:true,render:function(root,param){
  var skill=SKILLS.filter(function(s){return s.toLowerCase()===(param||"mining").toLowerCase()})[0]||"Mining";
  document.title=skill+" gear · Aeternum Crafting";
  root.innerHTML='<h1>'+esc(skill)+' gear</h1><p class="loading">Loading gear data…</p>';
  App.loadJSON("gear.json").then(function(G){
    draw(root,skill,G);
  }).catch(function(){root.innerHTML='<h1>Gathering gear</h1><p class="err">The gear data did not load. Check your connection and reload the page.</p>'});
}});

function draw(root,skill,G){
  var S=G.skills[skill],tools=S.tools,wear=S.wear,fish=skill==="Fishing";
  var h='<h1>'+esc(skill)+' gear</h1><p class="sub">Tools and clothing that help with '+esc(skill.toLowerCase())+', read from the game files. Perk values are worked out at each item\'s gear score.</p>';
  h+='<nav class="seg" aria-label="Gathering skill">'+SKILLS.map(function(s){return '<a href="#/gather/gear/'+s.toLowerCase()+'"'+(s===skill?' aria-current="page"':'')+'>'+esc(s)+'</a>'}).join("")+'</nav>';

  // Best in slot, laid out like a character screen
  var bt=bestTool(tools);
  h+='<section class="card" aria-labelledby="h-bis"><h2 id="h-bis">Best in slot</h2><div class="doll">';
  h+=slotCard("tool","Tool",bt,fish?"":(bt?"Speed "+bt.sp:""),bt&&bt.pk.length?'<ul class="perks">'+bt.pk.map(perkLine).join("")+'</ul>':"");
  SLOTS.forEach(function(s){var w=bestWear(wear,s);h+=slotCard(s.toLowerCase(),s,w,w?headline(w):"")});
  h+='<div class="core" aria-hidden="true"></div></div><p class="note">Picked by the numbers in the game files: tools by gathering speed, then their fixed perks; clothing by the size of its '+esc(skill.toLowerCase())+' perks. Empty slots have no '+esc(skill.toLowerCase())+' item in the files.</p></section>';

  // Level bands
  var nodes=Object.keys(App.data.G.n).map(function(k){return App.data.G.n[k]}).filter(function(v){return v[1]===skill});
  h+='<section class="card" aria-labelledby="h-bands"><h2 id="h-bands">By skill level</h2><ol class="bands">';
  BANDS.forEach(function(B){
    var tl=B.tr?tools.filter(function(t){return t.tr===B.tr&&t.src==="Crafted"&&!t.pk.length}).sort(function(a,b){return a.gs-b.gs})[0]:bt;
    var wl=SLOTS.map(function(s){return bestWear(wear,s,B.tr||0)}).filter(Boolean);
    var seen={},nl=nodes.filter(function(v){return v[2]>=B.a&&v[2]<=B.b}).map(function(v){return v[0]}).filter(function(n){return seen[n]?0:(seen[n]=1)});
    var spd=(G.levels[skill]||{})[String(B.a)];
    h+='<li class="band"><div class="lvl"><span>Level</span><b>'+B.a+(B.b>=250?"+":"–"+B.b)+'</b></div><div class="body">';
    h+='<p><span class="k">New nodes</span>'+(fish?'Fishing spots are not in the gathering data.':nl.length?nl.map(esc).join(", "):'None. Keep working the nodes you already have.')+'</p>';
    h+='<p><span class="k">Tool</span>'+(tl?link(tl)+' <span class="muted">(gear score '+tl.gs+(tl.lv?', character level '+tl.lv:'')+(tl.rs?', '+tl.rs+' random perk'+(tl.rs>1?'s':''):'')+')</span>':'<span class="muted">None in the files</span>')+'</p>';
    h+='<p><span class="k">Clothing</span>'+(wl.length?wl.map(function(w){return link(w)+' <span class="muted">'+esc(w.slot.toLowerCase())+'</span>'}).join(", "):'<span class="muted">No '+(B.tr?'tier '+B.tr+' ':'')+esc(skill.toLowerCase())+' clothing in the files'+(B.tr===2?'. It starts at tier 3.':'.')+'</span>')+'</p>';
    if(spd)h+='<p><span class="k">Skill bonus</span>Your level adds '+spd+' to gathering speed (game value).</p>';
    h+='</div></li>';
  });
  h+='</ol><p class="note">Tools go up a tier every 50 levels, in step with the new nodes. From 200 the best tool is shown. Tools also need a character level, shown in brackets.</p></section>';

  // Full lists
  h+='<section class="card" aria-labelledby="h-tools"><h2 id="h-tools">All '+esc(skill.toLowerCase())+' tools ('+tools.length+')</h2><div class="glist">'+tools.map(function(t){
    return '<details class="gi"><summary><span class="n">'+esc(t.n)+'</span>'+(fish?'':'<span class="spd" title="Gathering speed"><i style="width:'+Math.min(100,t.sp/9*100)+'%"></i><b>'+t.sp+'</b></span>')+'<span class="muted">T'+t.tr+', GS '+t.gs+'</span><span class="b plain">'+esc(t.src)+'</span></summary>'
      +'<div class="gd">'+(t.pk.length?'<ul class="perks">'+t.pk.map(perkLine).join("")+'</ul>':'')
      +(t.rs?'<p class="muted">'+t.rs+' random perk slot'+(t.rs>1?'s':'')+(t.pool.length?'. Can roll: '+t.pool.map(esc).join(", "):'')+'.</p>':'')
      +(!t.pk.length&&!t.rs?'<p class="muted">No perks.</p>':'')
      +'<p class="muted">'+(t.lv?'Needs character level '+t.lv+'. ':'')+(App.data.byOut[t.id]?App.itemLink(t.id,"Open recipe"):'')+'</p></div></details>';
  }).join("")+'</div></section>';
  h+='<section class="card" aria-labelledby="h-wear"><h2 id="h-wear">All '+esc(skill.toLowerCase())+' clothing and jewellery ('+wear.length+')</h2>'+SLOTS.map(function(s){
    var l=wear.filter(function(w){return w.slot===s});if(!l.length)return "";
    return '<h3 class="slot-h">'+esc(s)+'</h3><div class="glist">'+l.map(function(w){
      return '<details class="gi"><summary><span class="n">'+esc(w.n)+'</span><span class="val">'+headline(w)+'</span><span class="muted">T'+w.tr+', GS '+w.gs+'</span><span class="b plain">'+esc(w.src)+'</span></summary><div class="gd"><ul class="perks">'+w.pk.map(perkLine).join("")+'</ul>'+(App.data.byOut[w.id]?'<p class="muted">'+App.itemLink(w.id,"Open recipe")+'</p>':'')+'</div></details>';
    }).join("")+'</div>';
  }).join("")+'</section>';
  root.innerHTML=h;
}
function slotCard(area,label,x,val,extra){
  return '<div class="slot s-'+area+(x?'':' none')+'"><span class="sl">'+esc(label)+'</span>'+(x?'<b class="sn">'+link(x)+'</b>'+(val?'<span class="sv">'+val+'</span>':'')+'<span class="muted">GS '+x.gs+', '+esc(x.src.toLowerCase())+'</span>'+(extra||""):'<span class="muted">Nothing for this slot</span>')+'</div>';
}
// exposed for tests in the browser console
App.gearPick={bestTool:bestTool,bestWear:bestWear};
})();
