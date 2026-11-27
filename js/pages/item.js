// #/item/<id>: one item or material. Where the global search lands.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,nm=App.nm;
App.page("item",{title:"Item",needsData:true,render:function(root,id){
  var D=App.data,rs=D.byOut[id],r=rs&&rs[0],known=r||D.N[id]||App.usedBy(id).length;
  document.title=nm(id)+" · Aeternum Crafting";
  if(!id||!known){root.innerHTML='<h1>Item not found</h1><p>No item with the id "'+esc(id)+'" in the game data. Try the search box at the top.</p>';return}
  var h='<h1>'+esc(nm(id))+'</h1><div class="facts">';
  if(r)h+='<span class="b craft">craftable</span>'+(r.t?'<span class="b plain">'+esc(r.t)+' '+(r.l||0)+'</span>':'')+(r.s||[]).map(function(s){return '<span class="b craft">'+esc(NWCalc.stationLabel(s))+'</span>'}).join("")+(r.tr?'<span class="b plain">Tier '+r.tr+'</span>':'')+(r.gs?'<span class="b plain">GS '+r.gs+'</span>':'');
  else h+='<span class="b raw">material</span>';
  h+='<span class="b plain">id '+esc(id)+'</span></div>';

  if(r)h+='<div class="item-top"><div>';
  if(r){
    h+='<section class="card glass"><h2>Add to craft list</h2><div class="row"><input id="iq" class="q" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"><button id="iadd" class="primary" type="button">Add and open calculator</button></div></section>';
    h+='<section class="card"><h2>Recipe'+(r.o[1]>1?' (makes '+r.o[1]+')':'')+'</h2>'+r.g.map(function(g){
      var label=g[0]==="g"?'Any '+esc(nm(g[1]))+'<div class="links" style="margin-top:4px">'+(D.C[g[1]]||[]).map(function(x){return App.itemLink(x)}).join("")+'</div>':g[0]==="$"?esc(nm(g[1]))+' <span class="b plain">currency</span>':App.itemLink(g[1]);
      return '<div class="ing"><span class="c">'+fmt(g[2])+'×</span><span class="n">'+label+'</span></div>';
    }).join("")+(rs.length>1?'<p class="note">'+(rs.length-1)+' other recipe(s) also make this. The calculator uses the standard one shown here.</p>':'')+'</section>';
  }
  if(r)h+='</div><section class="card" aria-label="Recipe map"><div id="imap"></div></section></div>';
  var gl=App.nodesFor(id);
  if(!r||gl.length){
    h+='<section class="card"><h2>Where to get it</h2>'+(gl.length?'<div class="nodes">'+gl.map(function(x){return '<div>'+App.nodeLine(x.v)+'</div>'}).join("")+'</div><p class="note">These nodes can drop it. The game files have no drop chances or amounts.</p>'
      :'<p class="muted">No gathering node found. Likely a creature drop, chest, vendor, salvage or event item.</p>')+'</section>';
  }
  var used=App.usedBy(id);
  if(used.length){
    used.sort(function(a,b){return nm(a).localeCompare(nm(b))});
    h+='<section class="card"><h2>Used to craft ('+used.length+')</h2><div class="links">'+used.slice(0,60).map(function(x){return App.itemLink(x)}).join("")+'</div>'+(used.length>60?'<p class="muted">+'+(used.length-60)+' more</p>':'')+'</section>';
  }
  root.innerHTML=h;
  if(r)root.querySelector("#imap").classList.add("small");
  if(r)App.Constellation(root.querySelector("#imap")).set(NWCalc.expand([{id:id,qty:r.o[1]}],{byOut:D.byOut,cats:D.C,buy:App.state.buy,pick:App.state.pick}).tree);
  var add=root.querySelector("#iadd");
  if(add)add.addEventListener("click",function(){App.addToList(id,Math.max(1,parseInt(root.querySelector("#iq").value,10)||1));App.go("craft/calculator")});
}});
})();
