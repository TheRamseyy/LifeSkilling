// Craft > Saved recipes: items you starred, ready to add to the calculator. Kept on this device, and on every
// device when you sign in with Discord (js/core/auth.js).
(function(){
"use strict";
var esc=App.esc,S=App.state;

App.page("craft/saved",{title:"Saved recipes",needsData:true,render:function(root){
  function draw(){
    var A=App.auth,u=A.on&&A.user(),list=S.saved.filter(function(x){return App.data.byOut[x.id]||App.data.N[x.id]});
    var h='<h1>Saved recipes</h1><p class="sub">Press <b>☆ Save</b> on any item, in the calculator or on its page, to keep it here.</p>';
    h+='<div class="card glass savenote">'+(!A.on?'Saved on this device. Signing in with Discord is not set up on this site yet.'
      :u?'Signed in: your saves are kept on every device you sign in on.'
      :'Saved on this device only. <button type="button" class="sm" id="signin">Sign in with Discord</button> to keep them on every device.')+
      (App.syncNote?'<p class="err" style="margin:8px 0 0">'+esc(App.syncNote)+'</p>':'')+(App.authError?'<p class="err" style="margin:8px 0 0">Sign-in did not finish: '+esc(App.authError)+'</p>':'')+'</div>';
    if(!list.length){root.innerHTML=h+'<p class="muted">Nothing saved yet. <a href="#/craft/calculator">Open the calculator</a> and press ☆ Save next to an item.</p>';return}
    h+='<div class="savelist">'+list.map(function(x){
      var r=App.data.byOut[x.id]&&App.data.byOut[x.id][0];
      return '<article class="card glass saved"><div><b>'+App.itemLink(x.id)+'</b>'+(r&&r.t?'<span class="muted">'+esc(r.t)+' '+(r.l||0)+'</span>':'')+'</div>'+
        '<div class="act"><label class="muted">Qty <input type="number" min="1" value="1" data-qty="'+esc(x.id)+'" aria-label="How many to craft"></label>'+
        '<button type="button" class="sm" data-add="'+esc(x.id)+'">Add to calculator</button>'+App.saveButton(x.id)+'</div></article>';
    }).join("")+'</div>';
    root.innerHTML=h;
  }
  App.onSaved=function(){if(root.isConnected)draw()};
  draw();
  root.addEventListener("click",function(e){
    var b=e.target.closest("[data-add]");if(!b)return;
    var q=root.querySelector('[data-qty="'+CSS.escape(b.dataset.add)+'"]');
    App.addToList(b.dataset.add,Math.max(1,Math.round(+(q&&q.value)||1)));
    App.go("craft/calculator");
  });
}});
})();
