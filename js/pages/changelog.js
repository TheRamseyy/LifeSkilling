// Data > Changelog. Add new entries at the top.
App.page("data/changelog",{title:"Changelog",render:function(root){
  var log=[
    ["27 Nov 2026",["New page: Run planner. It takes your craft list and picks the fewest kinds of node that can drop every material, grouped by skill and level.","Set your gathering levels and it leaves out nodes you cannot gather yet, and says which level you need."]],
    ["27 Nov 2026",["New page: Gathering gear by level, for Mining, Logging, Harvesting, Skinning and Fishing.","Best in slot laid out like a character screen, what to use every 50 levels, and every tool and clothing piece with its perks worked out at its gear score."]],
    ["27 Nov 2026",["Data can now be fully rebuilt from the game files with one script.","Better names: Ironwood Planks, Infused Leather, Infused Silk and Phoenixweave instead of \"Tier 5 Timber\" and similar.","Full item lists for music sheets and armoring and furnishing schematics (they were cut off at 200)."]],
    ["27 Nov 2026",["New look: Azoth colours over a night sky, with one colour per kind of thing (cyan crafted, green gathered, lilac chosen, orange needs a pick).","Recipe map: your craft list drawn as a 3D constellation you can turn and click.","Smooth page changes and smooth opening of the breakdown tree."]],
    ["27 Nov 2026",["One app with a grouped side menu and links you can share for every page.","Search box at the top finds any item or material (press / to jump to it).","Item pages: recipe, where to get it, and what it is used for."]],
    ["27 Nov 2026",["Calculator redesign: collapsible breakdown tree, skills grouped by tradeskill, stations grouped by type.","Pick which item to use for \"any X\" materials; the choice flows into totals and gathering."]],
    ["Earlier",["First calculator: raw materials, crafting steps, requirements, optional prices."]]
  ];
  root.innerHTML='<div class="prose"><h1>Changelog</h1>'+log.map(function(e){return '<h2>'+App.esc(e[0])+'</h2><ul>'+e[1].map(function(t){return '<li>'+App.esc(t)+'</li>'}).join("")+'</ul>'}).join("")+'</div>';
}});
