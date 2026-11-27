(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var R=[],N={},C={},byOut={},outs=[],GN={},GB={};
var KEY="nwcalc.v2",state={list:[],buy:{},prices:{},pick:{}};
var RANK=["weapon","armorer","engineer","jeweler","arcana","cooking","refining","misc","specialtyshops","raid","dungeon","gypkilm","seasons","seasonalserver"];
// Station names from localization/en-us.json (<base>_station keys). The trailing number is the minimum station tier.
var STN={blacksmith:"Forge",outfitting:"Outfitting Station",alchemy:"Arcane Repository",smelting:"Smelter",tanning:"Tannery",weaving:"Loom",carpentry:"Woodshop",masonry:"Stonecutting Table",engineering:"Workshop",cooking:"Kitchen",camp:"Camp",gypsumstation:"Gypsum Kiln",RuneglassStation:"Runeglass Station",FlameCore_Forge:"Flame Core Forge",Specialty_DoubloonShop:"Doubloon Shop",Specialty_ReekwaterShop:"Reekwater Shop",Lightshield_AlchemyT:"Lightshield Arcane Repository"};
var openTree={};// tree path -> open (true/false), only for nodes the user toggled

function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fmt(n){return n.toLocaleString("en-GB")}
function pretty(id){return String(id).replace(/_/g,' ').replace(/([a-z])([A-Z0-9])/g,'$1 $2')}
function nm(id){return N[id]||pretty(id)}
function station(sid){
  var m=/^(.*?)(\d+)(_standing)?$/.exec(sid),base=m?m[1]:sid,tier=m?+m[2]:0;
  return {key:base,name:STN[base]||pretty(base),tier:tier};
}
function stLabel(sid){var s=station(sid);return s.name+(s.tier?" T"+s.tier:"")}
function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d){state.list=d.list||[];state.buy=d.buy||{};state.prices=d.prices||{};state.pick=d.pick||{}}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}

function dur(s,nu){if(s<90)return Math.round(s)+(nu?"":" s");var m=s/60;return (m<10?Math.round(m*10)/10:Math.round(m))+(nu?"":" min")}
function nodesFor(id){
  var l=(GB[String(id).toLowerCase()]||[]).map(function(g){return {g:g,v:GN[g]}}).filter(function(x){return x.v});
  l.sort(function(a,b){return a.v[2]-b.v[2]||a.v[6]-b.v[6]||a.v[0].localeCompare(b.v[0])});
  var seen={},out=[];l.forEach(function(x){var k=x.v[0]+"|"+x.v[1];if(!seen[k]){seen[k]=1;out.push(x)}});
  return out;
}
function rank(r){var i=RANK.indexOf(r.f);return (r.p?100:0)+(i<0?50:i)}
function pick(id){var l=byOut[id];return l?l[0]:null}

// Node kinds: craft, raw (nothing makes it), buy (craftable but marked bought), cur (currency), cat (unpicked "any X").
function calc(){
  var raw={},cur={},cat={},catUsed={},crafts={},order=[],tree=[];
  function visit(id,qty,depth,path,via){
    var r=pick(id),node={id:id,qty:qty,kids:[],kind:"raw",via:via,path:path.concat(id).join(">")};
    if(r&&state.buy[id])node.kind="buy";
    if(r&&!state.buy[id]&&path.indexOf(id)<0&&depth<25){
      var times=Math.ceil(qty/r.o[1]);node.kind="craft";node.times=times;node.r=r;
      r.g.forEach(function(g){
        var q=g[2]*times,p=path.concat(id);
        if(g[0]==="i")node.kids.push(visit(g[1],q,depth+1,p));
        else if(g[0]==="g"){
          catUsed[g[1]]=(catUsed[g[1]]||0)+q;
          var ch=state.pick[g[1]];
          if(ch&&(C[g[1]]||[]).indexOf(ch)>=0)node.kids.push(visit(ch,q,depth+1,p,g[1]));
          else{cat[g[1]]=(cat[g[1]]||0)+q;node.kids.push({id:g[1],qty:q,kids:[],kind:"cat",path:p.concat("any:"+g[1]).join(">")})}
        }
        else{cur[g[1]]=(cur[g[1]]||0)+q;node.kids.push({id:g[1],qty:q,kids:[],kind:"cur",path:p.concat("$"+g[1]).join(">")})}
      });
      if(!crafts[id]){crafts[id]={times:0,qty:0,depth:depth,r:r};order.push(id)}
      crafts[id].times+=times;crafts[id].qty+=qty;crafts[id].depth=Math.max(crafts[id].depth,depth);
    }else{raw[id]=(raw[id]||0)+qty}
    return node;
  }
  state.list.forEach(function(e,i){tree.push(visit(e.id,e.qty,0,["#"+i]))});
  // deepest first, so every input is made before the thing that uses it
  order.sort(function(a,b){return crafts[b].depth-crafts[a].depth});
  return {raw:raw,cur:cur,cat:cat,catUsed:catUsed,crafts:crafts,order:order,tree:tree};
}

