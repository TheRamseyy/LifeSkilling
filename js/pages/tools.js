// Gear > Tools: every gathering tool type side by side, and a comparison of any three tools.
(function(){
"use strict";
var esc=App.esc;
var TYPES=[["Mining","Pickaxe"],["Logging","Logging axe"],["Harvesting","Sickle"],["Skinning","Skinning knife"],["Fishing","Fishing pole"]];
var picked=(App.state.cmp&&App.state.cmp.length===3)?App.state.cmp.slice():["","",""];// tools chosen for comparison (saved)
function save(){App.state.cmp=picked.slice();App.save()}
function top3(tools){return tools.slice().sort(function(a,b){return b.sp-a.sp||b.pk.length-a.pk.length||b.gs-a.gs}).slice(0,3)}
function skillOf(G,id){for(var i=0;i<TYPES.length;i++){if(G.skills[TYPES[i][0]].tools.some(function(t){return t.id===id}))return TYPES[i][0]}return null}
function find(G,id){var s=skillOf(G,id);return s?G.skills[s].tools.filter(function(t){return t.id===id})[0]:null}

// Compare up to three tools: slots, quick presets, bar rows with the winner marked, and a perk-by-perk grid
function compareHtml(G){
  var h='<section class="card cmpbox" aria-labelledby="h-cmp" style="margin-top:28px"><h2 id="h-cmp">Compare tools</h2>';
  h+='<div class="presets"><span class="muted">Quick picks:</span>'+TYPES.map(function(T){var c=App.SKILL_COL[T[0]];return '<span class="pgroup" style="--a:'+c+'"><b>'+esc(T[1])+'</b><button type="button" class="sm" data-preset="ladder" data-skill="'+T[0]+'">Crafted T3–T5</button><button type="button" class="sm" data-preset="top" data-skill="'+T[0]+'">Top 3</button></span>'}).join("")+'</div>';
  var ts=picked.map(function(id){return id?find(G,id):null});
  h+='<div class="slots">'+ts.map(function(t,i){
    var sk=t?skillOf(G,t.id):null,col=sk?App.SKILL_COL[sk]:"var(--line2)";
    var sel='<select data-cmp="'+i+'" aria-label="Tool '+(i+1)+'"><option value="">Choose a tool…</option>'+TYPES.map(function(T){return '<optgroup label="'+esc(T[1])+'">'+G.skills[T[0]].tools.map(function(o){return '<option value="'+esc(o.id)+'"'+(t&&o.id===t.id?' selected':'')+'>'+esc(o.n)+' (T'+o.tr+', GS '+o.gs+')</option>'}).join("")+'</optgroup>'}).join("")+'</select>';
    return '<div class="slotc'+(t?'':' empty')+'" style="--a:'+col+'"><span class="sl">Tool '+(i+1)+(t?' <button type="button" class="sm clr" data-clear="'+i+'" aria-label="Remove tool '+(i+1)+'">✕</button>':'')+'</span>'+
      (t?'<b class="sn">'+App.itemLink(t.id,t.n)+'</b><span class="muted">'+esc(sk)+', T'+t.tr+', GS '+t.gs+'</span>':'<span class="muted">Empty</span>')+sel+'</div>';
  }).join("")+'</div>';
  var have=ts.filter(Boolean);
  if(!have.length)return h+'<p class="muted">Pick tools above, or use a quick pick.</p></section>';

  // number rows drawn as bars; "low" means lower is better
  function rec(t){var r=App.data.byOut[t.id]&&App.data.byOut[t.id][0];return r}
  var ROWS=[["Gathering speed",function(t){return t.sp},0,"How fast it gathers. Higher is faster."],["Gear score",function(t){return t.gs},0,"Higher makes its perks stronger."],
    ["Listed perks",function(t){return t.pk.length},0,"Perks it always comes with."],["Random perk slots",function(t){return t.rs||0},0,"Extra perks rolled when made or dropped."],
    ["Equip level",function(t){return t.lv||0},1,"Character level needed. Lower is easier."]];
  h+='<div class="cbars">'+ROWS.map(function(r){
    var vals=ts.map(function(t){return t?r[1](t):null}),nums=vals.filter(function(v){return v!=null});
    var best=r[2]?Math.min.apply(null,nums):Math.max.apply(null,nums),top=Math.max.apply(null,nums)||1,tie=nums.every(function(v){return v===nums[0]});
    return '<div class="cbar"><div class="cbl"><b>'+r[0]+'</b><span class="muted">'+r[3]+'</span></div>'+ts.map(function(t,i){
      if(!t)return '<div class="cbv empty"></div>';
      var v=vals[i],col=App.SKILL_COL[skillOf(G,t.id)];
      return '<div class="cbv'+(!tie&&v===best?' win':'')+'" style="--a:'+col+'"><i style="width:'+Math.max(3,Math.round((r[2]?(top?(top-v+1)/(top+1):1):v/top)*100))+'%"></i><b>'+(r[0]==="Equip level"&&!v?"Any":v)+'</b>'+(!tie&&v===best?'<span class="crown" title="Best">★</span>':'')+'</div>';
    }).join("")+'</div>';
  }).join("")+'</div>';
  // speed difference in plain words
  if(have.length>1&&!have.every(function(t){return t.sp===have[0].sp})){
    var f=have.slice().sort(function(a,b){return b.sp-a.sp}),slow=f[f.length-1];
    h+='<p class="note">'+esc(f[0].n)+' gathers '+Math.round((f[0].sp/slow.sp-1)*100)+'% faster than '+esc(slow.n)+', going by the speed value'+App.unsure("Speed is the game’s gathering efficiency value. That a higher value means proportionally faster gathering is the usual reading, not confirmed.")+'.</p>';
  }
  // perk grid: every perk any of them has, and which tool has it (or can roll it)
  var names=[];have.forEach(function(t){t.pk.forEach(function(p){if(names.indexOf(p[1])<0)names.push(p[1])});(t.pool||[]).forEach(function(n){if(names.indexOf(n)<0)names.push(n)})});
  if(names.length){
    h+='<h3 class="slot-h">Perks</h3><div style="overflow-x:auto"><table class="cmp pgrid"><tr><th>Perk</th>'+ts.map(function(t){return '<td>'+(t?'<b>'+esc(t.n)+'</b>':'')+'</td>'}).join("")+'</tr>'+names.map(function(n){
      return '<tr><th>'+esc(n)+'</th>'+ts.map(function(t){
        if(!t)return '<td></td>';
        var p=t.pk.filter(function(p){return p[1]===n})[0];
        if(p)return '<td class="has">✔ '+(p[3]!=null?'<b>+'+p[3]+(/%/.test(p[2])?'%':'')+'</b>':'listed')+'</td>';
        return (t.pool||[]).indexOf(n)>=0?'<td class="may">can roll</td>':'<td class="muted">—</td>';
      }).join("")+'</tr>';
    }).join("")+'</table></div><p class="note">✔ means the tool always has the perk (value at its gear score). "Can roll" means it may get it in a random perk slot.</p>';
  }
  h+='<h3 class="slot-h">How to get them</h3><div class="slots">'+ts.map(function(t){
    if(!t)return '<div></div>';var r=rec(t);
    return '<div class="muted">'+esc(t.src)+(r&&r.t?', '+esc(r.t)+' '+(r.l||0):'')+(t.bop?', bound':'')+'</div>';
  }).join("")+'</div>';
  return h+'</section>';
}

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

      h+=compareHtml(G);
      root.innerHTML=h;
    }
    draw();
    root.addEventListener("change",function(e){var i=e.target.dataset&&e.target.dataset.cmp;if(i==null)return;picked[+i]=e.target.value;save();draw();var el=root.querySelector('[data-cmp="'+i+'"]');if(el)el.focus()});
    root.addEventListener("click",function(e){
      var x=e.target.closest("[data-clear]");if(x){picked[+x.dataset.clear]="";save();draw();return}
      var p=e.target.closest("[data-preset]");if(!p)return;
      var tools=G.skills[p.dataset.skill].tools;
      picked=(p.dataset.preset==="ladder"?[3,4,5].map(function(t){var q=plain(tools,t);return q?q.id:""}):top3(tools).map(function(t){return t.id}));
      save();draw();var h2=root.querySelector("#h-cmp");if(h2)h2.scrollIntoView({block:"start"});
    });
  }).catch(function(e){root.innerHTML='<h1>Gathering tools</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
