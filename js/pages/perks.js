// Gear > Weapon perks: every perk that can roll on a weapon or shield, searchable.
(function(){
"use strict";
var esc=App.esc;

App.page("gear/perks",{title:"Weapon perks",render:function(root){
  root.innerHTML='<h1>Weapon perks</h1><p class="loading">Loading…</p>';
  App.loadJSON("weapons.json").then(function(W){
    var q="",on="";
    var weapons=[];W.perks.forEach(function(p){p.on.forEach(function(o){if(weapons.indexOf(o)<0)weapons.push(o)})});weapons.sort();
    function draw(){
      var list=W.perks.filter(function(p){return (!on||p.on.indexOf(on)>=0)&&(!q||(p.n+" "+p.d).toLowerCase().indexOf(q)>=0)});
      var h='<h1>Weapon perks</h1><p class="sub">Every perk that can roll on a weapon or shield, with its numbers worked out at gear score '+W.perkGS+App.unsure("Perk values use the game’s own scaling formula at gear score "+W.perkGS+". The tooltip in game may differ slightly, and values change with gear score.")+'.</p>'+App.gearNav("gear/perks");
      h+='<div class="wfilters"><input type="search" id="pq" placeholder="Search perks, e.g. haste or bleed" value="'+esc(q)+'" aria-label="Search perks">'+
        '<select id="pon" aria-label="Weapon"><option value="">All weapons</option>'+weapons.map(function(w){return '<option'+(w===on?' selected':'')+'>'+esc(w)+'</option>'}).join("")+'</select>'+
        '<span class="muted">'+list.length+' of '+W.perks.length+'</span></div>';
      h+='<div class="plist">'+list.map(function(p){
        return '<div class="pk"><b>'+esc(p.n)+'</b><p>'+esc(p.d)+(p.scales?'':' <span class="muted">(does not change with gear score)</span>')+'</p><div class="on">'+p.on.map(function(o){return '<span class="b plain">'+esc(o)+'</span>'}).join("")+'</div></div>';
      }).join("")+'</div>';
      if(!list.length)h+='<p class="empty">No perk matches that search.</p>';
      root.innerHTML=h;
    }
    draw();
    root.addEventListener("input",function(e){if(e.target.id==="pq"){q=e.target.value.trim().toLowerCase();draw();var i=root.querySelector("#pq");i.focus();i.setSelectionRange(i.value.length,i.value.length)}});
    root.addEventListener("change",function(e){if(e.target.id==="pon"){on=e.target.value;draw();root.querySelector("#pon").focus()}});
  }).catch(function(e){root.innerHTML='<h1>Weapon perks</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
