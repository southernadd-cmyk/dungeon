const test=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),D=require("../engine.js");
const src=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
function harness(initial){
 let id=0,timers=new Map(),stored=initial?JSON.stringify(initial):null,els={},events={},winEvents={};
 const el=()=>({textContent:"",children:[],style:{},classList:{toggle(k,v){this[k]=v;}},replaceChildren(...c){this.children=c;},addEventListener(k,f){this[k]=f;}});
 const document={getElementById(k){return els[k]||=(el());},createElement:el,addEventListener(k,f){events[k]=f;}};
 const window={Dungeon:D,addEventListener(k,f){winEvents[k]=f;}};
 vm.runInNewContext(src,{window,document,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>stored,setItem(k,v){stored=v;}},setTimeout(f){timers.set(++id,f);return id;},clearTimeout(i){timers.delete(i);},requestAnimationFrame(){}});
 const fire=(type,code,repeat=false)=>events[type]({code,repeat,target:{matches:()=>false},preventDefault(){}});
 const key=code=>{fire("keydown",code);fire("keyup",code);};
 const tick=()=>{for(const [i,f] of [...timers]){timers.delete(i);f();}};
 return {els,timers,key,tick,fire,click(text){const b=els.choices.children.find(c=>c.textContent.startsWith(text));assert(b,text);b.click();},selected(){return els.choices.children.find(c=>c.classList.scan)?.textContent;},saved(){return JSON.parse(stored);}};
}
test("two-switch mode requires confirmation, then only advances on Space and selects on Enter",()=>{
 const h=harness();h.click("Controls:");h.click("Two switches");assert.equal(h.els.prompt.textContent,"Confirm two-switch mode");
 h.click("Cancel");h.click("Two switches");h.click("Use two switches");
 assert.equal(h.saved().auto,false);assert.equal(h.timers.size,0);assert.match(h.els.controlmode.textContent,/TWO SWITCHES/);
 h.tick();assert.equal(h.selected(),undefined);h.key("Enter");assert.equal(h.els.prompt.textContent,"Enter the crypt");
 h.key("Space");assert.equal(h.selected(),"Begin expedition");h.tick();assert.equal(h.selected(),"Begin expedition");
 h.key("Enter");assert.equal(h.els.prompt.textContent,"Your move");assert.equal(h.els.turn.textContent,0);
 h.key("Space");assert.equal(h.els.turn.textContent,0);h.key("Enter");assert.equal(h.els.turn.textContent,1);
});
test("saved two-switch mode loads without timers and can return to automatic scanning",()=>{
 const h=harness({auto:false,interval:2000,speech:false,reduced:false});assert.equal(h.timers.size,0);h.click("Controls:");h.click("One switch");assert.equal(h.saved().auto,true);assert.equal(h.timers.size,1);
});
test("automatic scan freezes the highlighted choice during a held switch",()=>{
 const h=harness();h.tick();assert.equal(h.selected(),"Begin expedition");h.fire("keydown","Space");h.fire("keydown","Space",true);h.tick();assert.equal(h.selected(),"Begin expedition");h.fire("keyup","Space");assert.equal(h.els.prompt.textContent,"Your move");assert.equal(h.els.turn.textContent,0);
});
