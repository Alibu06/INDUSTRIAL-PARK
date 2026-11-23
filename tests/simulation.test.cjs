"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const sim=require("../src/sim.js");

test("start setup is deterministic and has real tenants",()=>{
 const a=sim.create(),b=sim.create();
 assert.equal(a.version,1);
 assert.equal(a.buildings.length,5);
 assert.equal(a.companies.length,3);
 assert.equal(a.seed,b.seed);
 assert.ok(a.roads.length>80);
 assert.equal(sim.metrics(a).rent,18000);
});
test("construction costs money, takes days and respects collisions",()=>{
 const s=sim.create(),before=s.cash;
 assert.equal(sim.place(s,"office",15,11).ok,false);
 const r=sim.place(s,"office",2,33);assert.equal(r.ok,true);
 assert.equal(s.cash,before-sim.TYPES.office.cost);
 assert.ok(r.building.construction>0);
 sim.advance(s,12*24*60);
 assert.equal(r.building.construction,0);
});
test("lease offer only accepts appropriate vacant and completed building",()=>{
 const s=sim.create(),site=sim.place(s,"office",2,33).building;
 const applicant=s.applicants.find(a=>a.kind==="office");
 assert.equal(sim.rent(s,site.id,applicant.name,6000).ok,false);
 sim.advance(s,12*1440);
 assert.equal(sim.rent(s,site.id,applicant.name,100000).ok,false);
 const result=sim.rent(s,site.id,applicant.name,5900);
 assert.equal(result.ok,true);
 assert.equal(site.tenantId,result.company.id);
 assert.equal(sim.rent(s,site.id,applicant.name,5900).ok,false);
});
test("floor editor places walls, doors, room types and equipment",()=>{
 const s=sim.create(),b=s.buildings[0],f=b.floors[0];
 assert.equal(sim.setWall(s,b.id,0,2,2,2,8,false).ok,true);
 assert.ok(f.walls["V:2:3"]);
 assert.equal(sim.toggleDoor(s,b.id,0,"V:2:3").ok,true);
 assert.ok(f.doors["V:2:3"]);
 assert.equal(sim.paint(s,b.id,0,6,6,"meeting").ok,true);
 assert.equal(f.tiles["6,6"],"meeting");
 const d=sim.putItem(s,b.id,0,5,5,"camera");
 assert.equal(d.ok,true);
 assert.ok(s.devices.some(d=>d.type==="camera"&&d.x===5&&d.y===5));
 assert.equal(sim.putItem(s,b.id,0,5,5,"camera").ok,false);
 assert.equal(sim.setWall(s,b.id,0,2,2,2,8,true).ok,true);
 assert.equal(f.doors["V:2:3"],undefined);
});
test("equipment faults create tickets that staff can repair",()=>{
 const s=sim.create(),d=s.devices[0];d.condition=17;
 sim.advance(s,1440);
 assert.equal(d.state,"defekt");
 const t=s.tickets.find(t=>t.deviceId===d.id);assert.ok(t);
 const result=sim.dispatch(s,t.id);assert.equal(result.ok,true);
 sim.advance(s,5*1440);
 assert.equal(t.status,"erledigt");
 assert.equal(d.state,"ok");
});
test("monthly leases affect balance separately from loans",()=>{
 const s=sim.create(),cash=s.cash;
 sim.advance(s,30*1440);
 assert.ok(s.history.length>=1);
 assert.ok(s.cash!==cash);
 assert.equal(sim.metrics(s).companies,s.companies.length);
 assert.ok(s.monthlyNet<sim.metrics(s).rent);
});
test("parking, staff and shuttle affect location operations",()=>{
 const s=sim.create();const demand=sim.metrics(s).demand;
 assert.equal(sim.buyBus(s).ok,true);
 assert.ok(sim.metrics(s).demand<demand);
 assert.equal(sim.buyBus(s).ok,false);
 const people=s.staff.technicians;
 assert.equal(sim.setStaff(s,"technicians",1).ok,true);
 assert.equal(s.staff.technicians,people+1);
});
test("save payload survives JSON roundtrip",()=>{
 const s=sim.create(),serialized=JSON.stringify(s);
 const restored=sim.validateLoaded(JSON.parse(serialized));
 assert.equal(restored.buildings[0].id,s.buildings[0].id);
 assert.throws(()=>sim.validateLoaded({version:3}),/nicht unterstützt/);
});
