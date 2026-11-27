// Gear > Weapons: every player weapon type, its stats and attribute scaling, searchable and comparable.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,S=App.state;
var ATTRS=["Str","Dex","Int","Foc","Con"];
var picked=[];// weapons ticked for comparison (kept while you stay on the site)

function at(a){return '<span class="at" style="--a:'+App.ATTR[a][1]+'">'+App.ATTR[a][0]+'</span>'}
function top(t){return t.tiers[t.tiers.length-1]}
// Attribute bonus estimate: scaling per point x effective points (after diminishing returns). Not confirmed.
function estimate(t,W){
  var sc=top(t).sc,total=0,any=false;
  ATTRS.forEach(function(a){
    var v=+S.attrs[a];if(!v||!sc[a])return;any=true;
    var A=W.attrs[App.ATTR[a][0]],i=Math.max(0,Math.min(A.sum.length-1,v-A.lv0));
    total+=sc[a]*A.sum[i];
  });
  return any?Math.round(total*100):null;
}

App.page("gear/weapons",{title:"Weapons",needsData:false,render:function(root){
  root.innerHTML='<h1>Weapons</h1><p class="loading">Loading weapon data…</p>';
  App.loadJSON("weapons.json").then(function(W){
    var q="",hand="all";
    function draw(){
      var max={dmg:0,crit:0,stg:0,blk:0};
      W.types.forEach(function(t){var x=top(t);Object.keys(max).forEach(function(k){max[k]=Math.max(max[k],x[k])})});
      var list=W.types.filter(function(t){
        var x=top(t),txt=(t.n+" "+t.main.concat(t.second).map(function(a){return App.ATTR[a][0]}).join(" ")).toLowerCase();
        return (!q||txt.indexOf(q)>=0)&&(hand==="all"||(hand==="2"?x.two:!x.two));
      });
      var h='<h1>Weapons</h1><p class="sub">Every weapon type with its base stats and which attributes raise its damage. Numbers are from the game files; how they combine into the damage you see in game is '+'not fully known'+App.unsure("The game files give base damage and scaling factors, but no source confirms exactly how gear score, attributes and other bonuses combine into the final damage number.")+'.</p>';
      h+=nav("gear/weapons");
      h+='<details class="guide card glass"><summary><h2>How to read this page</h2></summary><dl>'+
        '<dt>Base damage</dt><dd>The weapon\'s damage before gear score and attributes. It is the same at every tier in the files; gear score is what makes higher items hit harder.</dd>'+
        '<dt>Scaling</dt><dd>Which attributes raise the damage, and by how much per point. The first is the main attribute. Shown as the game value, for example 0.0085 per point of Strength.</dd>'+
        '<dt>Crit</dt><dd>Chance of a critical hit, and how much more a critical hit does.</dd>'+
        '<dt>Stagger</dt><dd>How hard it knocks the target\'s stamina when it is blocking.</dd>'+
        '<dt>Block</dt><dd>Stamina it costs an attacker when you block with it, and its block stability.</dd>'+
        '<dt>Estimate</dt><dd>Type your attributes on the Attributes page to see a rough damage bonus on each weapon. It is an estimate'+App.unsure("Worked out as scaling per point times your effective attribute points from the attribute tables. The real in-game formula is not confirmed.")+'.</dd>'+
      '</dl></details>';
      h+='<div class="wfilters"><input type="search" id="wq" placeholder="Search a weapon or attribute, e.g. Dexterity" value="'+esc(q)+'" aria-label="Search weapons">'+
        '<div class="chips" role="radiogroup" aria-label="Hands">'+[["all","All"],["1","One-handed"],["2","Two-handed"]].map(function(o){return '<label><input type="radio" name="hand" value="'+o[0]+'"'+(hand===o[0]?' checked':'')+'><span>'+o[1]+'</span></label>'}).join("")+'</div></div>';
      h+='<div class="wgrid">'+list.map(function(t){
        var x=top(t),a=App.ATTR[t.main[0]][1],est=estimate(t,W);
        return '<article class="wcard'+(picked.indexOf(t.cls)>=0?' picked':'')+'" style="--a:'+a+'"><label class="cmp"><input type="checkbox" data-cmp="'+esc(t.cls)+'"'+(picked.indexOf(t.cls)>=0?' checked':'')+'> Compare</label>'+
          '<h3>'+esc(t.n)+'</h3><span class="hands">'+(x.two?'Two-handed':'One-handed')+'</span>'+
          '<div class="ats">'+t.main.map(at).join("")+t.second.map(at).join("")+'</div>'+
          '<div class="bars">'+bar("Base damage",x.dmg,max.dmg)+bar("Crit chance",x.crit,max.crit,Math.round(x.crit*100)+'%')+bar("Stagger",x.stg,max.stg)+bar("Block cost",x.blk,max.blk)+'</div>'+
          '<p class="est">Scaling '+ATTRS.filter(function(k){return x.sc[k]}).map(function(k){return App.ATTR[k][0]+' '+x.sc[k]}).join(", ")+'.'+(est!=null?'<br>With your attributes: about <b>+'+fmt(est)+'%</b> damage'+App.unsure("Estimate from the attribute tables; the real formula is not confirmed."):'')+'</p>'+
          '<p class="est">Crafted: '+t.tiers.map(function(r){return App.itemLink(r.id,r.n)}).join(", ")+'</p></article>';
      }).join("")+'</div>';
      if(!list.length)h+='<p class="empty">No weapon matches that search.</p>';
      if(picked.length)h+='<div class="cmpbar"><b>Comparing '+picked.length+'</b> <span class="muted">(up to 3)</span><button type="button" class="sm" id="docmp">Show comparison</button><button type="button" class="sm" id="clrcmp">Clear</button></div><div id="cmpout"></div>';
      root.innerHTML=h;
    }
    function compare(){
      var ts=picked.map(function(c){return W.types.filter(function(t){return t.cls===c})[0]}).filter(Boolean);
      var rows=[["Hands",function(x){return x.two?"Two":"One"}],["Base damage","dmg"],["Crit chance",function(x){return Math.round(x.crit*100)+"%"},"crit"],["Crit damage",function(x){return "×"+x.critx},"critx"],["Stagger","stg"],["Block cost","blk"],["Block stability","stab"],["Accuracy","acc"],["Weight","wt"]];
      ATTRS.forEach(function(a){rows.push([App.ATTR[a][0]+" scaling",function(x){return x.sc[a]||"–"},null,function(x){return x.sc[a]||0}])});
      var h='<section class="card" style="margin-top:16px"><h2>Comparison</h2><div style="overflow-x:auto"><table class="cmp"><tr><th></th>'+ts.map(function(t){return '<td><b>'+esc(t.n)+'</b></td>'}).join("")+'</tr>'+
        rows.map(function(r){
          var get=function(t){var x=top(t);return typeof r[1]==="function"?r[1](x):x[r[1]]},num=function(t){var x=top(t);return r[3]?r[3](x):typeof r[1]==="string"?x[r[1]]:r[2]?x[r[2]]:null};
          var vals=ts.map(num),best=vals.every(function(v){return typeof v==="number"})?Math.max.apply(null,vals):null;
          return '<tr><th>'+esc(r[0])+'</th>'+ts.map(function(t,i){return '<td'+(best!=null&&vals[i]===best&&ts.length>1&&best>0?' class="best"':'')+'>'+esc(get(t))+'</td>'}).join("")+'</tr>';
        }).join("")+'</table></div><p class="note">Highest value in each row is highlighted. For weight and block cost, higher is not always better.</p></section>';
      root.querySelector("#cmpout").innerHTML=h;
    }
    draw();
    root.addEventListener("input",function(e){if(e.target.id==="wq"){q=e.target.value.trim().toLowerCase();draw();var i=root.querySelector("#wq");i.focus();i.setSelectionRange(i.value.length,i.value.length)}});
    root.addEventListener("change",function(e){
      if(e.target.name==="hand"){hand=e.target.value;draw();return}
      var c=e.target.dataset&&e.target.dataset.cmp;if(!c)return;
      if(e.target.checked){if(picked.length>=3)picked.shift();picked.push(c)}else picked=picked.filter(function(x){return x!==c});
      draw();var el=root.querySelector('[data-cmp="'+c+'"]');if(el)el.focus();
    });
    root.addEventListener("click",function(e){
      if(e.target.id==="docmp")compare();
      if(e.target.id==="clrcmp"){picked=[];draw()}
    });
  }).catch(function(e){root.innerHTML='<h1>Weapons</h1><p class="err">Weapon data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});

function bar(label,v,max,shown){return '<span>'+label+'</span><i style="width:'+Math.max(4,Math.round(v/max*100))+'%"></i><b>'+(shown||v)+'</b>'}
// Tabs shared by the three Gear pages
function nav(cur){
  return '<nav class="seg" aria-label="Gear pages">'+[["gear/weapons","Weapons"],["gear/attributes","Attributes"],["gear/perks","Weapon perks"]].map(function(p){return '<a href="#/'+p[0]+'"'+(p[0]===cur?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join("")+'</nav>';
}
App.gearNav=nav;
})();
