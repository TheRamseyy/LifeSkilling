// Gather > Where gear drops: every gathering tool, clothing piece and bag that can drop, who drops it and where.
// Data from data/drops.json (tools/build_drops.py): loot tables traced to creatures and chests, with the level
// conditions on the way and creature spawn levels and zones from the world files.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt;
var TABS=["All","Mining","Logging","Harvesting","Skinning","Fishing","Bag"];
// plainer names for loot tables that are not creatures or named chests
var LABEL=[[/^Creature Loot Master Mutated Container/,"Mutated expedition reward chests"],[/^Chest Loot Elite/,"Elite chests (in elite areas)"],
  [/^Doubloon Chest/,"Treasure map chests (doubloon treasure maps)"],[/^Reekwater Uplevel Chest/,"Reekwater treasure map chests"],
  [/^Season (\d+) ?Items/,"Season $1 reward track"],[/^World Event S(\d+)/,"Season $1 world event rewards"],[/^World Event Crassus/,"Crassus world event rewards"],
  [/^Omega Tools/,"Limited-time event tools"],[/^Fishing Quest Reward/,"Fishing quest rewards"],[/Twitch/,"Twitch drop (promotion)"]];
function label(n){for(var i=0;i<LABEL.length;i++){var m=LABEL[i][0].exec(n);if(m)return LABEL[i][1].replace("$1",m[1]||"")}return n}
function lv(r){return !r.lv?'any level':r.lv[1]>=999?'level '+r.lv[0]+' and up':'level '+r.lv[0]+'–'+r.lv[1]}
function link(id,n){return (App.data.byOut[id]||App.data.N[id])?App.itemLink(id,n):esc(n)}

App.page("gather/drops",{title:"Where gear drops",needsData:true,render:function(root,param){
  var focus=param?decodeURIComponent(param):"",tab=App.state.dropTab||"All",q="";
  root.innerHTML='<h1>Where gear drops</h1><p class="loading">Loading…</p>';
  App.loadJSON("drops.json").then(function(D){
    var ids=Object.keys(D).sort(function(a,b){var x=D[a],y=D[b];return TABS.indexOf(x.s[0])-TABS.indexOf(y.s[0])||x.tr-y.tr||x.n.localeCompare(y.n)});
    if(focus&&D[focus]){tab="All";q=D[focus].n}
    root.innerHTML='<h1>Where gear drops</h1><p class="sub">Gathering tools, clothing and bags that can drop, who drops them and where to farm them. Traced from the Season 10 loot tables to the creatures and chests that use them, keeping the level each piece needs'+
      App.unsure("Level ranges and creatures are read from the loot tables and checked against nwdb for a few items. The files have no drop chances, so this says what can drop, not how often.")+'.</p>'+
      '<div class="dfilters"><nav class="seg" aria-label="Skill">'+TABS.map(function(t){return '<button type="button" data-tab="'+t+'" style="--c:'+(App.SKILL_COL[t]||"var(--accent)")+'"'+(t===tab?' aria-current="true"':'')+'>'+(t==="Bag"?"Bags":t)+'</button>'}).join("")+'</nav>'+
      '<label class="dq">Find<input type="search" id="dq" placeholder="e.g. Miner Hat" value="'+esc(q)+'"></label></div><p class="muted" id="dn"></p><div class="dlist" id="dl"></div>';
    function route(r){
      var h='<div class="droute k-'+esc(r.k.split(" ")[0].toLowerCase())+'"><h4>'+esc(r.k)+'</h4>';
      if(r.k==="Creatures"){
        h+='<p><b>'+fmt(r.nc)+'</b> kind'+(r.nc===1?'':'s')+' of creature at <b>'+lv(r)+'</b>'+(r.el>1?' (enemy level '+r.el+'+)':'')+(r.pl>1?', once you are level '+r.pl:'')+(r.tag.length?', only '+r.tag.map(esc).join(", ")+' creatures':'')+'.</p>';
        if(r.z.length)h+='<p class="dz"><span class="k">Best places</span>'+r.z.map(function(z){return '<span class="b plain">'+esc(z[0])+' <small>'+fmt(z[1])+'</small></span>'}).join(" ")+'</p>';
        h+='<details><summary>Creatures ('+(r.nc>r.c.length?'most common '+r.c.length+' of '+fmt(r.nc):r.c.length)+')</summary><ul class="dcre">'+r.c.map(function(c){return '<li>'+esc(c[0])+' <span class="muted">'+esc(c[1].replace(/([a-z])([A-Z])/g,"$1 $2"))+', level '+(c[2]===c[3]?c[2]:c[2]+'–'+c[3])+'</span></li>'}).join("")+'</ul></details>';
      }else{
        var seen={},names=r.ch.map(label).filter(function(n){return seen[n]?0:(seen[n]=1)});
        h+='<p>'+(names.length?names.map(esc).join(", "):'From '+esc(r.k.toLowerCase()))+(r.lv?' <span class="muted">('+lv(r)+')</span>':'')+(r.nch>r.ch.length?' <span class="muted">and '+(r.nch-r.ch.length)+' more</span>':'')+'</p>';
      }
      return h+'</div>';
    }
    function draw(){
      var s=q.trim().toLowerCase();
      var list=ids.filter(function(id){var x=D[id];return (tab==="All"||x.s.indexOf(tab)>=0)&&(!s||x.n.toLowerCase().indexOf(s)>=0)});
      root.querySelector("#dn").textContent=list.length+" item"+(list.length===1?"":"s")+" that can drop.";
      root.querySelector("#dl").innerHTML=list.map(function(id){
        var x=D[id];
        return '<article class="card glass dcard'+(id===focus?' lit':'')+'" id="d-'+esc(id)+'" style="--a:'+(App.SKILL_COL[x.s[0]]||"var(--accent)")+'"><header><b>'+link(id,x.n)+'</b><span class="muted">'+x.s.map(function(k){return k==="Bag"?"Bag":esc(k)}).join(", ")+(x.slot&&x.slot!=="Bag"?' '+esc(x.slot.toLowerCase()):'')+', T'+x.tr+', GS '+x.gs+'</span></header>'+x.r.map(route).join("")+'</article>';
      }).join("")||'<p class="muted">Nothing matches.</p>';
    }
    draw();
    if(focus&&D[focus]){var el=root.querySelector("#d-"+CSS.escape(focus));if(el)el.scrollIntoView({block:"center"})}
    root.addEventListener("click",function(e){var b=e.target.closest("[data-tab]");if(!b)return;tab=b.dataset.tab;App.state.dropTab=tab;App.save();
      root.querySelectorAll("[data-tab]").forEach(function(x){x.toggleAttribute("aria-current",x===b);if(x===b)x.setAttribute("aria-current","true")});draw()});
    root.querySelector("#dq").addEventListener("input",function(e){q=e.target.value;draw()});
  }).catch(function(e){root.innerHTML='<h1>Where gear drops</h1><p class="err">The drop data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
