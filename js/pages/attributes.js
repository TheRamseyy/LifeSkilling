// Gear > Attributes: what each attribute does, its milestone bonuses, and how points lose value as you add more.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,S=App.state;
var KEYS=["Str","Dex","Int","Foc","Con"];
var DERIVED={Health:"Health",Mana:"Mana",Stamina:"Stamina",HealthRate:"Health regeneration",ManaRate:"Mana regeneration",StaminaRate:"Stamina regeneration",EquipLoad:"Equip load",Encumbrance:"Carry weight",CastSpeed:"Cast speed"};

App.page("gear/attributes",{title:"Attributes",render:function(root){
  root.innerHTML='<h1>Attributes</h1><p class="loading">Loading…</p>';
  App.loadJSON("weapons.json").then(function(W){
    function draw(){
      var h='<h1>Attributes</h1><p class="sub">What Strength, Dexterity, Intelligence, Focus and Constitution do, the bonuses you unlock along the way, and how each extra point counts for a little less.</p>'+App.gearNav("gear/attributes");
      h+='<section class="card glass" aria-labelledby="h-mine"><h2 id="h-mine">Your attributes</h2><p class="muted" style="margin:-4px 0 10px">Optional. Saved in this browser and used for the damage estimate on the Weapons page.</p><div class="mine">'+
        KEYS.map(function(k){return '<label style="--a:'+App.ATTR[k][1]+'">'+App.ATTR[k][0]+'<input type="number" min="5" max="500" inputmode="numeric" data-at="'+k+'" value="'+(S.attrs[k]!=null?esc(S.attrs[k]):"")+'" placeholder="5"></label>'}).join("")+'</div></section>';

      // Diminishing returns chart
      var A=W.attrs.Strength,lv0=A.lv0,n=A.per.length,w=760,ht=220,pad=36;
      var maxV=Math.max.apply(null,KEYS.map(function(k){return Math.max.apply(null,W.attrs[App.ATTR[k][0]].per)}));
      function x(i){return pad+i/(n-1)*(w-pad*1.5)}function y(v){return ht-pad+4-(v/maxV)*(ht-pad*1.6)}
      // attributes with identical curves share one line, named in the legend
      var groups=[];KEYS.forEach(function(k){var s=JSON.stringify(W.attrs[App.ATTR[k][0]].per),g=groups.filter(function(g){return g.s===s})[0];if(g)g.k.push(k);else groups.push({s:s,k:[k]})});
      var same=groups.length===1;
      var lines=groups.map(function(g){var p=W.attrs[App.ATTR[g.k[0]][0]].per;return '<polyline fill="none" stroke="'+App.ATTR[g.k[0]][1]+'" stroke-width="2.5" points="'+p.map(function(v,i){return x(i).toFixed(1)+","+y(v).toFixed(1)}).join(" ")+'"/>'}).join("");
      var legend='<div class="legend">'+groups.map(function(g){return '<span class="at" style="--a:'+App.ATTR[g.k[0]][1]+'">'+g.k.map(function(k){return App.ATTR[k][0]}).join(", ")+'</span>'}).join("")+'</div>';
      var ticks=[5,100,200,300,400,500].map(function(L){var i=L-lv0;return i<0||i>=n?"":'<text x="'+x(i)+'" y="'+(ht-8)+'" text-anchor="middle">'+L+'</text><line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+(ht-pad+6)+'" y2="'+(ht-pad+10)+'" stroke="var(--line2)"/>'}).join("");
      h+='<section class="card" aria-labelledby="h-dim"><h2 id="h-dim">Each point counts for less</h2><p class="muted" style="margin:-4px 0 10px">How much one more point is worth at each attribute level'+(same?' (the same for all five attributes)':'')+'. From the attribute tables in the game files.</p>'+legend+
        '<svg class="chart" viewBox="0 0 '+w+' '+ht+'" role="img" aria-label="Value of each attribute point falls from '+A.per[0]+' at level '+lv0+' to '+A.per[n-1]+' at level '+(lv0+n-1)+'">'+
        '<line x1="'+pad+'" x2="'+(w-pad/2)+'" y1="'+(ht-pad+4)+'" y2="'+(ht-pad+4)+'" stroke="var(--line2)"/>'+lines+ticks+
        '<text x="'+pad+'" y="16">'+A.per[0]+' per point</text><text x="'+(w-pad/2)+'" y="'+(y(A.per[n-1])-8)+'" text-anchor="end">'+A.per[n-1]+' per point</text></svg>'+
        '<p class="note">At level '+lv0+' a point is worth '+A.per[0]+'; by level '+(lv0+n-1)+' it is worth '+A.per[n-1]+'. Using this as the "effective points" behind damage scaling is how the estimate works'+App.unsure("The tables give these values; that they feed weapon scaling this way is the common reading, not confirmed.")+'.</p></section>';

      // One card per attribute
      h+='<div class="attrs">'+KEYS.map(function(k){
        var name=App.ATTR[k][0],a=W.attrs[name],col=App.ATTR[k][1];
        var main=W.types.filter(function(t){return t.main[0]===k}).map(function(t){return t.n}),sec=W.types.filter(function(t){return t.second[0]===k}).map(function(t){return t.n});
        var mine=+S.attrs[k],i=mine?Math.max(0,Math.min(a.sum.length-1,mine-a.lv0)):null;
        var der=Object.keys(a.derived).map(function(c){var v=a.derived[c];return '<p class="muted" style="margin:4px 0">'+esc(DERIVED[c]||c)+': +'+fmt(v[1]-v[0])+' per point'+(i!=null?', <b style="color:var(--mist)">'+fmt(Math.round(v[i]))+'</b> at your '+mine:'')+'</p>'}).join("");
        return '<article class="acard" style="--a:'+col+'"><h3>'+esc(name)+'</h3>'+
          (main.length?'<p class="muted" style="margin:0">Main attribute for: '+main.map(esc).join(", ")+'</p>':'')+
          (sec.length?'<p class="muted" style="margin:4px 0 0">Second attribute for: '+sec.map(esc).join(", ")+'</p>':'')+der+
          (i!=null?'<p style="margin:8px 0 0">At '+mine+': <b>'+fmt(Math.round(a.sum[i]))+'</b> effective points'+App.unsure("Running total from the attribute table; how the game uses it is not confirmed.")+'</p>':'')+
          '<ol>'+a.bonus.map(function(b){return '<li'+(mine&&mine>=b[0]?' style="opacity:1"':mine?' style="opacity:.55"':'')+'><b>'+b[0]+'</b><span>'+esc(b[1].replace(/^\s*•\s*/,"").replace(/\s*\n\s*•\s*/g,"\n"))+'</span></li>'}).join("")+'</ol></article>';
      }).join("")+'</div>';
      h+='<p class="note">Milestone bonuses are read from the game\'s attribute ability table. Bonuses you have reached are shown brighter once you type your attributes.</p>';
      root.innerHTML=h;
    }
    draw();
    root.addEventListener("change",function(e){
      var k=e.target.dataset&&e.target.dataset.at;if(!k)return;
      var v=e.target.value.trim();
      if(v==="")delete S.attrs[k];else S.attrs[k]=Math.max(5,Math.min(500,parseInt(v,10)||5));
      App.save();draw();var el=root.querySelector('[data-at="'+k+'"]');if(el)el.focus();
    });
  }).catch(function(e){root.innerHTML='<h1>Attributes</h1><p class="err">Data did not load ('+esc(e.message)+'). Reload the page.</p>'});
}});
})();
