// Saved in this browser only (localStorage): craft list, bought items, prices, "any X" picks, gathering levels, levelling plans, attributes, last page.
(function(){
"use strict";
var KEY="nwcalc.v2",LAST="nwapp.lastRoute";
var state=App.state={list:[],buy:{},prices:{},pick:{},levels:{},lvl:{},attrs:{}};
// keep every saved part (craft list, prices, picks, levels, levelling plans, attributes), with defaults for anything missing
try{var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&typeof d==="object")Object.keys(state).forEach(function(k){if(d[k]&&typeof d[k]===typeof state[k])state[k]=d[k]})}catch(e){}
App.save=function(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}};
App.addToList=function(id,qty){
  var ex=state.list.filter(function(e){return e.id===id})[0];
  if(ex)ex.qty+=qty;else state.list.push({id:id,qty:qty});
  App.save();
};
App.lastRoute=function(v){try{if(v)localStorage.setItem(LAST,v);else return localStorage.getItem(LAST)}catch(e){}};
})();
