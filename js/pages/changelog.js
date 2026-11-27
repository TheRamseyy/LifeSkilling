// Data > Changelog. Add new entries at the top.
App.page("data/changelog",{title:"Changelog",render:function(root){
  var log=[
    ["27 Nov 2026",["One app with a grouped side menu and links you can share for every page.","Search box at the top finds any item or material (press / to jump to it).","Item pages: recipe, where to get it, and what it is used for."]],
    ["27 Nov 2026",["Calculator redesign: collapsible breakdown tree, skills grouped by tradeskill, stations grouped by type.","Pick which item to use for \"any X\" materials; the choice flows into totals and gathering."]],
    ["Earlier",["First calculator: raw materials, crafting steps, requirements, optional prices."]]
  ];
  root.innerHTML='<div class="prose"><h1>Changelog</h1>'+log.map(function(e){return '<h2>'+App.esc(e[0])+'</h2><ul>'+e[1].map(function(t){return '<li>'+App.esc(t)+'</li>'}).join("")+'</ul>'}).join("")+'</div>';
}});
