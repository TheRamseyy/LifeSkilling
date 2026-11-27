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
App.nodeLine=function(v){return '<b>'+App.esc(v[0])+'</b>, '+App.esc(v[1])+(v[2]?' level '+v[2]:'')+', respawns in '+App.dur(v[3],1)+'–'+App.dur(v[4])+', takes '+App.dur(v[5])+' to gather'};
})();
