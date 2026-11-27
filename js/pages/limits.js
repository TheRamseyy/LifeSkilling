// Data > Known limits
App.page("data/limits",{title:"Known limits",render:function(root){
  root.innerHTML='<div class="prose"><h1>Known limits</h1><ul>'+
  '<li><b>No drop chances or amounts.</b> Loot tables list which items a node can drop, not how often or how many. The tool says "can drop" and never guesses amounts.</li>'+
  '<li><b>No map locations.</b> The data tables have no coordinates. A map is a later experiment.</li>'+
  '<li><b>One recipe per item.</b> Where several recipes make the same item, the standard (non-random) one is used.</li>'+
  '<li><b>Some names show as raw ids</b>, for example "FluxReagentsT5". About 300 categories have no display name in the game files.</li>'+
  '<li><b>Stations:</b> "Forge T2" means a tier 2 Forge or better. A few rare station names are best guesses.</li>'+
  '<li><b>Project Azoth may differ</b> from the official game. Treat everything as "from game files", not verified.</li>'+
  '</ul></div>';
}});
