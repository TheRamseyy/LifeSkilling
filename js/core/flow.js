// Recipe flow: the breakdown drawn left to right. Raw materials on the left, one column per crafting
// step, what you make on the right. Each item appears once with its total amount. Lines join an
// ingredient to what it is used in. Hover or focus a card to light up everything connected to it.
(function(){
"use strict";
var esc=App.esc,fmt=App.fmt;
var ROW=58,TOP=34;// row height, room for column titles

App.Flow=function(box){
  box.classList.add("flow");
  var edges=[],last=null,lastW=0,W=210,GAP=72;

  function set(c){
    last=c;
    var D=App.data,nodes={},kids={},seen={};
    edges=[];
    function key(n){return n.kind==="cat"?"any:"+n.id:n.kind==="cur"?"$"+n.id:n.id}
    function node(n){
      var k=key(n);
      if(!nodes[k]){
        var kind=n.kind==="craft"?"craft":n.kind,qty=kind==="craft"?c.crafts[n.id].qty:kind==="cat"?c.cat[n.id]:kind==="cur"?c.cur[n.id]:c.raw[n.id];
        nodes[k]={k:k,id:n.id,kind:kind,qty:qty,label:(kind==="cat"?"Any ":"")+App.nm(n.id),r:n.r};
        kids[k]=[];
      }
      return nodes[k];
    }
    (function walk(list){list.forEach(function(n){
      var p=node(n);
      (n.kids||[]).forEach(function(ch){
        var q=node(ch),e=q.k+">"+p.k;
        if(!seen[e]){seen[e]=1;edges.push([q.k,p.k]);kids[p.k].push(q.k)}
      });
      walk(n.kids||[]);
    })})(c.tree);
    var all=Object.keys(nodes);
    if(!all.length){box.innerHTML="";return}

    // Column = longest chain of crafts below the item; raw materials are column 0
    var col={};
    function height(k){if(k in col)return col[k];col[k]=0;var h=kids[k].length?1+Math.max.apply(null,kids[k].map(height)):0;return col[k]=h}
    all.forEach(height);
    var ncol=Math.max.apply(null,all.map(function(k){return col[k]}))+1;
    // what you craft sits in the last column, unless it is also an ingredient of something else on the list
    c.tree.forEach(function(n){var k=key(n);if(!edges.some(function(e){return e[0]===k}))col[k]=ncol-1});
    var parents={};
    edges.forEach(function(e){(parents[e[0]]=parents[e[0]]||[]).push(e[1])});

    // Lanes: one per crafting skill. A raw material joins the lane of the craft that uses most of it,
    // so most lines run along their own lane instead of across the chart.
    var lane={};
    all.forEach(function(k){var n=nodes[k];if(n.kind==="craft")lane[k]=(n.r&&n.r.t)||"Other"});
    all.forEach(function(k){
      if(lane[k])return;
      var ps=(parents[k]||[]).slice().sort(function(a,b){return nodes[b].qty-nodes[a].qty});
      lane[k]=ps.length?lane[ps[0]]:"Other";
    });
    var lanes={};
    all.forEach(function(k){var L=lanes[lane[k]]=lanes[lane[k]]||{name:lane[k],cols:[],min:99,max:0};
      (L.cols[col[k]]=L.cols[col[k]]||[]).push(k);if(nodes[k].kind==="craft"){L.min=Math.min(L.min,col[k]);L.max=Math.max(L.max,col[k])}});
    // refining lanes (early columns) first, what you are making last
    var order=Object.keys(lanes).sort(function(a,b){return lanes[a].max-lanes[b].max||lanes[a].min-lanes[b].min||a.localeCompare(b)});

    // Fewer crossings: order each lane's columns by the average position of their neighbours
    var pos={};
    function index(){var y=0;order.forEach(function(n){var L=lanes[n],rows=0;L.cols.forEach(function(l){if(l){l.forEach(function(k,i){pos[k]=y+i});rows=Math.max(rows,l.length)}});y+=rows+1})}
    function avg(l){return l&&l.length?l.reduce(function(s,k){return s+pos[k]},0)/l.length:null}
    index();
    for(var pass=0;pass<4;pass++){
      order.forEach(function(n){lanes[n].cols.forEach(function(l){if(l)reorder(l,kids)})});
      order.forEach(function(n){lanes[n].cols.slice().reverse().forEach(function(l){if(l)reorder(l,parents)})});
    }
    function reorder(l,by){
      var v={};l.forEach(function(k){var a=avg(by[k]);v[k]=a==null?pos[k]:a});
      l.sort(function(a,b){return v[a]-v[b]});index();
    }

    // cards shrink to fit the width (down to 150px), then the chart scrolls sideways
    var avail=(box.clientWidth||1200)-34;lastW=box.clientWidth;
    GAP=ncol>6?44:64;W=Math.max(150,Math.min(230,Math.floor((avail-(ncol-1)*GAP)/ncol)));
    var LANEHEAD=26,LANEGAP=14,width=ncol*W+(ncol-1)*GAP,xy={},bands=[],y=TOP;
    order.forEach(function(n){
      var L=lanes[n],rows=0;L.cols.forEach(function(l){if(l)rows=Math.max(rows,l.length)});// columns can be empty
      bands.push({n:n,y:y,h:LANEHEAD+rows*ROW});
      L.cols.forEach(function(l,ci){if(l)l.forEach(function(k,ri){xy[k]={x:ci*(W+GAP),y:y+LANEHEAD+ri*ROW}})});
      y+=LANEHEAD+rows*ROW+LANEGAP;
    });
    var height2=y;

    var h='<div class="fl-in" style="width:'+width+'px;height:'+height2+'px">';
    h+=bands.map(function(L){var c=App.SKILL_COL[L.n]||"#97A0BD";return '<div class="fl-lane" style="top:'+L.y+'px;height:'+L.h+'px;--c:'+c+'"><span>'+esc(L.n)+'</span></div>'}).join("");
    h+='<svg class="fl-svg" width="'+width+'" height="'+height2+'" aria-hidden="true">'+edges.map(function(e){
      var a=xy[e[0]],b=xy[e[1]],x1=a.x+W,y1=a.y+ROW/2-4,x2=b.x,y2=b.y+ROW/2-4,mx=(x1+x2)/2;
      return '<path class="fe k-'+nodes[e[0]].kind+'" data-a="'+esc(e[0])+'" data-b="'+esc(e[1])+'" d="M'+x1+','+y1+' C'+mx+','+y1+' '+mx+','+y2+' '+x2+','+y2+'"/>';
    }).join("")+'</svg>';
    for(var ci=0;ci<ncol;ci++){
      var t=ci===0?"Gather or buy":ci===ncol-1?"What you craft":"Step "+ci;
      h+='<div class="fl-col" style="left:'+ci*(W+GAP)+'px;width:'+W+'px">'+t+'</div>';
    }
    all.forEach(function(k){
      var n=nodes[k],p=xy[k],sub;
      if(n.kind==="craft"){var st=(n.r.s||[])[0];sub=fmt(c.crafts[n.id].times)+" craft"+(c.crafts[n.id].times>1?"s":"")+(st?", "+esc(NWCalc.stationLabel(st)):"")}
      else sub={raw:D.byOut[n.id]?"":(App.nodesFor(n.id).length?"gather":"other source"),buy:"bought",cat:"any",cur:"currency"}[n.kind]||"";
      var tag=(n.kind==="cat"||n.kind==="cur")?"div":"a",href=tag==="a"?' href="#/item/'+encodeURIComponent(n.id)+'"':' tabindex="0"';
      h+='<'+tag+' class="fn k-'+n.kind+'"'+href+' data-k="'+esc(k)+'" style="left:'+p.x+'px;top:'+p.y+'px;width:'+W+'px"><b>'+fmt(n.qty)+'×</b><span class="fl-n">'+esc(n.label)+'</span>'+(sub?'<small>'+sub+'</small>':'')+'</'+tag+'>';
    });
    box.innerHTML=h+'</div>';
  }

  // Light up everything that feeds into, or comes out of, the card under the pointer or focus
  function light(k){
    if(!k){box.classList.remove("hl");box.querySelectorAll(".on").forEach(function(e){e.classList.remove("on")});return}
    var on={},up={},down={};
    edges.forEach(function(e){(down[e[1]]=down[e[1]]||[]).push(e[0]);(up[e[0]]=up[e[0]]||[]).push(e[1])});
    function walk(x,m,tag){if(on[tag+x])return;on[tag+x]=1;on[x]=1;(m[x]||[]).forEach(function(y){walk(y,m,tag)})}
    walk(k,down,"d:");walk(k,up,"u:");
    box.classList.add("hl");
    box.querySelectorAll(".fn").forEach(function(e){e.classList.toggle("on",!!on[e.dataset.k])});
    box.querySelectorAll(".fe").forEach(function(e){e.classList.toggle("on",!!(on[e.dataset.a]&&on[e.dataset.b]&&(on["d:"+e.dataset.a]&&on["d:"+e.dataset.b]||on["u:"+e.dataset.a]&&on["u:"+e.dataset.b])))});
  }
  box.addEventListener("mouseover",function(e){var n=e.target.closest(".fn");light(n&&n.dataset.k)});
  box.addEventListener("mouseleave",function(){light(null)});
  box.addEventListener("focusin",function(e){var n=e.target.closest(".fn");light(n&&n.dataset.k)});
  box.addEventListener("focusout",function(){light(null)});
  // redraw when the space changes size (window resize, phone rotation)
  new ResizeObserver(function(){if(last&&Math.abs(box.clientWidth-lastW)>20)set(last)}).observe(box);
  return {set:set};
};
})();
