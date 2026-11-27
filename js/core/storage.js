// Saved in this browser only (localStorage): craft list, bought items, prices, "any X" picks, last page.
(function(){
"use strict";
var KEY="nwcalc.v2",LAST="nwapp.lastRoute";
var state=App.state={list:[],buy:{},prices:{},pick:{}};
try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d){state.list=d.list||[];state.buy=d.buy||{};state.prices=d.prices||{};state.pick=d.pick||{}}}catch(e){}
App.save=function(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}};
App.addToList=function(id,qty){
  var ex=state.list.filter(function(e){return e.id===id})[0];
  if(ex)ex.qty+=qty;else state.list.push({id:id,qty:qty});
  App.save();
};
App.lastRoute=function(v){try{if(v)localStorage.setItem(LAST,v);else return localStorage.getItem(LAST)}catch(e){}};
})();
