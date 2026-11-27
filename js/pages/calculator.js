// Craft > Calculator: what you need from the very start to craft your list.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,nm=App.nm,S=App.state;
var openTree={};// tree path -> open (true/false), only for nodes the user toggled

var HTML=''+
'<h1>What are you crafting?</h1><p class="sub" id="stat"></p>'+
'<div class="calc"><div class="col1">'+
  '<section class="card" aria-labelledby="h-search"><h2 id="h-search">Add something to craft</h2>'+
    '<div class="row"><input id="target" class="grow" placeholder="Search an item, e.g. Steel Ingot" autocomplete="off" aria-label="Search a craftable item">'+
    '<input id="qty" class="q" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"></div>'+
    '<div id="sugg" class="sugg" hidden></div>'+
    '<p class="muted" style="margin:8px 0 0">Type 2+ letters. Arrow keys move through results, Enter adds.</p></section>'+
  '<section class="card" aria-labelledby="h-list"><h2 id="h-list">Craft list</h2><div id="list"></div></section>'+
  '<section class="card" id="flexcard" aria-labelledby="h-flex" hidden><h2 id="h-flex">Flexible materials</h2>'+
    '<p class="muted" style="margin:0 0 10px">Some recipes accept any item of a type. Pick the one you will use: it is added to your totals, steps and gathering.</p><div id="flex"></div></section>'+
'</div><div>'+
  '<section class="card" id="mapcard" aria-labelledby="h-map"><h2 id="h-map">Recipe map</h2><div id="map"></div><p class="note">Your list in the middle, each ring one step further back, raw materials on the outside. The same breakdown, as text, is in the tree below.</p></section>'+
  '<nav class="jump" aria-label="Results sections"><a href="#rawcard">Materials</a><a href="#gathcard">Gathering</a><a href="#stepcard">Steps</a><a href="#skillcard">Skills</a><a href="#stationcard">Stations</a><a href="#treecard">Tree</a></nav>'+
  '<section class="card" id="rawcard" aria-labelledby="h-raw"><h2 id="h-raw">Raw materials to gather or buy</h2><div id="raw"></div></section>'+
  '<section class="card" id="gathcard" aria-labelledby="h-gath"><h2 id="h-gath">Gathering skills needed</h2><div id="gath"></div></section>'+
  '<section class="card" id="stepcard" aria-labelledby="h-steps"><h2 id="h-steps">Crafting steps (in order)</h2><div id="steps"></div></section>'+
  '<section class="card" id="skillcard" aria-labelledby="h-skills"><h2 id="h-skills">Crafting skills needed</h2><div id="skills"></div></section>'+
  '<section class="card" id="stationcard" aria-labelledby="h-st"><h2 id="h-st">Stations</h2><div id="stations"></div></section>'+
  '<section class="card" id="treecard" aria-labelledby="h-tree"><h2 id="h-tree">Breakdown tree <span class="act" id="treeact"><button class="sm" id="expall" type="button">Expand all</button><button class="sm" id="colall" type="button">Collapse all</button></span></h2>'+
    '<div class="legend"><span class="b craft">crafted</span><span class="b raw">gather / raw</span><span class="b buy">bought</span><span class="b cat">chosen "any" item</span><span class="b warn">pick one</span></div><div id="tree"></div></section>'+
'</div></div>';

