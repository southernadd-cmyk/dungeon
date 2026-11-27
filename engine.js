(function(root){
"use strict";
const dirs=[["north",0,-1],["east",1,0],["south",0,1],["west",-1,0]];
const FLOORS=["Entrance of the Dead","The Broken Ossuary","The Bell Warden"];
const REWARDS=[
 {id:"blade",label:"Tempered blade: +2 attack damage"},
 {id:"armour",label:"Reinforced armour: block 2 extra damage"},
 {id:"vitality",label:"Heartstone: +8 maximum health, heal 8"}
];
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function level(seed,depth){
 const random=rng((seed+Math.imul(depth-1,0x9e3779b9))>>>0),w=15,h=9,grid=Array.from({length:h},()=>Array(w).fill(0));
 const room=(x,y,ww,hh)=>{for(let j=y;j<y+hh;j++)for(let i=x;i<x+ww;i++)grid[j][i]=1;};
 room(1,2,4,5);room(6,1,3,7);room(10,2,4,5);
 const passage=depth===1?4:(random()<.5?3:5),other=depth===1?4:8-passage;
 grid[passage][5]=grid[other][9]=1;
 const enemyY=random()<.5?3:5,treasureY=random()<.5?2:6;
 const enemies=[{id:"s1",name:"Skeleton",kind:"skeleton",x:7,y:enemyY,hp:10,max:10,damage:4,intent:"wait",key:false},
 {id:"s2",name:depth===3?"Bell Warden":"Crypt guard",kind:depth===3?"warden":"guard",x:11,y:8-enemyY,hp:depth===3?28:depth===2?18:12,max:depth===3?28:depth===2?18:12,damage:depth===3?8:depth===2?6:5,intent:"wait",key:true}];
 if(depth>=2)enemies.push({id:"s3",name:"Skeleton sentry",kind:"skeleton",x:8,y:enemyY===3?6:2,hp:12,max:12,damage:5,intent:"wait",key:false});
 return {w,h,grid,enemies,chest:{x:3,y:treasureY,opened:false},exit:{x:13,y:4},depth,hasKey:false,reward:false};
}
function create(seed=Date.now()>>>0){
 return {seed,...level(seed,1),player:{x:2,y:4,hp:24,max:24,potions:2,gold:0,attack:5,armour:0,focus:0},turn:0,kills:0,treasures:0,upgrades:[],outcome:null,message:"Find the crypt guard and claim its stair key."};
}
function floor(s,x,y){return s.grid[y]?.[x]===1;}
function enemyAt(s,x,y){return s.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);}
function actions(s){
 if(s.outcome)return [];
 if(s.reward)return REWARDS.map(r=>({id:"reward:"+r.id,label:r.label}));
 const p=s.player,out=[];
 for(const e of s.enemies)if(e.hp>0&&dist(e,p)===1){
  out.push({id:"attack:"+e.id,label:"Strike "+e.name+" ("+p.attack+" damage)"});
  if(p.focus)out.push({id:"power:"+e.id,label:"Riposte "+e.name+" ("+(p.attack+4)+" damage)"});
 }
 for(const [name,dx,dy] of dirs)if(floor(s,p.x+dx,p.y+dy)&&!enemyAt(s,p.x+dx,p.y+dy))out.push({id:"move:"+name,label:"Move "+name});
 if(!s.chest.opened&&dist(p,s.chest)<=1)out.unshift({id:"chest",label:"Open treasure chest"});
 if(s.hasKey&&dist(p,s.exit)===0)out.unshift({id:"exit",label:s.depth===3?"Claim victory":"Descend the stairs"});
 if(s.enemies.some(e=>e.hp>0&&dist(e,p)===1&&e.intent==="strike"))out.push({id:"guard",label:"Guard and prepare riposte"});
 if(p.potions>0&&p.hp<p.max)out.push({id:"heal",label:"Drink healing draught (+8 health)"});
 return out;
}
function intentText(e){return e.intent==="strike"?"preparing a "+e.damage+" damage strike":e.intent==="recover"?"recovering after a strike":e.intent==="approach"?"approaching":"waiting";}
function describe(s){const p=s.player;const near=s.enemies.filter(e=>e.hp>0&&dist(e,p)<=5).map(e=>e.name+", "+e.hp+" health, "+dist(e,p)+" steps away, "+intentText(e));return [`Floor ${s.depth} of 3. ${FLOORS[s.depth-1]}. Health ${p.hp} of ${p.max}. Attack ${p.attack}. Armour ${p.armour}. ${p.focus?"Riposte ready.":""} Gold ${p.gold}. Healing draughts ${p.potions}. Position column ${p.x+1}, row ${p.y+1}.`,...near,!s.chest.opened?"Treasure chest "+dist(p,s.chest)+" steps away.":"Treasure collected.",s.hasKey?"Stair key collected.":"Defeat the "+(s.depth===3?"Bell Warden":"crypt guard")+" for the stair key.","Stairs "+dist(p,s.exit)+" steps away."].join(" ");}
function step(s,id){
 if(!actions(s).some(a=>a.id===id))return s;
 const n=JSON.parse(JSON.stringify(s)),p=n.player,notes=[];
 if(id.startsWith("reward:")){
  const choice=id.slice(7);
  if(choice==="blade")p.attack+=2;
  if(choice==="armour")p.armour+=2;
  if(choice==="vitality"){p.max+=8;p.hp=Math.min(p.max,p.hp+8);}
  n.upgrades.push(choice);p.x=2;p.y=4;p.focus=0;p.potions++;
  Object.assign(n,level(n.seed,n.depth+1));
  n.message="Upgrade acquired. One healing draught replenished. Floor "+n.depth+": "+FLOORS[n.depth-1]+".";
  return n;
 }
 n.turn++;
 if(id==="exit"){
  if(n.depth===3){n.outcome="won";n.message="The Bell Warden is defeated. You have conquered the Forgotten Crypt!";}else{n.reward=true;n.message="Floor "+n.depth+" conquered. Choose one permanent upgrade for this expedition.";}
  return n;
 }
 if(id.startsWith("move:")){const [name,dx,dy]=dirs.find(d=>d[0]===id.slice(5));p.x+=dx;p.y+=dy;notes.push("Moved "+name+".");}
 if(id.startsWith("attack:")||id.startsWith("power:")){
  const strong=id.startsWith("power:"),e=n.enemies.find(e=>e.id===id.split(":")[1]),damage=p.attack+(strong?4:0);
  if(strong)p.focus=0;
  e.hp=Math.max(0,e.hp-damage);notes.push(e.hp?e.name+" takes "+damage+" damage. "+e.hp+" health left.":e.name+" defeated.");
  if(!e.hp){p.gold+=e.key?18:8;n.kills++;if(e.key){n.hasKey=true;notes.push("Stair key acquired!");}}
 }
 if(id==="chest"){n.chest.opened=true;p.gold+=25;p.potions++;n.treasures++;notes.push("Found 25 gold and a healing draught.");}
 if(id==="heal"){p.potions--;p.hp=Math.min(p.max,p.hp+8);notes.push("Recovered health.");}
 if(id==="guard")notes.push("You brace for impact.");
 for(const e of n.enemies){
  if(e.hp<=0)continue;
  if(e.intent==="strike"){
   if(dist(e,p)===1){const damage=Math.max(0,e.damage-p.armour-(id==="guard"?e.damage-1:0));p.hp=Math.max(0,p.hp-damage);notes.push(e.name+" hits for "+damage+".");if(id==="guard"){p.focus=1;notes.push("Riposte ready.");}}
   else notes.push(e.name+" misses.");
   e.intent="recover";continue;
  }
  if(e.intent==="recover"){e.intent=dist(e,p)===1?"strike":dist(e,p)<=5?"approach":"wait";continue;}
  if(e.intent==="approach"&&dist(e,p)>1&&dist(e,p)<=5){const moves=dirs.map(([,dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(q=>floor(n,q.x,q.y)&&dist(q,p)>0&&!enemyAt(n,q.x,q.y)&&dist(q,p)<dist(e,p));if(moves.length){e.x=moves[0].x;e.y=moves[0].y;}}
  e.intent=dist(e,p)===1?"strike":dist(e,p)<=5?"approach":"wait";
 }
 if(p.hp<=0){n.outcome="lost";notes.push("Your journey ends here.");}
 n.message=notes.join(" ");return n;
}
function summary(s){return `${s.outcome==="won"?"Crypt conquered":"Expedition ended"}. ${s.outcome==="won"?3:s.depth-1} of 3 floors cleared. ${s.kills} enemies defeated. ${s.treasures} treasures found. ${s.player.gold} gold. ${s.turn} turns.`;}
const api={create,actions,step,describe,floor,dist,intentText,summary,FLOORS};if(typeof module!=="undefined")module.exports=api;else root.Dungeon=api;
})(typeof globalThis!=="undefined"?globalThis:this);
