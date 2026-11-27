// Hash routing: #/craft/calculator, #/item/<id>. Every page gets a shareable link and works on GitHub Pages.
(function(){
"use strict";
var esc=App.esc,DEFAULT="craft/calculator";
// Pages register themselves: App.page("data/about", {title, needsData, render(el, param)})
App.page=function(route,def){App.pages[route]=def};

function parse(){
  var h=decodeURIComponent(location.hash.replace(/^#\/?/,"")),parts=h.split("/");
  // longest registered page that starts the link wins; the rest is the page's parameter (item/<id>, gather/gear/<skill>)
  for(var i=parts.length;i>0;i--){var k=parts.slice(0,i).join("/");if(App.pages[k])return {route:k,param:parts.slice(i).join("/")}}
  return {route:h,param:""};
}
function renderMenu(cur){
  document.getElementById("side").innerHTML=App.menu.map(function(g){
    return '<h3>'+esc(g.label)+'</h3>'+g.items.map(function(it){
      if(it.soon)return '<span class="soon" aria-disabled="true">'+esc(it.label)+'<small>soon</small></span>';
      return '<a href="#/'+it.route+'"'+(it.route===cur||cur.indexOf(it.route+"/")===0?' aria-current="page"':'')+'>'+esc(it.label)+'</a>';
    }).join("");
  }).join("")+'<p class="side-foot">Data from game files, not verified on Azoth.</p>';
  // phones: the menu is a sideways strip, so bring the current page into view
  var side=document.getElementById("side"),cur2=side.querySelector("[aria-current]");
  if(cur2&&side.scrollWidth>side.clientWidth)side.scrollLeft=cur2.offsetLeft-side.clientWidth/2+cur2.offsetWidth/2;
}
var seq=0;
function go(){
  if(!location.hash||location.hash==="#"||location.hash==="#/"){location.replace("#/"+(App.lastRoute()||DEFAULT));return}
  var p=parse(),page=App.pages[p.route],main=document.getElementById("main"),my=++seq;
  renderMenu(p.route);
  if(!page){document.title="Not found · Aeternum Crafting";main.innerHTML='<h1>Page not found</h1><p>Nothing at this link. <a href="#/'+DEFAULT+'">Open the calculator</a>.</p>';return}
  App.lastRoute(location.hash.replace(/^#\//,""));
  document.title=(page.title||"")+" · Aeternum Crafting";
  var el=document.createElement("div");
  function swap(){page.render(el,p.param);main.replaceChildren(el);window.scrollTo(0,0);var h=el.querySelector("h1");if(h&&App.routed){h.tabIndex=-1;h.focus({preventScroll:true})}}
  function show(){
    if(my!==seq)return;
    // cross-fade between pages where the browser supports it; plain swap otherwise
    if(App.routed&&document.startViewTransition&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.startViewTransition(swap);else swap();
    App.routed=true;
  }
  if(page.needsData&&!App.data){
    main.innerHTML='<p class="loading">Loading game data…</p>';
    App.loadData().then(show).catch(function(e){if(my===seq)main.innerHTML='<h1>Could not load data</h1><p class="err">'+esc(e.message)+' did not load. Check your connection and reload the page.</p>'});
  }else show();
}
App.go=function(route){location.hash="#/"+route};
App.start=function(){window.addEventListener("hashchange",go);go()};
})();
