/* Original procedural crypt artwork. Simulation state is read-only. */
(function(){
const C=64,OX=0,OY=32, hash=(x,y,k=0)=>{let n=Math.imul(x+17,73856093)^Math.imul(y+31,19349663)^Math.imul(k+7,83492791);return (n>>>0)%997/997;};
function poly(g,pts,color,stroke){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}}
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function ellipse(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
function glow(g,x,y,r,c){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,c);gr.addColorStop(1,"transparent");g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function stone(g,x,y,i,j){
 const v=Math.floor(31+hash(i,j)*15);
 rect(g,x,y,C,C,"#141b22");rect(g,x+2,y+2,60,60,`rgb(${v},${v+5},${v+8})`);
 const cut=18+Math.floor(hash(i,j,1)*23);rect(g,x+3,y+cut,58,2,"#182027");rect(g,x+cut,y+3,2,cut-3,"#182027");rect(g,x+60-cut,y+cut+3,2,58-cut,"#182027");
 rect(g,x+3,y+3,57,1,"#525758");rect(g,x+3,y+cut+2,56,1,"#42494b");
 for(let k=0;k<10;k++){let a=4+Math.floor(hash(i,j,k+2)*54),b=4+Math.floor(hash(j,i,k+22)*54);rect(g,x+a,y+b,2+Math.floor(hash(i,k,j)*5),1,k%2?"#4b5051":"#20262b");}
 if(hash(i,j,31)>.83)poly(g,[[x+8,y+40],[x+15,y+35],[x+21,y+40],[x+12,y+48]],"#424746");
}
function wall(g,x,y,i,j){
 rect(g,x,y,64,64,"#171d25");rect(g,x+1,y+2,62,36,"#333c43");rect(g,x+2,y+3,60,3,"#545d5f");
 for(let row=0;row<3;row++){let yy=y+7+row*17;for(let col=-1;col<3;col++){let xx=x+col*32+(row%2?16:0);let l=Math.max(x+2,xx+1),r=Math.min(x+62,xx+31);if(r<=l)continue;const v=36+Math.floor(hash(i+col,j,row)*12);rect(g,l,yy,r-l,15,`rgb(${v},${v+6},${v+9})`);rect(g,l,yy,r-l,1,"#5a5e5d");}}
 rect(g,x,y+58,64,5,"#0d131a");
}
function torch(g,x,y,t,motion){
 ellipse(g,x,y+14,11,5,"#100e0d");rect(g,x-3,y-6,6,23,"#82502b");rect(g,x-5,y-8,10,6,"#b79358");let f=motion?0:Math.sin(t/140)*2;
 glow(g,x,y-13,85,"rgba(255,140,51,.13)");poly(g,[[x-7,y-8],[x-9,y-17],[x-2,y-28-f],[x+1,y-19],[x+6,y-23],[x+8,y-12],[x+3,y-6]],"#d96628");poly(g,[[x-4,y-9],[x-3,y-18],[x+1,y-23-f],[x+5,y-12],[x+2,y-7]],"#ffdb77");
}
function figure(g,x,y,kind,idx){
 ellipse(g,x,y+12,20,8,"rgba(0,0,0,.55)");
 if(kind==="hero"){
  poly(g,[[x-14,y-18],[x+10,y-18],[x+17,y+14],[x-17,y+14]],"#375c75","#101820");
  poly(g,[[x-11,y-19],[x+11,y-19],[x+9,y+1],[x-9,y+1]],"#a5a9a0","#29333a");
  rect(g,x-11,y+1,22,5,"#694c2d");rect(g,x-3,y+1,6,5,"#d3ad61");
  rect(g,x-10,y+6,8,10,"#252d32");rect(g,x+3,y+6,8,10,"#252d32");
  poly(g,[[x-12,y-31],[x-7,y-38],[x+7,y-38],[x+12,y-31],[x+10,y-20],[x-10,y-20]],"#bcc2bd","#3d484a");
  rect(g,x-7,y-28,14,5,"#293039");rect(g,x-1,y-29,2,8,"#d8c6a1");
  poly(g,[[x-22,y-14],[x-10,y-10],[x-11,y+4],[x-17,y+9],[x-24,y+1]],"#536f82","#d0c7a8");
  poly(g,[[x+12,y+4],[x+24,y-27],[x+28,y-31],[x+29,y-24],[x+18,y+7]],"#dbe2df","#536168");rect(g,x+10,y+3,12,4,"#c99b4c");
  ellipse(g,x,y+17,18,4,"rgba(102,210,229,.45)");
 }else{
  rect(g,x-3,y-15,6,22,"#c3b99c");for(let j=0;j<3;j++){rect(g,x-9,y-14+j*5,18,3,"#d4cbb1");}
  rect(g,x-10,y+5,5,11,"#b5aa91");rect(g,x+5,y+5,5,11,"#b5aa91");rect(g,x-15,y-13,5,18,"#c3b99c");rect(g,x+10,y-13,5,18,"#c3b99c");
  poly(g,[[x-13,y-30],[x-8,y-35],[x+8,y-35],[x+13,y-30],[x+12,y-20],[x+7,y-17],[x-7,y-17],[x-12,y-20]],"#e0d5b7","#57564b");
  rect(g,x-8,y-28,6,5,"#302927");rect(g,x+2,y-28,6,5,"#302927");rect(g,x-1,y-23,2,4,"#524c40");rect(g,x-6,y-19,12,3,"#9e927d");
  poly(g,[[x+14,y+7],[x+24,y-22],[x+28,y-25],[x+28,y-18],[x+19,y+8]],"#9da7a5","#536168");
  if(idx.type==="sentinel"||idx.type==="boss"){poly(g,[[x-14,y-17],[x+14,y-17],[x+11,y+3],[x-11,y+3]],idx.type==="boss"?"#68465c":"#54666e","#c5a46a");rect(g,x-4,y-16,8,17,"#c3a263");}if(idx.type==="boss"){poly(g,[[x-14,y-30],[x-15,y-43],[x-6,y-37],[x,y-46],[x+6,y-37],[x+15,y-43],[x+14,y-30]],"#c6a35f","#493426");glow(g,x,y-28,25,"rgba(214,82,153,.25)");rect(g,x-8,y-28,6,4,"#fa9ac6");rect(g,x+2,y-28,6,4,"#fa9ac6");}rect(g,x-10,y-49,20,3,"#4a2525");rect(g,x-10,y-49,20*idx.hp/idx.max,3,"#f38a76");
 }
}
window.CryptArt={draw(canvas,s,time,reduced){
 const g=canvas.getContext("2d");g.clearRect(0,0,960,600);rect(g,0,0,960,600,"#10151b");const cx=x=>OX+x*C+C/2,cy=y=>OY+y*C+C/2;
 for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++){
  if(s.grid[y][x])stone(g,OX+x*C,OY+y*C,x,y);
  else if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>s.grid[y+dy]?.[x+dx]))wall(g,OX+x*C,OY+y*C,x,y);
 }
 // Inlaid threshold, crypt pillars, urns and brazier niches.
 for(const [x,y] of [[1,2],[4,2],[6,1],[8,7],[10,2],[13,6]]){
  if(!s.grid[y]?.[x])continue;const px=cx(x),py=cy(y);ellipse(g,px,py+9,17,8,"#171c20");rect(g,px-11,py-21,22,29,"#474d4e");rect(g,px-8,py-22,4,27,"#717475");rect(g,px-14,py-25,28,6,"#88877a");rect(g,px-14,py+5,28,5,"#565d5b");
 }
 for(const [x,y] of [[1,3],[4,5],[6,2],[8,6],[10,3],[13,5]])if(s.grid[y]?.[x])torch(g,cx(x)-19,cy(y)-21,time,reduced);
 if(s.depth>1){rect(g,0,0,960,600,s.depth===2?"rgba(39,86,103,.10)":"rgba(109,37,76,.12)");}const p=s.player;const light=g.createRadialGradient(cx(p.x),cy(p.y),18,cx(p.x),cy(p.y),360);light.addColorStop(0,"rgba(8,12,22,0)");light.addColorStop(1,"rgba(8,12,22,.25)");g.fillStyle=light;g.fillRect(0,0,960,600);
 const ex=cx(s.exit.x),ey=cy(s.exit.y);glow(g,ex,ey,62,"rgba(113,211,219,.20)");rect(g,ex-24,ey-23,48,46,"#10191f");for(let i=0;i<5;i++){rect(g,ex-21+i*2,ey-20+i*8,42-i*4,5,"#64787e");}rect(g,ex-24,ey-24,48,2,"#c5dedb");if(s.depth===3){const locked=s.enemies.some(e=>e.type==="boss"&&e.hp>0);glow(g,ex,ey,55,locked?"rgba(190,67,92,.30)":"rgba(248,185,72,.40)");poly(g,[[ex-12,ey-9],[ex+12,ey-9],[ex+18,ey+10],[ex-18,ey+10]],locked?"#81545e":"#d8af61","#34271b");rect(g,ex-3,ey+10,6,5,"#c9a96c");if(locked){g.strokeStyle="#ef9a9a";g.lineWidth=3;g.strokeRect(ex-24,ey-24,48,48);}}
 if(!s.chest.opened){const x=cx(s.chest.x),y=cy(s.chest.y);glow(g,x,y,42,"rgba(248,185,72,.20)");ellipse(g,x,y+12,21,6,"#101519");rect(g,x-18,y-9,36,23,"#654526");rect(g,x-18,y-13,36,8,"#976434");for(const dx of [-13,10])rect(g,x+dx,y-13,4,26,"#cda05b");rect(g,x-3,y-4,6,8,"#e3c176");}
 for(const e of s.enemies)if(e.hp>0&&e.intent==="strike"){g.strokeStyle="#ffb18a";g.lineWidth=3;g.setLineDash([6,5]);g.strokeRect(cx(p.x)-28,cy(p.y)-28,56,56);g.setLineDash([]);}
 const figures=[...s.enemies.filter(e=>e.hp>0).map(e=>({...e,kind:"enemy"})),{...p,kind:"hero"}].sort((a,b)=>a.y-b.y);
 for(const f of figures)figure(g,cx(f.x),cy(f.y),f.kind,f);
 const v=g.createRadialGradient(480,300,220,480,300,570);v.addColorStop(0,"transparent");v.addColorStop(1,"rgba(5,7,12,.45)");g.fillStyle=v;g.fillRect(0,0,960,600);
}};
})();
