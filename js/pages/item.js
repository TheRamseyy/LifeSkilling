// #/item/<id>: one item or material. Where the global search lands.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,nm=App.nm;
App.page("item",{title:"Item",needsData:true,render:function(root,id){
  var D=App.data,rs=D.byOut[id],r=rs&&rs[0],known=r||D.N[id]||App.usedBy(id).length;
  document.title=nm(id)+" · Aeternum Crafting";
  if(!id||!known){root.innerHTML='<h1>Item not found</h1><p>No item with the id "'+esc(id)+'" in the game data. Try the search box at the top.</p>';return}
  var h='<h1>'+esc(nm(id))+' '+App.saveButton(id)+'</h1><div class="facts">';
  if(r)h+='<span class="b craft">craftable</span>'+(r.t?'<span class="b plain">'+esc(r.t)+' '+(r.l||0)+'</span>':'')+(r.s||[]).map(function(s){return '<span class="b craft">'+esc(NWCalc.stationLabel(s))+'</span>'}).join("")+(r.tr?'<span class="b plain">Tier '+r.tr+'</span>':'')+(r.gs?'<span class="b plain">GS '+r.gs+'</span>':'');
  else h+='<span class="b raw">material</span>';
  h+='<span class="b plain">id '+esc(id)+'</span></div>';

  h+='<div class="item-grid"><div>';
  if(r){
    h+='<section class="card glass"><h2>Add to craft list</h2><div class="row"><input id="iq" class="q" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"><button id="iadd" class="primary" type="button">Add and open calculator</button></div></section>';
    h+='<section class="card"><h2>Recipe'+(r.o[1]>1?' (makes '+r.o[1]+')':'')+'</h2>'+r.g.map(function(g){
      var label=g[0]==="g"?App.anyPicker(g[1]):g[0]==="$"?esc(nm(g[1]))+' <span class="b plain">currency</span>':App.itemLink(g[1]);
      return '<div class="ing"><span class="c">'+fmt(g[2])+'×</span><span class="n">'+label+'</span></div>';
    }).join("")+(rs.length>1?'<p class="note">'+(rs.length-1)+' other recipe(s) also make this. The calculator uses the standard one shown here.</p>':'')+'</section>';
  }
  var used=App.usedBy(id);
  if(used.length){
    used.sort(function(a,b){return nm(a).localeCompare(nm(b))});
    h+='<section class="card"><h2>Used to craft ('+used.length+')</h2><div class="links">'+used.slice(0,60).map(function(x){return App.itemLink(x)}).join("")+'</div>'+(used.length>60?'<p class="muted">+'+(used.length-60)+' more</p>':'')+'</section>';
  }
  h+='</div><div>';
  var gl=App.nodesFor(id);
  h+='<section class="card" aria-labelledby="h-where"><h2 id="h-where">Where to get it</h2>'+
    (r?'<p>Craft it'+(r.t?' with '+esc(r.t)+' '+(r.l||0):'')+(r.s&&r.s[0]?' at a '+esc(NWCalc.stationLabel(r.s[0])):'')+'.</p>':'')+
    (gl.length?'<h3 class="slot-h">Gathering nodes that can drop it</h3><div class="nodes">'+gl.map(function(x){return '<div>'+App.nodeLine(x.v)+'</div>'}).join("")+'</div>':'')+
    '<div id="isrc"><p class="loading">Looking up other sources…</p></div></section>';
  h+='</div></div>';
  if(r)h+='<section class="card" aria-labelledby="h-iflow"><h2 id="h-iflow">Crafting plan</h2><div id="iflow"></div></section>';
  root.innerHTML=h;
  if(r)App.Flow(root.querySelector("#iflow")).set(NWCalc.expand([{id:id,qty:r.o[1]}],{byOut:D.byOut,cats:D.C,buy:App.state.buy,pick:App.state.pick}));
  App.loadJSON("sources.json").then(function(S){
    var box=root.querySelector("#isrc");if(!box)return;
    var html=App.sourceDetail(S[id]);
    box.innerHTML=html||(!r&&!gl.length?'<p class="muted">The game files list no shop, loot table or quest for it. It may come from an event or the in-game store.</p>':'');
  }).catch(function(){var box=root.querySelector("#isrc");if(box)box.innerHTML='<p class="err">Other sources did not load. Reload the page.</p>'});
  root.addEventListener("change",function(e){if(e.target.dataset&&e.target.dataset.anypick!=null){App.setPick(e.target.dataset.anypick,e.target.value);App.go("item/"+encodeURIComponent(id))}});
  var add=root.querySelector("#iadd");
  if(add)add.addEventListener("click",function(){App.addToList(id,Math.max(1,parseInt(root.querySelector("#iq").value,10)||1));App.go("craft/calculator")});
}});
})();