function renderList(){
  var h="";
  state.list.forEach(function(e,i){
    h+='<div class="item"><span class="n">'+esc(nm(e.id))+'</span><input class="q" type="number" min="1" value="'+e.qty+'" data-q="'+i+'" aria-label="Quantity of '+esc(nm(e.id))+'"><button class="sm" data-rm="'+i+'" aria-label="Remove '+esc(nm(e.id))+'">✕</button></div>';
  });
  $("list").innerHTML=h||'<div class="empty">Nothing yet. Search an item above.</div>';
}

function renderRaw(c){
  var names=Object.keys(c.raw).sort(function(a,b){return nm(a).localeCompare(nm(b))}),t=0,pr=0,h="";
  names.forEach(function(id){
    var p=state.prices[id],cost=(p!=null&&p!=="")?p*c.raw[id]:null;if(cost!=null){t+=cost;pr++}
    var bought=!!byOut[id],gl=bought?[]:nodesFor(id),gh="",badge;
    if(bought)badge='<span class="b buy">bought</span>';
    else if(gl.length){
      badge='<span class="b raw">gather</span>';
      gh='<details class="nodes"><summary>Where to get it ('+gl.length+')</summary>'+gl.slice(0,8).map(function(x){var v=x.v;return '<div><b>'+esc(v[0])+'</b> · '+esc(v[1])+(v[2]?' lvl '+v[2]:'')+' · respawn '+dur(v[3],1)+'–'+dur(v[4])+' · gather '+dur(v[5])+'</div>'}).join("")+(gl.length>8?'<div>+'+(gl.length-8)+' more</div>':"")+'</details>';
    }else{badge='<span class="b plain">other source</span>';gh='<div class="muted">No gathering node found. Likely a creature drop, chest, vendor, salvage or event item.</div>'}
    h+='<div class="item"><span class="n">'+esc(nm(id))+' '+badge+gh+'</span><span class="c">'+fmt(c.raw[id])+'</span><input class="price" type="number" min="0" step="any" placeholder="price ea." value="'+(p!=null?esc(p):"")+'" data-p="'+esc(id)+'" aria-label="Price of '+esc(nm(id))+'">'+(bought?'<button class="sm" data-craft="'+esc(id)+'">Craft it</button>':'')+'</div>';
  });
  Object.keys(c.cat).forEach(function(id){
    h+='<div class="item"><span class="n">Any '+esc(nm(id))+' <span class="b warn">pick one</span><div class="muted"><a href="#flexcard">Choose which item you will use</a> to include it in gathering.</div></span><span class="c">'+fmt(c.cat[id])+'</span></div>';
  });
  Object.keys(c.cur).forEach(function(id){h+='<div class="item"><span class="n">'+esc(nm(id))+' <span class="b plain">currency</span></span><span class="c">'+fmt(c.cur[id])+'</span></div>'});
  if(names.length)h+='<div class="total"><span>Total cost'+(pr<names.length?' <span class="muted">('+pr+' of '+names.length+' priced)</span>':'')+'</span><span id="tot">'+fmt(Math.round(t*100)/100)+'</span></div>';
  $("raw").innerHTML=h||'<div class="empty">Add something to craft to see materials.</div>';
  return names;
}

