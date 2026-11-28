// Data > Known limits
App.page("data/limits",{title:"Known limits",render:function(root){
  root.innerHTML='<div class="prose"><h1>Known limits</h1><p>Anything on the site that the game files or testing do not fully confirm is marked '+App.unsure("Example of the marker. Hover or tab to it to read why.")+'. Hover over it, or tab to it, to see why.</p><ul>'+
  '<li><b>No drop chances or amounts.</b> Loot tables list which items a node can drop, not how often or how many. The tool says "can drop" and never guesses amounts.</li>'+
  '<li><b>No map locations.</b> The data tables have no coordinates. A map is a later experiment.</li>'+
  '<li><b>One recipe per item.</b> Where several recipes make the same item, the standard (non-random) one is used.</li>'+
  '<li><b>Some names show as raw ids</b>, for example "FluxReagentsT5". About 300 categories have no display name in the game files.</li>'+
  '<li><b>Stations:</b> "Forge T2" means a tier 2 Forge or better. A few rare station names are best guesses.</li>'+
  '<li><b>Project Azoth may differ</b> from the official game. Treat everything as "from game files", not verified.</li>'+
  '<li><b>Gear perk values are worked out</b> with the game&rsquo;s own scaling formula at each item&rsquo;s gear score. In game they may differ slightly. Fishing perks only say small, medium or large.</li>'+
  '<li><b>The run planner</b> picks kinds of node, not places or amounts. Some nodes list rarer materials that may only drop at higher skill levels; the planner shows everything a node can drop.</li>'+
  '<li><b>Levelling routes</b> use the XP per craft and per level from the game files. XP boosts are not counted. Only recipes known by default are used, made from things you can gather plus refining reagents, which are counted as bought. Salvage research notes and gypsum recipes are left out because they need rare or daily-limited items.</li>'+
  '<li><b>Costs</b> only use the prices you type in. There are no market prices in the game files. Crafting fees are shown before town tax.</li>'+
  '<li><b>Weapon damage</b>: the files give base damage and how much each attribute adds per point, but no source confirms exactly how gear score, attributes and other bonuses combine into the number you see in game. The damage estimate is marked as not 100%.</li>'+
  '<li><b>XP rates on Project Azoth</b> are not published. Official servers ran permanent double XP from April 2026; Project Azoth does not, so the planner uses base XP from the game files. Add your own extra XP if an event gives some.</li>'+
  '<li><b>Territory buffs</b> such as Miner\'s Resolve describe +20% yield, while their data value is 500 luck points (5%). Both are shown, marked not 100%.</li>'+
  '<li><b>Fishing spots</b> are not in the gathering data, so the gear page cannot list them by level.</li>'+
  '</ul></div>';
}});
