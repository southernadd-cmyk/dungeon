(function(){
"use strict";
const $=id=>document.getElementById(id),D=window.Dungeon;
let prefs={auto:true,interval:2000,speech:true,reduced:matchMedia("(prefers-reduced-motion: reduce)").matches};
try{const saved=JSON.parse(localStorage.getItem("dungeon-prefs"));if(saved){prefs.auto=saved.auto!==false;prefs.interval=[1000,1500,2000,3000,4000].includes(saved.interval)?saved.interval:2000;prefs.speech=saved.speech!==false;prefs.reduced=!!saved.reduced;}}catch{}
let s=D.create(),begun=false,screen="start",items=[],index=-1,timer=null,held=new Set(),scanEpoch=0;
function save(){try{localStorage.setItem("dungeon-prefs",JSON.stringify(prefs));}catch{}}
function stop(){clearTimeout(timer);timer=null;scanEpoch++;if(window.speechSynthesis)speechSynthesis.cancel();}
function speak(text,done){if(!prefs.speech||!window.speechSynthesis||!window.SpeechSynthesisUtterance){if(done)done();return;}const epoch=scanEpoch;const u=new SpeechSynthesisUtterance(text);u.rate=1;let called=false;const finish=()=>{if(called)return;called=true;if(epoch===scanEpoch&&done)done();};u.onend=finish;u.onerror=finish;speechSynthesis.speak(u);}
function schedule(){clearTimeout(timer);if(prefs.auto&&!held.has("Space"))timer=setTimeout(advance,prefs.interval);}
function highlight(){[...$("choices").children].forEach((b,i)=>b.classList.toggle("scan",i===index));$("scanstate").textContent=(prefs.auto?"Auto scan":"Manual scan")+(index<0?" · Ready":" · "+(index+1)+" of "+items.length);$("controlmode").textContent=prefs.auto?"ONE SWITCH · AUTO SCAN":"TWO SWITCHES · MANUAL SCAN";$("controlHint").textContent=prefs.auto?"Space · select highlighted choice":"Space · advance   |   Enter · select";}
function advance(){if(!items.length)return;stop();index=(index+1)%items.length;highlight();speak(items[index].label,schedule);}
function setItems(list,announcement=""){stop();items=list;index=-1;$("choices").replaceChildren(...list.map(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.addEventListener("click",()=>choose(a));return b;}));highlight();if(announcement)speak(announcement,schedule);else schedule();}
function choose(a){if(!a)return;stop();a.run();}
function status(){$("hp").textContent=s.player.hp+" / "+s.player.max;$("healthbar").style.width=100*s.player.hp/s.player.max+"%";$("gold").textContent=s.player.gold;$("potions").textContent=s.player.potions;$("turn").textContent=s.turn;$("journal").textContent=s.message;$("seed").textContent="Seed "+s.seed;$("location").textContent=D.FLOORS[s.depth-1];$("intent").textContent=s.reward?"Choose an upgrade. No enemies move while you decide.":s.enemies.filter(e=>e.hp>0&&D.dist(e,s.player)<=5).map(e=>e.name+": "+D.intentText(e)).join(" · ");$("depth").textContent="Floor "+s.depth+" / 3";$("objective").textContent=s.hasKey?"Stair key acquired":s.depth===3?"Defeat the Bell Warden":"Defeat the crypt guard";$("build").textContent="Attack "+s.player.attack+" · Armour "+s.player.armour+(s.player.focus?" · Riposte ready":"");$("hint").textContent=prefs.auto?"Space selects on release.":"Space advances · Enter selects."; }
function action(label,run){return {label,run};}
function scene(kind){
 $("game").hidden=kind==="title";$("titleScene").hidden=kind!=="title";
}
const PROLOGUE="For a hundred years, the doors of the Forgotten Crypt remained sealed. Tonight, a bell rings beneath the earth. You descend alone, armed with a sword and two healing draughts. Find the three stair keys and defeat the Bell Warden who waits below.";
const INSTRUCTIONS="Choose a direction to move. Attack adjacent enemies. Guard against a declared strike to prepare a powerful riposte, or move away. Enemies recover after striking. Defeat each floor's guardian for its stair key. Choose an upgrade between floors, and defeat the Bell Warden on floor three. Look around describes the dungeon without spending a turn. Space selects the highlighted choice in one-switch mode. In two-switch mode, Space advances and Enter selects.";
function titleCopy(kicker,heading,body){$("titleKicker").textContent=kicker;$("titleHeading").textContent=heading;$("titleText").textContent=body;}
function prologue(){screen="intro";scene("title");titleCopy("CHAPTER I · THE FORGOTTEN CRYPT","The bell beneath the earth",PROLOGUE);$("prompt").textContent="Prologue";setItems([action("Enter the crypt",()=>play(s.message)),action("Repeat narration",prologue),action("Back to main menu",start)],PROLOGUE);}
function play(announcement=""){begun=true;screen="play";scene("game");status();$("prompt").textContent=s.outcome?"Journey complete":s.reward?"Choose your reward":"Your move";const list=D.actions(s).map(a=>action(a.label,()=>{s=D.step(s,a.id);const warning=s.enemies.filter(e=>e.hp>0&&D.dist(e,s.player)<=2).map(e=>e.name+": "+D.intentText(e)).join(". ");play(s.message+(s.outcome||s.reward?"":" "+warning));}));if(s.outcome){scene("title");titleCopy("EXPEDITION REPORT",s.outcome==="won"?"The crypt is conquered":"Fallen in the dark",D.summary(s));list.push(action("New expedition",()=>confirmNew()),action("Repeat results",()=>play(D.summary(s))));announcement=announcement||D.summary(s);}else if(!s.reward)list.push(action("Look around",()=>play(D.describe(s))));list.push(action("Settings",()=>settings()),action("Main menu",()=>start()));setItems(list,announcement);}
function confirmNew(){const back=screen==="play"?play:start;$("prompt").textContent="Begin a new expedition?";setItems([action("Cancel",()=>back()),action("Start new expedition",()=>{s=D.create();begun=false;prologue();})],"Start again? Current expedition will be lost.");}
function start(){screen="start";scene("title");status();titleCopy("A TURN-BASED FANTASY ADVENTURE","Dungeon Quest","Beyond the sealed gate, forgotten things awaken. Descend into the dark, find your fortune, and survive.");$("prompt").textContent="Main menu";setItems([action(begun?"Continue expedition":"Begin expedition",()=>begun?play(s.message):prologue()),action("Controls: "+(prefs.auto?"One switch":"Two switches"),()=>controlMenu(start)),action("How to play",instructions),action("Settings",settings),...(begun?[action("New expedition",confirmNew)]:[])],"Dungeon Quest. Main menu. Nothing moves until you choose.");}
function controlMenu(back){
 $("prompt").textContent="Choose switch controls";
 setItems([
  action("One switch — automatic scan"+(prefs.auto?" (current)":""),()=>{prefs.auto=true;save();back();}),
  action("Two switches — manual scan"+(!prefs.auto?" (current)":""),()=>{
   if(!prefs.auto){back();return;}
   $("prompt").textContent="Confirm two-switch mode";
   setItems([action("Cancel",()=>controlMenu(back)),action("Use two switches",()=>{prefs.auto=false;save();held.clear();back();})],"Two switches require Space to advance and Enter to select. Choose Cancel if you only have one switch.");
  }),
  action("Back",back)
 ],"One switch scans automatically. Two switches let you advance and select at your own pace.");
}
function instructions(){scene("title");titleCopy("THE ADVENTURER'S GUIDE","How to play",INSTRUCTIONS);$("prompt").textContent="How to play";setItems([action("Repeat instructions",instructions),action("Back",start)],INSTRUCTIONS);}
let returnScreen="start";
function settings(){if(screen!=="settings")returnScreen=screen;screen="settings";$("prompt").textContent="Settings";setItems([action("Controls: "+(prefs.auto?"One switch":"Two switches"),()=>controlMenu(settings)),action("Scan speed: "+prefs.interval/1000+" seconds",()=>{const speeds=[1000,1500,2000,3000,4000];prefs.interval=speeds[(speeds.indexOf(prefs.interval)+1)%speeds.length];save();settings();}),action("Speech: "+(prefs.speech?"On":"Off"),()=>{prefs.speech=!prefs.speech;save();settings();}),action("Reduced motion: "+(prefs.reduced?"On":"Off"),()=>{prefs.reduced=!prefs.reduced;save();settings();}),action("Back",()=>returnScreen==="play"?play():start())]);}
document.addEventListener("keydown",e=>{if(!["Space","Enter"].includes(e.code)||e.target.matches("input,textarea,select"))return;e.preventDefault();if(!e.repeat){held.add(e.code);if(prefs.auto&&e.code==="Space"){clearTimeout(timer);timer=null;}}});
document.addEventListener("keyup",e=>{if(!held.delete(e.code))return;e.preventDefault();if(prefs.auto){if(e.code==="Space"){if(index<0)advance();else choose(items[index]);}}else if(e.code==="Space")advance();else if(index>=0)choose(items[index]);});
window.addEventListener("blur",()=>{held.clear();if(prefs.auto)schedule();});
function frame(t){if(!$("game").hidden)window.CryptArt.draw($("world"),s,t,prefs.reduced);requestAnimationFrame(frame);}
start();requestAnimationFrame(frame);
})();
