// Saved recipes, kept on this device, and Discord sign-in through Supabase that keeps them on every device.
// No library: Supabase's sign-in page sends you back with #access_token=... in the link, which is read here
// before the page router starts, then saves are read and written with Supabase's REST API.
// Table (see docs/discord-login.md): user_saves(user_id uuid primary key, saved jsonb, updated_at).
(function(){
"use strict";
var esc=App.esc,S=App.state,C=App.SUPABASE||{},ON=!!(C.url&&C.key),KEY="nwapp.session";
var session=null,user=null;
S.saved=Array.isArray(S.saved)?S.saved:[];

function base(){return C.url.replace(/\/+$/,"")}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
function store(s){session=s;try{if(s)localStorage.setItem(KEY,JSON.stringify(s));else localStorage.removeItem(KEY)}catch(e){}}

// Back from Discord: the link holds the session (or an error). Keep it, then go back to the last page.
if(ON&&/^#(access_token|error)=/.test(location.hash)){
  var q=new URLSearchParams(location.hash.slice(1));
  if(q.get("access_token"))store({at:q.get("access_token"),rt:q.get("refresh_token"),exp:Date.now()+(+q.get("expires_in")||3600)*1000});
  else App.authError=q.get("error_description")||q.get("error");
  history.replaceState(null,"",location.pathname+location.search+"#/"+(App.lastRoute()||"craft/calculator"));
}

function call(path,opt){
  opt=opt||{};
  var h={apikey:C.key,"Content-Type":"application/json"};
  if(session)h.Authorization="Bearer "+session.at;
  Object.keys(opt.headers||{}).forEach(function(k){h[k]=opt.headers[k]});
  return fetch(base()+path,{method:opt.method||"GET",headers:h,body:opt.body?JSON.stringify(opt.body):undefined}).then(function(r){
    if(!r.ok)return r.text().then(function(t){throw new Error(r.status+" "+t.slice(0,160))});
    return r.status===204?null:r.json().catch(function(){return null});
  });
}
// a fresh access token (they last about an hour)
function ready(){
  if(!session)return Promise.reject(new Error("signed out"));
  if(session.exp-Date.now()>60000)return Promise.resolve();
  return call("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.rt}}).then(function(d){
    store({at:d.access_token,rt:d.refresh_token,exp:Date.now()+(d.expires_in||3600)*1000});
  },function(e){store(null);user=null;draw();throw e});
}

// Saves: one row per person holding the whole list
function merge(a,b){var m={};a.concat(b).forEach(function(x){if(x&&x.id&&!m[x.id])m[x.id]=x});return Object.keys(m).map(function(k){return m[k]}).sort(function(x,y){return (y.t||0)-(x.t||0)})}
var pushT=0;
function push(){
  if(!ON||!user)return;
  clearTimeout(pushT);
  pushT=setTimeout(function(){
    ready().then(function(){return call("/rest/v1/user_saves",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:{user_id:user.id,saved:S.saved,updated_at:new Date().toISOString()}})})
      .then(function(){App.syncNote=""},function(e){App.syncNote="Could not save online ("+e.message+"). Your saves are still on this device."});
  },600);
}
function pull(){
  return ready().then(function(){return call("/rest/v1/user_saves?select=saved&user_id=eq."+encodeURIComponent(user.id))}).then(function(rows){
    var online=(rows&&rows[0]&&rows[0].saved)||[];
    S.saved=merge(S.saved,online);App.save();push();
    if(App.onSaved)App.onSaved();
  });
}

App.isSaved=function(id){return S.saved.some(function(x){return x.id===id})};
App.toggleSaved=function(id){
  if(App.isSaved(id))S.saved=S.saved.filter(function(x){return x.id!==id});
  else{S.saved.unshift({id:id,t:Date.now()});S.saved=S.saved.slice(0,1000)}// the database allows up to 1000 saves
  App.save();push();
};
// a Save button for any item; clicks anywhere on the page are handled below
App.saveButton=function(id){var on=App.isSaved(id);return '<button type="button" class="sm savebtn" data-save="'+esc(id)+'" aria-pressed="'+on+'">'+(on?'★ Saved':'☆ Save')+'</button>'};
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-save]");if(!b)return;
  App.toggleSaved(b.dataset.save);
  document.querySelectorAll('[data-save="'+CSS.escape(b.dataset.save)+'"]').forEach(function(x){var on=App.isSaved(x.dataset.save);x.setAttribute("aria-pressed",on);x.textContent=on?"★ Saved":"☆ Save"});
  if(App.onSaved)App.onSaved();
});

// Header: sign in, or who you are
App.auth={on:ON,user:function(){return user},
  signIn:function(){location.href=base()+"/auth/v1/authorize?provider=discord&redirect_to="+encodeURIComponent(location.origin+location.pathname)},
  signOut:function(){var s=session;store(null);user=null;draw();if(App.onSaved)App.onSaved();if(s)fetch(base()+"/auth/v1/logout",{method:"POST",headers:{apikey:C.key,Authorization:"Bearer "+s.at}}).catch(function(){})}};
function name(u){var m=(u&&u.user_metadata)||{};return m.custom_claims&&m.custom_claims.global_name||m.full_name||m.name||m.user_name||"Signed in"}
function avatar(u){var a=u&&u.user_metadata&&u.user_metadata.avatar_url;return /^https:\/\/cdn\.discordapp\.com\//.test(a||"")?a:""}
function draw(){
  var box=document.getElementById("acct");if(!box)return;
  if(!ON){box.innerHTML="";return}
  box.innerHTML=user?'<span class="who">'+(avatar(user)?'<img src="'+esc(avatar(user))+'" alt="" width="26" height="26">':'')+'<span>'+esc(name(user))+'</span></span><button type="button" class="sm" id="signout">Sign out</button>'
    :'<button type="button" class="discord" id="signin"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.5 19.5 0 0 0-4.9 1.5C.6 9.1-.3 13.7.1 18.2a19.8 19.8 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.7 19.7 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.8ZM8.3 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.4 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>Sign in with Discord</button>';
}
document.addEventListener("click",function(e){
  if(e.target.closest("#signin"))App.auth.signIn();
  if(e.target.closest("#signout"))App.auth.signOut();
});

session=ON?load():null;
draw();
if(ON&&session){
  ready().then(function(){return call("/auth/v1/user")}).then(function(u){user=u;draw();
      return pull().catch(function(e){App.syncNote="Could not load your online saves ("+e.message+"). Your saves on this device still work.";if(App.onSaved)App.onSaved()})})
    .catch(function(e){if(!user){store(null);draw()}App.syncNote="Could not reach the sign-in service ("+e.message+").";if(App.onSaved)App.onSaved()});
}
})();
