"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),S=require("../src/sim.js");
function park(){const s=S.create(),r=S.commission(s,{tool:"office",x:8,y:13},"rheinbau");assert.equal(r.ok,true);return {s,b:r.building};}
test("construction catalogue holds priced dimensioned security and furnishing variants",()=>{
 assert.ok(S.ASSETS.length>=90);
 for(const id of ["deskCorner","desk160","table8","imac","imacPro","rack42","wlanCeiling","dome","bullet","turret","ptz","smoke","alarmButton","emergencyLight","readerBio"]){
   const a=S.ASSET_INDEX[id];assert.ok(a,id);assert.ok(a.w>0&&a.d>0&&a.price>0,id);
 }
 assert.equal(S.ASSET_INDEX.table8.w,2.4);
 assert.equal(S.ASSET_INDEX.desk160.w,1.6);
 assert.equal(S.DOOR_MODELS.double.width,2);
 assert.equal(S.WINDOW_MODELS.panorama.width,3);
});
test("25 cm dimensioned furniture collides correctly and tabletop computer has a desk",()=>{
 const {s,b}=park(),before=s.cash;
 const desk=S.placeAsset(s,b.id,0,"desk160",3,3);assert.equal(desk.ok,true);
 assert.equal(desk.item.x,3);assert.equal(desk.item.w,1.6);
 assert.equal(S.placeAsset(s,b.id,0,"chairErgo",3.5,3.25).ok,false);
 assert.equal(S.placeAsset(s,b.id,0,"imac",3.2,3.2).ok,true);
 assert.equal(S.placeAsset(s,b.id,0,"imac",6,6).ok,false);
 assert.equal(S.placeAsset(s,b.id,0,"chairErgo",5,3).ok,true);
 assert.ok(s.cash<before);
});
test("several security cameras differ and wall equipment requires walls",()=>{
 const {s,b}=park();
 assert.equal(S.ASSET_INDEX.bullet.range,35);
 assert.ok(S.ASSET_INDEX.ptz.price>S.ASSET_INDEX.dome.price);
 assert.equal(S.placeAsset(s,b.id,0,"bullet",5,5).ok,false);
 const mounted=S.placeAsset(s,b.id,0,"bullet",0,3);
 assert.equal(mounted.ok,true);
 assert.equal(mounted.item.assetId,"bullet");
 assert.ok(s.devices.find(d=>d.assetId==="bullet"));
 const ceiling=S.placeAsset(s,b.id,0,"dome",4,4);
 assert.equal(ceiling.ok,true);
});
test("door/window types honor multi-metre walls, exterior restrictions and collisions",()=>{
 const {s,b}=park(),f=b.floors[0];
 let r=S.installOpening(s,b.id,0,"H:2:0","door","double");
 assert.equal(r.ok,true);assert.equal(f.doors["H:3:0"].model,"double");
 assert.equal(S.installOpening(s,b.id,0,"H:3:0","door","fire90").ok,false);
 r=S.installOpening(s,b.id,0,"V:0:2","window","standard");
 assert.equal(r.ok,true);assert.equal(f.windows["V:0:2"].model,"standard");
 assert.equal(S.installOpening(s,b.id,0,"H:5:5","window","standard").ok,false);
 S.setWall(s,b.id,0,5,5,8,5,false);
 assert.equal(S.installOpening(s,b.id,0,"H:5:5","window","standard").ok,false);
 assert.equal(S.removeOpening(s,b.id,0,"H:3:0").ok,true);
 assert.equal(f.doors["H:2:0"],undefined);assert.equal(f.doors["H:3:0"],undefined);
});
test("freeform buildings have real U-shaped occupied masks and area-based costs",()=>{
 const s=S.create();
 const cells=[{x:5,y:12},{x:6,y:12},{x:7,y:12},{x:5,y:13},{x:7,y:13},{x:5,y:14},{x:7,y:14}];
 const p=S.previewFootprint(s,"office",cells);
 assert.equal(p.ok,true);assert.equal(p.cells.length,7);assert.equal(p.cost,112000);
 const r=S.commission(s,{tool:"office",cells},"rheinbau");
 assert.equal(r.ok,true);assert.equal(r.building.shape.length,7);
 assert.equal(r.building.floors[0].mask.length,112);
 assert.equal(S.validCell(r.building.floors[0],5,5),false);
 assert.equal(S.validCell(r.building.floors[0],1,1),true);
 assert.equal(S.paintZone(s,r.building.id,0,5,5,"office").ok,false);
 const disconnected=S.previewFootprint(s,"office",[{x:10,y:14},{x:12,y:14}]);
 assert.equal(disconnected.ok,false);assert.match(disconnected.message,/zusammenhängend/);
});
test("invisible room zones report functional requirements instead of mere color",()=>{
 const {s,b}=park(),f=b.floors[0];
 for(const [x,y] of [[4,4],[5,4],[4,5],[5,5]])assert.equal(S.paintZone(s,b.id,0,x,y,"toilet").ok,true);
 let r=S.zoneReport(s,b.id,0,"toilet");assert.equal(r.ready,false);
 assert.equal(S.placeAsset(s,b.id,0,"toiletWall",4,4).ok,true);
 assert.equal(S.placeAsset(s,b.id,0,"sink",5,4).ok,true);
 assert.equal(S.placeAsset(s,b.id,0,"lightLED",4,5).ok,true);
 assert.equal(S.placeAsset(s,b.id,0,"hvacCeiling",5,5).ok,true);
 r=S.zoneReport(s,b.id,0,"toilet");assert.equal(r.ready,true);
 assert.deepEqual(Object.keys(f.zones).length,4);
});
test("complete workstation sets are atomic and consist of individually removable objects",()=>{
 const {s,b}=park();
 const price=S.FURNITURE_SETS.workstation.pieces.reduce((sum,p)=>sum+S.ASSET_INDEX[p.id].price,0);
 const initial=s.cash;
 const success=S.placeSet(s,b.id,0,"workstation",2,2);
 assert.equal(success.ok,true);assert.equal(success.count,3);assert.equal(success.cost,price);
 assert.equal(s.cash,initial-price);
 assert.equal(b.floors[0].items.filter(i=>i.assetId).length,3);
 const before=JSON.stringify(s);
 const blocked=S.placeSet(s,b.id,0,"workstation",2,2);
 assert.equal(blocked.ok,false);assert.equal(JSON.stringify(s),before);
});
