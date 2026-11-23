"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const S=require("../src/sim.js");
function makeBuilding(){
 const s=S.create(),r=S.commission(s,{tool:"office",x:8,y:12},"rheinbau");
 assert.equal(r.ok,true);
 return {s,b:r.building,f:r.building.floors[0]};
}
function rendererFor(w=1200,h=800){
 const ctx=new Proxy({}, {get(_t,k){
   if(k==="createLinearGradient")return ()=>({addColorStop(){}});
   if(k==="measureText")return text=>({width:String(text).length*7});
   return ()=>{};
 },set(){return true}});
 const canvas={width:w,height:h,getContext:()=>ctx,getBoundingClientRect:()=>({width:w,height:h})};
 const window={IPSim:S,devicePixelRatio:1};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/render.js"),"utf8"),{window});
 const renderer=window.IPRender.create(canvas);renderer.resize();
 return renderer;
}
test("new floors contain visible exterior shell wall segments",()=>{
 const {f}=makeBuilding();
 assert.equal(Object.keys(f.walls).length,2*(f.cols+f.rows));
 assert.equal(f.walls["H:2:0"],1);
 assert.equal(f.walls["V:0:2"],1);
 assert.equal(f.walls["V:"+f.cols+":2"],1);
 assert.deepEqual(f.wallFinishes,{});
});
test("individual walls can be painted navy, beige and translucent glass",()=>{
 const {s,b,f}=makeBuilding(),before=s.cash;
 let r=S.finishWall(s,b.id,0,"H:2:0","navy");
 assert.equal(r.ok,true);assert.equal(r.cost,68);
 assert.equal(S.finishWall(s,b.id,0,"H:2:0","navy").ok,false);
 assert.equal(S.finishWall(s,b.id,0,"H:3:0","beige").ok,true);
 S.setWall(s,b.id,0,4,2,4,7,false);
 assert.equal(S.finishWall(s,b.id,0,"V:4:3","glass").ok,true);
 assert.equal(f.wallFinishes["H:2:0"],"navy");
 assert.equal(f.wallFinishes["H:3:0"],"beige");
 assert.equal(f.wallFinishes["V:4:3"],"glass");
 assert.equal(s.cash,before-68-55-260);
 assert.equal(S.finishWall(s,b.id,0,"H:2:0","invalid").ok,false);
 assert.equal(S.finishWall(s,b.id,0,"V:9:9","navy").ok,false);
});
test("removing a wall also deletes its saved finish",()=>{
 const {s,b,f}=makeBuilding();
 S.setWall(s,b.id,0,3,3,3,5,false);
 S.finishWall(s,b.id,0,"V:3:3","sage");
 S.setWall(s,b.id,0,3,3,3,5,true);
 assert.equal(f.walls["V:3:3"],undefined);
 assert.equal(f.wallFinishes["V:3:3"],undefined);
});
test("2.5D renderer and 2D blueprint both draw from identical building data",()=>{
 const {s,b}=makeBuilding(),r=rendererFor();
 S.setWall(s,b.id,0,3,2,3,7,false);
 S.toggleDoor(s,b.id,0,"V:3:3");
 S.finishWall(s,b.id,0,"V:3:4","glass");
 S.putItem(s,b.id,0,5,5,"desk");
 const ui={mode:"floor",floorView:"iso",selectedId:b.id,floorIndex:0,
   cam:{cx:15,cy:19,zoom:.98,panX:0,panY:0,floorZoom:1,floorX:0,floorY:0},
   tool:"finish:navy",hoverFloor:null,wallStart:null};
 assert.doesNotThrow(()=>r.render(s,ui,500));
 const iso={x:186+(5.5-6.5+16)*23,y:209+(5.5+6.5)*11.5};
 let h=r.hitFloor(iso.x,iso.y,ui,b);
 assert.equal(h.x,5);assert.equal(h.y,6);assert.equal(h.inside,true);
 ui.floorView="plan";
 assert.doesNotThrow(()=>r.render(s,ui,500));
 // 1200 × 800 px viewport gives plan size of 32 px per m.
 h=r.hitFloor(280+5.5*32,144+6.5*32,ui,b);
 assert.equal(h.x,5);assert.equal(h.y,6);assert.equal(h.inside,true);
 assert.equal(r.pickFloorWall(280+2.5*32,144,ui,b),"H:2:0");
});
