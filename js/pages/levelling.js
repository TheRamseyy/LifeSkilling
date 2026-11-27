// Craft > Level a crafting skill: what to craft at each stage, how many, and what it takes.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,nm=App.nm,S=App.state;
var SKILLS=["Arcana","Armoring","Cooking","Engineering","Furnishing","Jewelcrafting","Leatherworking","Smelting","Stonecutting","Weaponsmithing","Weaving","Woodworking"];

App.page("craft/levelling",{title:"Level a crafting skill",needsData:true,render:function(root,param){
  var skill=SKILLS.filter(function(s){return s.toLowerCase()===(param||"smelting").toLowerCase()})[0]||"Smelting";
  document.title="Level "+skill+" · Aeternum Crafting";
  root.innerHTML='<h1>Level '+esc(skill)+'</h1><p class="loading">Loading…</p>';
  App.loadJSON("gear.json").then(function(G){
    S.lvl=S.lvl||{};
    var st=S.lvl[skill]=S.lvl[skill]||{from:0,to:250,mode:"fast"};
    function draw(){App.accent(App.SKILL_COL[skill],"#B9A4FF");root.innerHTML=html(skill,st,G)}
    draw();
    root.addEventListener("change",function(e){
      var t=e.target,k=t.dataset&&t.dataset.f;if(!k)return;
      if(k==="mode")st.mode=t.value;
      else st[k]=Math.max(0,Math.min(250,parseInt(t.value,10)||0));
      if(st.from>st.to){var x=st.from;st.from=st.to;st.to=x}
      App.save();draw();
      var el=root.querySelector('[data-f="'+k+'"]'+(k==="mode"?':checked':''));if(el)el.focus();
    });
    root.addEventListener("click",function(e){
      var b=e.target.closest("[data-add]");
      if(b){App.addToList(b.dataset.add,+b.dataset.qty);b.textContent="Added";b.disabled=true;return}
      var c=e.target.closest("[data-copy]");
      if(c&&navigator.clipboard){navigator.clipboard.writeText(c.dataset.copy).then(function(){c.textContent="Copied"},function(){c.textContent="Copy failed"})}
    });
  }).catch(function(e){root.innerHTML='<h1>Level a crafting skill</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});

function html(skill,st,G){
  var D=App.data,low=skill.toLowerCase();
  var r=NWLevel.route({recipes:D.R,byOut:D.byOut,cats:D.C,gather:D.G,xp:G.crafting[skill].xp,skill:skill,from:st.from,to:st.to,mode:st.mode,prices:S.prices,pick:S.pick});
  var h='<h1>Level '+esc(skill)+'</h1><p class="sub">What to craft at each stage to level '+esc(low)+', how many times, and everything it takes. Recipe XP and level XP come from the game files.</p>';
  h+='<nav class="seg" aria-label="Crafting skill">'+SKILLS.map(function(s){return '<a style="--c:'+App.SKILL_COL[s]+'" href="#/craft/levelling/'+s.toLowerCase()+'"'+(s===skill?' aria-current="page"':'')+'>'+esc(s)+'</a>'}).join("")+'</nav>';

  h+='<div class="runs"><div class="col1">';
  h+='<section class="card glass" aria-labelledby="h-set"><h2 id="h-set">Your plan</h2><div class="lvls">'+
    '<label><span>Current level</span><input type="number" min="0" max="250" inputmode="numeric" data-f="from" value="'+st.from+'"></label>'+
    '<label><span>Target level</span><input type="number" min="0" max="250" inputmode="numeric" data-f="to" value="'+st.to+'"></label></div>'+
    '<fieldset class="pick" style="margin-top:12px"><legend>Route</legend><div class="chips" role="radiogroup" aria-label="Route">'+
    '<label><input type="radio" name="mode" data-f="mode" value="fast"'+(st.mode==="fast"?" checked":"")+'><span>Fastest</span></label>'+
    '<label><input type="radio" name="mode" data-f="mode" value="cheap"'+(st.mode==="cheap"?" checked":"")+'><span>Cheapest</span></label></div>'+
    '<p class="muted" style="margin:8px 0 0">'+(st.mode==="fast"?'Fastest: the most XP per craft, so the fewest crafts.':'Cheapest: the lowest cost per XP using your prices from the calculator, or the fewest raw materials per XP where items have no price. Only recipes worth at least a quarter of the best XP count, so it never becomes a huge grind.')+'</p></fieldset></section>';
  var t=r.total;
  h+='<section class="card glass sum" aria-label="Summary"><b class="big">'+fmt(t.crafts)+'</b><span>crafts from level '+st.from+' to '+st.to+'</span>'+
    '<span class="muted" style="flex-basis:100%">'+fmt(Math.round(t.xp))+' XP, '+fmt(t.units)+' raw materials, '+fmt(t.fee)+' coin in crafting fees before town tax'+(t.priced&&t.cost?', about '+fmt(Math.round(t.cost))+' coin of materials at your prices':'')+'.</span></section>';
  h+='</div><div>';

  // The route
  h+='<section class="card" aria-labelledby="h-route"><h2 id="h-route">What to craft</h2><ol class="trail">';
  r.steps.forEach(function(s,i){
    h+='<li class="stop"><span class="no">'+(i+1)+'</span><div>';
    if(!s.r){h+='<div class="st-h"><b>Level '+s.from+' to '+s.to+'</b></div><p class="muted">No standard recipe in the files for this stage uses materials you can gather or buy. Craft anything you have unlocked; '+fmt(Math.round(s.xp))+' XP needed.</p></div></li>';return}
    var stn=(s.r.s||[])[0],out=s.r.o[1]*s.crafts;
    h+='<div class="st-h"><b>Level '+s.from+' to '+s.to+': '+App.itemLink(s.r.o[0],s.r.n)+'</b><span class="b plain">needs '+esc(skill)+' '+(s.r.l||0)+'</span>'+(stn?'<span class="b craft">'+esc(NWCalc.stationLabel(stn))+'</span>':'')+'</div>'+
      '<p><b class="big2">'+fmt(s.crafts)+' crafts</b> <span class="muted">at '+fmt(s.r.x)+' XP each, '+fmt(Math.round(s.xp))+' XP in total'+(s.r.fee?', '+fmt(s.r.fee*s.crafts)+' coin in fees':'')+'</span></p>'+
      '<div class="mats">'+Object.keys(s.raw).sort(function(a,b){return s.raw[b]-s.raw[a]}).map(function(id){return '<a class="mat" href="#/item/'+encodeURIComponent(id)+'">'+esc(nm(id))+' <b>×'+fmt(s.raw[id])+'</b></a>'}).join("")+'</div>'+
      '<p><button class="sm" type="button" data-add="'+esc(s.r.o[0])+'" data-qty="'+out+'">Add '+fmt(out)+' to craft list</button></p></div></li>';
  });
  h+='</ol><p class="note">XP per craft and XP per level are from the game files. XP boosts from territory standing, events or anything else are not counted, so you may need fewer crafts. "Any" ingredients use your choice from the calculator, or the standard item. Refining reagents (flux, sandpaper, tannin, solvent) are counted as bought.</p></section>';

  // Shopping list
  var ids=Object.keys(t.raw).sort(function(a,b){return t.raw[b]-t.raw[a]});
  if(ids.length){
    var copy=ids.map(function(id){return t.raw[id]+" x "+nm(id)}).join("\n");
    h+='<section class="card" aria-labelledby="h-shop"><h2 id="h-shop">Everything you need <span class="act"><button class="sm" type="button" data-copy="'+esc(copy)+'">Copy shopping list</button></span></h2>'+
      ids.map(function(id){var p=S.prices[id];return '<div class="item"><span class="n">'+App.itemLink(id)+(App.nodesFor(id).length?' <span class="b raw">gather</span>':' <span class="b buy">buy</span>')+'</span><span class="c">'+fmt(t.raw[id])+'</span>'+(p!=null&&p!==""?'<span class="muted">'+fmt(Math.round(p*t.raw[id]))+' coin</span>':'')+'</div>'}).join("")+'</section>';
  }

  // Crafting clothing
  var wear=G.crafting[skill].wear;
  h+='<section class="card" aria-labelledby="h-cw"><h2 id="h-cw">Clothing that helps '+esc(low)+'</h2>';
  if(!wear.length)h+='<p class="muted">No clothing in the game files has a '+esc(low)+' perk.</p>';
  else h+='<div class="gt nospd" role="table"><div class="gt-h" role="row"><span role="columnheader">Item</span><span role="columnheader">Slot</span><span role="columnheader">Tier</span><span role="columnheader">Gear score</span><span role="columnheader">Perk</span><span role="columnheader">How to get it</span></div>'+
    wear.map(function(w){var rc=D.byOut[w.id]&&D.byOut[w.id][0];return '<div class="gt-r"><div class="gt-row" role="row"><span class="gt-n" role="cell">'+((D.byOut[w.id]||D.N[w.id])?App.itemLink(w.id,w.n):esc(w.n))+'</span><span role="cell" data-l="Slot">'+esc(w.slot)+'</span><span role="cell" data-l="Tier">T'+w.tr+'</span><span role="cell" data-l="Gear score">'+w.gs+'</span><span class="gt-p" role="cell">'+w.pk.map(function(p){return esc(p[2])}).join("<br>")+'</span><span role="cell"><span class="b plain">'+esc(w.src)+'</span>'+(w.src==="Crafted"&&rc&&rc.t?' <span class="muted">'+esc(rc.t)+' '+(rc.l||0)+'</span>':'')+'</span></div></div>'}).join("")+'</div>';
  h+='<p class="note">Perk values from the game files. Guides agree that each piece of a refining set adds about 2% yield, matching the files (<a href="https://www.icy-veins.com/new-world/weaving-trade-skill-guide" rel="noopener" target="_blank">Icy Veins</a>). "Crafted Item Quality" is the game’s name for it; it is understood to help what you craft roll a higher gear score.</p></section>';
  h+='</div></div>';
  return h;
}
})();
