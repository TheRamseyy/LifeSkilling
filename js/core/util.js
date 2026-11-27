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
// One line per gathering node: "Name · Skill lvl N · respawn a–b · gather c"
App.nodeLine=function(v){return '<b>'+App.esc(v[0])+'</b> · '+App.esc(v[1])+(v[2]?' lvl '+v[2]:'')+' · respawn '+App.dur(v[3],1)+'–'+App.dur(v[4])+' · gather '+App.dur(v[5])};
})();
