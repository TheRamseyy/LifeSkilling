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
App.nodeLine=function(v){return '<b>'+App.esc(v[0])+'</b>, '+App.esc(v[1])+(v[2]?' level '+v[2]:'')+', respawns in '+App.dur(v[3],1)+'–'+App.dur(v[4])+', takes '+App.dur(v[5])+' to gather'};
})();
