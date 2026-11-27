// Recipe map: draws a breakdown tree as a slowly turning 3D constellation on a <canvas>. No library.
// The item you craft sits in the middle; each ring outwards is one step further back, ending in raw materials.
// Drag to turn, hover for names, click a star to open that item. The text tree stays the accessible version.
(function(){
"use strict";
var COL={craft:"#5CE1E6",raw:"#A6D97A",buy:"#B9A4FF",cat:"#FF9F6B",cur:"#97A0BD",root:"#D9FBFF"};
var KIND={craft:"crafted",raw:"gathered or raw",buy:"bought",cat:"pick one",cur:"currency"};
var MAX=280;// keeps big lists smooth on phones
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var sprites={};
function sprite(col){// soft glowing dot, drawn once per colour
  if(sprites[col])return sprites[col];
  var c=document.createElement("canvas"),s=64,g;c.width=c.height=s;var x=c.getContext("2d");
  g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,"#fff");g.addColorStop(.16,col);g.addColorStop(.38,col+"55");g.addColorStop(1,col+"00");
  x.fillStyle=g;x.fillRect(0,0,s,s);return sprites[col]=c;
}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return ((h>>>0)%1000)/1000}
function ease(t){return 1-Math.pow(1-t,3)}

App.Constellation=function(box,opt){
  opt=opt||{};
  box.classList.add("map");
  box.setAttribute("aria-hidden","true");
  box.innerHTML='<canvas></canvas><div class="tip"></div><div class="hint">Drag to turn it. Click a star to open that item.</div>';
  var cv=box.querySelector("canvas"),ctx=cv.getContext("2d"),tip=box.querySelector(".tip");
  var FONT="600 13px "+(getComputedStyle(document.body).getPropertyValue("--display")||"sans-serif"),W=0,H=0,dpr=1,nodes=[],stars=[],sig="",born=0;
  var seen=false,yaw=.6,pitch=-.32,auto=!reduce,lastUser=0,hover=null,visible=true,raf=0,prev=0;

  for(var i=0;i<140;i++){// background stars on a far sphere, they turn with the map for depth
    var u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=Math.sqrt(1-u*u);
    stars.push({x:r*Math.cos(a)*900,y:u*900,z:r*Math.sin(a)*900,s:Math.random()*1.2+.3});
  }

  function layout(roots){
    var list=[],maxD=0;
    function walk(n,depth,parent){
      if(list.length>=MAX)return null;
      var o={id:n.id,kind:depth===0&&n.kind==="craft"?"root":n.kind,real:n.kind,qty:n.qty,label:(n.kind==="cat"?"Any ":"")+App.nm(n.id),depth:depth,parent:parent,kids:[],leaves:0};
      list.push(o);maxD=Math.max(maxD,depth);
      (n.kids||[]).forEach(function(k){var c=walk(k,depth+1,o);if(c)o.kids.push(c)});
      return o;
    }
    var top=roots.map(function(r){return walk(r,0,null)}).filter(Boolean);
    function count(o){o.leaves=o.kids.length?o.kids.reduce(function(s,k){return s+count(k)},0):1;return o.leaves}
    top.forEach(count);
    var step=maxD?150/maxD:0,total=top.reduce(function(s,o){return s+o.leaves},0);
    // each subtree gets a slice of the circle sized by how many end materials it has
    function place(o,a0,a1,lat){
      var mid=(a0+a1)/2,r=o.depth*step+(o.depth===0&&top.length>1?Math.max(40,step*.7):0);
      o.ang=mid;o.lat=lat;
      o.x=r*Math.cos(lat)*Math.cos(mid);o.y=r*Math.sin(lat);o.z=r*Math.cos(lat)*Math.sin(mid);
      var a=a0,n=o.kids.length;
      o.kids.forEach(function(k,i){
        var span=(a1-a0)*k.leaves/o.leaves,spread=Math.min(1.6,.5*n)/Math.max(1,o.depth*.6+.5);
        var kl=lat*.55+(n>1?(i/(n-1)-.5)*spread:0)+(hash(k.id+i)-.5)*.7;
        place(k,a,a+span,Math.max(-1.3,Math.min(1.3,kl)));a+=span;
      });
    }
    var a=0;top.forEach(function(o,i){var span=Math.PI*2*o.leaves/total;place(o,a,a+span,top.length>1?(i%2?.35:-.35):0);a+=span});
    return {list:list,maxD:maxD};
  }

  function set(roots){
    var L=layout(roots);nodes=L.list;
    var shape=nodes.map(function(n){return n.id}).join(",");
    if(shape!==sig&&!reduce)born=performance.now();// bloom outwards only when the tree itself changes
    sig=shape;box.hidden=!nodes.length;hover=null;tip.style.opacity=0;
    kick();
  }

  function resize(){
    var r=box.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);
    W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);kick();
  }

  var proj=[];
  function project(x,y,z,f,D){
    var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    var x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp,k=f/(D-z2);
    return {x:W/2+x1*k,y:H/2+y1*k,z:z2,k:k};
  }
  function frame(t){
    raf=0;
    if(!box.isConnected){if(seen)destroy();return}// not on the page yet, or page left
    seen=true;
    var dt=prev?Math.min(.05,(t-prev)/1000):0;prev=t;
    if(auto&&t-lastUser>3500)yaw+=dt*.14;
    var g=born?Math.min(1,(t-born)/1100):1;
    var D=520,f=Math.min(W,H)*.44*D/150;// outer ring fills ~88% of the short side
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);

    // far stars
    ctx.fillStyle="#C9D3F0";
    stars.forEach(function(s){var p=project(s.x,s.y,s.z,f*.35,1400);if(p.z<-200)return;ctx.globalAlpha=.12+.25*Math.max(0,p.z/900);ctx.fillRect(p.x,p.y,s.s,s.s)});

    proj=nodes.map(function(n){
      var e=1,x=n.x,y=n.y,z=n.z;
      if(g<1){e=ease(Math.max(0,Math.min(1,g*1.6-n.depth*.12)));x*=e;y*=e;z*=e}
      var p=project(x,y,z,f,D);p.n=n;p.e=e;return p;
    });
    // links
    ctx.lineWidth=1;
    proj.forEach(function(p,i){
      var n=p.n;if(!n.parent)return;
      var q=proj[nodes.indexOf(n.parent)],front=(p.z+q.z)/2;
      ctx.globalAlpha=(.1+.22*Math.max(0,(front+170)/340))*p.e;
      ctx.strokeStyle=COL[n.kind]||COL.cur;
      ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();
    });
    // stars, back to front
    var order=proj.slice().sort(function(a,b){return a.z-b.z});
    order.forEach(function(p){
      var n=p.n,base=n.kind==="root"?9:2.4+1.6*Math.log10(n.qty+1),s=base*(p.k*D/f)*1.7;
      if(hover===n)s*=1.5;
      ctx.globalAlpha=(.45+.55*Math.max(0,Math.min(1,(p.z+200)/360)))*p.e;
      ctx.drawImage(sprite(COL[n.kind]||COL.cur),p.x-s,p.y-s,s*2,s*2);
    });
    // labels: the target(s), the first ring when it is small, and the star under the pointer
    ctx.globalAlpha=1;ctx.textAlign="center";ctx.font=FONT;
    var ring=nodes.filter(function(n){return n.depth===1}).length<=8,boxes=[];
    // roots first, then nearest first; a label that would overlap one already drawn is skipped
    order.slice().sort(function(a,b){return a.n.depth-b.n.depth||b.z-a.z}).forEach(function(p){
      var n=p.n;if(!(n.depth===0||(ring&&n.depth===1&&p.z>-40)))return;if(p.e<.9)return;
      var w=ctx.measureText(n.label).width,y=p.y+(n.depth===0?26:19),bx={l:p.x-w/2-4,r:p.x+w/2+4,t:y-12,b:y+4};
      if(boxes.some(function(o){return bx.l<o.r&&bx.r>o.l&&bx.t<o.b&&bx.b>o.t}))return;
      boxes.push(bx);
      ctx.fillStyle=n.depth===0?"#E6EAF5":"rgba(230,234,245,.7)";
      ctx.fillText(n.label,p.x,y);
    });
    if(hover){var hp=proj[nodes.indexOf(hover)];if(hp){tip.style.left=hp.x+"px";tip.style.top=hp.y+"px"}}
    if(visible&&!document.hidden&&((auto&&!reduce)||g<1||dragging))raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf&&visible)raf=requestAnimationFrame(frame)}

  // pointer: drag to turn, hover for a name, click to open
  var dragging=false,sx=0,sy=0,moved=0;
  function pick(e){
    var r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,best=null,bd=18*18;
    proj.forEach(function(p){var d=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y);if(d<bd&&p.z>-260){bd=d;best=p.n}});
    return best;
  }
  cv.addEventListener("pointerdown",function(e){dragging=true;moved=0;sx=e.clientX;sy=e.clientY;cv.setPointerCapture(e.pointerId);lastUser=performance.now();kick()});
  cv.addEventListener("pointermove",function(e){
    if(dragging){
      var dx=e.clientX-sx,dy=e.clientY-sy;sx=e.clientX;sy=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
      yaw+=dx*.008;pitch=Math.max(-1.2,Math.min(1.2,pitch+dy*.006));lastUser=performance.now();kick();return;
    }
    var n=pick(e);
    if(n!==hover){
      hover=n;
      if(n){tip.textContent=App.fmt(n.qty)+"× "+n.label+" ("+(n.kind==="root"?"what you craft":KIND[n.real])+")";tip.style.opacity=1}
      else tip.style.opacity=0;
      cv.style.cursor=n&&n.real!=="cat"&&n.real!=="cur"?"pointer":"";
      kick();
    }
  });
  function up(e){
    if(!dragging)return;dragging=false;lastUser=performance.now();
    if(moved<6){var n=pick(e);if(n&&n.real!=="cat"&&n.real!=="cur")App.go("item/"+encodeURIComponent(n.id))}
    kick();
  }
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",function(){dragging=false});
  cv.addEventListener("pointerleave",function(){if(!dragging&&hover){hover=null;tip.style.opacity=0;kick()}});

  var ro=new ResizeObserver(resize);ro.observe(box);
  var io=new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible){prev=0;kick()}});io.observe(box);
  function vis(){if(!document.hidden){prev=0;kick()}}
  document.addEventListener("visibilitychange",vis);
  function destroy(){ro.disconnect();io.disconnect();document.removeEventListener("visibilitychange",vis);if(raf)cancelAnimationFrame(raf);raf=0}
  resize();
  return {set:set,destroy:destroy};
};
})();
