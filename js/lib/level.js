// Crafting skill levelling: which recipe to craft at each stage, and how many. No page (DOM) code.
// Uses each recipe's XP per craft and the XP each level needs, both from the game files.
(function(root){
"use strict";
var C=(typeof module!=="undefined"&&module.exports)?require("./calc.js"):root.NWCalc;
// Recipe tables left out of levelling: events, seasons, raids, dungeons, special shops
var SKIP={seasons:1,seasonalserver:1,dungeon:1,raid:1,specialtyshops:1,gypkilm:1};
var STEP=25;// levels per stage; a stage can switch to a better recipe
// Recipes tied to a daily cooldown item, so they cannot be repeated for levelling
var LIMITED=/Gypsum|Attunement/;
var MINSHARE=0.25;
// Refining reagents (Obsidian Flux, Sandpaper, Aged Tannin, Pure Solvent, Wireweave) are bought, not made
var REAGENT=/^(Flux|Sandpaper|Tannin|Solvent|Weave)T\d/;

/* opt: {recipes, byOut, cats, gather, xp (array: xp[n] = XP from level n to n+1),
         skill, from, to, mode: "fast"|"cheap", prices: {itemId: price}, pick: {catId: itemId}}
   Returns {steps:[{from,to,r,crafts,xp,raw,units,cost}], total:{crafts,xp,raw,units,cost,fee}} */
function route(opt){
  var from=Math.max(0,opt.from|0),to=Math.min(opt.xp.length,opt.to|0),cache={};
  // refining reagents (flux, sandpaper, tannin, solvent, weave) are bought from vendors or players, so they are allowed
  var reagent={};Object.keys(opt.cats).forEach(function(k){if(/Reagent/i.test(k))opt.cats[k].forEach(function(m){reagent[m]=1})});
  opt.recipes.forEach(function(r){r.g.forEach(function(g){if(REAGENT.test(g[1]))reagent[g[1]]=1})});
  var buy=Object.assign({},reagent,opt.buy||{});
  var cands=opt.recipes.filter(function(r){
    return r.t===opt.skill&&r.x>0&&r.k&&r.o[0]&&!SKIP[r.f]&&r.g.length&&!r.g.some(function(g){return g[0]==="$"})
      &&r.c!=="Salvage"&&!LIMITED.test(r.n);
  });
  // raw materials for one craft of r; any-X ingredients use your pick, else the first (standard) item in the list
  function one(r){
    if(cache[r.i])return cache[r.i];
    var list=[],ok=true;
    r.g.forEach(function(g){
      var id=g[1];
      if(g[0]==="g"){
        var mem=(opt.cats[id]||[]),p=opt.pick&&opt.pick[id];
        id=p&&mem.indexOf(p)>=0?p:mem[0];
        if(!id){ok=false;return}
      }
      list.push({id:id,qty:g[2]});
    });
    var raw=ok?C.expand(list,{byOut:opt.byOut,cats:opt.cats,pick:opt.pick,buy:buy}).raw:{};
    var units=0,cost=0,priced=true,gatherable=ok;
    Object.keys(raw).forEach(function(id){
      units+=raw[id];
      var pr=opt.prices&&opt.prices[id];
      if(pr==null||pr==="")priced=false;else cost+=pr*raw[id];
      // every raw material must be gatherable, a reagent, or priced, else the route could ask for something you cannot get
      if(!C.nodesFor(id,opt.gather).length&&!reagent[id]&&(pr==null||pr===""))gatherable=false;
    });
    return cache[r.i]={raw:raw,units:units,cost:priced?cost:null,ok:ok&&gatherable};
  }
  function score(r){
    var o=one(r);
    if(opt.mode==="cheap")return o.cost!=null?o.cost/r.x:1e9+o.units/r.x;// priced recipes first, then fewest raw materials
    return -r.x+o.units/r.x/1e6;// most XP per craft; ties go to fewer materials
  }
  var steps=[];
  for(var a=from;a<to;a=b){
    var b=Math.min(to,(Math.floor(a/STEP)+1)*STEP),need=0;
    for(var n=a;n<b;n++)need+=opt.xp[n]||0;
    var pool=cands.filter(function(r){return (r.l||0)<=a&&one(r).ok});
    // cheapest still has to be sensible: only recipes worth at least a quarter of the best XP on offer
    if(opt.mode==="cheap"&&pool.length){var top=Math.max.apply(null,pool.map(function(r){return r.x}));pool=pool.filter(function(r){return r.x>=top*MINSHARE})}
    if(!pool.length){steps.push({from:a,to:b,r:null,xp:need});continue}
    var r=pool.sort(function(x,y){return score(x)-score(y)||x.n.localeCompare(y.n)})[0];
    var last=steps[steps.length-1];
    if(last&&last.r===r){last.to=b;last.xp+=need}else steps.push({from:a,to:b,r:r,xp:need});
  }
  var total={crafts:0,xp:0,raw:{},units:0,cost:0,fee:0,priced:true};
  steps.forEach(function(s){
    total.xp+=s.xp;
    if(!s.r)return;
    var o=one(s.r);
    s.crafts=Math.ceil(s.xp/s.r.x);
    s.raw={};Object.keys(o.raw).forEach(function(id){s.raw[id]=o.raw[id]*s.crafts;total.raw[id]=(total.raw[id]||0)+s.raw[id]});
    s.units=o.units*s.crafts;s.cost=o.cost==null?null:o.cost*s.crafts;
    total.crafts+=s.crafts;total.units+=s.units;total.fee+=(s.r.fee||0)*s.crafts;
    if(s.cost==null)total.priced=false;else total.cost+=s.cost;
  });
  return {steps:steps,total:total};
}

var api={route:route,STEP:STEP};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NWLevel=api;
})(this);
