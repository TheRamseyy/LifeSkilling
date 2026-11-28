// Calculator logic. No page (DOM) code here, so it runs in the browser and in Node tests.
(function(root){
"use strict";
// Order used when several recipes make the same item: standard tables first, procedural last.
var RANK=["weapon","armorer","engineer","jeweler","arcana","cooking","refining","misc","specialtyshops","raid","dungeon","gypkilm","seasons","seasonalserver"];
// Station names from localization/en-us.json (<base>_station keys). The trailing number is the minimum station tier.
var STN={blacksmith:"Forge",outfitting:"Outfitting Station",alchemy:"Arcane Repository",smelting:"Smelter",tanning:"Tannery",weaving:"Loom",carpentry:"Woodshop",masonry:"Stonecutting Table",engineering:"Workshop",cooking:"Kitchen",camp:"Camp",gypsumstation:"Gypsum Kiln",RuneglassStation:"Runeglass Station",FlameCore_Forge:"Flame Core Forge",Specialty_DoubloonShop:"Doubloon Shop",Specialty_ReekwaterShop:"Reekwater Shop",Lightshield_AlchemyT:"Lightshield Arcane Repository"};

function pretty(id){return String(id).replace(/_/g," ").replace(/([a-z])([A-Z0-9])/g,"$1 $2")}
function rank(r){var i=RANK.indexOf(r.f);return (r.p?100:0)+(i<0?50:i)}

// recipes array -> {outputItemId: [recipes, best first]}
function indexRecipes(R){
  var by={};
  R.forEach(function(r){if(r.o[0])(by[r.o[0]]=by[r.o[0]]||[]).push(r)});
  Object.keys(by).forEach(function(id){by[id].sort(function(a,b){return rank(a)-rank(b)})});
  return by;
}

function station(sid){
  var m=/^(.*?)(\d+)(_standing)?$/.exec(sid),base=m?m[1]:sid,tier=m?+m[2]:0;
  return {key:base,name:STN[base]||pretty(base),tier:tier};
}
function stationLabel(sid){var s=station(sid);return s.name+(s.tier?" T"+s.tier:"")}

// Gathering nodes that can drop an item, easiest first, one per name+skill.
function nodesFor(id,gather){
  var GN=gather.n||{},l=((gather.b||{})[String(id).toLowerCase()]||[]).map(function(g){return {g:g,v:GN[g]}}).filter(function(x){return x.v});
  l.sort(function(a,b){return a.v[2]-b.v[2]||a.v[6]-b.v[6]||a.v[0].localeCompare(b.v[0])});
  var seen={},out=[];l.forEach(function(x){var k=x.v[0]+"|"+x.v[1];if(!seen[k]){seen[k]=1;out.push(x)}});
  return out;
}

/* Expand a craft list into everything needed.
   list: [{id, qty}]; opt: {byOut, cats, buy: {id:1}, pick: {catId: itemId}}
   Node kinds: craft, raw (nothing makes it), buy (craftable but marked bought), cur (currency), cat (unpicked "any X"). */
function expand(list,opt){
  var byOut=opt.byOut,cats=opt.cats||{},buy=opt.buy||{},pick=opt.pick||{};
  var raw={},cur={},cat={},catUsed={},crafts={},order=[],tree=[];
  function visit(id,qty,depth,path,via){
    var rs=byOut[id],r=rs&&rs[0],node={id:id,qty:qty,kids:[],kind:"raw",via:via,path:path.concat(id).join(">")};
    if(r&&buy[id])node.kind="buy";
    if(r&&!buy[id]&&path.indexOf(id)<0&&depth<25){
      var times=Math.ceil(qty/r.o[1]),p=path.concat(id);node.kind="craft";node.times=times;node.r=r;
      r.g.forEach(function(g){
        var q=g[2]*times;
        if(g[0]==="i")node.kids.push(visit(g[1],q,depth+1,p));
        else if(g[0]==="g"){
          catUsed[g[1]]=(catUsed[g[1]]||0)+q;
          var ch=pick[g[1]];
          if(ch&&(cats[g[1]]||[]).indexOf(ch)>=0)node.kids.push(visit(ch,q,depth+1,p,g[1]));
          else{cat[g[1]]=(cat[g[1]]||0)+q;node.kids.push({id:g[1],qty:q,kids:[],kind:"cat",path:p.concat("any:"+g[1]).join(">")})}
        }
        else{cur[g[1]]=(cur[g[1]]||0)+q;node.kids.push({id:g[1],qty:q,kids:[],kind:"cur",path:p.concat("$"+g[1]).join(">")})}
      });
      if(!crafts[id]){crafts[id]={times:0,qty:0,depth:depth,r:r};order.push(id)}
      crafts[id].times+=times;crafts[id].qty+=qty;crafts[id].depth=Math.max(crafts[id].depth,depth);
    }else{raw[id]=(raw[id]||0)+qty}
    return node;
  }
  list.forEach(function(e,i){tree.push(visit(e.id,e.qty,0,["#"+i]))});
  // deepest first, so every input is made before the thing that uses it
  order.sort(function(a,b){return crafts[b].depth-crafts[a].depth});
  return {raw:raw,cur:cur,cat:cat,catUsed:catUsed,crafts:crafts,order:order,tree:tree};
}

/* Cost to craft one of an item from your prices, including the crafting fee.
   opt: {byOut, cats, prices, buy, pick}. Returns {each: number|null, missing: [item ids with no price]}.
   An ingredient you marked as bought, or that nothing makes, uses its price; anything else is costed by crafting it. */
function craftCost(id,opt,seen){
  seen=seen||{};
  var rs=opt.byOut[id],r=rs&&rs[0];
  if(!r)return {each:null,missing:[id]};
  if(seen[id])return {each:null,missing:[]};// recipe loop
  seen[id]=1;
  var total=r.fee||0,missing=[];
  r.g.forEach(function(g){
    var ing=g[1];
    if(g[0]==="$"){return}// currencies such as Azoth are not priced in coin
    if(g[0]==="g"){var mem=(opt.cats||{})[ing]||[],p=opt.pick&&opt.pick[ing];ing=p&&mem.indexOf(p)>=0?p:null;if(!ing){missing.push("any:"+g[1]);return}}
    var c=unitPrice(ing,opt,seen);
    if(c.each==null)missing=missing.concat(c.missing);else total+=c.each*g[2];
  });
  delete seen[id];
  return {each:missing.length?null:total/r.o[1],missing:missing};
}
function unitPrice(id,opt,seen){
  var p=opt.prices&&opt.prices[id],has=p!=null&&p!=="";
  if(!opt.byOut[id]||(opt.buy&&opt.buy[id]))return has?{each:+p,missing:[]}:{each:null,missing:[id]};
  var c=craftCost(id,opt,seen);
  return c.each==null&&has?{each:+p,missing:[]}:c;// a craftable item with a price falls back to that price if its parts are not all priced
}

/* Cheapest route for a craft list, from your prices.
   opt: {byOut, cats, prices, buy (your choices), pick (your choices)}.
   Returns {pick, buy, auto}: pick = item used for every "any X" in the list (your choice, else the cheapest
   priced item, else the standard first item); buy = your buys plus crafted items whose market price is
   below their cost to craft; auto = {buy:[ids], pick:[cat ids]} chosen here rather than by you. */
function bestRoute(list,opt){
  var cats=opt.cats||{},prices=opt.prices||{},userPick=opt.pick||{},pick={},buy=Object.assign({},opt.buy||{}),auto={buy:[],pick:[]};
  function has(id){var p=prices[id];return p!=null&&p!==""}
  Object.keys(cats).forEach(function(k){var mem=cats[k],u=userPick[k];pick[k]=u&&mem.indexOf(u)>=0?u:mem[0]});
  // which "any X" the list uses, with the standard items for now
  var used=expand(list,{byOut:opt.byOut,cats:cats,buy:buy,pick:pick}).catUsed;
  Object.keys(used).forEach(function(k){
    if(userPick[k]&&cats[k].indexOf(userPick[k])>=0)return;
    var best=null,bc=Infinity;
    cats[k].forEach(function(m){
      var c=has(m)&&!opt.byOut[m]?+prices[m]:craftCost(m,{byOut:opt.byOut,cats:cats,prices:prices,buy:buy,pick:pick}).each;
      if(c==null&&has(m))c=+prices[m];
      if(c!=null&&c<bc){bc=c;best=m}
    });
    if(best&&best!==pick[k]){pick[k]=best;auto.pick.push(k)}
  });
  // crafted items that are cheaper to buy at the market price you entered
  var r=expand(list,{byOut:opt.byOut,cats:cats,buy:buy,pick:pick});
  Object.keys(r.crafts).forEach(function(id){
    if(buy[id]||!has(id))return;
    var c=craftCost(id,{byOut:opt.byOut,cats:cats,prices:prices,buy:buy,pick:pick}).each;
    if(c!=null&&+prices[id]<c){buy[id]=1;auto.buy.push(id)}
  });
  return {pick:pick,buy:buy,auto:auto};
}

var api={bestRoute:bestRoute,craftCost:craftCost,indexRecipes:indexRecipes,expand:expand,station:station,stationLabel:stationLabel,nodesFor:nodesFor,pretty:pretty};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.NWCalc=api;
})(this);
