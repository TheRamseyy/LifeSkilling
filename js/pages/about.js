// Data > About the data
App.page("data/about",{title:"About the data",render:function(root){
  root.innerHTML='<div class="prose"><h1>About the data</h1>'+
  '<p>This tool answers one question: <i>"I want to craft X. What do I need from the very start, where do I get each material, and what skills and gear do I need?"</i></p>'+
  '<p>Everything here is read from game files extracted by hand. It is not taken from other fan sites and has not been checked against Project Azoth, which may differ from the official game.</p>'+
  '<h2>What is included</h2><ul>'+
  '<li>Every crafting recipe: ingredients, tradeskill level, station and tier.</li>'+
  '<li>Item and category names in English.</li>'+
  '<li>Which gathering nodes can drop each material, with skill level, respawn and gather time.</li>'+
  '<li>Gathering tools, clothing and jewellery with their perks.</li></ul>'+
  '<p>See <a href="#/data/limits">Known limits</a> for what the files cannot tell us.</p>'+
  '<h2>Your data</h2><p>Your craft list, prices and choices are saved in this browser only. Nothing is sent anywhere.</p></div>';
}});
