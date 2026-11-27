(function(root){
"use strict";
const dirs=[["north",0,-1],["east",1,0],["south",0,1],["west",-1,0]];
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function create(seed=Date.now()>>>0){
 const random=rng(seed),w=15,h=9,grid=Array.from({length:h},()=>Array(w).fill(0));
 const room=(x,y,ww,hh)=>{for(let j=y;j<y+hh;j++)for(let i=x;i<x+ww;i++)grid[j][i]=1;};
 room(1,2,4,5);room(6,1,3,7);room(10,2,4,5);grid[4][5]=grid[4][9]=1;
 const enemyY=random()<.5?3:5, treasureY=random()<.5?2:6;
 return {seed,w,h,grid,player:{x:2,y:4,hp:24,max:24,potions:2,gold:0},enemies:[{id:"s1",x:7,y:enemyY,hp:10,max:10,intent:"wait"},{id:"s2",x:11,y:8-enemyY,hp:10,max:10,intent:"wait"}],chest:{x:3,y:treasureY,opened:false},exit:{x:13,y:4},turn:0,outcome:null,message:"The crypt is silent. Find the stairs."};
}
function floor(s,x,y){return s.grid[y]?.[x]===1;}
function enemyAt(s,x,y){return s.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);}
function actions(s){
 if(s.outcome)return [];
 const p=s.player,out=[];
 for(const e of s.enemies)if(e.hp>0&&dist(e,p)===1)out.push({id:"attack:"+e.id,label:"Attack skeleton "+e.id.slice(1)});
 for(const [name,dx,dy] of dirs)if(floor(s,p.x+dx,p.y+dy)&&!enemyAt(s,p.x+dx,p.y+dy))out.push({id:"move:"+name,label:"Move "+name});
 if(!s.chest.opened&&dist(p,s.chest)<=1)out.unshift({id:"chest",label:"Open treasure chest"});
 if(dist(p,s.exit)===0)out.unshift({id:"exit",label:"Descend the stairs"});
 if(s.enemies.some(e=>e.hp>0&&dist(e,p)<=2))out.push({id:"guard",label:"Guard"});
 if(p.potions>0&&p.hp<p.max)out.push({id:"heal",label:"Drink healing draught"});
 return out;
}
function describe(s){const p=s.player;const near=s.enemies.filter(e=>e.hp>0&&dist(e,p)<=5).map(e=>"Skeleton "+e.id.slice(1)+", "+dist(e,p)+" steps away, "+(e.intent==="strike"?"preparing a strike":e.intent==="approach"?"approaching":"waiting"));return [`Health ${p.hp} of ${p.max}. Gold ${p.gold}. Healing draughts ${p.potions}. Position column ${p.x+1}, row ${p.y+1}.`,...near,!s.chest.opened?"Treasure chest "+dist(p,s.chest)+" steps away.":"Treasure collected.","Stairs "+dist(p,s.exit)+" steps away."].join(" ");}
function step(s,id){
 if(!actions(s).some(a=>a.id===id))return s;
 const n=JSON.parse(JSON.stringify(s)),p=n.player,notes=[];n.turn++;
 if(id==="exit"){n.outcome="won";n.message="You escaped the Forgotten Crypt!";return n;}
 if(id.startsWith("move:")){const [name,dx,dy]=dirs.find(d=>d[0]===id.slice(5));p.x+=dx;p.y+=dy;notes.push("Moved "+name+".");}
 if(id.startsWith("attack:")){const e=n.enemies.find(e=>e.id===id.slice(7));e.hp=Math.max(0,e.hp-5);notes.push(e.hp?"Skeleton wounded.":"Skeleton defeated.");if(!e.hp)p.gold+=8;}
 if(id==="chest"){n.chest.opened=true;p.gold+=25;p.potions++;notes.push("Found 25 gold and a healing draught.");}
 if(id==="heal"){p.potions--;p.hp=Math.min(p.max,p.hp+8);notes.push("Recovered health.");}
 if(id==="guard")notes.push("You brace for impact.");
 for(const e of n.enemies){
  if(e.hp<=0)continue;
  if(e.intent==="strike"&&dist(e,p)===1){const damage=id==="guard"?1:4;p.hp=Math.max(0,p.hp-damage);notes.push("Skeleton "+e.id.slice(1)+" hits for "+damage+".");}
  else if(e.intent==="approach"&&dist(e,p)>1&&dist(e,p)<=5){const moves=dirs.map(([,dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(q=>floor(n,q.x,q.y)&&dist(q,p)>0&&!enemyAt(n,q.x,q.y)&&dist(q,p)<dist(e,p));if(moves.length){e.x=moves[0].x;e.y=moves[0].y;}}
  e.intent=dist(e,p)===1?"strike":dist(e,p)<=5?"approach":"wait";
 }
 if(p.hp<=0){n.outcome="lost";notes.push("Your journey ends here.");}
 n.message=notes.join(" ");return n;
}
const api={create,actions,step,describe,floor,dist};if(typeof module!=="undefined")module.exports=api;else root.Dungeon=api;
})(typeof globalThis!=="undefined"?globalThis:this);