function renderGather(names){
  var sk={},sn={},h="";
  names.forEach(function(id){if(byOut[id])return;var gl=nodesFor(id);if(!gl.length)return;var best=gl[0],k=best.v[1];
    sk[k]=Math.max(sk[k]||0,best.v[2]);(sn[k]=sn[k]||[]).push({id:id,l:best.v[2],n:best.v[0]})});
  Object.keys(sk).sort().forEach(function(k){
    h+='<section class="grp"><header>'+esc(k)+'<span class="c">level '+sk[k]+'</span></header><ul>'+sn[k].map(function(x){return '<li><span class="n">'+esc(nm(x.id))+'</span><span class="muted">'+esc(x.n)+(x.l?' · lvl '+x.l:'')+'</span></li>'}).join("")+'</ul></section>';
  });
  $("gath").innerHTML=h?h+'<p class="note">Level is the lowest needed to reach every material, using the easiest node for each.</p>':'<div class="empty">No gathering needed.</div>';
}

function renderFlex(c){
  var ck=Object.keys(c.catUsed).sort(function(a,b){return nm(a).localeCompare(nm(b))}),h="";
  ck.forEach(function(id){
    var opts=C[id]||[],ch=state.pick[id],nmid="pk_"+id.replace(/\W/g,"_");
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
  var h="";
  c.order.forEach(function(id,i){
    var x=c.crafts[id],r=x.r;
    h+='<div class="step"><span class="no">'+(i+1)+'</span><span><b>'+esc(nm(id))+'</b><div class="muted">'+r.g.map(function(g){return g[2]+" "+(g[0]==="g"?"any ":"")+esc(nm(g[1]))}).join(" + ")+(r.o[1]>1?" → makes "+r.o[1]:"")+'</div></span>'
      +'<span class="c">×'+fmt(x.times)+' <button class="sm" data-buy="'+esc(id)+'" title="Buy this instead of crafting it">Buy</button></span>'
      +'<span class="meta">'+(r.s||[]).map(function(s,j){return (j?'<span class="muted">or</span> ':'')+'<span class="b craft">'+esc(stLabel(s))+'</span>'}).join(" ")+(r.t?'<span class="b plain">'+esc(r.t)+' '+(r.l||0)+'</span>':'')+'</span></div>';
  });
  $("steps").innerHTML=h||'<div class="empty">No crafting steps yet.</div>';
}

function renderSkills(c){
  var g={},h="";
  c.order.forEach(function(id){var r=c.crafts[id].r,k=r.t||"No skill needed";(g[k]=g[k]||{max:0,l:[]}).max=Math.max(g[k].max,r.l||0);g[k].l.push(id)});
  Object.keys(g).sort().forEach(function(k){
    var x=g[k];x.l.sort(function(a,b){return (c.crafts[b].r.l||0)-(c.crafts[a].r.l||0)});
    h+='<section class="grp"><header>'+esc(k)+'<span class="c">level '+x.max+'</span></header><ul>'+x.l.map(function(id){var r=c.crafts[id].r;return '<li><span class="n">'+esc(nm(id))+'</span><span class="muted">lvl '+(r.l||0)+'</span>'+(r.s||[]).map(function(s){return '<span class="b craft">'+esc(stLabel(s))+'</span>'}).join("")+'</li>'}).join("")+'</ul></section>';
  });
  $("skills").innerHTML=h||'<div class="empty">Nothing yet.</div>';
}

function renderStations(c){
  var g={},h="";
  c.order.forEach(function(id){
    var r=c.crafts[id].r,s=(r.s&&r.s[0])?station(r.s[0]):{key:"none",name:"No station listed",tier:0};
    var e=g[s.key]=g[s.key]||{name:s.name,tier:0,l:[]};e.tier=Math.max(e.tier,s.tier);e.l.push({id:id,tier:s.tier,alt:(r.s||[]).slice(1)});
  });
  Object.keys(g).sort(function(a,b){return g[a].name.localeCompare(g[b].name)}).forEach(function(k){
    var x=g[k];
    h+='<section class="grp"><header>'+esc(x.name)+(x.tier?'<span class="c">tier '+x.tier+'+</span>':'')+'</header><ul>'+x.l.map(function(e){return '<li><span class="n">'+esc(nm(e.id))+'</span><span class="c">×'+fmt(c.crafts[e.id].times)+'</span>'+(e.tier?'<span class="muted">T'+e.tier+'</span>':'')+(e.alt.length?'<span class="muted">or '+e.alt.map(function(s){return esc(stLabel(s))}).join(", ")+'</span>':'')+'</li>'}).join("")+'</ul></section>';
  });
  $("stations").innerHTML=h?h+'<p class="note">Crafts listed in the order of the steps. "T2" means a tier 2 station or better.</p>':'<div class="empty">Nothing yet.</div>';
}

function treeNode(n,depth){
  var label='<span class="tq">'+fmt(n.qty)+'×</span><span class="nm">'+esc(n.kind==="cat"?"Any "+nm(n.id):nm(n.id))+(n.via?' <span class="via">for any '+esc(nm(n.via))+'</span>':'')+'</span>';
  if(n.kind==="craft"){
    var open=n.path in openTree?openTree[n.path]:depth<2;
    var st=(n.r.s||[])[0];
    return '<li><details data-p="'+esc(n.path)+'"'+(open?' open':'')+'><summary>'+label+'<span class="b craft">craft ×'+fmt(n.times)+(st?' · '+esc(stLabel(st)):'')+'</span></summary><ul>'+n.kids.map(function(k){return treeNode(k,depth+1)}).join("")+'</ul></details></li>';
  }
  var b={raw:'<span class="b raw">gather / raw</span>',buy:'<span class="b buy">bought</span>',cur:'<span class="b plain">currency</span>',cat:'<span class="b warn">pick one</span>'}[n.kind];
  if(n.kind==="raw"&&!nodesFor(n.id).length)b='<span class="b plain">raw · other source</span>';
  return '<li><div class="leaf '+n.kind+'">'+label+b+'</div></li>';
}
function renderTree(c){
  $("tree").innerHTML=c.tree.length?'<ul class="tree">'+c.tree.map(function(n){return treeNode(n,0)}).join("")+'</ul>':'<div class="empty">Nothing to show.</div>';
  $("treeact").hidden=!c.tree.length;
}

function render(){
  renderList();
  var c=calc();
  renderGather(renderRaw(c));renderFlex(c);renderSteps(c);renderSkills(c);renderStations(c);renderTree(c);
}
function totalOnly(){
  var c=calc(),t=0;Object.keys(c.raw).forEach(function(id){var p=state.prices[id];if(p!=null&&p!=="")t+=p*c.raw[id]});
  var e=$("tot");if(e)e.textContent=fmt(Math.round(t*100)/100);
}
function setAll(open){
  $("tree").querySelectorAll("details").forEach(function(d){d.open=open;openTree[d.dataset.p]=open});
}

function add(id){
  var q=Math.max(1,parseInt($("qty").value,10)||1),ex=state.list.filter(function(e){return e.id===id})[0];
  if(ex)ex.qty+=q;else state.list.push({id:id,qty:q});
  $("target").value="";$("sugg").hidden=true;$("qty").value=1;save();render();$("target").focus();
}
$("target").addEventListener("input",function(){
  var q=this.value.trim().toLowerCase(),s=$("sugg");
  if(q.length<2){s.hidden=true;return}
  var m=[];
  for(var i=0;i<outs.length&&m.length<25;i++){if(outs[i].l.indexOf(q)>=0)m.push(outs[i])}
  m.sort(function(a,b){var as=a.l.indexOf(q)===0?0:1,bs=b.l.indexOf(q)===0?0:1;return as-bs||a.n.length-b.n.length});
  s.innerHTML=m.map(function(o){return '<button type="button" data-add="'+esc(o.id)+'"><span>'+esc(o.n)+'</span><span class="muted">'+esc(o.meta)+'</span></button>'}).join("")||'<div class="empty">No match.</div>';
  s.hidden=false;
});
$("target").addEventListener("keydown",function(e){
  var f=$("sugg").querySelector("button");
  if(e.key==="ArrowDown"&&f){e.preventDefault();f.focus()}
  else if(e.key==="Enter"&&f&&!$("sugg").hidden){e.preventDefault();add(f.dataset.add)}
  else if(e.key==="Escape")$("sugg").hidden=true;
});
$("sugg").addEventListener("keydown",function(e){
  var b=e.target.closest("button");if(!b)return;
  if(e.key==="ArrowDown"&&b.nextElementSibling){e.preventDefault();b.nextElementSibling.focus()}
  else if(e.key==="ArrowUp"){e.preventDefault();(b.previousElementSibling||$("target")).focus()}
  else if(e.key==="Escape"){$("sugg").hidden=true;$("target").focus()}
});
$("sugg").addEventListener("click",function(e){var b=e.target.closest("[data-add]");if(b)add(b.dataset.add)});
$("list").addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(!b)return;state.list.splice(+b.dataset.rm,1);save();render()});
$("list").addEventListener("change",function(e){var i=e.target.dataset.q;if(i==null)return;state.list[+i].qty=Math.max(1,parseInt(e.target.value,10)||1);save();render()});
$("raw").addEventListener("input",function(e){var id=e.target.dataset.p;if(id==null)return;if(e.target.value==="")delete state.prices[id];else state.prices[id]=parseFloat(e.target.value)||0;save();totalOnly()});
$("raw").addEventListener("click",function(e){var b=e.target.closest("[data-craft]");if(!b)return;delete state.buy[b.dataset.craft];save();render()});
$("steps").addEventListener("click",function(e){var b=e.target.closest("[data-buy]");if(!b)return;state.buy[b.dataset.buy]=1;save();render()});
$("flex").addEventListener("change",function(e){
  var id=e.target.dataset.cat;if(id==null)return;
  if(e.target.value)state.pick[id]=e.target.value;else delete state.pick[id];
  var name=e.target.name||e.target.id;save();render();
  // keep keyboard focus on the same picker after re-render
  var el=$("flex").querySelector(e.target.type==="radio"?'input[name="'+name+'"]:checked':'#'+name);if(el)el.focus();
});
$("tree").addEventListener("toggle",function(e){var d=e.target;if(d.dataset&&d.dataset.p)openTree[d.dataset.p]=d.open},true);
$("expall").addEventListener("click",function(){setAll(true)});
$("colall").addEventListener("click",function(){setAll(false)});

