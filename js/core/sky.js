// Live background: a moonlit night over Aeternum, drawn with WebGL behind every page. A large moon with a halo
// and soft moonbeams, thin clouds lit at the edges, an aurora, stars, three mountain ridges fading into mist,
// and drifting motes of Azoth light. The aurora, mist, motes and horizon glow take the colour of the section or
// skill you are on. Renders at low resolution and about 30 frames a second, pauses when the tab is hidden, holds
// still for reduced motion, and simply does nothing without WebGL.
(function(){
"use strict";
var cv=document.createElement("canvas");cv.className="sky";cv.setAttribute("aria-hidden","true");
var gl=cv.getContext("webgl",{antialias:false,alpha:false,premultipliedAlpha:false,powerPreference:"low-power"});
App.sky={tint:function(){}};
if(!gl)return;
document.body.prepend(cv);

var VS="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
var FS=[
"precision mediump float;",
"uniform vec2 res;uniform float t;uniform vec3 c1;uniform vec3 c2;",
"float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
"float h1(float x){return fract(sin(x*91.17)*43758.5453);}",
"float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
" return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
"float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}",
"float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
// a mountain skyline: folded noise gives sharp peaks
"float ridge(float x,float s){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*(1.-abs(n1(x)*2.-1.));x=x*2.1+s;a*=.5;}return v;}",
"void main(){",
" vec2 uv=gl_FragCoord.xy/res;float asp=res.x/res.y;vec2 q=vec2(uv.x*asp,uv.y);",
// sky: deep navy above, a cold twilight band and a faint glow of the section colour at the horizon
" vec3 col=mix(vec3(.05,.07,.13),vec3(.018,.024,.05),smoothstep(.15,1.,uv.y));",
" col+=c1*.18*exp(-abs(uv.y-.32)*6.)+vec3(.05,.07,.12)*exp(-abs(uv.y-.32)*5.);",
// moon: upper right, with craters, a darker limb and a wide halo
" vec2 mp=vec2(asp*.86,.80);float mr=.075;vec2 d=q-mp;float md=length(d);",
" float disk=smoothstep(mr,mr-.006,md);",
" float crat=fbm(d*28.+3.)*.6+fbm(d*60.)*.4;",
" vec3 moon=vec3(.72,.76,.86)*(.78+.22*smoothstep(.35,.75,crat))*(1.-.35*smoothstep(.0,mr,md));",
" float halo=exp(-md*7.)*.45+exp(-md*22.)*.45;",
" vec3 halocol=mix(vec3(.55,.65,.95),c2,.25);",
// moonbeams: soft rays fanning down from the moon, slowly shifting
" float ang=atan(d.y,d.x);float rays=pow(n(vec2(ang*7.,t*.05)),3.)*smoothstep(.0,-.6,d.y)*exp(-md*1.6);",
// thin clouds drifting across, lit where they pass near the moon
" float cl=fbm(vec2(q.x*1.6-t*.012,q.y*5.)+vec2(0.,fbm(q*2.+t*.01)));",
" float cloud=smoothstep(.55,.85,cl)*smoothstep(.35,.7,uv.y)*smoothstep(1.,.75,uv.y);",
// aurora: folded noise curtains across the upper sky in the section colour
" float w=fbm(vec2(q.x*1.3+t*.015,q.y*.6-t*.01));",
" float curtain=fbm(vec2(q.x*2.2+w*1.8+t*.03,q.y*1.2));",
" float au=pow(curtain,2.2)*smoothstep(.45,.95,uv.y)*smoothstep(1.2,.7,uv.y+w*.2)*1.15;",
// stars: twinkling, hidden near the moon and behind clouds and aurora
" vec2 sq=q*70.;vec2 g=floor(sq);float sr=h(g);float tw=.5+.5*sin(t*1.4+sr*40.);",
" vec2 so=fract(sq)-.5-(vec2(h(g+7.),h(g+3.))-.5)*.6;float pt=smoothstep(.16,.0,length(so));",
" float star=step(.985,sr)*pt*tw*(1.-smoothstep(.0,.25,halo))*(1.-cloud)*(1.-au)*smoothstep(.3,.6,uv.y);",
" col+=vec3(.78,.85,1.)*star*.7;",
" col+=c1*au*.9+c2*au*au*.4;",
" col+=halocol*halo*.35+vec3(.6,.7,1.)*rays*.12;",
" col=mix(col,vec3(.12,.14,.22)+halocol*halo*.25,cloud*.55);",
" col+=vec3(.8,.85,1.)*cloud*exp(-md*4.)*.35;",
" col=mix(col,moon,disk*(1.-cloud*.6));",
// three mountain ridges, far to near, each darker, with mist drifting between them
" float far=.30+ridge(q.x*1.1+3.,1.3)*.16;",
" float mid=.20+ridge(q.x*1.7+11.,2.7)*.17;",
" float near=.06+ridge(q.x*2.6+27.,5.1)*.16;",
" float mist=fbm(vec2(q.x*1.5-t*.02,uv.y*3.+t*.01));",
" vec3 fogc=mix(vec3(.10,.13,.22),c1*.45+vec3(.06,.08,.14),.5);",
" float rim=exp(-md*1.2)*.5;",
" if(uv.y<far){col=mix(vec3(.08,.10,.18)+halocol*rim*.1,fogc,.4);}",
" if(uv.y<mid){col=mix(vec3(.04,.055,.10)+halocol*rim*.05,fogc,.22+.25*mist*smoothstep(mid-.12,mid,uv.y));}",
" if(uv.y<near){col=vec3(.018,.024,.045)+fogc*.12*mist;}",
// moonlight catching the far and middle skylines
" col+=halocol*.25*rim*(smoothstep(.006,.0,abs(uv.y-far))+smoothstep(.006,.0,abs(uv.y-mid))*.7);",
// Azoth motes: a few soft lights rising slowly in the section colour
" vec2 mq=vec2(q.x*9.,uv.y*6.-t*.08);vec2 mc=floor(mq);float mh=h(mc);",
" vec2 mo=fract(mq)-.5-vec2(sin(t*.3+mh*30.)*.25,(mh-.5)*.4);",
" float mote=step(.86,mh)*exp(-dot(mo,mo)*90.)*(.6+.4*sin(t*2.+mh*50.))*smoothstep(.75,.1,uv.y);",
" col+=c1*mote*.9;",
// soft vignette keeps the edges calm behind the text
" float v=smoothstep(1.3,.35,length((uv-vec2(.5,.6))*vec2(asp*.7,1.)));",
" gl_FragColor=vec4(col*mix(.6,1.,v),1.);",
"}"].join("\n");

function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null}
var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
if(!vs||!fs){cv.remove();return}
var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){cv.remove();return}
gl.useProgram(pr);
var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
var loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
var U={res:gl.getUniformLocation(pr,"res"),t:gl.getUniformLocation(pr,"t"),c1:gl.getUniformLocation(pr,"c1"),c2:gl.getUniformLocation(pr,"c2")};
document.documentElement.classList.add("has-sky");

