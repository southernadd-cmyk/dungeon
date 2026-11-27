/* Versioned expedition snapshots. Separate from shared access settings. */
(function(root){
"use strict";
const KEY="dungeon-expedition",VERSION=1;
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function valid(s){
 if(!s||typeof s!=="object"||!integer(s.seed,0,0xffffffff)||!integer(s.depth,1,3)||!integer(s.turn)||s.w!==15||s.h!==9)return false;
 if(!Array.isArray(s.grid)||s.grid.length!==s.h||s.grid.some(row=>!Array.isArray(row)||row.length!==s.w||row.some(n=>n!==0&&n!==1)))return false;
 const pos=q=>q&&integer(q.x,0,s.w-1)&&integer(q.y,0,s.h-1)&&s.grid[q.y][q.x]===1;
 const p=s.player;
 if(!pos(p)||!integer(p.max,1)||!integer(p.hp,0,p.max)||!integer(p.attack,1)||!integer(p.potions)||!integer(p.gold)||!integer(p.kills))return false;
 if(!pos(s.chest)||typeof s.chest.opened!=="boolean"||!pos(s.exit))return false;
 if(!Array.isArray(s.enemies)||s.enemies.length!==(s.depth===2?3:2))return false;
 if(s.enemies.some(e=>!pos(e)||typeof e.id!=="string"||typeof e.name!=="string"||!integer(e.max,1)||!integer(e.hp,0,e.max)||!integer(e.damage,1)||!["skeleton","sentinel","boss"].includes(e.type)||!["wait","approach","strike","recover"].includes(e.intent)))return false;
 if(new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length)return false;
 const alive=s.enemies.filter(e=>e.hp>0),loc=q=>q.x+","+q.y;
 if(new Set([loc(p),...alive.map(loc)]).size!==alive.length+1)return false;
 if(s.enemies.filter(e=>e.type==="boss").length!==(s.depth===3?1:0))return false;
 if(!["explore","upgrade"].includes(s.phase)||![null,"won","lost"].includes(s.outcome)||typeof s.message!=="string")return false;
 if((s.outcome==="lost")!==(p.hp===0))return false;
 if(s.phase==="upgrade"&&(s.depth===3||s.outcome!==null||loc(p)!==loc(s.exit)))return false;
 if(s.outcome==="won"&&(s.depth!==3||s.phase!=="explore"||loc(p)!==loc(s.exit)||alive.some(e=>e.type==="boss")))return false;
 return true;
}
function create(storage){
 function read(){
  try{
   const raw=storage.getItem(KEY);if(raw===null)return {status:"empty",state:null};
   const data=JSON.parse(raw);
   if(data?.version!==VERSION||!valid(data.state))return {status:"invalid",state:null};
   return {status:"saved",state:data.state};
  }catch{return {status:"unavailable",state:null};}
 }
 function write(state){
  try{if(!valid(state))return false;storage.setItem(KEY,JSON.stringify({version:VERSION,state}));return true;}catch{return false;}
 }
 function clear(){try{storage.removeItem(KEY);return true;}catch{return false;}}
 return {read,write,clear};
}
const api={create,valid,KEY,VERSION};if(typeof module!=="undefined")module.exports=api;else root.DungeonSave=api;
})(typeof globalThis!=="undefined"?globalThis:this);
