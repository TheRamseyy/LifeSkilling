// Gear > Attributes: set your five attributes with sliders, like the in-game screen, and see every bonus you
// unlock, gathering and crafting first. Milestones and per-point values come from the game files.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,S=App.state;
var KEYS=["Str","Dex","Int","Foc","Con"];
var MILES=[25,50,100,150,200,250,300,350];
// words that mark a gathering or crafting effect in a milestone bonus
var TRADE=/mining|logging|harvest|skinning|fishing|fish|gather|craft|refin|azoth|encumbrance|carry|weight|ore|tree|prey/i;
var DERIVED={Health:"Health",Mana:"Mana",Stamina:"Stamina",EquipLoad:"Equip load",Encumbrance:"Carry weight"};

function bonusLines(t){return t.split("\n").map(function(l){return l.replace(/^\s*•\s*/,"").trim()}).filter(Boolean)}
// "+10% mining speed" -> {n:10, unit:"%", key:"mining speed"} so equal effects from several milestones add up
function parse(l){
  var m=/^([+-]?)(\d+(?:\.\d+)?)(%?)\s+(.*)$/.exec(l);
  if(!m)return null;
  return {n:(m[1]==="-"?-1:1)*parseFloat(m[2]),unit:m[3],sign:m[1]||"",key:m[4].replace(/\.$/,"").toLowerCase()};
}
function mark(l){return TRADE.test(l)?'<mark class="ts">'+esc(l)+'</mark>':esc(l)}

