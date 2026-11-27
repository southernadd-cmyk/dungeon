const test=require("node:test"),assert=require("node:assert/strict");
const {boot}=require("./choice-harness.js");
function select(h,prefix){
 const auto=h.M.getSettings().autoScan;
 for(let i=0;i<=h.buttons().length+1;i++){
  if(h.active()?.startsWith(prefix)){h.press("Enter");return;}
  if(auto)h.tick(h.M.getScanInterval());else h.press("Space");
 }
 assert.fail("Could not scan to "+prefix+" from "+h.el("prompt").textContent);
}
function begin(h){select(h,"Begin expedition");select(h,"Enter the crypt");}
test("pause, settings and resume are reachable using only the two switches and spend no turns",()=>{
 const h=boot();begin(h);select(h,"Move ");const turn=h.el("turn").textContent,hp=h.el("hp").textContent;
 select(h,"Pause");assert.equal(h.el("prompt").textContent,"Pause menu");assert.equal(h.active(),undefined);
 assert.deepEqual(h.buttons().map(b=>b.textContent),["Continue","Restart","Settings","Main menu","Exit game","Help"]);
 select(h,"Settings");select(h,"Scan speed");assert.equal(h.M.getScanInterval(),3000);
 select(h,"Sound effects");assert.equal(JSON.parse(h.storage.get("dungeon-prefs")).sound,false);
 assert(h.audio.some(a=>a[0]==="enabled"&&a[1]===false));
 select(h,"Back");assert.equal(h.el("prompt").textContent,"Pause menu");assert.equal(h.active(),"Settings");
 select(h,"Help");assert.equal(h.el("prompt").textContent,"Pause menu");
 select(h,"Continue");assert.equal(h.el("prompt").textContent,"Your move");assert.equal(h.el("turn").textContent,turn);assert.equal(h.el("hp").textContent,hp);
});
test("restart and reset require a second selection and cancellation restores the original context",()=>{
 const h=boot();begin(h);select(h,"Move ");assert.equal(h.el("turn").textContent,1);
 select(h,"Pause");select(h,"Restart");assert.equal(h.el("prompt").textContent,"Begin a new expedition?");assert.equal(h.active(),undefined);
 select(h,"Cancel");assert.equal(h.active(),"Restart");assert.equal(h.el("turn").textContent,1);
 select(h,"Settings");select(h,"Reset progress");assert.equal(h.el("prompt").textContent,"Reset progress?");
 select(h,"Cancel");assert.equal(h.active(),"Reset progress");assert.equal(h.el("turn").textContent,1);
 select(h,"Reset progress");select(h,"Reset expedition");assert.equal(h.el("prompt").textContent,"Main menu");assert.equal(h.el("turn").textContent,0);assert.equal(h.buttons()[0].textContent,"Begin expedition");
});
test("single-switch player can cancel exit then return to Hub with the documented message",()=>{
 const h=boot({"narbe-scan-settings":JSON.stringify({autoScan:true})},{embedded:true});
 begin(h);select(h,"Pause");select(h,"Exit game");assert.equal(h.el("prompt").textContent,"Exit game?");assert.equal(h.active(),undefined);
 select(h,"Cancel");assert.equal(h.messages.filter(x=>x.data.action==="focusBackButton").length,0);
 select(h,"Exit game");select(h,"Return to Hub");const exits=h.messages.filter(x=>x.data.action==="focusBackButton");
 assert.equal(exits.length,1);assert.equal(exits[0].origin,"*");assert.equal(h.el("prompt").textContent,"Main menu");
});
test("standalone exit returns to a usable main menu without discarding the expedition",()=>{
 const h=boot();begin(h);select(h,"Move ");select(h,"Pause");select(h,"Exit game");select(h,"Return to main menu");
 assert.equal(h.messages.length,0);assert.equal(h.el("prompt").textContent,"Main menu");select(h,"Continue expedition");assert.equal(h.el("turn").textContent,1);
});
