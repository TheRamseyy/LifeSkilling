// Loads the game data once and builds the lookups every page uses.
(function(){
"use strict";
var loading=null;
function get(f){return fetch("data/"+f).then(function(r){if(!r.ok)throw new Error(f);return r.json()})}
App.loadData=function(){
  if(loading)return loading;
  loading=Promise.all([get("recipes.json"),get("names.json"),get("cats.json"),get("gather.json").catch(function(){return {n:{},b:{}}})]).then(function(d){
    var D={R:d[0],N:d[1],C:d[2],G:d[3]};
    D.byOut=NWCalc.indexRecipes(D.R);
    App.data=D;
    // Search list: everything a recipe makes, plus every item a recipe uses
    var seen={},idx=[];
    function addIdx(id,craft){if(seen[id])return;seen[id]=1;var n=App.nm(id);idx.push({id:id,n:n,l:n.toLowerCase(),craft:craft})}
    Object.keys(D.byOut).forEach(function(id){addIdx(id,true)});
    D.R.forEach(function(r){r.g.forEach(function(g){if(g[0]==="i")addIdx(g[1],false)})});
    D.index=idx;
    D.craftCount=Object.keys(D.byOut).length;
    return D;
  });
  loading.catch(function(){loading=null});// allow a retry after a failed load
  return loading;
};
// item id -> output ids of recipes that use it (built on first use)
App.usedBy=function(id){
  var D=App.data;
  if(!D.used){D.used={};D.R.forEach(function(r){if(r.o[0])r.g.forEach(function(g){var k=g[0]==="g"?"any:"+g[1]:g[1];(D.used[k]=D.used[k]||{})[r.o[0]]=1})})}
  return Object.keys(D.used[id]||{});
};
App.nodesFor=function(id){return NWCalc.nodesFor(id,App.data.G)};
})();