var SCALE=.5;// render size relative to the screen; the soft look hides the low resolution
function size(){cv.width=Math.max(160,Math.round(innerWidth*SCALE));cv.height=Math.max(120,Math.round(innerHeight*SCALE));gl.viewport(0,0,cv.width,cv.height);draw(last)}
function rgb(hex){var n=parseInt(hex.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
var cur=[rgb("#5CE1E6"),rgb("#B9A4FF")],goal=cur.map(function(c){return c.slice()});
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,start=performance.now(),last=0,prevT=0,raf=0;
function draw(ms){
  for(var k=0;k<2;k++)for(var i=0;i<3;i++)cur[k][i]+=(goal[k][i]-cur[k][i])*.06;
  gl.uniform2f(U.res,cv.width,cv.height);gl.uniform1f(U.t,reduce?40:(ms-start)/1000+40);
  gl.uniform3fv(U.c1,cur[0]);gl.uniform3fv(U.c2,cur[1]);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function frame(ms){
  raf=0;if(document.hidden)return;
  if(ms-prevT>=33){prevT=ms;last=ms;draw(ms)}// about 30 frames a second
  var moving=Math.abs(goal[0][0]-cur[0][0])+Math.abs(goal[0][1]-cur[0][1])+Math.abs(goal[0][2]-cur[0][2])>.005;
  if(!reduce||moving)raf=requestAnimationFrame(frame);
}
function go(){if(!raf)raf=requestAnimationFrame(frame)}
// Change the aurora colours; it fades to them over about a second
App.sky.tint=function(a,b){goal=[rgb(a),rgb(b||a)];go()};
addEventListener("resize",size);
document.addEventListener("visibilitychange",function(){if(!document.hidden)go()});
size();go();
})();
