// The side menu and start-up. To add a page: create js/pages/<name>.js, add a <script> line in index.html,
// and set its menu entry below (remove "soon"). See docs/adding-a-page.md.
(function(){
"use strict";
App.menu=[
  {label:"Craft",items:[{route:"craft/calculator",label:"Calculator"},{route:"craft/levelling",label:"Level a crafting skill"},{label:"Craft list",soon:1},{label:"Prices",soon:1}]},
  {label:"Gather",items:[{label:"Materials and nodes",soon:1},{route:"gather/gear",label:"Gathering gear by level"},{route:"gather/runs",label:"Run planner"}]},
  {label:"Gear",items:[{route:"gear/tools",label:"Tools"},{route:"gear/attributes",label:"Attributes"},{route:"gear/perks",label:"Tool perks"}]},
  {label:"Data",items:[{route:"data/about",label:"About the data"},{route:"data/limits",label:"Known limits"},{route:"data/changelog",label:"Changelog"}]}
];

// Header search: any craftable item or material, opens its item page
var gi=document.getElementById("gq"),gb=document.getElementById("gsugg");
App.attachSearch(gi,gb,function(id){gi.value="";gi.blur();App.go("item/"+encodeURIComponent(id))});
gi.addEventListener("focus",function(){App.loadData().catch(function(){})},{once:true});
document.addEventListener("keydown",function(e){
  var t=e.target.tagName;
  if(e.key==="/"&&t!=="INPUT"&&t!=="TEXTAREA"&&t!=="SELECT"){e.preventDefault();gi.focus()}
});

// "Skip to content" must not change the page link
document.querySelector(".skip").addEventListener("click",function(e){e.preventDefault();document.getElementById("main").focus()});

// Phones: the menu strip sticks just under the header, whatever height it wraps to
var hdr=document.querySelector(".top");
function setHdr(){document.documentElement.style.setProperty("--hdr",hdr.offsetHeight+"px")}
window.addEventListener("resize",setHdr);setHdr();

App.start();
})();
