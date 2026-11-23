"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),S=require("../src/sim.js");
test("preview does not mutate state and rotated footprints fit only owned land",()=>{
 const s=S.create(),before=JSON.stringify(s);
 assert.equal(S.preview(s,"office",30,12).ok,false);
 const p=S.preview(s,"office",7,12,1);
 assert.equal(p.ok,true);assert.equal(p.w,4);assert.equal(p.h,5);
 assert.equal(JSON.stringify(s),before);
 const b=S.place(s,"office",7,12,1);
 assert.equal(b.ok,true);assert.equal(b.building.rotation,1);
 assert.equal(b.building.floors[0].cols,16);assert.equal(b.building.floors[0].rows,20);
});
test("path placement prevents duplicate charges",()=>{
 const s=S.create(),before=s.cash;
 const path=[{x:5,y:15},{x:6,y:15},{x:7,y:15},{x:7,y:15}];
 const r=S.placePath(s,"road",path);
 assert.equal(r.ok,true);assert.equal(r.count,3);assert.equal(r.cost,27000);
 assert.equal(s.cash,before-27000);
 const duplicate=S.placePath(s,"road",path);
 assert.equal(duplicate.ok,false);assert.equal(s.cash,before-27000);
});
test("parking spaces cannot be silently removed by construction",()=>{
 const s=S.create();assert.equal(S.place(s,"parking",10,18).ok,true);
 const collision=S.preview(s,"warehouse",8,16);
 assert.equal(collision.ok,false);assert.match(collision.message,/Parkplätze/);
});
test("bulk construction is rejected when there is insufficient capital",()=>{
 const s=S.create();s.cash=12000;const before=s.parking.length;
 const r=S.placePath(s,"parking",[{x:5,y:20},{x:6,y:20},{x:7,y:20}]);
 assert.equal(r.ok,false);assert.equal(s.cash,12000);assert.equal(s.parking.length,before);
});
test("contractor procurement reserves selected cells until project completion",()=>{
 const s=S.create();
 const r=S.commission(s,{tool:"road",points:[{x:5,y:11},{x:5,y:12}]},"rheinbau");
 assert.equal(r.ok,true);
 assert.equal(s.roads.length,0);
 assert.equal(S.preview(s,"road",5,11).ok,false);
 assert.match(S.preview(s,"road",5,11).message,/reserviert/);
 S.advance(s,(r.project.totalDays+1)*1440);
 assert.equal(s.roads.length,2);
 assert.equal(S.preview(s,"road",5,11).ok,false);
 assert.match(S.preview(s,"road",5,11).message,/bereits vorhanden/);
});
test("commission is atomic when quote is over available capital",()=>{
 const s=S.create();s.cash=2000;const before=JSON.stringify(s);
 assert.equal(S.commission(s,{tool:"road",points:[{x:5,y:11}]},"rheinbau").ok,false);
 assert.equal(JSON.stringify(s),before);
});
