// Hash routing: #/craft/calculator, #/item/<id>. Every page gets a shareable link and works on GitHub Pages.
(function(){
"use strict";
var esc=App.esc,DEFAULT="craft/calculator";
// Pages register themselves: App.page("data/about", {title, needsData, render(el, param)})
App.page=function(route,def){App.pages[route]=def};

function parse(){
  var h=decodeURIComponent(location.hash.replace(/^#\/?/,"")),parts=h.split("/");
  if(App.pages[h])return {route:h,param:""};
  if(App.pages[parts[0]])return {route:parts[0],param:parts.slice(1).join("/")};// e.g. item/<id>
  return {route:h,param:""};
}
function renderMenu(cur){
  document.getElementById("side").innerHTML=App.menu.map(function(g){
    return '<h3>'+esc(g.label)+'</h3>'+g.items.map(function(it){
      if(it.soon)return '<span class="soon" aria-disabled="true">'+esc(it.label)+'<small>soon</small></span>';
      return '<a href="#/'+it.route+'"'+(it.route===cur?' aria-current="page"':'')+'>'+esc(it.label)+'</a>';
    }).join("");
  }).join("")+'<p class="side-foot">Data from game files, not verified on Azoth.</p>';
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
  function show(){if(my!==seq)return;page.render(el,p.param);main.replaceChildren(el);window.scrollTo(0,0);var h=el.querySelector("h1");if(h&&App.routed){h.tabIndex=-1;h.focus({preventScroll:true})}App.routed=true}
  if(page.needsData&&!App.data){
    main.innerHTML='<p class="loading">Loading game data…</p>';
    App.loadData().then(show).catch(function(e){if(my===seq)main.innerHTML='<h1>Could not load data</h1><p class="err">'+esc(e.message)+' did not load. Check your connection and reload the page.</p>'});
  }else show();
}
App.go=function(route){location.hash="#/"+route};
App.start=function(){window.addEventListener("hashchange",go);go()};
})();
