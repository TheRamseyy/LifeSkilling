// Gear > Tools: every gathering tool type side by side, and a comparison of any three tools.
(function(){
"use strict";
var esc=App.esc;
var TYPES=[["Mining","Pickaxe"],["Logging","Logging axe"],["Harvesting","Sickle"],["Skinning","Skinning knife"],["Fishing","Fishing pole"]];
var picked=["","",""];// tools chosen for comparison

// Tabs shared by the Gear pages
App.gearNav=function(cur){
  return '<nav class="seg" aria-label="Gear pages">'+[["gear/tools","Tools"],["gear/attributes","Attributes"],["gear/perks","Tool perks"]].map(function(p){return '<a href="#/'+p[0]+'"'+(p[0]===cur?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join("")+'</nav>';
};
// old links to the weapons page land here
App.page("gear/weapons",{title:"Tools",render:function(){location.replace("#/gear/tools")}});

function plain(tools,tier){return tools.filter(function(t){return t.tr===tier&&t.src==="Crafted"&&!t.pk.length}).sort(function(a,b){return a.gs-b.gs})[0]}
function perkList(t){return (t.pk||[]).map(function(p){return esc(p[1])+(p[3]!=null?' <b>+'+p[3]+(/%/.test(p[2])?'%':'')+'</b>':'')}).join("<br>")+(t.rs?(t.pk.length?'<br>':'')+'<span class="muted">'+t.rs+' random perk'+(t.rs>1?'s':'')+'</span>':'')||'<span class="muted">None</span>'}

App.page("gear/tools",{title:"Gathering tools",needsData:true,render:function(root){
  root.innerHTML='<h1>Gathering tools</h1><p class="loading">Loading…</p>';
  App.loadJSON("gear.json").then(function(G){
    function draw(){
      var h='<h1>Gathering tools</h1><p class="sub">Pickaxes, logging axes, sickles, skinning knives and fishing poles. Tools do not scale with your attributes: how fast they gather comes from the tool itself, and their perks get stronger with gear score.</p>'+App.gearNav("gear/tools");
      h+='<div class="tgrid">'+TYPES.map(function(T){
        var skill=T[0],tools=G.skills[skill].tools,fish=skill==="Fishing",col=App.SKILL_COL[skill];
        var ladder=[1,2,3,4,5].map(function(t){return plain(tools,t)}).filter(Boolean),max=Math.max.apply(null,tools.map(function(t){return t.sp}))||1;
        var best=tools.slice().sort(function(a,b){return b.sp-a.sp||b.pk.length-a.pk.length||b.gs-a.gs})[0];
        return '<article class="tcard" style="--a:'+col+'"><h3>'+esc(T[1])+'</h3><span class="hands">For '+esc(skill.toLowerCase())+', '+tools.length+' in the files</span>'+
          '<table class="tl"><tr><th>Crafted tool</th>'+(fish?'':'<th>Speed</th>')+'<th>GS</th><th>Level</th><th>Make with</th></tr>'+
          ladder.map(function(t){var r=App.data.byOut[t.id]&&App.data.byOut[t.id][0];return '<tr><td>'+App.itemLink(t.id,t.n)+'</td>'+(fish?'':'<td><span class="spd"><i style="width:'+Math.round(t.sp/max*60)+'px"></i><b>'+t.sp+'</b></span></td>')+'<td>'+t.gs+'</td><td>'+(t.lv||'Any')+'</td><td class="muted">'+(r&&r.t?esc(r.t)+' '+(r.l||0):'')+'</td></tr>'}).join("")+'</table>'+
          (best?'<p class="est">Best in the files: <b>'+App.itemLink(best.id,best.n)+'</b>'+(fish?'':' (speed '+best.sp+')')+', GS '+best.gs+'.</p>':'')+
          '<p class="est"><a href="#/gather/gear/'+skill.toLowerCase()+'">'+esc(skill)+' gear by level</a></p></article>';
      }).join("")+'</div>';

      // Compare any three tools
      var all=[];TYPES.forEach(function(T){G.skills[T[0]].tools.forEach(function(t){all.push([T,t])})});
      h+='<section class="card" aria-labelledby="h-cmp" style="margin-top:28px"><h2 id="h-cmp">Compare tools</h2><div class="row">'+picked.map(function(v,i){
        return '<select data-cmp="'+i+'" aria-label="Tool '+(i+1)+'"><option value="">Choose a tool…</option>'+TYPES.map(function(T){return '<optgroup label="'+esc(T[1])+'">'+G.skills[T[0]].tools.map(function(t){return '<option value="'+esc(t.id)+'"'+(t.id===v?' selected':'')+'>'+esc(t.n)+' (T'+t.tr+', GS '+t.gs+')</option>'}).join("")+'</optgroup>'}).join("")+'</select>';
      }).join("")+'</div>';
      var ts=picked.map(function(id){var m=all.filter(function(x){return x[1].id===id})[0];return m&&m[1]}).filter(Boolean);
      if(ts.length){
        var rows=[["Speed",function(t){return t.sp},1],["Tier",function(t){return "T"+t.tr}],["Gear score",function(t){return t.gs},1],["Equip level",function(t){return t.lv||"Any"}],["Perks",perkList],["How to get it",function(t){var r=App.data.byOut[t.id]&&App.data.byOut[t.id][0];return esc(t.src)+(r&&r.t?' ('+esc(r.t)+' '+(r.l||0)+')':'')+(t.bop?', bound':'')}]];
        h+='<div style="overflow-x:auto;margin-top:12px"><table class="cmp"><tr><th></th>'+ts.map(function(t){return '<td><b>'+App.itemLink(t.id,t.n)+'</b></td>'}).join("")+'</tr>'+rows.map(function(r){
          var vals=ts.map(r[1]),best=r[2]?Math.max.apply(null,vals):null;
          return '<tr><th>'+r[0]+'</th>'+vals.map(function(v){return '<td'+(best!=null&&v===best&&ts.length>1?' class="best"':'')+'>'+v+'</td>'}).join("")+'</tr>';
        }).join("")+'</table></div>';
      }else h+='<p class="muted" style="margin-top:10px">Choose up to three tools to see them side by side.</p>';
      h+='</section>';
      root.innerHTML=h;
    }
    draw();
    root.addEventListener("change",function(e){var i=e.target.dataset&&e.target.dataset.cmp;if(i==null)return;picked[+i]=e.target.value;draw();root.querySelector('[data-cmp="'+i+'"]').focus()});
  }).catch(function(e){root.innerHTML='<h1>Gathering tools</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
