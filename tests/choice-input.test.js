const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const Input=require("../choice-input.js");
const source=fs.readFileSync(path.join(__dirname,"../vendor/narbe-choice-voice.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function harness(initial={}){
 let now=10000,next=0;const timers=new Map(),storage=new Map(Object.entries(initial)),windowListeners={},docListeners={};
 function tick(ms){const end=now+ms;for(;;){const q=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!q)break;now=q[1].at;timers.delete(q[0]);q[1].fn();}now=end;}
 function elem(){const classes=new Set(),attributes=new Map();return {nodeType:1,style:{},children:[],textContent:"",hidden:false,classList:{add:k=>classes.add(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),hasAttribute:k=>attributes.has(k),appendChild(b){this.children.push(b);},replaceChildren(...a){this.children=a;},remove(){},scrollIntoView(){},matches(){return false;},closest(){return null;},addEventListener(k,fn){this[k]=fn;}};}
 const nodes=new Map();
 const document={createElement:elem,getElementById(id){if(!nodes.has(id))nodes.set(id,elem());return nodes.get(id);},querySelectorAll(){return [];},querySelector(){return null;},visibilityState:"visible",hidden:false,addEventListener(k,fn){(docListeners[k]??=[]).push(fn);},removeEventListener(){}};
 const window={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{origin:"https://test.example"},addEventListener(k,fn){(windowListeners[k]??=[]).push(fn);},removeEventListener(){}};window.parent=window;
 const context=vm.createContext({window,document,localStorage:window.localStorage,console,Date:class extends Date{static now(){return now;}},setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false}),requestAnimationFrame:()=>0});
 vm.runInContext(source,context);
 const M=window.NarbeScanManager,V=window.NarbeVoiceManager;
 function event(type,code){const e={type,code,target:elem(),repeat:false,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){this.stopped=true;}};for(const f of windowListeners[type]||[]){f(e);if(e.stopped)return;}for(const f of docListeners[type]||[])f(e);}
 function press(code){event("keydown",code);event("keyup",code);tick(60);}
 return {context,window,M,V,tick,event,press,document,elem,storage};
}
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
 buttons().find(b=>b.textContent==="Settings").click();assert.equal(d.getElementById("prompt").textContent,"Settings");
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