App.page("gear/attributes",{title:"Attributes",render:function(root){
  root.innerHTML='<h1>Attributes</h1><p class="loading">Loading…</p>';
  App.loadJSON("weapons.json").then(function(W){
    KEYS.forEach(function(k){if(S.attrs[k]==null)S.attrs[k]=5});
    var A={};KEYS.forEach(function(k){A[k]=W.attrs[App.ATTR[k][0]]});
    function max(k){return A[k].lv0+A[k].per.length-1}

    var h='<h1>Attributes</h1><p class="sub">Set your attributes like on the in-game screen, including points from gear. Every milestone you reach lights up, and the panel adds up what they give you. Gathering tools do not scale with attributes; attributes help gathering and crafting through these milestone bonuses.</p>'+App.gearNav("gear/attributes");
    h+='<div class="attr-layout"><section class="card glass attr-panel" aria-labelledby="h-set"><h2 id="h-set">Your attributes <span class="act"><button class="sm" type="button" id="reset">Reset to '+A.Str.lv0+'</button></span></h2>';
    h+=KEYS.map(function(k){
      var col=App.ATTR[k][1],a=A[k],mx=max(k);
      var ticks=MILES.map(function(m){return '<span class="tick" data-m="'+m+'" style="left:'+((m-a.lv0)/(mx-a.lv0)*100)+'%" title="'+m+'"></span>'}).join("");
      return '<div class="arow" style="--a:'+col+'" data-row="'+k+'">'+
        '<div class="ahead"><b>'+App.ATTR[k][0]+'</b><span class="muted" data-info="'+k+'"></span></div>'+
        '<div class="actl"><button type="button" class="sm step" data-step="-1" data-k="'+k+'" aria-label="One less '+App.ATTR[k][0]+'">−</button>'+
        '<div class="slider"><div class="track"><div class="fill" data-fill="'+k+'"></div>'+ticks+'</div>'+
        '<input type="range" min="'+a.lv0+'" max="'+mx+'" step="1" value="'+S.attrs[k]+'" data-k="'+k+'" aria-label="'+App.ATTR[k][0]+'"></div>'+
        '<button type="button" class="sm step" data-step="1" data-k="'+k+'" aria-label="One more '+App.ATTR[k][0]+'">+</button>'+
        '<input type="number" class="anum" min="'+a.lv0+'" max="'+mx+'" value="'+S.attrs[k]+'" data-num="'+k+'" aria-label="'+App.ATTR[k][0]+' value"></div>'+
        '<div class="anext" data-next="'+k+'"></div></div>';
    }).join("");
    h+='<p class="muted" data-total></p></section>';
    h+='<section class="card attr-sum" aria-labelledby="h-sum" aria-live="polite"><h2 id="h-sum">What you get</h2><div id="sum"></div></section></div>';
    h+='<section class="card" aria-labelledby="h-all"><h2 id="h-all">Every milestone</h2><div class="attrs" id="all"></div><p class="note">Milestone bonuses are read from the game\'s attribute ability table. Each attribute starts at '+A.Str.lv0+'.</p></section>';
    root.innerHTML=h;

    function sum(list){
      // add up equal effects (e.g. +10% and +20% mining speed = +30% mining speed)
      var groups={},order=[],rest=[];
      list.forEach(function(u){var p=parse(u.l);if(!p){rest.push(u);return}var key=p.key+"|"+p.unit,g=groups[key];if(!g){g=groups[key]={p:p,n:0,from:[]};order.push(g)}g.n+=p.n;g.from.push(App.ATTR[u.k][0].slice(0,3)+" "+u.m)});
      return order.map(function(g){var v=Math.round(g.n*100)/100;return '<li><b>'+(v>0&&g.p.sign!==""?"+":"")+fmt(v)+g.p.unit+'</b> '+esc(g.p.key)+' <span class="muted">('+g.from.join(", ")+')</span></li>'}).join("")+
        rest.map(function(u){return '<li>'+esc(u.l)+' <span class="muted">('+App.ATTR[u.k][0].slice(0,3)+' '+u.m+')</span></li>'}).join("");
    }
    function update(){
      var spent=0,unlocked=[];
      KEYS.forEach(function(k){
        var v=+S.attrs[k],a=A[k],mx=max(k),i=Math.max(0,Math.min(a.per.length-1,v-a.lv0));
        spent+=v-a.lv0;
        root.querySelector('[data-fill="'+k+'"]').style.width=((v-a.lv0)/(mx-a.lv0)*100)+"%";
        root.querySelectorAll('[data-row="'+k+'"] .tick').forEach(function(t){t.classList.toggle("on",v>=+t.dataset.m)});
        var r=root.querySelector('input[type=range][data-k="'+k+'"]');if(+r.value!==v)r.value=v;
        var n=root.querySelector('[data-num="'+k+'"]');if(document.activeElement!==n)n.value=v;
        var got=a.bonus.filter(function(b){return v>=b[0]});
        root.querySelector('[data-info="'+k+'"]').textContent=got.length+" of "+a.bonus.length+" milestones, next point worth "+a.per[i];
        var nx=a.bonus.filter(function(b){return v<b[0]})[0];
        root.querySelector('[data-next="'+k+'"]').innerHTML=nx?'Next at <b>'+nx[0]+'</b> ('+(nx[0]-v)+' more): '+bonusLines(nx[1]).map(mark).join(", "):'<span class="muted">Every milestone reached.</span>';
        got.forEach(function(b){bonusLines(b[1]).forEach(function(l){unlocked.push({k:k,m:b[0],l:l})})});
      });
      root.querySelector("[data-total]").textContent="Points above the starting "+A.Str.lv0+" in each: "+fmt(spent)+".";
      var trade=unlocked.filter(function(u){return TRADE.test(u.l)}),other=unlocked.filter(function(u){return !TRADE.test(u.l)});
      var der=[];KEYS.forEach(function(k){var a=A[k],i=Math.max(0,Math.min(a.per.length-1,+S.attrs[k]-a.lv0));Object.keys(a.derived).forEach(function(c){der.push('<li><b>+'+fmt(Math.round(a.derived[c][i]))+'</b> '+esc((DERIVED[c]||c).toLowerCase())+' <span class="muted">(from '+App.ATTR[k][0]+')</span></li>')})});
      root.querySelector("#sum").innerHTML=
        '<h3 class="slot-h">Gathering and crafting</h3>'+(trade.length?'<ul class="sumlist trade">'+sum(trade)+'</ul>':'<p class="muted">Nothing yet. The first gathering bonus comes at 25 in any attribute.</p>')+
        (der.length?'<h3 class="slot-h">Stats</h3><ul class="sumlist">'+der.join("")+'</ul>':'')+
        '<details class="more"><summary>Combat and other bonuses ('+other.length+')</summary>'+(other.length?'<ul class="sumlist">'+sum(other)+'</ul>':'<p class="muted">None yet.</p>')+'</details>';
      root.querySelector("#all").innerHTML=KEYS.map(function(k){
        var a=A[k],v=+S.attrs[k];
        return '<article class="acard" style="--a:'+App.ATTR[k][1]+'"><h3>'+App.ATTR[k][0]+' <span class="muted" style="font:400 .85rem var(--body)">'+v+'</span></h3><ol>'+a.bonus.map(function(b){
          return '<li class="'+(v>=b[0]?'got':'not')+'"><b>'+b[0]+'</b><span>'+bonusLines(b[1]).map(mark).join("\n")+'</span></li>';
        }).join("")+'</ol></article>';
      }).join("");
    }
    function set(k,v){var a=A[k];S.attrs[k]=Math.max(a.lv0,Math.min(max(k),Math.round(+v)||a.lv0));App.save();update()}
    update();
    root.addEventListener("input",function(e){var t=e.target;if(t.type==="range"&&t.dataset.k)set(t.dataset.k,t.value)});
    root.addEventListener("change",function(e){var t=e.target;if(t.dataset&&t.dataset.num)set(t.dataset.num,t.value)});
    root.addEventListener("click",function(e){
      var b=e.target.closest("[data-step]");if(b)set(b.dataset.k,+S.attrs[b.dataset.k]+(+b.dataset.step));
      if(e.target.id==="reset")KEYS.forEach(function(k){set(k,A[k].lv0)});
    });
  }).catch(function(e){root.innerHTML='<h1>Attributes</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