App.page("craft/calculator",{title:"Crafting calculator",needsData:true,render:function(root){
  root.innerHTML=HTML;
  var $=function(id){return root.querySelector("#"+id)};
  var D=App.data,byOut=D.byOut;
  // jump links scroll inside the page instead of changing the route
  $("rawcard").parentNode.querySelector(".jump").addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;e.preventDefault();var t=root.querySelector(a.getAttribute("href"));if(t)t.scrollIntoView()});
  S.list=S.list.filter(function(e){return byOut[e.id]||D.N[e.id]});
  $("stat").textContent=fmt(D.craftCount)+" craftable items from "+fmt(D.R.length)+" recipes, read from the game files and not yet checked on Azoth.";
  var map=App.Constellation($("map"));

  function calc(){return NWCalc.expand(S.list,{byOut:byOut,cats:D.C,buy:S.buy,pick:S.pick})}
  function stLabel(s){return NWCalc.stationLabel(s)}

  function renderList(){
    $("list").innerHTML=S.list.map(function(e,i){
      return '<div class="item"><span class="n">'+App.itemLink(e.id)+'</span><input class="q" type="number" min="1" value="'+e.qty+'" data-q="'+i+'" aria-label="Quantity of '+esc(nm(e.id))+'"><button class="sm" data-rm="'+i+'" aria-label="Remove '+esc(nm(e.id))+'">✕</button></div>';
    }).join("")||'<div class="empty">Nothing yet. Search an item above.</div>';
  }
  function renderRaw(c){
    var names=Object.keys(c.raw).sort(function(a,b){return nm(a).localeCompare(nm(b))}),t=0,pr=0,h="";
    names.forEach(function(id){
      var p=S.prices[id],cost=(p!=null&&p!=="")?p*c.raw[id]:null;if(cost!=null){t+=cost;pr++}
      var bought=!!byOut[id],gl=bought?[]:App.nodesFor(id),gh="",badge;
      if(bought)badge='<span class="b buy">bought</span>';
      else if(gl.length){
        badge='<span class="b raw">gather</span>';
        gh='<details class="nodes"><summary>Where to get it ('+gl.length+')</summary>'+gl.slice(0,8).map(function(x){return '<div>'+App.nodeLine(x.v)+'</div>'}).join("")+(gl.length>8?'<div>+'+(gl.length-8)+' more</div>':"")+'</details>';
      }else{badge='<span class="b plain">other source</span>';gh='<div class="muted">No gathering node found. Likely a creature drop, chest, vendor, salvage or event item.</div>'}
      h+='<div class="item"><span class="n">'+App.itemLink(id)+' '+badge+gh+'</span><span class="c">'+fmt(c.raw[id])+'</span><input class="price" type="number" min="0" step="any" placeholder="price ea." value="'+(p!=null?esc(p):"")+'" data-p="'+esc(id)+'" aria-label="Price of '+esc(nm(id))+'">'+(bought?'<button class="sm" data-craft="'+esc(id)+'">Craft it</button>':'')+'</div>';
    });
    Object.keys(c.cat).forEach(function(id){
      h+='<div class="item"><span class="n">Any '+esc(nm(id))+' <span class="b warn">pick one</span><div class="muted">Choose which item you will use under Flexible materials to include it in gathering.</div></span><span class="c">'+fmt(c.cat[id])+'</span></div>';
    });
    Object.keys(c.cur).forEach(function(id){h+='<div class="item"><span class="n">'+esc(nm(id))+' <span class="b plain">currency</span></span><span class="c">'+fmt(c.cur[id])+'</span></div>'});
    if(names.length)h+='<div class="total"><span>Total cost'+(pr<names.length?' <span class="muted">('+pr+' of '+names.length+' priced)</span>':'')+'</span><span id="tot">'+fmt(Math.round(t*100)/100)+'</span></div>';
    $("raw").innerHTML=h||'<div class="empty">Add something to craft to see materials.</div>';
    return names;
  }
  function renderGather(names){
    var sk={},sn={},h="";
    names.forEach(function(id){if(byOut[id])return;var gl=App.nodesFor(id);if(!gl.length)return;var best=gl[0],k=best.v[1];
      sk[k]=Math.max(sk[k]||0,best.v[2]);(sn[k]=sn[k]||[]).push({id:id,l:best.v[2],n:best.v[0]})});
    Object.keys(sk).sort().forEach(function(k){
      h+='<section class="grp"><header>'+esc(k)+'<span class="c">level '+sk[k]+'</span></header><ul>'+sn[k].map(function(x){return '<li><span class="n">'+App.itemLink(x.id)+'</span><span class="muted">'+esc(x.n)+(x.l?', level '+x.l:'')+'</span></li>'}).join("")+'</ul></section>';
    });
    $("gath").innerHTML=h?'<div class="grps">'+h+'</div><p class="note">Level is the lowest needed to reach every material, using the easiest node for each.</p>':'<div class="empty">No gathering needed.</div>';
  }
  function renderFlex(c){
    var ck=Object.keys(c.catUsed).sort(function(a,b){return nm(a).localeCompare(nm(b))}),h="";
    ck.forEach(function(id){
      var opts=D.C[id]||[],ch=S.pick[id],nmid="pk_"+id.replace(/\W/g,"_");
      h+='<fieldset class="pick"><legend>Any '+esc(nm(id))+' <span class="c">×'+fmt(c.catUsed[id])+'</span></legend>';
      if(!opts.length)h+='<div class="muted">No item list for this category in the game files.</div>';
      else if(opts.length<=12){
        h+='<div class="muted">'+(ch?'Using '+esc(nm(ch)):'Not chosen yet: counted as "any" and left out of gathering.')+'</div><div class="chips" role="radiogroup" aria-label="Any '+esc(nm(id))+'">';
        h+='<label><input type="radio" name="'+nmid+'" value="" data-cat="'+esc(id)+'"'+(ch?'':' checked')+'><span>Not decided</span></label>';
        opts.forEach(function(o){h+='<label><input type="radio" name="'+nmid+'" value="'+esc(o)+'" data-cat="'+esc(id)+'"'+(o===ch?' checked':'')+'><span>'+esc(nm(o))+'</span></label>'});
        h+='</div>';
      }else{
        h+='<label class="muted" for="'+nmid+'">'+opts.length+' items count. Pick the one you will use:</label><select id="'+nmid+'" data-cat="'+esc(id)+'"><option value="">Not decided</option>'+opts.map(function(o){return '<option value="'+esc(o)+'"'+(o===ch?' selected':'')+'>'+esc(nm(o))+'</option>'}).join("")+'</select>';
      }
      h+='</fieldset>';
    });
    $("flexcard").hidden=!ck.length;$("flex").innerHTML=h;
  }
  function renderSteps(c){
    $("steps").innerHTML=c.order.map(function(id,i){
      var x=c.crafts[id],r=x.r;
      return '<div class="step"><span class="no">'+(i+1)+'</span><span><b>'+App.itemLink(id)+'</b><div class="muted">'+r.g.map(function(g){return g[2]+" "+(g[0]==="g"?"any ":"")+esc(nm(g[1]))}).join(" + ")+(r.o[1]>1?" → makes "+r.o[1]:"")+'</div></span>'
        +'<span class="c">×'+fmt(x.times)+' <button class="sm" data-buy="'+esc(id)+'" title="Buy this instead of crafting it">Buy</button></span>'
        +'<span class="meta">'+(r.s||[]).map(function(s,j){return (j?'<span class="muted">or</span> ':'')+'<span class="b craft">'+esc(stLabel(s))+'</span>'}).join(" ")+(r.t?'<span class="b plain">'+esc(r.t)+' '+(r.l||0)+'</span>':'')+'</span></div>';
    }).join("")||'<div class="empty">No crafting steps yet.</div>';
  }
  function renderSkills(c){
    var g={},h="";
    c.order.forEach(function(id){var r=c.crafts[id].r,k=r.t||"No skill needed";(g[k]=g[k]||{max:0,l:[]}).max=Math.max(g[k].max,r.l||0);g[k].l.push(id)});
    Object.keys(g).sort().forEach(function(k){
      var x=g[k];x.l.sort(function(a,b){return (c.crafts[b].r.l||0)-(c.crafts[a].r.l||0)});
      h+='<section class="grp"><header>'+esc(k)+'<span class="c">level '+x.max+'</span></header><ul>'+x.l.map(function(id){var r=c.crafts[id].r;return '<li><span class="n">'+App.itemLink(id)+'</span><span class="muted">lvl '+(r.l||0)+'</span>'+(r.s||[]).map(function(s){return '<span class="b craft">'+esc(stLabel(s))+'</span>'}).join("")+'</li>'}).join("")+'</ul></section>';
    });
    $("skills").innerHTML=h?'<div class="grps">'+h+'</div>':'<div class="empty">Nothing yet.</div>';
  }
  function renderStations(c){
    var g={},h="";
    c.order.forEach(function(id){
      var r=c.crafts[id].r,s=(r.s&&r.s[0])?NWCalc.station(r.s[0]):{key:"none",name:"No station listed",tier:0};
      var e=g[s.key]=g[s.key]||{name:s.name,tier:0,l:[]};e.tier=Math.max(e.tier,s.tier);e.l.push({id:id,tier:s.tier,alt:(r.s||[]).slice(1)});
    });
    Object.keys(g).sort(function(a,b){return g[a].name.localeCompare(g[b].name)}).forEach(function(k){
      var x=g[k];
      h+='<section class="grp"><header>'+esc(x.name)+(x.tier?'<span class="c">tier '+x.tier+'+</span>':'')+'</header><ul>'+x.l.map(function(e){return '<li><span class="n">'+App.itemLink(e.id)+'</span><span class="c">×'+fmt(c.crafts[e.id].times)+'</span>'+(e.tier?'<span class="muted">T'+e.tier+'</span>':'')+(e.alt.length?'<span class="muted">or '+e.alt.map(function(s){return esc(stLabel(s))}).join(", ")+'</span>':'')+'</li>'}).join("")+'</ul></section>';
    });
    $("stations").innerHTML=h?'<div class="grps">'+h+'</div><p class="note">Crafts listed in the order of the steps. "T2" means a tier 2 station or better.</p>':'<div class="empty">Nothing yet.</div>';
  }
  function treeNode(n,depth){
    var label='<span class="tq">'+fmt(n.qty)+'×</span><span class="nm">'+esc(n.kind==="cat"?"Any "+nm(n.id):nm(n.id))+(n.via?' <span class="via">for any '+esc(nm(n.via))+'</span>':'')+'</span>';
    if(n.kind==="craft"){
      var open=n.path in openTree?openTree[n.path]:depth<2,st=(n.r.s||[])[0];
      return '<li><details data-p="'+esc(n.path)+'"'+(open?' open':'')+'><summary>'+label+'<span class="b craft">craft ×'+fmt(n.times)+(st?' at '+esc(stLabel(st)):'')+'</span></summary><ul>'+n.kids.map(function(k){return treeNode(k,depth+1)}).join("")+'</ul></details></li>';
    }
    var b={raw:'<span class="b raw">gather / raw</span>',buy:'<span class="b buy">bought</span>',cur:'<span class="b plain">currency</span>',cat:'<span class="b warn">pick one</span>'}[n.kind];
    if(n.kind==="raw"&&!App.nodesFor(n.id).length)b='<span class="b plain">raw, other source</span>';
    return '<li><div class="leaf '+n.kind+'">'+label+b+'</div></li>';
  }
  function renderTree(c){
    $("tree").innerHTML=c.tree.length?'<ul class="tree">'+c.tree.map(function(n){return treeNode(n,0)}).join("")+'</ul>':'<div class="empty">Nothing to show.</div>';
    $("treeact").hidden=!c.tree.length;
    $("mapcard").hidden=!c.tree.length;if(c.tree.length)map.set(c.tree);
  }
  function render(){
    renderList();
    var c=calc();
    renderGather(renderRaw(c));renderFlex(c);renderSteps(c);renderSkills(c);renderStations(c);renderTree(c);
  }
  function totalOnly(){
    var c=calc(),t=0;Object.keys(c.raw).forEach(function(id){var p=S.prices[id];if(p!=null&&p!=="")t+=p*c.raw[id]});
    var e=$("tot");if(e)e.textContent=fmt(Math.round(t*100)/100);
  }
  function setAll(open){root.querySelectorAll("#tree details").forEach(function(d){d.open=open;openTree[d.dataset.p]=open})}

  App.attachSearch($("target"),$("sugg"),function(id){
    App.addToList(id,Math.max(1,parseInt($("qty").value,10)||1));
    $("target").value="";$("qty").value=1;render();$("target").focus();
  },{craftOnly:true});
  $("list").addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;S.list.splice(+b.dataset.rm,1);App.save();render()});
  $("list").addEventListener("change",function(e){var i=e.target.dataset.q;if(i==null)return;S.list[+i].qty=Math.max(1,parseInt(e.target.value,10)||1);App.save();render()});
  $("raw").addEventListener("input",function(e){var id=e.target.dataset.p;if(id==null)return;if(e.target.value==="")delete S.prices[id];else S.prices[id]=parseFloat(e.target.value)||0;App.save();totalOnly()});
  $("raw").addEventListener("click",function(e){var b=e.target.closest("[data-craft]");if(!b)return;delete S.buy[b.dataset.craft];App.save();render()});
  $("steps").addEventListener("click",function(e){var b=e.target.closest("[data-buy]");if(!b)return;S.buy[b.dataset.buy]=1;App.save();render()});
  $("flex").addEventListener("change",function(e){
    var id=e.target.dataset.cat;if(id==null)return;
    if(e.target.value)S.pick[id]=e.target.value;else delete S.pick[id];
    var name=e.target.name||e.target.id;App.save();render();
    // keep keyboard focus on the same picker after re-render
    var el=$("flex").querySelector(e.target.type==="radio"?'input[name="'+name+'"]:checked':'#'+name);if(el)el.focus();
  });
  $("tree").addEventListener("toggle",function(e){var d=e.target;if(d.dataset&&d.dataset.p)openTree[d.dataset.p]=d.open},true);
  $("expall").addEventListener("click",function(){setAll(true)});
  $("colall").addEventListener("click",function(){setAll(false)});
  render();
}});
})();
