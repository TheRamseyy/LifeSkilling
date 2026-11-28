// Builds > Noxie's build planner: what Noxie's New World Vault is and a link to it. This site covers crafting and
// gathering; Noxie's covers builds and combat, so we point there instead of repeating it.
(function(){
"use strict";
var URL="https://project-azoth-vault.pages.dev/",SRC="https://github.com/NoxieProxie/PA_TestVault";
var FEATURES=[
  ["Loadout builder","Put together gear, perks and attributes for a build, then share it with a link."],
  ["Damage calculator","Works out real hits and health for your build, including against raid bosses."],
  ["Builds","Ready-made builds for PvE, PvP, wars and open world, plus the basics of gearing each role."],
  ["Bosses, expeditions and raids","Boss mechanics and phases, every expedition with suggested gear, and the raids."],
  ["PvP and wars","Outpost Rush, arenas, Capture the Flag, open-world PvP and war roles and prep."],
  ["Reference","Perks, status effects, artifacts, gems, skill trees, perk charms, heart runes and gear sets."],
  ["Gear grind","How to push gear score to 800, with tier lists for PvE and PvP gear."],
  ["Item and recipe search","Look up any weapon, armour piece, perk or recipe."]
];

App.page("builds/noxie",{title:"Noxie’s build planner",render:function(root){
  root.innerHTML='<h1>Noxie’s build planner</h1>'+
    '<p class="sub">A companion site made by Noxie for New World: Aeternum Season 10. It covers builds, combat and endgame, the side this site leaves out: here is crafting and gathering, there is how to fight with what you made.</p>'+
    '<section class="card glass noxie"><div><h2>New World Vault</h2><p>A Season 10 guide to builds, boss fights, raids and gear, based on the game’s data. It has its own sign-in for saving your loadouts.</p></div>'+
    '<div class="noxie-go"><a class="btn" href="'+URL+'" target="_blank" rel="noopener">Open Noxie’s build planner ↗</a><a class="muted" href="'+SRC+'" target="_blank" rel="noopener">Source on GitHub</a></div></section>'+
    '<section class="card"><h2>What you will find there</h2><div class="noxie-grid">'+FEATURES.map(function(f){return '<div class="card glass"><h3>'+App.esc(f[0])+'</h3><p class="muted">'+App.esc(f[1])+'</p></div>'}).join("")+'</div></section>'+
    '<p class="note">Noxie’s site is separate and run by Noxie: its sign-in and saved loadouts are not linked to this site’s saved recipes. Contents described as of 28 November 2026.</p>';
}});
})();
