"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const S=require("../src/sim.js");
test("placement previews are non-mutating and share construction validation",()=>{
 const s=S.create(),before=JSON.stringify(s),existing=s.buildings[0];
 const blocked=S.preview(s,"office",existing.x,existing.y);
 assert.equal(blocked.ok,false);
 assert.match(blocked.message,/Gebäude|Straße/);
 assert.equal(JSON.stringify(s),before);
 const good=S.preview(s,"office",2,33,1);
 assert.equal(good.ok,true);
 assert.equal(good.w,4);
 assert.equal(good.h,5);
 const built=S.place(s,"office",2,33,1);
 assert.equal(built.ok,true);
 assert.equal(built.building.rotation,1);
 assert.equal(built.building.floors[0].cols,16);
 assert.equal(built.building.floors[0].rows,20);
});
test("road drawing supports paths with no duplicate charge",()=>{
 const s=S.create(),before=s.cash;
 const p=[{x:0,y:3},{x:1,y:3},{x:2,y:3},{x:2,y:3}];
 const r=S.placePath(s,"road",p);
 assert.equal(r.ok,true);
 assert.equal(r.count,3);
 assert.equal(r.cost,27000);
 assert.equal(s.cash,before-27000);
 assert.equal(s.roads.filter(k=>k==="2,3").length,1);
 const retry=S.placePath(s,"road",p);
 assert.equal(retry.ok,false);
 assert.equal(s.cash,before-27000);
});
test("parking cannot silently disappear beneath new buildings",()=>{
 const s=S.create(),place=S.place(s,"office",2,33);
 assert.equal(place.ok,true);
 const p=S.place(s,"parking",22,26);assert.equal(p.ok,true);
 const result=S.preview(s,"warehouse",21,23);
 assert.equal(result.ok,false);
 assert.match(result.message,/Parkplätze/);
});
test("bulk construction remains atomic when total cost exceeds capital",()=>{
 const s=S.create();s.cash=12000;const before=s.parking.length;
 const r=S.placePath(s,"parking",[{x:2,y:38},{x:3,y:38},{x:4,y:38}]);
 assert.equal(r.ok,false);
 assert.equal(s.cash,12000);
 assert.equal(s.parking.length,before);
});
