const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const Input=require("../choice-input.js");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
const {harness}=require("./choice-harness.js");
test("upstream shared scanner has blank root, standard timing and stable choice identity",()=>{
 const h=harness(),chosen=[],scan=h.M.createChoiceScan({choice:true,holdThreshold:600,statusHost:h.elem(),items:[{id:"a",label:"A"},{id:"b",label:"B"}],onSelect:a=>chosen.push(a.id)});
 assert.equal(h.M.getSettings().autoScan,false);assert.equal(h.M.getScanInterval(),2000);assert.equal(scan.getState().index,-1);assert.equal(scan.select(),false);
 scan.step(1);assert.equal(scan.getState().id,"a");scan.setItems([{id:"b",label:"B"},{id:"a",label:"New A"}]);assert.equal(scan.getState().id,"a");
 scan.step(1);assert.equal(scan.getState().index,-1);scan.step(-1);assert.equal(scan.getState().id,"a");scan.select();assert.deepEqual(chosen,["a"]);scan.dispose();
});
test("one-switch auto scan supports parking and resume without accidental selection",()=>{
 const h=harness(),chosen=[];h.M.updateSettings({autoScan:true,parking:"chosen"});
 const scan=h.M.createChoiceScan({choice:true,holdThreshold:600,statusHost:h.elem(),items:[{id:"a",label:"A"}],onSelect:a=>chosen.push(a.id)});
 assert.equal(scan.getState().index,-1);scan.select();assert.equal(scan.getState().parked,true);h.tick(10000);assert.equal(scan.getState().index,-1);
 scan.select();assert.equal(scan.getState().id,"a");assert.deepEqual(chosen,[]);scan.select();assert.deepEqual(chosen,["a"]);scan.dispose();
});
test("actual application loads with shared managers and supports release-only navigation and stable settings",()=>{
 const h=harness({"narbe-voice-settings":JSON.stringify({ttsEnabled:false})});
 h.window.Dungeon=require("../engine.js");h.window.DungeonChoiceInput=Input;h.window.CryptArt={draw(){}};
 vm.runInContext(app,h.context);
 const d=h.document,buttons=()=>d.getElementById("choices").children,active=()=>buttons().find(b=>b.classList.contains("scan"))?.textContent;
 assert.equal(d.getElementById("prompt").textContent,"Main menu");assert.equal(active(),undefined);
 h.press("Enter");assert.equal(d.getElementById("prompt").textContent,"Main menu");
 h.event("keydown","Space");assert.equal(active(),undefined);h.event("keyup","Space");h.tick(60);assert.equal(active(),"Begin expedition");
 h.press("NumpadEnter");assert.equal(d.getElementById("prompt").textContent,"Prologue");
 h.press("Space");h.press("Enter");assert.equal(d.getElementById("prompt").textContent,"Your move");
 buttons().find(b=>b.textContent==="Pause").click();buttons().find(b=>b.textContent==="Settings").click();assert.equal(d.getElementById("prompt").textContent,"Settings");
 for(let i=0;i<5;i++)h.press("Space");assert.match(active(),/Scan speed: 2/);
 h.press("Enter");assert.match(active(),/Scan speed: 3/);assert.equal(h.M.getScanInterval(),3000);
 h.M.setAutoScan(true);assert.match(active(),/Scan speed: 3/);
 h.press("Enter");assert.equal(h.M.getScanInterval(),4000);
});
test("input bridge preserves Space brake, Enter release and optional reverse",()=>{
 const calls=[],pending=new Map();let n=0,auto=false,brake=false;
 const scan={setInputHeld:v=>calls.push(["held",v]),step:v=>calls.push(["step",v]),select:()=>calls.push(["select"]),brakePress:()=>brake,brakeRelease:()=>calls.push(["brakeRelease"]),setSuspended:v=>calls.push(["suspend",v])};
 const bridge=Input.create({scan,manager:{getSettings:()=>({autoScan:auto}),getScanInterval:()=>2000,resetInputState(){}},setTimer:fn=>{const id=++n;pending.set(id,fn);return id;},clearTimer:id=>pending.delete(id)});
 const e=code=>({code,preventDefault(){}});bridge.down(e("Space"));assert(!calls.some(c=>c[0]==="step"));bridge.up(e("Space"));assert(calls.some(c=>c[0]==="step"&&c[1]===1));
 calls.length=0;bridge.down(e("Space"));[...pending.values()][0]();bridge.up(e("Space"));assert(calls.some(c=>c[0]==="step"&&c[1]===-1));assert(!calls.some(c=>c[0]==="step"&&c[1]===1));
 auto=true;brake=true;calls.length=0;bridge.down(e("Space"));bridge.up(e("Space"));assert.deepEqual(calls,[["brakeRelease"]]);
 bridge.down(e("Enter"));assert(!calls.some(c=>c[0]==="select"));bridge.up(e("Enter"));assert(calls.some(c=>c[0]==="select"));
 calls.length=0;bridge.down(e("Enter"));bridge.cancel();bridge.up(e("Enter"));assert(!calls.some(c=>c[0]==="select"));
});
