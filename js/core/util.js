// Shared helpers. Everything lives on one global object, App, so plain <script> tags work with no build step.
var App=window.App={pages:{}};
(function(){
"use strict";
App.esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
App.fmt=function(n){return n.toLocaleString("en-GB")};
// Display name for any id; set up properly once names.json has loaded
App.nm=function(id){return (App.data&&App.data.N[id])||NWCalc.pretty(id)};
App.dur=function(s,noUnit){if(s<90)return Math.round(s)+(noUnit?"":" s");var m=s/60;return (m<10?Math.round(m*10)/10:Math.round(m))+(noUnit?"":" min")};
App.itemLink=function(id,label){return '<a href="#/item/'+encodeURIComponent(id)+'">'+App.esc(label||App.nm(id))+'</a>'};
// One line per gathering node, e.g. "Iron Vein, Mining, respawns in 8.4–12 min, takes 15 s to gather"
// Colour for each skill, used on its page, its switch button and the sky
App.SKILL_COL={Mining:"#E8955A",Logging:"#7BC96F",Harvesting:"#E8CF5A",Skinning:"#E8776F",Fishing:"#5AA8E8",
  Arcana:"#B9A4FF",Armoring:"#9FB4CC",Cooking:"#F2A65A",Engineering:"#E8C25A",Furnishing:"#C9A27A",Jewelcrafting:"#F48FB1",
  Leatherworking:"#C98A5A",Smelting:"#FF8A5C",Stonecutting:"#BDB8A6",Weaponsmithing:"#E8776F",Weaving:"#7FD1C9",Woodworking:"#8FCB6F"};
// Marker for anything not confirmed by the game files or testing. The tip explains why.
App.unsure=function(tip){return '<span class="unsure" tabindex="0" role="note" title="'+App.esc(tip)+'" aria-label="Not 100% sure: '+App.esc(tip)+'">not 100%</span>'};
// Attribute colours, used on every weapon and attribute page
App.ATTR={Str:["Strength","#E8776F"],Dex:["Dexterity","#7BC96F"],Int:["Intelligence","#5AA8E8"],Foc:["Focus","#B9A4FF"],Con:["Constitution","#F2B45A"]};
// Boosts for one skill from data/boosts.json, as a table (food, trophies, territory, music, boosters, attributes)
App.boostTable=function(all,skill){
  var KIND={luck:"luck",yield:"yield",xp:"XP",gs:"crafted gear score",extra:"chance of extra items"};
  var SRC={Food:"Food",Trophy:"Housing trophy",Territory:"Territory buff",Music:"Music buff",Booster:"Booster",Attribute:"Attribute bonus"};
  var l=all.filter(function(b){return b.s===skill});
  if(!l.length)return '<p class="muted">Nothing in the game files boosts '+App.esc(skill.toLowerCase())+' directly.</p>';
  return '<div class="gt nospd bst" role="table"><div class="gt-h" role="row"><span role="columnheader">Boost</span><span role="columnheader">Type</span><span role="columnheader">Effect</span><span role="columnheader">Lasts</span><span role="columnheader">Notes</span></div>'+
    l.map(function(b){
      var val=b.k==="gs"?"+"+b.v+" "+KIND.gs:"+"+b.v+"% "+KIND[b.k];
      var lasts=b.dur?(b.dur>=3600?Math.round(b.dur/360)/10+" h":Math.round(b.dur/60)+" min"):(b.src==="Territory"?"3 days":"While active");
      var note=b.note?App.esc(b.note)+(b.k==="luck"?App.unsure("The buff's description says yield, but its data value is luck points ("+b.v*100+" = "+b.v+"%). Which one the game applies is not confirmed."):""):"";
      var name=(App.data&&(App.data.byOut[b.id]||App.data.N[b.id]))?App.itemLink(b.id,b.n):App.esc(b.n);
      return '<div class="gt-r"><div class="gt-row" role="row"><span class="gt-n" role="cell">'+name+'</span><span role="cell" data-l="Type">'+App.esc(SRC[b.src]||b.src)+'</span><span class="gt-p" role="cell"><b>'+App.esc(val)+'</b></span><span role="cell" data-l="Lasts">'+lasts+'</span><span role="cell" class="muted">'+note+'</span></div></div>';
    }).join("")+'</div>';
};
// "Any X" ingredients: the item you chose, else the standard (first) item
App.currentPick=function(cat){var m=(App.data.C[cat]||[]),p=App.state.pick[cat];return p&&m.indexOf(p)>=0?p:m[0]};
App.setPick=function(cat,item){if(item)App.state.pick[cat]=item;else delete App.state.pick[cat];App.save()};
// A drop-down showing the item used for an "any X" ingredient, with every alternative and its cost where known
App.anyPicker=function(cat,chosen,auto){
  var D=App.data,mem=D.C[cat]||[],own=App.state.pick[cat];chosen=chosen||App.currentPick(cat);
  if(!mem.length)return 'Any '+App.esc(App.nm(cat));
  function cost(m){
    var p=App.state.prices[m];if(p!=null&&p!==""&&!D.byOut[m])return +p;
    var c=NWCalc.craftCost(m,{byOut:D.byOut,cats:D.C,prices:App.state.prices,buy:App.state.buy,pick:App.state.pick}).each;
    return c!=null?c:(p!=null&&p!==""?+p:null);
  }
  return '<span class="anyw"><span class="anyl">any '+App.esc(App.nm(cat))+':</span><select class="anypick" data-anypick="'+App.esc(cat)+'" aria-label="Item to use for any '+App.esc(App.nm(cat))+'">'+
    (own?'<option value="">Automatic choice</option>':'')+
    mem.map(function(m,i){var c=cost(m);return '<option value="'+App.esc(m)+'"'+(m===chosen?' selected':'')+'>'+App.esc(App.nm(m))+(c!=null?' · '+App.fmt(Math.round(c*100)/100)+' each':'')+(i===0?' · standard':'')+'</option>'}).join("")+
    '</select>'+(auto?'<span class="b raw" title="Cheapest by your prices">cheapest</span>':'')+'</span>';
};
// Where an item comes from besides crafting and gathering nodes (data/sources.json)
App.sourceShort=function(s){
  if(!s)return "";var bits=[];
  if(s.shop)bits.push("faction shop, "+App.fmt(s.shop[0][1])+" tokens");
  if(s.loot){var k=s.loot.filter(function(l){return l[0]!=="Other loot"});(k.length?k:s.loot).slice(0,2).forEach(function(l){bits.push(l[0].toLowerCase()+(l[1][0]?" ("+l[1][0]+(l[2]>1?" and more":"")+")":""))})}
  if(s.salvage)bits.push("salvaging "+s.salvage[0][0]);
  if(s.quest)bits.push("quest rewards");
  return bits.length?"Get it from: "+App.esc(bits.join("; "))+".":"";
};
App.sourceDetail=function(s){
  if(!s)return "";var h="",esc=App.esc;
  if(s.shop)h+='<h3 class="slot-h">Shops</h3><ul class="srcl">'+s.shop.map(function(x){return '<li><b>'+App.fmt(x[1])+'</b> '+esc(x[0])+(x[2]?' <span class="muted">(needs '+esc(x[2])+')</span>':'')+'</li>'}).join("")+'</ul>';
  if(s.salvage)h+='<h3 class="slot-h">Salvage'+App.unsure("Read from the salvage tables. What a salvage actually gives can vary and is not confirmed.")+'</h3><p>Salvaging '+s.salvage[0].map(esc).join(", ")+(s.salvage[1]>s.salvage[0].length?' and '+(s.salvage[1]-s.salvage[0].length)+' more':'')+' can give it.</p>';
  if(s.quest)h+='<h3 class="slot-h">Quests</h3><p>A reward from '+s.quest+' quest step'+(s.quest>1?'s':'')+'.</p>';
  if(s.loot){
    var k=s.loot.filter(function(l){return l[0]!=="Other loot"});if(!k.length)k=s.loot;
    h+='<h3 class="slot-h">Can drop from'+App.unsure("Loot tables list what can drop, not chances or amounts. Some drops also depend on creature level, region or events, which this list does not check.")+'</h3><ul class="srcl">'+k.map(function(l){return '<li><b>'+esc(l[0])+'</b>: '+l[1].map(esc).join(", ")+(l[2]>l[1].length?' and '+(l[2]-l[1].length)+' more':'')+'</li>'}).join("")+'</ul>';
  }
  if(s.tags)h+='<p class="muted">Loot tags: '+s.tags.map(function(t){return '<span class="b plain">'+esc(NWCalc.pretty(t))+'</span>'}).join(" ")+'</p>';
  return h;
};
App.nodeLine=function(v){return '<b>'+App.esc(v[0])+'</b>, '+App.esc(v[1])+(v[2]?' level '+v[2]:'')+', respawns in '+App.dur(v[3],1)+'–'+App.dur(v[4])+', takes '+App.dur(v[5])+' to gather'};
})();
