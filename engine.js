(function(root){
"use strict";
const dirs=[["north",0,-1],["east",1,0],["south",0,1],["west",-1,0]];
const FLOORS=["The Forgotten Crypt","The Bone Vault","The Bellkeeper's Sanctum"];
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const living=s=>s.enemies.filter(e=>e.hp>0);
function populate(s,depth){
 const random=rng((s.seed+Math.imul(depth-1,0x9e3779b9))>>>0),w=15,h=9,grid=Array.from({length:h},()=>Array(w).fill(0));
 const room=(x,y,ww,hh)=>{for(let j=y;j<y+hh;j++)for(let i=x;i<x+ww;i++)grid[j][i]=1;};
 room(1,2,4,5);room(6,1,3,7);room(10,2,4,5);
 const corridor=()=>depth===1?4:3+Math.floor(random()*3);
 grid[corridor()][5]=grid[corridor()][9]=1;
 const enemyY=random()<.5?3:5,treasureY=random()<.5?2:6;
 const enemy=(id,name,x,y,hp,damage,type)=>({id,name,x,y,hp,max:hp,damage,type,intent:"wait"});
 const enemies=[enemy("s1","Skeleton 1",7,enemyY,10,4,"skeleton"),enemy("s2",depth===1?"Skeleton 2":"Crypt sentinel",11,8-enemyY,depth===1?10:15,depth===1?4:6,depth===1?"skeleton":"sentinel")];
 if(depth===2)enemies.push(enemy("s3","Skeleton 3",8,8-enemyY,10,4,"skeleton"));
 if(depth===3)enemies[1]=enemy("s2","The Bellkeeper",12,4,26,8,"boss");
 return {...s,w,h,grid,depth,player:{...s.player,x:2,y:4},enemies,chest:{x:3,y:treasureY,opened:false},exit:{x:13,y:4},phase:"explore"};
}
function create(seed=Date.now()>>>0){return populate({seed,player:{hp:24,max:24,potions:2,gold:0,attack:5,kills:0},turn:0,outcome:null,message:"The crypt is silent. Find the stairs."},1);}
function floor(s,x,y){return s.grid[y]?.[x]===1;}
function enemyAt(s,x,y){return living(s).find(e=>e.x===x&&e.y===y);}
function sealed(s){return s.depth===3&&living(s).some(e=>e.type==="boss");}
function intention(e){return e.intent==="strike"?"preparing a strike for "+e.damage+" damage":e.intent==="approach"?"approaching":e.intent==="recover"?"recovering from a strike":"waiting";}
function threats(s){return living(s).filter(e=>e.intent==="strike").map(e=>e.name+" preparing a strike for "+e.damage+" damage").join(" · ");}
function actions(s){
 if(s.outcome)return [];
 if(s.phase==="upgrade")return [{id:"upgrade:blade",label:"Sharpen blade: +2 attack"},{id:"upgrade:vitality",label:"Vitality blessing: +6 maximum and current health"},{id:"upgrade:supplies",label:"Rest and resupply: heal 8, gain 2 draughts"}];
 const p=s.player,out=[];
 for(const e of living(s))if(dist(e,p)===1)out.push({id:"attack:"+e.id,label:"Attack "+e.name+" ("+e.hp+" health)"});
 if(living(s).some(e=>e.intent==="strike"&&dist(e,p)===1))out.push({id:"guard",label:"Guard and counter"});
 for(const [name,dx,dy] of dirs)if(floor(s,p.x+dx,p.y+dy)&&!enemyAt(s,p.x+dx,p.y+dy))out.push({id:"move:"+name,label:"Move "+name});
 if(!s.chest.opened&&dist(p,s.chest)<=1)out.unshift({id:"chest",label:"Open treasure chest"});
 if(dist(p,s.exit)===0&&!sealed(s))out.unshift({id:"exit",label:s.depth===3?"Claim the Bell of Dawn":"Descend the stairs"});
 if(p.potions>0&&p.hp<p.max)out.push({id:"heal",label:"Drink healing draught"});
 return out;
}
function describe(s){const p=s.player;const near=living(s).filter(e=>dist(e,p)<=5).map(e=>e.name+", "+e.hp+" health, "+dist(e,p)+" steps away, "+intention(e)+".");return [FLOORS[s.depth-1]+", floor "+s.depth+" of 3. Health "+p.hp+" of "+p.max+". Attack "+p.attack+". Gold "+p.gold+". Healing draughts "+p.potions+". Position column "+(p.x+1)+", row "+(p.y+1)+".",...near,!s.chest.opened?"Treasure chest "+dist(p,s.chest)+" steps away.":"Treasure collected.",sealed(s)?"Defeat the Bellkeeper to unseal the relic.":"Stairs or relic "+dist(p,s.exit)+" steps away."].join(" ");}
function hurt(s,e,damage,notes){e.hp=Math.max(0,e.hp-damage);if(e.hp){notes.push(e.name+" wounded for "+damage+".");}else{s.player.gold+=e.type==="boss"?40:e.type==="sentinel"?15:8;s.player.kills++;notes.push(e.name+" defeated."+ (e.type==="boss"?" The Bell of Dawn is unsealed.":""));}}
function step(s,id){
 if(!actions(s).some(a=>a.id===id))return s;
 const n=JSON.parse(JSON.stringify(s)),p=n.player,notes=[];
 if(n.phase==="upgrade"){
  if(id==="upgrade:blade"){p.attack+=2;notes.push("Blade sharpened.");}
  if(id==="upgrade:vitality"){p.max+=6;p.hp+=6;notes.push("Vitality increased.");}
  if(id==="upgrade:supplies"){p.potions+=2;p.hp=Math.min(p.max,p.hp+8);notes.push("Rested and resupplied.");}
  const next=populate(n,n.depth+1);next.message=notes.join(" ")+" Entered "+FLOORS[next.depth-1]+". "+(next.depth===3?"Defeat the Bellkeeper and claim the Bell of Dawn.":"Find the next stairs.");return next;
 }
 n.turn++;
 if(id==="exit"){
  if(n.depth===3){n.outcome="won";n.message="The Bell of Dawn is yours! You conquered all three floors. "+p.kills+" enemies defeated; "+p.gold+" gold collected.";}
  else{n.phase="upgrade";n.message="Floor "+n.depth+" cleared. Choose one blessing before descending.";}
  return n;
 }
 if(id.startsWith("move:")){const [name,dx,dy]=dirs.find(d=>d[0]===id.slice(5));p.x+=dx;p.y+=dy;notes.push("Moved "+name+".");}
 if(id.startsWith("attack:"))hurt(n,n.enemies.find(e=>e.id===id.slice(7)),p.attack,notes);
 if(id==="chest"){n.chest.opened=true;p.gold+=25;p.potions++;notes.push("Found 25 gold and a healing draught.");}
 if(id==="heal"){p.potions--;p.hp=Math.min(p.max,p.hp+8);notes.push("Recovered health.");}
 if(id==="guard")notes.push("You brace for impact.");
 for(const e of living(n)){
  if(p.hp<=0)break;
  const previous=e.intent;
  if(previous==="strike"&&dist(e,p)===1){
   const damage=id==="guard"?Math.max(1,Math.floor(e.damage/4)):e.damage;
   p.hp=Math.max(0,p.hp-damage);notes.push(e.name+" hits for "+damage+".");
   if(id==="guard"&&p.hp>0)hurt(n,e,Math.max(2,p.attack-2),notes);
   e.intent="recover";continue;
  }
  if(previous==="approach"&&dist(e,p)>1&&dist(e,p)<=5){
   const moves=dirs.map(([,dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(q=>floor(n,q.x,q.y)&&dist(q,p)>0&&!enemyAt(n,q.x,q.y)&&dist(q,p)<dist(e,p));
   if(moves.length){e.x=moves[0].x;e.y=moves[0].y;}
  }
  e.intent=dist(e,p)===1?"strike":dist(e,p)<=5?"approach":"wait";
 }
 if(p.hp<=0){n.outcome="lost";notes.push("Your journey ends on floor "+n.depth+". "+p.kills+" enemies defeated; "+p.gold+" gold collected.");}
 n.message=notes.join(" ");return n;
}
const api={create,actions,step,describe,floor,dist,threats,FLOORS,sealed};if(typeof module!=="undefined")module.exports=api;else root.Dungeon=api;
})(typeof globalThis!=="undefined"?globalThis:this);
