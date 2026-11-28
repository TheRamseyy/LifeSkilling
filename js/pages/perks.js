// Gear > Tool perks: every perk a gathering tool can have, searchable and filterable by skill.
(function(){
"use strict";
var esc=App.esc;
var SKILLS=["Mining","Logging","Harvesting","Skinning","Fishing"];

App.page("gear/perks",{title:"Tool perks",render:function(root){
  root.innerHTML='<h1>Tool perks</h1><p class="loading">Loading…</p>';
  App.loadJSON("gear.json").then(function(G){
    var q="",on="";
    function draw(){
      // [id, name, text, value, skills]
      var list=G.toolPerks.filter(function(p){return (!on||p[4].indexOf(on)>=0)&&(!q||(p[1]+" "+p[2]).toLowerCase().indexOf(q)>=0)});
      var h='<h1>Tool perks</h1><p class="sub">Every perk a gathering tool can have, fixed or random, with its numbers worked out at gear score 700'+App.unsure("Perk values use the game’s own scaling formula at gear score 700. Tooltips in game may differ slightly, and values change with gear score.")+'.</p>'+App.gearNav("gear/perks");
      h+='<div class="wfilters"><input type="search" id="pq" placeholder="Search perks, e.g. yield or luck" value="'+esc(q)+'" aria-label="Search perks">'+
        '<div class="chips" role="radiogroup" aria-label="Skill"><label><input type="radio" name="on" value=""'+(on?'':' checked')+'><span>All</span></label>'+SKILLS.map(function(s){return '<label><input type="radio" name="on" value="'+s+'"'+(on===s?' checked':'')+'><span>'+s+'</span></label>'}).join("")+'</div>'+
        '<span class="muted">'+list.length+' of '+G.toolPerks.length+'</span></div>';
      h+='<div class="plist">'+list.map(function(p){
        return '<div class="pk"><b>'+esc(p[1])+'</b><p>'+esc(p[2])+'</p><div class="on">'+p[4].map(function(s){return '<span class="b plain" style="color:'+App.SKILL_COL[s]+'">'+esc(s)+'</span>'}).join("")+'</div></div>';
      }).join("")+'</div>';
      if(!list.length)h+='<p class="empty">No perk matches that search.</p>';
      root.innerHTML=h;
    }
    draw();
    root.addEventListener("input",function(e){if(e.target.id==="pq"){q=e.target.value.trim().toLowerCase();draw();var i=root.querySelector("#pq");i.focus();i.setSelectionRange(i.value.length,i.value.length)}});
    root.addEventListener("change",function(e){if(e.target.name==="on"){on=e.target.value;draw();var c=root.querySelector('input[name="on"]:checked');if(c)c.focus()}});
  }).catch(function(e){root.innerHTML='<h1>Tool perks</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
