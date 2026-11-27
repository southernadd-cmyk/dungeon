/* Read the Hub's existing visual preference record (ACCESSIBILITY.md).
 * Hub owns these settings; the game never overwrites them.
 * Verified against NARBEHOUSE/Narbehouse.github.io at 5b5686d43e7cebd66632d1a3d860f37dd4b9ae2d.
 */
(function(){
"use strict";
const root=document.documentElement,key="narbe-hub-settings";
const dark=["#10141b","#191d25","#252b34"];
const themes={
 default:dark,ocean:["#102a3c","#15384b","#20465b"],forest:["#10291e","#17392a","#234b38"],
 sunset:["#3a211a","#4a2c24","#583a2e"],midnight:["#080b16","#141a2c","#232b42"],
 rose:["#ffe3eb","#fff0f4","#f6d8e4"],sky:["#dcefff","#edf7ff","#d1e5f8"],
 cream:["#f2e6cf","#fff7e7","#ecdfc5"],mint:["#d9f3e5","#effaf3","#cce9db"],
 lavender:["#e9e1f8","#f7f1ff","#e2d7f3"],peach:["#ffe4d4","#fff3e9","#f6d9c4"]
};
const colors={blue:["#70baff","#0056a9"],green:["#8aee91","#136423"],purple:["#d2a5ff","#7034a2"],red:["#ffa2a0","#ad2727"],yellow:["#ffe16e","#795600"],white:["#ffffff","#ffffff"]};
const textColors={green:["#a2f3a4","#175e26"],purple:["#e4c4ff","#572988"],red:["#ffb5b2","#9d2525"],gold:["#f4d48b","#765000"],black:["#111111","#111111"],white:["#ffffff","#ffffff"]};
const light=["#f3eada","#fffaf1","#ece2d1"];
const get=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k)?obj[k]:null;
function lum(hex){
 const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function apply(){
 let p={};try{p=JSON.parse(localStorage.getItem(key)||"{}")||{};}catch{}
 let palette=get(themes,p.bgTheme)||dark;
 // Explicit black or white text requires a contrasting surface even if the
 // selected theme would otherwise make that text difficult to read.
 if(p.textColor==="black"&&lum(palette[1])<.5)palette=light;
 if(p.textColor==="white"&&lum(palette[1])>.5)palette=dark;
 const isLight=lum(palette[1])>.5,index=isLight?1:0;
 const custom=Boolean(get(themes,p.bgTheme)&&p.bgTheme!=="default"||get(textColors,p.textColor));
 const paper=get(textColors,p.textColor)?.[index]||(isLight?"#202020":"#efe5ce");
 const scan=get(colors,p.highlightColor)?.[index]||(window.parent!==window?"#70baff":"#f0c97c");
 const style=contrast(scan,"#111111")>=contrast(scan,"#ffffff")?"#111111":"#ffffff";
 const vars={"--page-bg":palette[0],"--panel-bg":palette[1],"--button-bg":palette[2],"--paper":paper,
 "--muted":custom?paper:"#c0b9a8","--heading":custom?paper:"#f7e6c6","--gold":isLight?paper:"#eabf72",
 "--line":isLight?"#746d63":"#827b70","--scan-color":scan,"--scan-ink":style,
 "--scan-edge":contrast(scan,palette[2])>=3?scan:(isLight?"#171717":"#ffffff")};
 for(const [k,v] of Object.entries(vars))root.style.setProperty(k,v);
 root.setAttribute("data-hub-highlight-style",p.highlightStyle==="full"?"full":"outline");
 root.setAttribute("data-hub-size",["large","larger","largest"].includes(p.uiSize)?p.uiSize:"default");
 if(custom)root.setAttribute("data-hub-custom","");else root.removeAttribute("data-hub-custom");
}
apply();
window.addEventListener("storage",e=>{if(e.key===key||e.key===null)apply();});
window.addEventListener("focus",apply);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)apply();});
})();
