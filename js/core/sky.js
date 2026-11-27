// Live background: a slow aurora over a night sky with faint stars, drawn with WebGL behind every page.
// Tinted with the colour of the section or skill you are on. Renders at low resolution and about 30 frames
// a second, pauses when the tab is hidden, holds still for reduced motion, and simply does nothing without WebGL.
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
"float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
" return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
"float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
"void main(){",
" vec2 uv=gl_FragCoord.xy/res;float asp=res.x/res.y;vec2 q=vec2(uv.x*asp,uv.y);",
// night sky: deep blue-teal at the bottom, a little lighter at the top
" vec3 col=mix(vec3(.045,.06,.11),vec3(.075,.095,.17),uv.y);",
// aurora curtains: folded noise, strongest across the top third, drifting slowly
" float w=fbm(vec2(q.x*1.3+t*.015,q.y*.6-t*.01));",
" float curtain=fbm(vec2(q.x*2.2+w*1.8+t*.03,q.y*1.2));",
" float band=smoothstep(.25,.95,uv.y)*smoothstep(1.15,.55,uv.y+w*.2);",
" float a=pow(curtain,1.9)*band;",
" col+=c1*a*1.05+c2*pow(fbm(q*1.6-t*.012),2.6)*smoothstep(.0,.8,1.-uv.y)*.45;",
// stars: sparse, twinkling, hidden behind the brightest aurora
" vec2 g=floor(q*90.);float s=h(g);float tw=.5+.5*sin(t*1.3+s*40.);",
" col+=vec3(.75,.82,1.)*step(.9965,s)*tw*(1.-a*1.5)*.6;",
// soft vignette keeps edges calm behind the text
" float v=smoothstep(1.25,.35,length((uv-vec2(.5,.62))*vec2(asp*.7,1.)));",
" gl_FragColor=vec4(col*mix(.55,1.,v),1.);",
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

var SCALE=.35;// render size relative to the screen; the soft look hides the low resolution
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
