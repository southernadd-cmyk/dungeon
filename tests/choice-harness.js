const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const Input=require("../choice-input.js");
const source=fs.readFileSync(path.join(__dirname,"../vendor/narbe-choice-voice.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function harness(initial={}){
 let now=10000,next=0;const timers=new Map(),storage=new Map(Object.entries(initial)),windowListeners={},docListeners={};
 function tick(ms){const end=now+ms;for(;;){const q=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!q)break;now=q[1].at;timers.delete(q[0]);q[1].fn();}now=end;}
 function elem(){const classes=new Set(),attributes=new Map();return {nodeType:1,style:{},children:[],textContent:"",hidden:false,classList:{add:k=>classes.add(k),contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)},setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),hasAttribute:k=>attributes.has(k),appendChild(b){this.children.push(b);},replaceChildren(...a){this.children=a;},remove(){},scrollIntoView(){},matches(){return false;},closest(){return null;},addEventListener(k,fn){this[k]=fn;}};}
 const nodes=new Map();
 const document={createElement:elem,getElementById(id){if(!nodes.has(id))nodes.set(id,elem());return nodes.get(id);},querySelectorAll(){return [];},querySelector(){return null;},visibilityState:"visible",hidden:false,addEventListener(k,fn){(docListeners[k]??=[]).push(fn);},removeEventListener(){}};
 const window={document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{origin:"https://test.example"},addEventListener(k,fn){(windowListeners[k]??=[]).push(fn);},removeEventListener(){}};window.parent=window;
 const context=vm.createContext({window,document,localStorage:window.localStorage,console,Date:class extends Date{static now(){return now;}},setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),matchMedia:()=>({matches:false}),requestAnimationFrame:()=>0});
 vm.runInContext(source,context);
 window.DungeonSave=require("../run-save.js");
 const M=window.NarbeScanManager,V=window.NarbeVoiceManager;
 function event(type,code,repeat=false){const e={type,code,target:elem(),repeat,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){this.stopped=true;}};for(const f of windowListeners[type]||[]){f(e);if(e.stopped)return;}for(const f of docListeners[type]||[])f(e);}
 function press(code){event("keydown",code);event("keyup",code);tick(60);}
 return {context,window,M,V,tick,event,press,document,elem,storage,timers};
}

function boot(initial={},options={}){
 const h=harness({"narbe-voice-settings":JSON.stringify({ttsEnabled:false}),...initial});
 const audio=[];h.window.SafeAudio={setEnabled:on=>audio.push(["enabled",on]),play:name=>audio.push(["play",name]),stopAll:()=>audio.push(["stopAll"])};const messages=[];if(options.embedded)h.window.parent={postMessage:(data,origin)=>messages.push({data,origin})};
 h.window.Dungeon=require("../engine.js");h.window.DungeonChoiceInput=Input;h.window.CryptArt={draw(){}};
 vm.runInContext(app,h.context);
 const el=id=>h.document.getElementById(id),buttons=()=>el("choices").children;
 return {...h,audio,messages,el,buttons,click(prefix){const button=buttons().find(b=>b.textContent.startsWith(prefix));assert(button,prefix);button.click();},active:()=>buttons().find(b=>b.classList.contains("scan"))?.textContent};
}
module.exports={harness,boot};
