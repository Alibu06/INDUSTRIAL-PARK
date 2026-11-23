"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const S=require("../src/sim.js");
function building(){
 const state=S.create();
 const result=S.commission(state,{tool:"office",x:7,y:12},"rheinbau");
 assert.equal(result.ok,true);
 return {state,b:result.building,f:result.building.floors[0]};
}
test("newly commissioned buildings have complete editable wall shells",()=>{
 const {f}=building();
 assert.equal(Object.keys(f.walls).length,2*(f.cols+f.rows));
 assert.ok(f.walls["H:0:0"]);
 assert.ok(f.walls["H:0:"+f.rows]);
 assert.ok(f.walls["V:0:0"]);
 assert.ok(f.walls["V:"+f.cols+":0"]);
 assert.deepEqual(f.wallFinishes,{});
 assert.deepEqual(f.floorFinishes,{});
});
test("individual wall paint and glass partitions are paid, persisted and removed correctly",()=>{
 const {state,b,f}=building(),edge="H:7:0";
 const cash=state.cash,price=S.WALL_FINISHES.navy.cost;
 const paint=S.finishWall(state,b.id,0,edge,"navy");
 assert.equal(paint.ok,true);assert.equal(state.cash,cash-price);
 assert.equal(f.wallFinishes[edge],"navy");
 assert.equal(S.finishWall(state,b.id,0,edge,"navy").ok,false);
 assert.equal(state.cash,cash-price);
 assert.equal(S.finishWall(state,b.id,0,"H:2:2","glass").ok,false);
 S.setWall(state,b.id,0,2,2,6,2,false);
 assert.equal(S.finishWall(state,b.id,0,"H:3:2","glass").ok,true);
 assert.equal(S.toggleDoor(state,b.id,0,"H:3:2").ok,true);
 assert.ok(f.doors["H:3:2"]);
 S.setWall(state,b.id,0,2,2,6,2,true);
 assert.equal(f.walls["H:3:2"],undefined);
 assert.equal(f.wallFinishes["H:3:2"],undefined);
 assert.equal(f.doors["H:3:2"],undefined);
});
test("floor finishes are independent of room classification, cost money and survive saving",()=>{
 const {state,b,f}=building(),before=state.cash;
 assert.equal(f.tiles["4,5"],"office");
 const result=S.finishFloor(state,b.id,0,4,5,"oak");
 assert.equal(result.ok,true);
 assert.equal(result.cost,S.FLOOR_FINISHES.oak.cost);
 assert.equal(f.tiles["4,5"],"office");
 assert.equal(f.floorFinishes["4,5"],"oak");
 assert.equal(state.cash,before-result.cost);
 assert.equal(S.finishFloor(state,b.id,0,4,5,"oak").ok,false);
 assert.equal(S.finishFloor(state,b.id,0,-1,5,"tile").ok,false);
 assert.equal(S.finishFloor(state,b.id,0,4,5,"unknown").ok,false);
 assert.equal(state.cash,before-result.cost);
 assert.equal(S.paint(state,b.id,0,4,5,"meeting").ok,true);
 assert.equal(f.floorFinishes["4,5"],"oak");
 const loaded=S.validateLoaded(JSON.parse(JSON.stringify(state)));
 assert.equal(loaded.buildings[0].floors[0].floorFinishes["4,5"],"oak");
 assert.equal(loaded.buildings[0].floors[0].tiles["4,5"],"meeting");
});
test("isometric hit testing and wall surface picking align with drawn geometry",()=>{
 const {state,b}=building();
 const beforeWindow=global.window;
 try{
   global.window={IPSim:S,devicePixelRatio:1};
   delete require.cache[require.resolve("../src/render.js")];
   require("../src/render.js");
   let fills=0;
   const ctx=new Proxy({}, {get(_target,key){
      if(key==="createLinearGradient")return ()=>({addColorStop(){}});
      if(key==="measureText")return ()=>({width:60});
      if(key==="fill")return ()=>{fills++;};
      return ()=>{};
   },set(){return true;}});
   const canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({width:1280,height:780})};
   const renderer=global.window.IPRender.create(canvas);
   renderer.resize();
   const ui={mode:"floor",floorView:"iso",selectedId:b.id,floorIndex:0,
     tool:"wall",cam:{floorZoom:1,floorX:0,floorY:0}};
   const f=b.floors[0],size=23,ox=(1280-(f.cols+f.rows)*size)/2,oy=(780-(f.cols+f.rows)*size*.5)/2+16;
   const projected=(x,y,z=0)=>({x:ox+(x-y+f.rows)*size,y:oy+(x+y)*size*.5-z*size});
   const center=projected(8.5,6.5);
   const hit=renderer.hitFloor(center.x,center.y,ui,b);
   assert.equal(hit.x,8);assert.equal(hit.y,6);assert.equal(hit.inside,true);
   S.setWall(state,b.id,0,7,7,13,7,false);
   const a=projected(9,7),bb=projected(10,7);
   const face={x:(a.x+bb.x)/2,y:(a.y+bb.y)/2-size*.65};
   assert.equal(renderer.pickFloorWall(face.x,face.y,ui,b),"H:9:7");
   S.finishWall(state,b.id,0,"H:9:7","glass");
   S.finishFloor(state,b.id,0,8,6,"oak");
   ui.hoverWall="H:9:7";ui.tool="finish:navy";
   renderer.render(state,ui,19000);
   assert.ok(fills>f.cols*f.rows);
   ui.floorView="plan";
   renderer.render(state,ui,19000);
   const planSize=32,px=(1280-f.cols*planSize)/2,py=(780-f.rows*planSize)/2;
   const planHit=renderer.hitFloor(px+8.5*planSize,py+6.5*planSize,ui,b);
   assert.equal(planHit.x,8);assert.equal(planHit.y,6);
 }finally{
   if(beforeWindow===undefined)delete global.window;else global.window=beforeWindow;
 }
});
