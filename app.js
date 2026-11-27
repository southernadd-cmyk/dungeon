(function(){
"use strict";
const $=id=>document.getElementById(id),D=window.Dungeon;
const M=window.NarbeScanManager,V=window.NarbeVoiceManager;
const A=window.SafeAudio;
let prefs={reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,sound:true};
try{const saved=JSON.parse(localStorage.getItem("dungeon-prefs"));if(saved&&typeof saved.reduced==="boolean")prefs.reduced=saved.reduced;if(saved&&typeof saved.sound==="boolean")prefs.sound=saved.sound;}catch{}
A?.setEnabled(prefs.sound);
const runStore=window.DungeonSave.create({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
const loaded=runStore.read();
let s=loaded.state||D.create(),begun=!!loaded.state,screen="start",items=[],input;
let saveNotice=loaded.status==="invalid"?"Saved expedition is incompatible or damaged. It has not been resumed.":loaded.status==="unavailable"?"Saved expedition could not be read.":loaded.status==="saved"?"Saved expedition found. Choose Continue expedition.":"";
let savedOk=loaded.status==="saved";
function persist(){
 savedOk=runStore.write(s);
 saveNotice=savedOk?"":"Progress could not be saved on this device. Keep this page open to continue.";
 return savedOk;
}
function clearRun(){
 if(!runStore.clear()){saveNotice="Could not delete the saved expedition. Your current expedition is unchanged.";return false;}
 savedOk=false;saveNotice="";return true;
}
function saveMessage(text){return [text,saveNotice].filter(Boolean).join(" ");}
const HOLD_THRESHOLD=600; // optional backwards scan; never a minimum activation duration
function save(){try{localStorage.setItem("dungeon-prefs",JSON.stringify(prefs));}catch{}}
function mode(){return M.getSettings().autoScan;}
function highlight(item,state){
 const current=M.getSettings();
 for(const a of items)a.element.classList.toggle("scan",a.id===item?.id);
 $("scanstate").textContent=(current.autoScan?"Auto scan":"Manual scan")+(state.index<0?" · Ready":" · "+(state.index+1)+" of "+items.length);
 $("controlmode").textContent=current.autoScan?"ONE SWITCH · AUTO SCAN":"TWO SWITCHES · MANUAL SCAN";
 $("controlHint").textContent=current.autoScan?"Enter · select highlighted choice"+(current.spaceBrake?" | Space · brake":" | Space also selects"):"Space · advance | Enter · select";
 $("hint").textContent=current.autoScan?"Enter selects on release.":"Space advances · Enter selects.";
 if(item?.element&&!state.suspended)item.element.scrollIntoView?.({block:"nearest",inline:"nearest"});
}
const scan=M.createChoiceScan({choice:true,holdThreshold:HOLD_THRESHOLD,statusHost:$("parkStatus"),getId:a=>a.id,getLabel:a=>a.label,getElement:a=>a.element,onHighlight:highlight,onSelect:choose,speak:text=>V.speak(text)});
input=window.DungeonChoiceInput.create({scan,manager:M,holdThreshold:HOLD_THRESHOLD});
function setItems(list,announcement="",{fresh=true,restoreId=null}={}){
 if(fresh)input.cancel();
 items=list.map(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.addEventListener("click",()=>{input.cancel();choose(a);});return {...a,element:b};});
 $("choices").replaceChildren(...items.map(a=>a.element));
 if(fresh)scan.open(items,{restoreId});else scan.setItems(items);
 if(announcement)scan.announceCurrent(announcement);
}
function sound(name){try{A?.play(name,.45);}catch{}}
function choose(a){if(a){sound("select");a.run();}}
function status(){$("hp").textContent=s.player.hp+" / "+s.player.max;$("healthbar").style.width=100*s.player.hp/s.player.max+"%";$("gold").textContent=s.player.gold;$("potions").textContent=s.player.potions;$("turn").textContent=s.turn;$("journal").textContent=s.message;$("saveStatus").textContent=saveNotice||(savedOk?"Expedition saved":"Not yet saved");$("seed").textContent="Seed "+s.seed;$("location").textContent=s.player.x<5?"Entrance hall":s.player.x<10?"The ossuary":"Stairway chamber";$("floorName").textContent=D.FLOORS[s.depth-1];$("chapterNumber").textContent="FLOOR "+s.depth+" / 3";$("chapterName").textContent=D.FLOORS[s.depth-1];$("attack").textContent=s.player.attack;$("kills").textContent=s.player.kills;$("objective").textContent=s.phase==="upgrade"?"Choose a blessing":D.sealed(s)?"Defeat the Bellkeeper":s.depth===3?"Claim the Bell of Dawn":"Find the stairs";$("intent").textContent=s.phase==="explore"&&!s.outcome?D.threats(s):""; }
function action(label,run,id=label){return {id,label,run};}
function scene(kind){
 $("game").hidden=kind==="title";$("titleScene").hidden=kind!=="title";
}
const PROLOGUE="For a hundred years, the doors of the Forgotten Crypt remained sealed. Tonight, a bell rings beneath the earth. You descend alone, armed with a sword and two healing draughts. Three floors lie between you and the stolen Bell of Dawn. Find the stairs, choose your blessings and defeat the Bellkeeper.";
const INSTRUCTIONS="Use Travel toward treasure or stairs to walk several safe steps at once. Travel stops when an enemy is near or a point of interest is reached. You can always move one step at a time. Attack adjacent enemies, guard and counter when a strike is announced, and open treasure. Choose a blessing at the end of each of the first two floors. Defeat the Bellkeeper on floor three and claim the Bell of Dawn. Look around describes the dungeon without spending a turn. Enter selects the highlighted choice in one-switch mode. In two-switch mode, Space advances and Enter selects. Both act on release. Choose Pause to access settings, restart or exit without spending a turn. Your expedition saves automatically after each action. Choose Continue expedition when you return.";
function titleCopy(kicker,heading,body){$("titleKicker").textContent=kicker;$("titleHeading").textContent=heading;$("titleText").textContent=body;}
function prologue(){screen="intro";scene("title");titleCopy("CHAPTER I · THE FORGOTTEN CRYPT","The bell beneath the earth",PROLOGUE);$("prompt").textContent="Prologue";setItems([action("Enter the crypt",()=>play(s.message)),action("Repeat narration",prologue),action("Back to main menu",start)],PROLOGUE);}
function play(announcement="",restoreId=null){if(!begun){begun=true;persist();}screen="play";scene("game");status();$("prompt").textContent=s.outcome?"Journey complete":s.phase==="upgrade"?"Choose your blessing":"Your move";const list=D.actions(s).map(a=>action(a.label,()=>{s=D.step(s,a.id);persist();if(s.outcome)sound(s.outcome==="won"?"win":"lose");play(s.message+(s.outcome||s.phase!=="explore"?"":" "+D.threats(s)));},a.id));if(s.outcome)list.push(action("New expedition",()=>confirmNew()));list.push(action("Look around",()=>play(D.describe(s),"inspect"),"inspect"),action("Pause",()=>pause(),"pause"));setItems(list,saveMessage(announcement),{restoreId});}
function confirmNew(back=()=>screen==="play"?play():start()){
 $("prompt").textContent="Begin a new expedition?";
 setItems([action("Cancel",()=>back()),action("Start new expedition",()=>{if(!clearRun()){start(null,saveNotice);return;}s=D.create();begun=false;prologue();})],"Start again? Current expedition will be lost.");
}
function pause(restoreId=null,announcement="Paused. Your expedition is unchanged."){
 screen="pause";scene("game");status();$("prompt").textContent="Pause menu";
 setItems([
 action("Continue",()=>play("Expedition resumed.","pause"),"continue"),
 action("Restart",()=>confirmNew(()=>pause("restart")),"restart"),
 action("Settings",()=>settings(),"settings"),
 action("Main menu",()=>start(),"main"),
 action("Exit game",()=>confirmExit(()=>pause("exit")),"exit"),
 action("Help",()=>pause("help",INSTRUCTIONS),"help")
 ],announcement,{restoreId});
}
function confirmExit(back){
 $("prompt").textContent="Exit game?";
 const embedded=window.parent!==window;
 const warning=(embedded?"Return to the Hub?":"Return to the main menu?")+(begun?(savedOk?" Your expedition is saved on this device.":" Progress could not be saved. Closing the page may lose your expedition."):"");
 setItems([action("Cancel",back),action(embedded?"Return to Hub":"Return to main menu",()=>{
  // A host that does not handle the message must never leave the player stranded.
  start(null,embedded?"Returning to the Hub.":"Returned to the main menu.");
  if(embedded){
   input.cancel({resetGuard:true});V.cancel();try{A?.stopAll();}catch{}
   window.parent.postMessage({action:"focusBackButton"},"*");
  }
 })],warning);
}
function resetProgress(){
 $("prompt").textContent="Reset progress?";
 setItems([action("Cancel",()=>settings({restoreId:"reset"})),action("Reset expedition",()=>{
  if(!clearRun()){settings({restoreId:"reset",announcement:saveNotice});return;}s=D.create();begun=false;start(null,"Expedition reset. Your accessibility settings are unchanged.");
 })],"Reset the expedition? All current progress will be lost. Your accessibility settings will be kept.");
}
function start(restoreId=null,announcement="Dungeon Quest. Main menu. Nothing moves until you choose."){screen="start";scene("title");status();titleCopy("A TURN-BASED FANTASY ADVENTURE","Dungeon Quest","Beyond the sealed gate, forgotten things awaken. Descend into the dark, find your fortune, and survive.");$("prompt").textContent="Main menu";setItems([action(begun?"Continue expedition":"Begin expedition",()=>begun?play("Expedition resumed. "+D.describe(s)):prologue()),action("Controls: "+(mode()?"One switch":"Two switches"),()=>controlMenu(()=>start("controls")),"controls"),action("How to play",instructions),action("Settings",()=>settings(),"settings"),...(begun?[action("New expedition",()=>confirmNew(()=>start("New expedition")))]:[]),action("Exit game",()=>confirmExit(()=>start("exit")),"exit")],saveMessage(announcement),{restoreId});}
function controlMenu(back){
 $("prompt").textContent="Choose switch controls";
 setItems([
  action("One switch — automatic scan"+(mode()?" (current)":""),()=>{M.setAutoScan(true);back();},"auto"),
  action("Two switches — manual scan"+(!mode()?" (current)":""),()=>{
   if(!mode()){back();return;}
   $("prompt").textContent="Confirm two-switch mode";
   setItems([action("Cancel",()=>controlMenu(back)),action("Use two switches",()=>{M.setAutoScan(false);back();})],"Two switches require Space to advance and Enter to select. Choose Cancel if you only have one switch.");
  },"manual"),
  action("Back",back)
 ],"One switch scans automatically. Two switches let you advance and select at your own pace.");
}
function instructions(){screen="instructions";scene("title");titleCopy("THE ADVENTURER'S GUIDE","How to play",INSTRUCTIONS);$("prompt").textContent="How to play";setItems([action("Repeat instructions",instructions),action("Back",()=>start("How to play"))],INSTRUCTIONS);}
let returnScreen="start";
function settings({fresh=true,restoreId=null,announcement=""}={}){
 if(screen!=="settings")returnScreen=screen;
 screen="settings";$("prompt").textContent="Settings";
 const redraw=text=>settings({fresh:false,announcement:text});
 setItems([
 action("Text to speech: "+(V.getSettings().ttsEnabled?"On":"Off"),()=>{V.toggleTTS();redraw(V.getSettings().ttsEnabled?"Text to speech on":"Text to speech off");},"tts"),
 action("Voice: "+V.getVoiceDisplayName(V.getCurrentVoice()),()=>{V.cycleVoice();redraw("Voice: "+V.getVoiceDisplayName(V.getCurrentVoice()));},"voice"),
 action("Reduced motion: "+(prefs.reduced?"On":"Off"),()=>{prefs.reduced=!prefs.reduced;save();redraw("Reduced motion "+(prefs.reduced?"on":"off"));},"motion"),
 action("Auto scan: "+(mode()?"On — One switch":"Off — Two switches"),()=>controlMenu(()=>settings({restoreId:"auto"})),"auto"),
 action("Scan speed: "+M.getScanInterval()/1000+" seconds",()=>{M.cycleScanSpeed();redraw("Scan speed "+M.getScanInterval()/1000+" seconds");},"speed"),
 action("Sound effects: "+(prefs.sound?"On":"Off"),()=>{prefs.sound=!prefs.sound;A?.setEnabled(prefs.sound);save();redraw("Sound effects "+(prefs.sound?"on":"off"));},"sound"),
 action("Reset progress",resetProgress,"reset"),
 action("Back",()=>returnScreen==="pause"?pause("settings"):start("settings"),"back")
 ],announcement||(fresh?"Settings":""),{fresh,restoreId});
}
M.subscribe(()=>{if(screen==="settings"&&$("prompt").textContent==="Settings")settings({fresh:false});else if(screen==="start"&&$("prompt").textContent==="Main menu")refreshMain();});
V.onSettingsChange(()=>{if(screen==="settings"&&$("prompt").textContent==="Settings")settings({fresh:false});});
function refreshMain(){
 const a=items.find(x=>x.id==="controls");
 if(a){a.label="Controls: "+(mode()?"One switch":"Two switches");a.element.textContent=a.label;scan.setItems(items);}
}
document.addEventListener("keydown",input.down);
document.addEventListener("keyup",input.up);
document.addEventListener("narbe-input-cancelled",()=>input.cancel());
window.addEventListener("blur",()=>input.cancel({resetGuard:true}));
document.addEventListener("visibilitychange",()=>{if(document.hidden)input.cancel({resetGuard:true});});
window.addEventListener("pagehide",e=>{input.cancel({resetGuard:true});V.cancel();try{A?.stopAll();}catch{}if(!e.persisted)scan.dispose();});
function frame(t){if(!$("game").hidden)window.CryptArt.draw($("world"),s,t,prefs.reduced);requestAnimationFrame(frame);}
start();requestAnimationFrame(frame);
})();
