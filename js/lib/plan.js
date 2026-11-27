// Gathering run planner. No page (DOM) code, so it runs in the browser and in Node tests.
// Picks the fewest kinds of node that between them can drop every material you need,
// preferring nodes that drop several needed materials, then lower level, faster respawn, faster gathering.
(function(root){
"use strict";
var SIZE=/\s+(Tiny|Small|Medium|Large|Huge)$/;
var SKILL_ORDER=["Mining","Logging","Harvesting","Skinning","Fishing"];

/* needs: {itemId: qty} raw materials to gather
   gather: data/gather.json ({n: nodes, b: item -> node ids})
   levels: {skill: your level}; a skill left out means "any level"
   Returns {stops, missing}:
     stops: [{key, name, skill, level, gather, respMin, respMax, ids, sizes, covers, extra}] in visiting order
       covers = needed items this stop is chosen for, extra = other needed items it can also drop
     missing: [{id, qty, reason: "none" | "level", skill, level}] */
function plan(needs,gather,levels){
  levels=levels||{};
  var GN=gather.n||{},GB=gather.b||{},groups={},missing=[],todo={};
  Object.keys(needs).forEach(function(id){
    var nodes=(GB[String(id).toLowerCase()]||[]).filter(function(g){return GN[g]});
    if(!nodes.length){missing.push({id:id,qty:needs[id],reason:"none"});return}
    var ok=nodes.filter(function(g){var v=GN[g],lv=levels[v[1]];return lv==null||lv===""||v[2]<=+lv});
    if(!ok.length){
      var low=nodes.map(function(g){return GN[g]}).sort(function(a,b){return a[2]-b[2]})[0];
      missing.push({id:id,qty:needs[id],reason:"level",skill:low[1],level:low[2]});return;
    }
    todo[id]=1;
    ok.forEach(function(g){
      // one kind of stop = same name, skill and level; sizes ("Ore Vein Mythril Small/Large") count as one
      var v=GN[g],m=SIZE.exec(v[0]),base=m?v[0].slice(0,m.index):v[0],k=base+"|"+v[1]+"|"+v[2];
      var s=groups[k]=groups[k]||{key:k,name:base,skill:v[1],level:v[2],gather:v[5],respMin:v[3],respMax:v[4],distinct:v[6],ids:[],sizes:[],can:{}};
      if(s.ids.indexOf(g)<0)s.ids.push(g);
      if(m&&s.sizes.indexOf(m[1].toLowerCase())<0)s.sizes.push(m[1].toLowerCase());
      s.can[id]=1;s.gather=Math.min(s.gather,v[5]);s.respMin=Math.min(s.respMin,v[3]);s.respMax=Math.min(s.respMax,v[4]);
    });
  });
  // Greedy set cover: keep taking the stop that covers the most still-uncovered materials
  var left=Object.keys(todo),stops=[],all=Object.keys(groups).map(function(k){return groups[k]});
  while(left.length){
    var best=null,bestN=0;
    all.forEach(function(s){
      var n=left.filter(function(id){return s.can[id]}).length;
      if(n>bestN||(n===bestN&&n>0&&better(s,best))){best=s;bestN=n}
    });
    if(!best)break;// cannot happen: every todo item has at least one stop
    best.covers=left.filter(function(id){return best.can[id]});
    left=left.filter(function(id){return !best.can[id]});
    stops.push(best);
  }
  stops.forEach(function(s){s.extra=Object.keys(s.can).filter(function(id){return s.covers.indexOf(id)<0});delete s.can;delete s.distinct});
  // Visiting order: by skill, then lowest level first, then busiest stop first
  stops.sort(function(a,b){return rank(a.skill)-rank(b.skill)||a.level-b.level||b.covers.length-a.covers.length||a.name.localeCompare(b.name)});
  return {stops:stops,missing:missing};
}
function better(a,b){
  if(!b)return true;
  // lower level, then faster to respawn (common nodes), then faster to gather, then fewer other drops, then name
  return (a.level-b.level||a.respMin-b.respMin||a.gather-b.gather||a.distinct-b.distinct||a.name.localeCompare(b.name))<0;
}
function rank(s){var i=SKILL_ORDER.indexOf(s);return i<0?99:i}

var api={plan:plan,SKILLS:SKILL_ORDER};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NWPlan=api;
})(this);
