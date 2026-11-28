// Crafting plan: the breakdown as steps you do in order, top to bottom, with no connecting lines.
// Step 1 is everything to gather or buy, grouped by where it comes from. Each later step lists the crafts
// you can do once the earlier steps are done; each card says what it makes, how many crafts, where, and what
// it needs. Hover or tab to a "needs" chip to light up the card or material it comes from.
// Follows whatever route the calculator worked out (cheapest "any" items, bought-instead-of-crafted).
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt;
var GATHER=["Mining","Logging","Harvesting","Skinning","Fishing"];

App.Flow=function(box){
  box.classList.add("plan");

  function set(c){
    var nodes={},inputs={};
    function key(n){return n.kind==="cat"?"any:"+n.id:n.kind==="cur"?"$"+n.id:n.id}
    // one entry per item, with the total each craft needs of each input
    (function walk(list){list.forEach(function(n){
      var k=key(n);
      if(!nodes[k]){
        var kind=n.kind==="craft"?"craft":n.kind;
        nodes[k]={k:k,id:n.id,kind:kind,r:n.r,via:n.via,
          qty:kind==="craft"?c.crafts[n.id].qty:kind==="cat"?c.cat[n.id]:kind==="cur"?c.cur[n.id]:c.raw[n.id]};
      }
      if(n.via&&!nodes[k].via)nodes[k].via=n.via;
      if(n.kind==="craft"){
        var ins=inputs[k]=inputs[k]||{};
        (n.kids||[]).forEach(function(ch){var q=key(ch);ins[q]=(ins[q]||0)+ch.qty});
      }
      walk(n.kids||[]);
    })})(c.tree);
    var all=Object.keys(nodes);
    if(!all.length){box.innerHTML="";return}

    // step = longest chain of crafts below an item (raw materials are step 0); what you make goes last
    var step={};
    function depth(k){if(k in step)return step[k];step[k]=0;var ins=Object.keys(inputs[k]||{});return step[k]=ins.length?1+Math.max.apply(null,ins.map(depth)):0}
    all.forEach(depth);
    var last=Math.max.apply(null,all.map(function(k){return step[k]}));
    var used={};Object.keys(inputs).forEach(function(k){Object.keys(inputs[k]).forEach(function(i){used[i]=1})});
    c.tree.forEach(function(n){var k=key(n);if(!used[k]&&nodes[k].kind==="craft")step[k]=last});

    // Step 1: gather and buy, grouped by source
    var raws=all.filter(function(k){return nodes[k].kind!=="craft"}),groups={},order=[];
    raws.forEach(function(k){
      var n=nodes[k],g;
      if(n.kind==="buy")g="Buy";
      else if(n.kind==="cur")g="Currency";
      else if(n.kind==="cat")g="Choose an item";
      else{var nd=App.nodesFor(n.id);g=nd.length?nd[0].v[1]:"Buy or find"}
      if(!groups[g]){groups[g]=[];order.push(g)}
      groups[g].push(k);
    });
    order.sort(function(a,b){var i=GATHER.indexOf(a),j=GATHER.indexOf(b);return (i<0?9:i)-(j<0?9:j)||a.localeCompare(b)});

    function chip(k,q){
      var n=nodes[k],col=n.kind==="craft"?(App.SKILL_COL[(n.r&&n.r.t)||""]||"var(--azoth)"):"var(--moss)";
      var label=n.kind==="cat"?"any "+App.nm(n.id):App.nm(n.id);
      var tag=n.kind==="craft"?'<small>step '+(step[k]+1)+'</small>':"";
      var via=n.via?'<small class="via">for any '+esc(App.nm(n.via))+'</small>':"";
      return '<span class="pchip k-'+n.kind+'" tabindex="0" data-src="'+esc(k)+'" style="--a:'+col+'"><b>'+fmt(q)+'×</b>'+esc(label)+tag+via+'</span>';
    }
    var h='<ol class="steps-plan">';
    h+='<li class="pstage"><header><span class="pnum">1</span><b>Gather and buy</b><span class="muted">'+raws.length+' material'+(raws.length>1?'s':'')+'</span></header><div class="pgroups">'+
      order.map(function(g){var col=App.SKILL_COL[g]||"var(--mute)";return '<div class="pgroup2" style="--a:'+col+'"><h4>'+esc(g)+'</h4><div class="pchips">'+groups[g].sort(function(a,b){return nodes[b].qty-nodes[a].qty}).map(function(k){
        var n=nodes[k];return '<a class="pchip big k-'+n.kind+'" data-k="'+esc(k)+'" href="#/item/'+encodeURIComponent(n.id)+'" style="--a:'+(n.kind==="buy"?"var(--lilac)":col)+'"><b>'+fmt(n.qty)+'×</b>'+esc(n.kind==="cat"?"any "+App.nm(n.id):App.nm(n.id))+(n.via?'<small class="via">for any '+esc(App.nm(n.via))+'</small>':'')+'</a>';
      }).join("")+'</div></div>'}).join("")+'</div></li>';

    for(var s=1;s<=last;s++){
      var crafts=all.filter(function(k){return nodes[k].kind==="craft"&&step[k]===s});
      if(!crafts.length)continue;
      // group the step's cards by crafting skill so one station visit covers them
      crafts.sort(function(a,b){var ta=(nodes[a].r&&nodes[a].r.t)||"",tb=(nodes[b].r&&nodes[b].r.t)||"";return ta.localeCompare(tb)||nodes[b].qty-nodes[a].qty});
      var title=s===last?"Make what you are crafting":s===1?"Refine the raw materials":"Craft step "+(s+1);
      h+='<li class="pstage"><header><span class="pnum">'+(s+1)+'</span><b>'+title+'</b><span class="muted">'+crafts.length+' craft'+(crafts.length>1?'s':'')+'</span></header><div class="pcards">'+crafts.map(function(k){
        var n=nodes[k],r=n.r,x=c.crafts[n.id],st=(r.s||[])[0],col=App.SKILL_COL[r.t]||"var(--azoth)";
        var ins=inputs[k]||{};
        return '<article class="pcard" data-k="'+esc(k)+'" style="--a:'+col+'"><div class="pc-top"><a href="#/item/'+encodeURIComponent(n.id)+'">'+esc(App.nm(n.id))+'</a><span class="pq">×'+fmt(n.qty)+'</span></div>'+
          '<div class="pc-meta">'+fmt(x.times)+' craft'+(x.times>1?'s':'')+(st?' at '+esc(NWCalc.stationLabel(st)):'')+(r.t?', '+esc(r.t)+' '+(r.l||0):'')+'</div>'+
          '<div class="pc-needs"><span class="muted">Needs</span>'+Object.keys(ins).sort(function(a,b){return step[b]-step[a]||ins[b]-ins[a]}).map(function(i){return chip(i,ins[i])}).join("")+'</div></article>';
      }).join("")+'</div></li>';
    }
    box.innerHTML=h+'</ol>';
  }

  // hover or focus a "needs" chip: light up where it comes from
  function light(k){
    box.querySelectorAll(".lit").forEach(function(e){e.classList.remove("lit")});
    if(!k)return;
    box.querySelectorAll('[data-k="'+CSS.escape(k)+'"]').forEach(function(e){e.classList.add("lit")});
  }
  box.addEventListener("mouseover",function(e){var c=e.target.closest("[data-src]");light(c&&c.dataset.src)});
  box.addEventListener("mouseleave",function(){light(null)});
  box.addEventListener("focusin",function(e){var c=e.target.closest("[data-src]");light(c&&c.dataset.src)});
  box.addEventListener("focusout",function(){light(null)});
  return {set:set};
};
})();
