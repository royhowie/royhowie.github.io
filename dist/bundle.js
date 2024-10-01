(()=>{"use strict";var t={81:(t,e)=>{var s;Object.defineProperty(e,"__esModule",{value:!0}),e.BfsFill=e.Grid=e.GridContext=e.Cell=e.Direction=void 0,function(t){t[t.UP=1]="UP",t[t.RIGHT=2]="RIGHT",t[t.DOWN=4]="DOWN",t[t.LEFT=8]="LEFT"}(s||(e.Direction=s={}));class n{x;y;paths=new Map;constructor(t,e){this.x=t,this.y=e}visited(){return this.paths.size>0}walkTo(t,e){switch(this.paths.set(t,e),t){case s.UP:e.paths.set(s.DOWN,this);break;case s.DOWN:e.paths.set(s.UP,this);break;case s.LEFT:e.paths.set(s.RIGHT,this);break;case s.RIGHT:e.paths.set(s.LEFT,this)}}}e.Cell=n,e.GridContext=class{rows;cols;constructor(t,e){this.rows=t,this.cols=e}};class o{ctx;grid=[];constructor(t){this.ctx=t;for(let t=0;t<this.ctx.rows;t++)for(let e=0;e<this.ctx.cols;e++)this.grid[t*this.ctx.cols+e]=new n(t,e)}get(t,e){if(!(t<0||t>=this.ctx.rows||e<0||e>=this.ctx.cols))return this.grid[e+t*this.ctx.cols]}}e.Grid=o,e.BfsFill=class{ctx;constructor(t){this.ctx=t}newGrid(){const t=new o(this.ctx);return this.step(t.get(0,0),t),t}options(t,e){return[[e.get(t.x-1,t.y),s.UP],[e.get(t.x+1,t.y),s.DOWN],[e.get(t.x,t.y-1),s.LEFT],[e.get(t.x,t.y+1),s.RIGHT]].filter((([t,e])=>t&&!t.visited()))}step(t,e){for(;;){const s=this.options(t,e);if(!s.length)break;const[n,o]=s[Math.random()*s.length|0];t.walkTo(o,n),this.step(n,e)}}}},73:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.Painter=e.RandomWalk=e.BfsWalk=e.WaveStrategy=e.Step=e.PAINT_OFFSET=e.BOX_WIDTH=e.BAR_WIDTH=e.GAP=e.BAR_COLOR=void 0;const n=s(81);e.BAR_COLOR="#4682b4",e.GAP=4,e.BAR_WIDTH=32,e.BOX_WIDTH=e.GAP+e.BAR_WIDTH,e.PAINT_OFFSET=e.BOX_WIDTH/2|0;class o{strokes;constructor(t){this.strokes=t}}e.Step=o,e.WaveStrategy=class{zigzag;zip;constructor(t,e){this.zigzag=t,this.zip=e}generate(t,e){const s=[],n=e.rows+e.cols-1;let a=Math.random()<.5;for(let r=0;r<n;r++){const n=[],i=Math.min(r,e.rows-1),c=r<e.rows-1?0:r-e.rows+1;for(let s=0;s+c<e.cols&&i>=s;s++)n.push(t.get(i-s,s+c));this.zigzag&&(a&&n.reverse(),a=!a),this.zip?n.forEach((t=>s.push(new o(new Map([[t,new Set(t.paths.keys())]]))))):s.push(new o(new Map(n.map((t=>[t,new Set(t.paths.keys())])))))}return s}},e.BfsWalk=class{generate(t,e){const s=[];let n=[t.get(0,0)];const a=new Set;for(;n.length;){const t=[],e=new o(new Map);n.forEach((s=>{s&&!a.has(s)&&(a.add(s),e.strokes.set(s,new Set(s.paths.keys())),t.push(...s.paths.values()))})),n=t,s.push(e)}return s}};class a{concurrentCells;constructor(t){this.concurrentCells=t}generate(t,e){const s=[],n=[];for(let s=0;s<e.rows;s++)for(let o=0;o<e.cols;o++)n.push(t.get(s,o));a.shuffle(n);let r=0;for(;r<n.length;){const t=new Map;for(let e=0;e<this.concurrentCells&&r+e<n.length;e++){const s=n[r+e];t.set(s,new Set(s.paths.keys()))}s.push(new o(t)),r+=this.concurrentCells}return s}static shuffle(t){for(let e=t.length-1;e>0;e--){const s=Math.floor(Math.random()*(e+1)),n=t[e];t[e]=t[s],t[s]=n}}}e.RandomWalk=a;const r=e.GAP+1.5*e.BAR_WIDTH;class i{canvas;static STEPS=1;constructor(t){this.canvas=t}paint(t,e,s,n){window.requestAnimationFrame((()=>this.drawFrame(1,t,n)))}drawFrame(t,s,o){if(t>i.STEPS)return o();const a=(t-1)/i.STEPS*r,c=r/i.STEPS;for(const[t,o]of s.strokes){let s=e.BOX_WIDTH*t.y,r=e.BOX_WIDTH*t.x;0===t.x&&0===t.y&&(this.canvas.moveTo(e.GAP/2-e.PAINT_OFFSET,0),this.canvas.lineTo(e.BOX_WIDTH,0)),o.forEach((t=>{switch(t){case n.Direction.UP:this.canvas.moveTo(s,r-a),this.canvas.lineTo(s,r-a-c);break;case n.Direction.DOWN:this.canvas.moveTo(s,r+a),this.canvas.lineTo(s,r+a+c);break;case n.Direction.LEFT:this.canvas.moveTo(s-a,r),this.canvas.lineTo(s-a-c,r);break;case n.Direction.RIGHT:this.canvas.moveTo(s+a,r),this.canvas.lineTo(s+a+c,r)}}))}this.canvas.stroke(),window.requestAnimationFrame((()=>this.drawFrame(t+1,s,o)))}}e.Painter=i}},e={};function s(n){var o=e[n];if(void 0!==o)return o.exports;var a=e[n]={exports:{}};return t[n](a,a.exports,s),a.exports}(()=>{const t=s(81),e=s(73);document.addEventListener("DOMContentLoaded",(function(){const s=document.body.getBoundingClientRect(),n=document.createElement("canvas"),o=s.height+10,a=s.width+10;document.body.appendChild(n),n.height=o,n.width=a,n.id="canvas";const r=n.getContext("2d");var i=window.devicePixelRatio||1;n.style.width=n.width+"px",n.style.height=n.height+"px",n.width*=i,n.height*=i,r.setTransform(i,0,0,i,0,0),r.translate(e.PAINT_OFFSET,e.PAINT_OFFSET),r.strokeStyle=e.BAR_COLOR,r.lineWidth=e.BAR_WIDTH,console.log("starting generation");const c=new t.GridContext(Math.ceil(o/e.BOX_WIDTH),Math.ceil(a/e.BOX_WIDTH)),h=new t.BfsFill(c).newGrid(),l=function(){const t=[new e.BfsWalk,new e.RandomWalk(50),new e.WaveStrategy(!0,!1),new e.WaveStrategy(!0,!0)];return t[t.length*Math.random()|0]}(),d=new e.Painter(r),w=l.generate(h,c);!function t(e,s){if(e===w.length)return s();d.paint(w[e],h,c,(()=>t(e+1,s)))}(0,(()=>console.log("done painting!",s,h)))}))})()})();