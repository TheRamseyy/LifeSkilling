// Gather > Run planner: which nodes to visit for everything on the craft list, fewest stops first.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt,nm=App.nm,S=App.state;
var SKILLS=["Mining","Logging","Harvesting","Skinning"];// the gathering data has no fishing spots

App.page("gather/runs",{title:"Gathering run planner",needsData:true,render:function(root){
  var D=App.data;
  S.levels=S.levels||{};
  function draw(){
    var list=S.list.filter(function(e){return D.byOut[e.id]||D.N[e.id]});
    var h='<h1>Plan a gathering run</h1>';
    if(!list.length){root.innerHTML=h+'<p class="sub">The planner works from your craft list, and it is empty.</p><p><a class="btn" href="#/craft/calculator">Add something in the calculator</a></p>';return}
    var c=NWCalc.expand(list,{byOut:D.byOut,cats:D.C,buy:S.buy,pick:S.pick}),needs={};
    Object.keys(c.raw).forEach(function(id){if(!D.byOut[id])needs[id]=c.raw[id]});
    var r=NWPlan.plan(needs,D.G,S.levels),covered=r.stops.reduce(function(n,s){return n+s.covers.length},0);

    h+='<p class="sub">For your craft list: '+list.map(function(e){return esc(nm(e.id))+' ×'+fmt(e.qty)}).join(", ")+'. <a href="#/craft/calculator">Change it in the calculator</a>.</p>';
    h+='<div class="runs"><div class="col1">';
    h+='<section class="card glass" aria-labelledby="h-lv"><h2 id="h-lv">Your gathering levels</h2><p class="muted" style="margin:0 0 10px">Leave a box empty to see every node. With a level set, nodes above it are left out.</p><div class="lvls">'+
      SKILLS.map(function(s){var v=S.levels[s];return '<label><span>'+s+'</span><input type="number" min="0" max="250" inputmode="numeric" data-skill="'+s+'" value="'+(v==null?"":esc(v))+'" placeholder="any"></label>'}).join("")+'</div></section>';
    h+='<section class="card glass sum" aria-label="Summary"><b class="big">'+r.stops.length+'</b><span>'+(r.stops.length===1?'stop covers ':'stops cover ')+covered+' of '+Object.keys(needs).length+' materials</span>'+
      (r.missing.length?'<span class="muted">'+r.missing.length+' to get another way</span>':'')+'</section>';
    var cats=Object.keys(c.cat);
    if(cats.length)h+='<section class="card glass"><h2>Not planned yet</h2><p class="muted" style="margin:0">Choose which item you will use for '+cats.map(function(id){return '"any '+esc(nm(id))+'"'}).join(", ")+' under Flexible materials in the <a href="#/craft/calculator">calculator</a>, and it will be added here.</p></section>';
    h+='</div><div>';

    // The route, grouped by skill
    var n=0;
    SKILLS.concat(["Fishing"]).forEach(function(skill){
      var st=r.stops.filter(function(s){return s.skill===skill});if(!st.length)return;
      var top=Math.max.apply(null,st.map(function(s){return s.level}));
      h+='<section class="card" aria-labelledby="h-'+skill+'"><h2 id="h-'+skill+'">'+skill+' <span class="muted" style="font:400 .9rem var(--body)">'+st.length+' stop'+(st.length>1?'s':'')+', up to level '+top+'</span><span class="act"><a class="b craft" href="#/gather/gear/'+skill.toLowerCase()+'">'+skill+' gear</a></span></h2><ol class="trail">';
      st.forEach(function(s){
        n++;
        h+='<li class="stop"><span class="no">'+n+'</span><div><div class="st-h"><b>'+esc(s.name)+'</b>'+(s.sizes.length>1?' <span class="muted">'+esc(s.sizes.join(", "))+'</span>':'')+'<span class="b plain">level '+s.level+'</span></div>'+
          '<div class="mats">'+s.covers.map(function(id){return '<a class="mat" href="#/item/'+encodeURIComponent(id)+'">'+esc(nm(id))+' <b>×'+fmt(needs[id])+'</b></a>'}).join("")+'</div>'+
          (s.extra.length?'<p class="muted">Can also drop '+s.extra.map(function(id){return esc(nm(id))}).join(", ")+', planned at another stop.</p>':'')+
          '<p class="muted">Takes '+App.dur(s.gather)+' to gather, respawns in '+App.dur(s.respMin,1)+'–'+App.dur(s.respMax)+'.</p></div></li>';
      });
      h+='</ol></section>';
    });
    if(!r.stops.length)h+='<section class="card"><p class="empty">Nothing on this list can be gathered'+(Object.keys(S.levels).length?' at your levels':'')+'.</p></section>';

    if(r.missing.length){
      h+='<section class="card" aria-labelledby="h-miss"><h2 id="h-miss">Get these another way</h2>'+r.missing.map(function(m){
        return '<div class="item"><span class="n">'+App.itemLink(m.id)+'<div class="muted">'+(m.reason==="level"?'Needs '+esc(m.skill)+' level '+m.level+'. Your level is '+esc(S.levels[m.skill])+'.':'No gathering node drops this. Likely a creature drop, chest, vendor, salvage or event item.')+'</div></span><span class="c">'+fmt(m.qty)+'</span></div>';
      }).join("")+'</section>';
    }
    h+='<p class="note">Each stop is a kind of node that <i>can drop</i> the materials listed'+App.unsure("Some low-level nodes list rarer drops that may only appear at a higher skill level.")+'. The game files have no drop chances or amounts, so the planner cannot say how many nodes you need. Visit several of the same kind in one area, and loop back as they respawn.</p>';
    h+='</div></div>';
    root.innerHTML=h;
  }
  draw();
  root.addEventListener("change",function(e){
    var s=e.target.dataset&&e.target.dataset.skill;if(!s)return;
    var v=e.target.value.trim();
    if(v==="")delete S.levels[s];else S.levels[s]=Math.max(0,Math.min(250,parseInt(v,10)||0));
    App.save();draw();
    var el=root.querySelector('[data-skill="'+s+'"]');if(el)el.focus();
  });
}});
})();
