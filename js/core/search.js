// Item search used by the header box and the calculator. Keyboard: arrows move, Enter picks, Escape closes.
(function(){
"use strict";
var esc=App.esc;
App.findItems=function(q,opt){
  q=q.trim().toLowerCase();opt=opt||{};
  if(q.length<2||!App.data)return [];
  var m=[],idx=App.data.index;
  for(var i=0;i<idx.length&&m.length<200;i++){var x=idx[i];if((!opt.craftOnly||x.craft)&&x.l.indexOf(q)>=0)m.push(x)}
  m.sort(function(a,b){return (a.l.indexOf(q)===0?0:1)-(b.l.indexOf(q)===0?0:1)||a.n.length-b.n.length||a.n.localeCompare(b.n)});
  return m.slice(0,opt.limit||25);
};
function meta(x){
  if(!x.craft)return "material";
  var r=App.data.byOut[x.id][0];
  return [r.t,r.tr?"T"+r.tr:"",r.gs?"GS "+r.gs:""].filter(Boolean).join(", ")||"craftable";
}
// Wire an <input> and a results box. onPick(id) runs when the user chooses a result.
App.attachSearch=function(input,box,onPick,opt){
  function close(){box.hidden=true}
  input.addEventListener("input",function(){
    if(input.value.trim().length<2){close();return}
    var m=App.findItems(input.value,opt);
    box.innerHTML=m.map(function(x){return '<button type="button" data-id="'+esc(x.id)+'"><span>'+esc(x.n)+'</span><span class="tag">'+esc(meta(x))+'</span></button>'}).join("")||'<div class="empty">'+(App.data?"No match.":"Loading data…")+'</div>';
    box.hidden=false;
  });
  input.addEventListener("keydown",function(e){
    var f=box.querySelector("button");
    if(e.key==="ArrowDown"&&f&&!box.hidden){e.preventDefault();f.focus()}
    else if(e.key==="Enter"&&f&&!box.hidden){e.preventDefault();close();onPick(f.dataset.id)}
    else if(e.key==="Escape")close();
  });
  box.addEventListener("keydown",function(e){
    var b=e.target.closest("button");if(!b)return;
    if(e.key==="ArrowDown"&&b.nextElementSibling){e.preventDefault();b.nextElementSibling.focus()}
    else if(e.key==="ArrowUp"){e.preventDefault();(b.previousElementSibling||input).focus()}
    else if(e.key==="Escape"){close();input.focus()}
  });
  box.addEventListener("click",function(e){var b=e.target.closest("button[data-id]");if(b){close();onPick(b.dataset.id)}});
  // close when focus or a click leaves the search area
  document.addEventListener("click",function h(e){
    if(!input.isConnected){document.removeEventListener("click",h);return}// page was left
    if(!box.hidden&&!box.contains(e.target)&&e.target!==input)close();
  });
};
})();