function init(data){
  R=data[0];N=data[1];C=data[2];
  R.forEach(function(r){if(r.o[0]){(byOut[r.o[0]]=byOut[r.o[0]]||[]).push(r)}});
  Object.keys(byOut).forEach(function(id){
    byOut[id].sort(function(a,b){return rank(a)-rank(b)});
    var r=byOut[id][0],n=nm(id);
    outs.push({id:id,n:n,l:n.toLowerCase(),meta:[r.t,r.tr?"T"+r.tr:"",r.gs?"GS "+r.gs:""].filter(Boolean).join(" · ")});
  });
  $("stat").textContent=fmt(R.length)+" recipes · "+fmt(outs.length)+" craftable items · from game files, not verified on Azoth";
  load();state.list=state.list.filter(function(e){return byOut[e.id]||N[e.id]});render();
}
// exposed for testing in the browser console only
window.nwcalc={calc:calc,state:state,station:station};
Promise.all(["recipes.json","names.json","cats.json"].map(function(f){return fetch("data/"+f).then(function(r){if(!r.ok)throw new Error(f);return r.json()})}))
 .then(function(d){return fetch("data/gather.json").then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(g){if(g){GN=g.n;GB=g.b}return d})})
 .then(init).catch(function(e){$("stat").innerHTML='<span class="err">Could not load data ('+esc(e.message)+').</span>'});
})();
