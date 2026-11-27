const test=require("node:test"),assert=require("node:assert/strict"),D=require("../engine.js"),Save=require("../run-save.js");
const {boot}=require("./choice-harness.js");
const KEY=Save.KEY;
const snapshot=s=>JSON.stringify({version:Save.VERSION,state:s});
function store(){const data=new Map();return {data,api:Save.create({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)})};}
function saved(h){return JSON.parse(h.storage.get(KEY)).state;}
function reload(h){return boot(Object.fromEntries(h.storage));}
function select(h,prefix){
 for(let i=0;i<=h.buttons().length+1;i++){
  if(h.active()?.startsWith(prefix)){h.press("Enter");return;}
  if(h.M.getSettings().autoScan)h.tick(h.M.getScanInterval());else h.press("Space");
 }
 assert.fail("Cannot scan to "+prefix);
}
test("autosave and refresh preserve the exact expedition and do not advance it while scanning or inspecting",()=>{
 let h=boot();assert.equal(h.storage.has(KEY),false);select(h,"Begin expedition");assert.equal(h.storage.has(KEY),false);select(h,"Enter the crypt");assert.equal(saved(h).turn,0);
 select(h,"Move ");select(h,"Move ");const before=saved(h);assert.equal(before.turn,2);
 select(h,"Look around");select(h,"Pause");select(h,"Settings");select(h,"Scan speed");assert.deepEqual(saved(h),before);
 h=reload(h);assert.equal(h.buttons()[0].textContent,"Continue expedition");assert.equal(h.el("turn").textContent,2);assert.equal(h.M.getScanInterval(),3000);
 select(h,"Continue expedition");assert.deepEqual(saved(h),before);assert.equal(h.el("game").hidden,false);select(h,"Move ");assert.equal(saved(h).turn,3);
});
test("saved combat, loot, enemy intent, blessings and completed outcomes round-trip exactly",()=>{
 const {api}=store();let s=D.create(42);
 Object.assign(s.player,{x:7,y:4});Object.assign(s.enemies[0],{x:7,y:3,intent:"strike"});s=D.step(s,"guard");assert(api.write(s));assert.deepEqual(api.read().state,s);
 Object.assign(s.player,s.exit);s=D.step(s,"exit");assert.equal(s.phase,"upgrade");assert(api.write(s));assert.deepEqual(api.read().state,s);
 let h=boot({[KEY]:snapshot(s)});select(h,"Continue expedition");assert.equal(h.el("prompt").textContent,"Choose your blessing");select(h,"Vitality blessing");assert.equal(saved(h).depth,2);assert.equal(saved(h).player.max,30);
 s=saved(h);Object.assign(s.player,s.exit);s=D.step(s,"exit");s=D.step(s,"upgrade:blade");s.enemies.find(e=>e.type==="boss").hp=0;Object.assign(s.player,s.exit);s=D.step(s,"exit");
 assert.equal(s.outcome,"won");assert(api.write(s));assert.deepEqual(api.read().state,s);
 h=boot({[KEY]:snapshot(s)});select(h,"Continue expedition");assert.equal(h.el("prompt").textContent,"Journey complete");
 s=D.create(8);s.player.hp=0;s.outcome="lost";assert(api.write(s));assert.deepEqual(api.read().state,s);
});
test("reset and restart clear only the saved expedition after confirmation",()=>{
 let h=boot({"narbe-scan-settings":JSON.stringify({autoScan:false,scanSpeedIndex:3}),"dungeon-prefs":JSON.stringify({sound:false,reduced:true})});
 select(h,"Begin expedition");select(h,"Enter the crypt");select(h,"Move ");const before=saved(h);
 select(h,"Pause");select(h,"Restart");select(h,"Cancel");assert.deepEqual(saved(h),before);
 select(h,"Restart");select(h,"Start new expedition");assert.equal(h.storage.has(KEY),false);select(h,"Enter the crypt");assert.equal(saved(h).turn,0);
 select(h,"Pause");select(h,"Settings");select(h,"Reset progress");select(h,"Cancel");assert(h.storage.has(KEY));
 select(h,"Reset progress");select(h,"Reset expedition");assert(!h.storage.has(KEY));h=reload(h);assert.equal(h.buttons()[0].textContent,"Begin expedition");assert.equal(h.M.getScanInterval(),4000);assert.equal(JSON.parse(h.storage.get("dungeon-prefs")).sound,false);
});
test("bad or incompatible saved state is rejected safely; storage failure does not throw",()=>{
 const {data,api}=store();assert.equal(api.read().status,"empty");
 for(const raw of ["{",JSON.stringify({version:999,state:D.create(1)}),snapshot({...D.create(1),grid:[]}),snapshot({...D.create(1),phase:"upgrade"})]){
  data.set(KEY,raw);assert.equal(api.read().status,"invalid");assert.equal(data.get(KEY),raw);
  const h=boot({[KEY]:raw});assert.equal(h.buttons()[0].textContent,"Begin expedition");assert.match(h.el("saveStatus").textContent,/incompatible or damaged/);assert.equal(h.storage.get(KEY),raw);
 }
 const broken=Save.create({getItem(){throw Error("denied");},setItem(){throw Error("quota");},removeItem(){throw Error("denied");}});
 assert.equal(broken.read().status,"unavailable");assert.equal(broken.write(D.create(2)),false);assert.equal(broken.clear(),false);
});
test("failed autosave reports unsaved progress while retaining the live game",()=>{
 const h=boot();h.window.localStorage.setItem=(k)=>{if(k===KEY)throw Error("quota");};
 select(h,"Begin expedition");select(h,"Enter the crypt");assert.match(h.el("saveStatus").textContent,/could not be saved/);
 select(h,"Move ");assert.equal(h.el("turn").textContent,1);assert.equal(h.storage.has(KEY),false);
});
