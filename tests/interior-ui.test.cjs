"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const S=require("../src/sim.js");

test("2.5D editor opens full-screen, paints a wall and a floor, saves and switches plan views",()=>{
 const state=S.create();
 const planned=S.commission(state,{tool:"office",x:7,y:12},"rheinbau");
 assert.equal(planned.ok,true);
 const building=planned.building;
 class Element {
   constructor(id){
     this.id=id;this.clientWidth=1200;this.clientHeight=800;this.style={};this.innerHTML="";this.textContent="";
     this.dataset={};this.hidden=["panel","contextMenu","contractorModal"].includes(id);
     this.disabled=false;this.tagName="DIV";this.handlers={};this.className="";
   }
   get classList(){const el=this;return{
     add(name){if(name==="hidden")el.hidden=true;},
     remove(name){if(name==="hidden")el.hidden=false;},
     toggle(name,value){if(name==="hidden")el.hidden=!!value;},
     contains(name){return name==="hidden"?el.hidden:false;}
   };}
   getBoundingClientRect(){return {left:0,top:0,width:1200,height:800};}
   addEventListener(event,fn){this.handlers[event]=fn;}
   setPointerCapture(){}
   getContext(){return new Proxy({}, {get(_ctx,key){
     if(key==="createLinearGradient")return ()=>({addColorStop(){}});
     if(key==="measureText")return ()=>({width:64});
     return ()=>{};
   }});}
 }
 const elements=new Map(),get=id=>{
   if(!elements.has(id))elements.set(id,new Element(id));
   return elements.get(id);
 };
 const listeners={},doc={getElementById:get,querySelectorAll(){return [];},
   addEventListener(event,fn){listeners[event]=fn;},activeElement:{tagName:"BODY"}};
 const win={IPSim:S,devicePixelRatio:1,addEventListener(){}};
 const saved={"industrial-park-save-v2":JSON.stringify(state)};
 const storage={getItem:k=>saved[k]||null,setItem:(k,val)=>{saved[k]=val;}};
 const renderCode=fs.readFileSync(path.join(__dirname,"../src/render.js"),"utf8");
 const appCode=fs.readFileSync(path.join(__dirname,"../src/app.js"),"utf8");
 new Function("window",renderCode)(win);
 const env={window:win,document:doc,ResizeObserver:class{observe(){}},
   requestAnimationFrame(){},setInterval(){},setTimeout(){return 1;},clearTimeout(){},
   localStorage:storage,confirm(){return true;},Intl,Date,Math,JSON};
 new Function(...Object.keys(env),appCode)(...Object.values(env));
 function click(selector,dataset){
   listeners.click({target:{dataset,closest(q){return q===selector?{dataset}:null;}}});
 }
 click("[data-nav]",{nav:"buildings"});
 assert.equal(get("panel").hidden,false);
 click("[data-action]",{action:"inspect-building",id:building.id});
 click("[data-action]",{action:"floor-view"});
 assert.equal(get("panel").hidden,true);
 assert.match(get("viewHint").textContent,/2,5D/);
 click("[data-tool]",{tool:"floorfinish:oak"});
 assert.match(get("mapInfo").innerHTML,/Eichenparkett/);
 const floor=building.floors[0],size=23,ox=(1200-(floor.cols+floor.rows)*size)/2;
 const oy=(800-(floor.cols+floor.rows)*size*.5)/2+16;
 const project=(x,y)=>({x:ox+(x-y+floor.rows)*size,y:oy+(x+y)*size*.5});
 const canvas=get("gameCanvas");
 const interact=p=>{
   canvas.handlers.pointerdown({button:0,clientX:p.x,clientY:p.y,pointerId:1,preventDefault(){}});
   canvas.handlers.pointerup({button:0,clientX:p.x,clientY:p.y,pointerId:1});
 };
 interact(project(4.5,5.5));
 click("[data-tool]",{tool:"finish:navy"});
 const left=project(9,0),right=project(10,0);
 const wall={x:(left.x+right.x)/2,y:(left.y+right.y)/2-size*.65};
 canvas.handlers.pointermove({clientX:wall.x,clientY:wall.y,buttons:0});
 interact(wall);
 click("[data-action]",{action:"save"});
 const result=JSON.parse(saved["industrial-park-save-v2"]);
 assert.equal(result.buildings[0].floors[0].floorFinishes["4,5"],"oak");
 assert.ok(Object.values(result.buildings[0].floors[0].wallFinishes).includes("navy"));
 click("[data-action]",{action:"floor-view-toggle"});
 assert.match(get("viewHint").textContent,/Bauplan/);
 click("[data-action]",{action:"floor-view-toggle"});
 assert.match(get("viewHint").textContent,/2,5D/);
});
