"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const S=require("../src/sim.js");
test("new career starts entirely empty on one owned parcel",()=>{
 const s=S.create(),t=S.create();
 assert.equal(s.version,2);assert.equal(s.buildings.length,0);assert.equal(s.companies.length,0);
 assert.equal(s.roads.length,0);assert.equal(s.parking.length,0);assert.equal(s.devices.length,0);
 assert.deepEqual(s.staff,{technicians:0,cleaners:0,security:0});
 assert.equal(s.constructionDept.active,false);assert.equal(S.metrics(s).rent,0);
 assert.equal(s.parcels.filter(p=>p.owned).length,1);assert.deepEqual(s.publicRoads,t.publicRoads);
 assert.equal(S.propertyArea(s),5120);
});
test("land cannot be developed before it has been purchased",()=>{
 const s=S.create(),before=s.cash;
 assert.match(S.preview(s,"office",28,13).message,/Eigentum/);
 assert.equal(S.commission(s,{tool:"office",x:28,y:13},"rheinbau").ok,false);
 const price=s.parcels.find(p=>p.id==="P-02").price;
 assert.equal(S.buyParcel(s,"P-02").ok,true);
 assert.equal(s.cash,before-price);
 assert.equal(S.buyParcel(s,"P-02").ok,false);
 assert.equal(S.preview(s,"office",28,13).ok,true);
});
test("multiple contractors offer distinct quality, prices and times",()=>{
 const s=S.create(),qs=S.getQuotes(s,"office");
 assert.equal(qs.length,3);
 assert.ok(qs[1].price<qs[0].price);assert.ok(qs[2].days<qs[0].days);
 assert.ok(qs[2].quality>qs[0].quality);
 assert.equal(s.cash,790000);
});
test("the first commissioned building consumes funds and construction takes days",()=>{
 const s=S.create(),before=s.cash;
 const res=S.commission(s,{tool:"office",x:8,y:12,rotation:1},"rheinbau");
 assert.equal(res.ok,true);assert.ok(res.building.construction>0);
 assert.equal(res.building.w,4);assert.equal(res.building.h,5);
 assert.equal(s.cash,before-res.cost);
 assert.equal(s.projects[0].status,"bau");
 S.advance(s,(res.project.totalDays+1)*1440);
 assert.equal(res.building.construction,0);
 assert.equal(res.project.status,"fertig");
});
test("lease only a completed, correctly typed building",()=>{
 const s=S.create(),res=S.commission(s,{tool:"office",x:7,y:12},"direktbau");
 const app=s.applicants.find(a=>a.kind==="office");
 assert.equal(S.rent(s,res.building.id,app.name,6000).ok,false);
 S.advance(s,(res.project.totalDays+1)*1440);
 assert.equal(S.rent(s,res.building.id,app.name,100000).ok,false);
 const r=S.rent(s,res.building.id,app.name,5900);
 assert.equal(r.ok,true);assert.equal(res.building.tenantId,r.company.id);
 assert.equal(S.metrics(s).rent,5900);
});
test("interior editing works after commissioning building",()=>{
 const s=S.create(),r=S.commission(s,{tool:"office",x:7,y:12},"rheinbau"),b=r.building,f=b.floors[0];
 assert.equal(S.setWall(s,b.id,0,2,2,2,8,false).ok,true);
 assert.equal(S.toggleDoor(s,b.id,0,"V:2:3").ok,true);
 assert.equal(S.paint(s,b.id,0,6,6,"meeting").ok,true);
 assert.equal(S.putItem(s,b.id,0,5,5,"camera").ok,true);
 assert.equal(S.putItem(s,b.id,0,5,5,"camera").ok,false);
 assert.ok(f.items.find(it=>it.type==="camera"));
});
test("technical faults require actually employed maintenance personnel",()=>{
 const s=S.create(),b=S.commission(s,{tool:"office",x:7,y:12},"rheinbau").building;
 S.putItem(s,b.id,0,2,2,"hvac");
 const d=s.devices.find(d=>d.buildingId===b.id);
 d.condition=17;S.advance(s,1440);
 assert.equal(d.state,"defekt");
 const t=s.tickets.find(t=>t.deviceId===d.id);assert.ok(t);
 assert.equal(S.dispatch(s,t.id).ok,false);
 S.setStaff(s,"technicians",1);assert.equal(S.dispatch(s,t.id).ok,true);
 S.advance(s,5*1440);assert.equal(t.status,"erledigt");assert.equal(d.state,"ok");
});
test("external site contractor is needed to build first parking spots",()=>{
 const s=S.create();
 const plan={tool:"parking",points:[{x:8,y:22},{x:9,y:22}]};
 const r=S.commission(s,plan,"direktbau");
 assert.equal(r.ok,true);assert.equal(s.parking.length,0);
 assert.equal(S.preview(s,"office",8,20).ok,false);
 S.advance(s,(r.project.totalDays+1)*1440);
 assert.equal(s.parking.length,2);assert.equal(r.project.status,"fertig");
});
test("in-house construction team can be unlocked and has its own operating costs",()=>{
 const s=S.create(),before=S.metrics(s).staff;
 assert.equal(S.getQuotes(s,"office").some(q=>q.id==="eigen"),false);
 const r=S.startConstructionDept(s);assert.equal(r.ok,true);
 assert.equal(s.constructionDept.workers,5);
 assert.ok(S.metrics(s).staff>before);
 assert.equal(S.getQuotes(s,"office").find(q=>q.id==="eigen").available,true);
 const job=S.commission(s,{tool:"office",x:7,y:12},"eigen");
 assert.equal(job.ok,true);
 assert.equal(S.getQuotes(s,"road").find(q=>q.id==="eigen").available,false);
 S.advance(s,(job.project.totalDays+1)*1440);
 assert.equal(S.getQuotes(s,"road").find(q=>q.id==="eigen").available,true);
});
test("monthly cashflow is negative with an empty park and retains history",()=>{
 const s=S.create();S.advance(s,31*1440);
 assert.equal(s.companies.length,0);
 assert.equal(s.history.length,1);assert.ok(s.monthlyNet<0);
 assert.equal(s.cash,790000+s.monthlyNet);
});
test("local save state is roundtrip safe and old v1 does not overwrite fresh start",()=>{
 const s=S.create(),serialized=JSON.stringify(s),r=S.validateLoaded(JSON.parse(serialized));
 assert.equal(r.parcels[0].owned,true);assert.equal(r.buildings.length,0);
 assert.throws(()=>S.validateLoaded({version:1}),/nicht unterstützt/);
});
test("Shuttle and staffing remain optional and affect actual costs",()=>{
 const s=S.create();assert.equal(S.buyBus(s).ok,true);assert.equal(S.buyBus(s).ok,false);
 const before=S.metrics(s).staff;S.setStaff(s,"security",1);
 assert.ok(S.metrics(s).staff>before);
});
