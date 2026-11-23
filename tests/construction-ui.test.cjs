"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const S=require("../src/sim.js");
test("custom footprints, categories, security selection and zones work through the UI",()=>{
 class Element{
  constructor(id){this.id=id;this.clientWidth=1200;this.clientHeight=800;this.style={};this.innerHTML="";this.textContent="";this.dataset={};this.hidden=["panel","contextMenu","contractorModal"].includes(id);this.disabled=false;this.tagName="DIV";this.handlers={};this.className="";}
  get classList(){const it=this;return{add(k){if(k==="hidden")it.hidden=true},remove(k){if(k==="hidden")it.hidden=false},toggle(k,v){if(k==="hidden")it.hidden=!!v},contains(k){return k==="hidden"?it.hidden:false}}}
  getBoundingClientRect(){return {left:0,top:0,width:1200,height:800}}
  addEventListener(k,fn){this.handlers[k]=fn}
  setPointerCapture(){}
  getContext(){return new Proxy({}, {get(_c,k){if(k==="createLinearGradient")return ()=>({addColorStop(){}});if(k==="measureText")return ()=>({width:60});return ()=>{};}})}
 }
 const elMap=new Map(),el=id=>{if(!elMap.has(id))elMap.set(id,new Element(id));return elMap.get(id)};
 const events={},doc={getElementById:el,querySelectorAll:()=>[],addEventListener:(k,fn)=>{events[k]=fn},activeElement:{tagName:"BODY"}};
 const win={IPSim:S,devicePixelRatio:1,addEventListener(){}},store={};
 const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
 new Function("window",fs.readFileSync(path.join(__dirname,"../src/render.js"),"utf8"))(win);
 const env={window:win,document:doc,ResizeObserver:class{observe(){}},requestAnimationFrame(){},setInterval(){},setTimeout(){return 1},clearTimeout(){},localStorage,confirm(){return true},Intl,Date,Math,JSON};
 new Function(...Object.keys(env),fs.readFileSync(path.join(__dirname,"../src/app.js"),"utf8"))(...Object.values(env));
 const click=(selector,dataset)=>events.click({target:{dataset,closest:q=>q===selector?{dataset}:null}});
 const canvas=el("gameCanvas");
 const world=(x,y)=>({clientX:600+((x-y)+4)*32*.98,clientY:400+((x+y)-34)*16*.98});
 const drag=(start,end,shift=false)=>{
   const a=world(start[0]+.5,start[1]+.5),b=world(end[0]+.5,end[1]+.5);
   canvas.handlers.pointerdown({...a,button:0,pointerId:1,shiftKey:shift,preventDefault(){}});
   canvas.handlers.pointermove({...b,buttons:1,shiftKey:shift});
   canvas.handlers.pointerup({...b,button:0,pointerId:1});
 };
 click("[data-tool]",{tool:"office"});
 drag([6,12],[8,14]);
 assert.match(el("mapInfo").innerHTML,/9 Baufelder/);
 drag([8,12],[8,13],true);
 assert.match(el("mapInfo").innerHTML,/7 Baufelder/);
 click("[data-action]",{action:"review-footprint"});
 assert.equal(el("contractorModal").hidden,false);
 assert.match(el("contractorOffers").innerHTML,/Rheinbau Projektbau/);
 click("[data-action]",{action:"commission-project",contractor:"rheinbau"});
 assert.equal(el("contractorModal").hidden,true);
 click("[data-action]",{action:"save"});
 const s=JSON.parse(store["industrial-park-save-v2"]);
 assert.equal(s.buildings.length,1);
 assert.equal(s.buildings[0].shape.length,7);
 click("[data-action]",{action:"floor-view"});
 assert.match(el("viewHint").textContent,/2,5D/);
 click("[data-action]",{action:"open-catalog"});
 assert.equal(el("panel").hidden,false);
 assert.match(el("panelBody").innerHTML,/Dome-Kamera/);
 click("[data-action]",{action:"catalog-filter",id:"brandschutz"});
 assert.match(el("panelBody").innerHTML,/Handfeuermelder/);
 click("[data-action]",{action:"catalog-filter",id:"sicherheit"});
 assert.match(el("panelBody").innerHTML,/Bullet-Kamera/);
 click("[data-action]",{action:"catalog-select",tool:"asset:dome",variant:"hell"});
 assert.equal(el("panel").hidden,true);
 // New L-shaped building has 12×12 m bounding plan. Choose interior first 4m cell.
 const floor=(x,y)=>{const g=23,originX=(1200-24*g)/2,originY=(800-24*g*.5)/2+16;
   return {clientX:originX+(x-y+12)*g,clientY:originY+(x+y)*g*.5}};
 const p=floor(2.5,2.5);
 canvas.handlers.pointerdown({...p,button:0,pointerId:1,preventDefault(){}});
 canvas.handlers.pointerup({...p,button:0,pointerId:1});
 click("[data-action]",{action:"save"});
 const after=JSON.parse(store["industrial-park-save-v2"]);
 assert.ok(after.buildings[0].floors[0].items.some(it=>it.assetId==="dome"));
 assert.ok(after.devices.some(d=>d.assetId==="dome"));
 click("[data-action]",{action:"open-catalog"});
 click("[data-action]",{action:"catalog-filter",id:"zonen"});
 click("[data-action]",{action:"catalog-select",tool:"zone:toilet"});
 assert.match(el("viewHint").textContent,/2,5D/);
 assert.match(el("mapInfo").innerHTML,/Zone zeichnen/);
});
