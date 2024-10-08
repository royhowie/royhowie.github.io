(()=>{"use strict";var t={81:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.RecursiveDivide=e.Ellers=e.DfsFill=e.Grid=e.GridContext=e.Cell=e.Direction=void 0;const n=s(840);var o;!function(t){t[t.UP=1]="UP",t[t.RIGHT=2]="RIGHT",t[t.DOWN=4]="DOWN",t[t.LEFT=8]="LEFT"}(o||(e.Direction=o={}));class r{x;y;paths=new Map;constructor(t,e){this.x=t,this.y=e}visited(){return this.paths.size>0}walkTo(t,e){switch(this.paths.set(t,e),t){case o.UP:e.paths.set(o.DOWN,this);break;case o.DOWN:e.paths.set(o.UP,this);break;case o.LEFT:e.paths.set(o.RIGHT,this);break;case o.RIGHT:e.paths.set(o.LEFT,this)}}}e.Cell=r,e.GridContext=class{rows;cols;constructor(t,e){this.rows=t,this.cols=e}};class i{ctx;grid=[];constructor(t){this.ctx=t;for(let t=0;t<this.ctx.rows;t++)for(let e=0;e<this.ctx.cols;e++)this.grid[t*this.ctx.cols+e]=new r(t,e)}get(t,e){if(!(t<0||t>=this.ctx.rows||e<0||e>=this.ctx.cols))return this.grid[e+t*this.ctx.cols]}}e.Grid=i,e.DfsFill=class{ctx;constructor(t){this.ctx=t}newGrid(){const t=new i(this.ctx);return this.step(t.get(0,0),t),t}options(t,e){return[[e.get(t.x-1,t.y),o.UP],[e.get(t.x+1,t.y),o.DOWN],[e.get(t.x,t.y-1),o.LEFT],[e.get(t.x,t.y+1),o.RIGHT]].filter((([t,e])=>t&&!t.visited()))}step(t,e){for(;;){const s=this.options(t,e);if(!s.length)break;const[o,r]=s[(0,n.random)(0,s.length)];t.walkTo(r,o),this.step(o,e)}}},e.Ellers=class{ctx;constructor(t){this.ctx=t}newGrid(){const t=new i(this.ctx);for(let e=0;e<this.ctx.rows-1;e++)this.join(t,e),this.descend(t,e);for(let e=0;e<this.ctx.cols-1;e++)this.connectColumn(t,this.ctx.rows-1,e);return t}descend(t,e){for(let s=0;s<this.ctx.cols;s++){let r=s,i=t.get(e,s);for(;i=i?.paths.get(o.RIGHT);)r=i.y;const c=(0,n.random)(s,r+1);t.get(e,c).walkTo(o.DOWN,t.get(e+1,c)),s=r}}join(t,e){for(let s=0;s<this.ctx.cols-1;s++)0===(0,n.random)(0,2)&&this.connectColumn(t,e,s)}connectColumn(t,e,s){t.get(e,s).walkTo(o.RIGHT,t.get(e,s+1))}},e.RecursiveDivide=class{ctx;constructor(t){this.ctx=t}newGrid(){const t=new i(this.ctx);return this.divide(t,0,0,this.ctx.rows,this.ctx.cols),t}divide(t,e,s,r,i){if(r!==e+1)if(i!==s+1)if(window.crypto.getRandomValues(new Uint8Array(1))[0]%2==0){const c=(0,n.random)(e+1,r),a=(0,n.random)(s,i);t.get(c-1,a).walkTo(o.DOWN,t.get(c,a)),this.divide(t,e,s,c,i),this.divide(t,c,s,r,i);for(let e=s;e<i-1;e++){const s=t.get(c-1,e),n=t.get(c-1,e+1);0==n.paths.size&&s.walkTo(o.RIGHT,n)}}else{const c=(0,n.random)(e,r),a=(0,n.random)(s+1,i);t.get(c,a-1).walkTo(o.RIGHT,t.get(c,a)),this.divide(t,e,s,r,a),this.divide(t,e,a,r,i);for(let s=e;s<r-1;s++){const e=t.get(s,a-1),n=t.get(s+1,a-1);0==n.paths.size&&e.walkTo(o.DOWN,n)}}else for(let n=e;n<r-1;n++)t.get(n,s).walkTo(o.DOWN,t.get(n+1,s));else for(let n=s;n<i-1;n++)t.get(e,n).walkTo(o.RIGHT,t.get(e,n+1))}}},840:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.random=function(t,e){return t+window.crypto.getRandomValues(new Uint8Array(1))[0]%(e-t)}},73:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.Painter=e.Spiraled=e.RandomWalk=e.LinearWalk=e.BfsWalk=e.WaveStrategy=e.Step=e.PAINT_OFFSET=e.BOX_WIDTH=e.BAR_WIDTH=e.GAP=e.BAR_COLOR=void 0;const n=s(81),o=s(840);e.BAR_COLOR="#4682b4",e.GAP=2,e.BAR_WIDTH=32,e.BOX_WIDTH=e.GAP+e.BAR_WIDTH,e.PAINT_OFFSET=e.BOX_WIDTH/2|0;class r{strokes;constructor(t){this.strokes=t}}e.Step=r,e.WaveStrategy=class{zigzag;zip;constructor(t,e){this.zigzag=t,this.zip=e}generate(t,e){const s=[],n=e.rows+e.cols-1;let o=Math.random()<.5;for(let i=0;i<n;i++){const n=[],c=Math.min(i,e.rows-1),a=i<e.rows-1?0:i-e.rows+1;for(let s=0;s+a<e.cols&&c>=s;s++)n.push(t.get(c-s,s+a));this.zigzag&&(o&&n.reverse(),o=!o),this.zip?n.forEach((t=>s.push(new r(new Map([[t,new Set(t.paths.keys())]]))))):s.push(new r(new Map(n.map((t=>[t,new Set(t.paths.keys())])))))}return s}},e.BfsWalk=class{generate(t,e){const s=[];let n=[t.get(0,0)];const o=new Set;for(;n.length;){const t=[],e=new r(new Map);n.forEach((s=>{s&&!o.has(s)&&(o.add(s),e.strokes.set(s,new Set(s.paths.keys())),t.push(...s.paths.values()))})),n=t,s.push(e)}return s}},e.LinearWalk=class{glompingFactor;constructor(t){this.glompingFactor=t}generate(t,e){const s=[];for(let n=0;n<e.cols;n++)for(let o=0;o<Math.max(1,e.rows/this.glompingFactor);o++){const e=new r(new Map);for(let s=0;s<this.glompingFactor;s++){const r=t.get(o*this.glompingFactor+s,n);r&&e.strokes.set(r,new Set(r.paths.keys()))}s.push(e)}return s}};class i{concurrentCells;constructor(t){this.concurrentCells=t}generate(t,e){const s=[],n=[];for(let s=0;s<e.rows;s++)for(let o=0;o<e.cols;o++)n.push(t.get(s,o));i.shuffle(n);let o=0;for(;o<n.length;){const t=new Map;for(let e=0;e<this.concurrentCells&&o+e<n.length;e++){const s=n[o+e];t.set(s,new Set(s.paths.keys()))}s.push(new r(t)),o+=this.concurrentCells}return s}static shuffle(t){for(let e=t.length-1;e>0;e--){const s=(0,o.random)(0,e+1),n=t[e];t[e]=t[s],t[s]=n}}}e.RandomWalk=i,e.Spiraled=class{centers;zip;constructor(t,e){this.centers=t,this.zip=e}generate(t,e){const s=Array.from({length:this.centers},(()=>[(0,o.random)(0,e.rows),(0,o.random)(0,e.cols)])),r=[];let i=0;const c=new Set;for(;c.size<e.rows*e.cols;){const e=[],o=[],a=[],l=[];for(let r=0;r<s.length;r++){const[h,d]=s[r];0==i?this.appendTo(e,this.walkDirection(t,c,h,d+i,n.Direction.UP,1)):(this.appendTo(e,this.walkDirection(t,c,h,d+i,n.Direction.UP,i)),this.appendTo(o,this.walkDirection(t,c,h-i,d,n.Direction.RIGHT,i)),this.appendTo(a,this.walkDirection(t,c,h,d-i,n.Direction.DOWN,i)),this.appendTo(l,this.walkDirection(t,c,h+i,d,n.Direction.LEFT,i)))}r.push(...e,...o,...a,...l),i++}return r}appendTo(t,e){if(this.zip&&t.length){const s=Math.min(t.length,e.length);for(let n=0;n<s;n++)e[n].strokes.forEach(((e,s)=>{t[n].strokes.set(s,e)}));for(let n=s;n<e.length;n++)t.push(e[n])}else t.push(...e)}walkDirection(t,e,s,n,o,i){const c=this.tuple(o),a=[];for(let o=0;o<i;o++){const i=t.get(s+c[0]*o,n+c[1]*o);if(i&&!e.has(i)){e.add(i);const t=new Map;t.set(i,new Set(i.paths.keys())),a.push(new r(t))}}return a}tuple(t){switch(t){case n.Direction.UP:return[-1,-1];case n.Direction.RIGHT:return[1,-1];case n.Direction.DOWN:return[1,1];case n.Direction.LEFT:return[-1,1]}}};class c{canvas;static STEPS=1;constructor(t){this.canvas=t}paint(t,e,s,n){window.requestAnimationFrame((()=>this.drawFrame(1,s,t,n)))}outOfBoundsDraw(t,e,s,o){switch(s){case n.Direction.UP:return 0===t;case n.Direction.DOWN:return t===o.cols-1;case n.Direction.LEFT:return 0===e;case n.Direction.RIGHT:return e===o.rows-1}}drawFrame(t,s,o,r){if(t>c.STEPS)return r();for(const[r,i]of o.strokes)i.forEach((o=>{const i=1+(this.outOfBoundsDraw(r.x,r.y,o,s)?e.BAR_WIDTH:e.BOX_WIDTH),a=i*(t-1)/c.STEPS,l=i/c.STEPS;this.canvas.beginPath();let h=e.BOX_WIDTH*r.x,d=e.BOX_WIDTH*r.y;switch(o){case n.Direction.LEFT:h+=e.BAR_WIDTH/2,d+=e.BAR_WIDTH,this.canvas.moveTo(h,d-a),this.canvas.lineTo(h,d-a-l);break;case n.Direction.RIGHT:h+=e.BAR_WIDTH/2,d+=0,this.canvas.moveTo(h,d+a),this.canvas.lineTo(h,d+a+l);break;case n.Direction.UP:h+=e.BAR_WIDTH,d+=e.BAR_WIDTH/2,this.canvas.moveTo(h-a,d),this.canvas.lineTo(h-a-l,d);break;case n.Direction.DOWN:h+=0,d+=e.BAR_WIDTH/2,this.canvas.moveTo(h+a,d),this.canvas.lineTo(h+a+l,d)}this.canvas.stroke()}));window.requestAnimationFrame((()=>this.drawFrame(t+1,s,o,r)))}}e.Painter=c}},e={};function s(n){var o=e[n];if(void 0!==o)return o.exports;var r=e[n]={exports:{}};return t[n](r,r.exports,s),r.exports}(()=>{const t=s(81),e=s(73);document.addEventListener("DOMContentLoaded",(function(){const s=document.body.getBoundingClientRect(),n=document.createElement("canvas"),o=window.devicePixelRatio||1,r=s.height-e.GAP,i=s.width-e.GAP,c=Math.floor(i/e.BOX_WIDTH),a=Math.floor(r/e.BOX_WIDTH),l=c*e.BOX_WIDTH,h=a*e.BOX_WIDTH;document.body.appendChild(n),n.height=o*r,n.width=o*i;const d=n.getContext("2d");d.setTransform(i/l,0,0,r/h,e.GAP,e.GAP),d.strokeStyle=e.BAR_COLOR,d.lineWidth=e.BAR_WIDTH,console.log("starting generation");const w=new t.GridContext(c,a),u=function(e){const s=[new t.DfsFill(e),new t.Ellers(e),new t.RecursiveDivide(e)];return s[s.length*Math.random()|0]}(w).newGrid(),g=function(){const t=[new e.BfsWalk,new e.RandomWalk(50),new e.LinearWalk(3),new e.Spiraled(10,!0),new e.WaveStrategy(!0,!1),new e.WaveStrategy(!0,!0)];return t[t.length*Math.random()|0]}(),p=new e.Painter(d),T=g.generate(u,w);!function t(e,s){if(e===T.length)return s();p.paint(T[e],u,w,(()=>t(e+1,s)))}(0,(()=>console.log("done painting!",s,u)))}))})()})();