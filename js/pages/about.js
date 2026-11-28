// Data > About the data
App.page("data/about",{title:"About the data",render:function(root){
  root.innerHTML='<div class="prose"><h1>About the data</h1>'+
  '<p>This tool answers one question: <i>"I want to craft X. What do I need from the very start, where do I get each material, and what skills and gear do I need?"</i></p>'+
  '<p>Everything here is read from game files extracted by hand. It is not taken from other fan sites and has not been checked against Project Azoth, which may differ from the official game.</p>'+
  '<h2>What is included</h2><ul>'+
  '<li>Every crafting recipe: ingredients, tradeskill level, station and tier.</li>'+
  '<li>Item and category names in English.</li>'+
  '<li>Which gathering nodes can drop each material, with skill level, respawn and gather time.</li>'+
  '<li>Gathering tools, clothing and jewellery with their perks.</li>'+
  '<li>Weapon stats, attribute scaling and milestone bonuses, and weapon perks.</li>'+
  '<li>Boosts: food, housing trophies, territory buffs, music, boosters and attribute bonuses.</li></ul>'+
  '<p>See <a href="#/data/limits">Known limits</a> for what the files cannot tell us.</p>'+
  '<h2>Checked against</h2><p>The game files are Season 10 (Nighthaven, October 2025), read with NW Buddy 10.0.4. Only Season 10 sources are used to check them: the <a href="https://nwdb.info/patch-notes/live/season-10-nighthaven" rel="noopener" target="_blank">Season 10 Nighthaven patch notes</a> on nwdb (October 2025), the official <a href="https://www.newworld.com/en-us/news/articles/the-future-of-new-world-aeternum-what-to-expect" rel="noopener" target="_blank">Future of New World</a> post (January 2026), and the <a href="https://gaming.tools/newworld/guides/smelting" rel="noopener" target="_blank">gaming.tools</a> levelling guides, whose XP per craft matches the Season 10 files. Server details are from the <a href="https://projectazoth.com/" rel="noopener" target="_blank">Project Azoth</a> site. <a href="https://nwdb.info" rel="noopener" target="_blank">nwdb</a> and <a href="https://www.nw-buddy.de" rel="noopener" target="_blank">NW Buddy</a> can be used to double-check where items come from. No numbers are copied from them. Older guides (2021 to 2024) are not used, since Season 10 changed attributes and gear.</p>'+
  '<h2>Your data</h2><p>Your craft list, prices and choices are saved in this browser only. Nothing is sent anywhere.</p></div>';
}});
