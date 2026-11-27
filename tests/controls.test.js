const test=require("node:test"),assert=require("node:assert/strict");
const {boot}=require("./choice-harness.js");
const initialAuto={"narbe-scan-settings":JSON.stringify({autoScan:true})};
test("two-switch mode requires confirmation, then Space advances and Enter selects",()=>{
 const h=boot(initialAuto);h.click("Controls:");h.click("Two switches");assert.equal(h.el("prompt").textContent,"Confirm two-switch mode");
 h.click("Cancel");assert.equal(h.M.getSettings().autoScan,true);h.click("Two switches");h.click("Use two switches");
 assert.equal(h.M.getSettings().autoScan,false);assert.match(h.el("controlmode").textContent,/TWO SWITCHES/);assert.match(h.active(),/^Controls:/);
 h.tick(6000);assert.match(h.active(),/^Controls:/);
 // Back from the mode chooser restores the parent identity. Reach the root blank and then Begin.
 h.press("Space");h.press("Space");h.press("Space");assert.equal(h.active(),undefined);
 h.press("Enter");assert.equal(h.el("prompt").textContent,"Main menu");
 h.press("Space");assert.equal(h.active(),"Begin expedition");h.tick(6000);assert.equal(h.active(),"Begin expedition");
 h.press("Enter");assert.equal(h.el("prompt").textContent,"Prologue");assert.equal(h.el("turn").textContent,0);assert.equal(h.el("game").hidden,true);
 h.press("Space");h.press("Enter");assert.equal(h.el("prompt").textContent,"Your move");assert.equal(h.el("game").hidden,false);
 // Choose a single movement, not a multi-step travel shortcut.
 for(let i=0;i<h.buttons().length&&!h.active()?.startsWith("Move ");i++)h.press("Space");
 assert.match(h.active(),/^Move /);assert.equal(h.el("turn").textContent,0);h.press("Enter");assert.equal(h.el("turn").textContent,1);
});
test("saved two-switch mode loads without auto advancing and can return to automatic scanning",()=>{
 const h=boot({"narbe-scan-settings":JSON.stringify({autoScan:false,scanSpeedIndex:1})});
 h.tick(6000);assert.equal(h.active(),undefined);
 h.click("Controls:");h.click("One switch");assert.equal(h.M.getSettings().autoScan,true);
 assert.equal(JSON.parse(h.storage.get("narbe-scan-settings")).autoScan,true);assert.match(h.active(),/^Controls:/);
 h.tick(2000);assert.equal(h.active(),"How to play");
});
test("auto scan freezes the choice while Enter is held, selects only on release; Space brake does not select",()=>{
 const h=boot(initialAuto);h.tick(2000);assert.equal(h.active(),"Begin expedition");
 h.event("keydown","Space");h.event("keydown","Space",true);h.tick(100);h.event("keyup","Space");
 h.tick(6000);assert.equal(h.active(),"Begin expedition");assert.equal(h.el("prompt").textContent,"Main menu");
 h.press("Space");h.tick(2000);assert.match(h.active(),/^Controls:/);
 // Wrap through the other choices and the required blank, then back to Begin.
 h.tick(8000);assert.equal(h.active(),"Begin expedition");
 h.event("keydown","Enter");h.event("keydown","Enter",true);h.tick(6000);
 assert.equal(h.active(),"Begin expedition");assert.equal(h.el("prompt").textContent,"Main menu");
 h.event("keyup","Enter");assert.equal(h.el("prompt").textContent,"Prologue");assert.equal(h.el("turn").textContent,0);
});
test("title and narrated prologue are separate from gameplay, repeatable and skippable",()=>{
 const h=boot();assert.equal(h.el("game").hidden,true);assert.equal(h.el("titleScene").hidden,false);assert.equal(h.el("titleHeading").textContent,"Dungeon Quest");
 h.click("Begin expedition");assert.equal(h.el("prompt").textContent,"Prologue");assert.match(h.el("titleText").textContent,/bell rings/);
 h.click("Repeat narration");assert.equal(h.el("turn").textContent,0);h.click("Back to main menu");assert.equal(h.el("prompt").textContent,"Main menu");
 h.click("Begin expedition");h.click("Enter the crypt");assert.equal(h.el("game").hidden,false);assert.equal(h.el("titleScene").hidden,true);
 h.click("Main menu");assert.equal(h.el("game").hidden,true);h.click("Continue expedition");assert.equal(h.el("prompt").textContent,"Your move");assert.equal(h.el("turn").textContent,0);
});
