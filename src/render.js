(function(root){
"use strict";
const S=root.IPSim, TAU=Math.PI*2;
const ground=["#92a88d","#95aa90","#91a68c","#98ac93"];
const roomColors={office:"#e6edf3",meeting:"#d9e9ed",hall:"#e6e7df",workshop:"#f2e5d5",kitchen:"#f6e7d7",bath:"#d8ebeb",lobby:"#e8e1f0",corridor:"#e4e9ef",server:"#d9e1ef",break:"#ebefdf"};
const clip=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(c,pts,fill,stroke,line){c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line||1;c.stroke();}}
function line(c,a,b,color,width){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineWidth=width||1;c.strokeStyle=color;c.stroke();}
function mix(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
function factory(canvas){
 const c=canvas.getContext("2d",{alpha:false});
 let cw=1,ch=1,dpr=1;
 function resize(){const r=canvas.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);}
 function worldP(x,y,z,u){let q=u.cam;return {x:cw/2+((x-y)-(q.cx-q.cy))*32*q.zoom+q.panX,y:ch/2+((x+y)-(q.cx+q.cy))*16*q.zoom+q.panY-z*q.zoom};}
 function unproject(mx,my,u){const q=u.cam,dx=(mx-cw/2-q.panX)/(32*q.zoom)+(q.cx-q.cy),dy=(my-ch/2-q.panY)/(16*q.zoom)+(q.cx+q.cy);return {x:Math.floor((dx+dy)/2),y:Math.floor((dy-dx)/2)};}
 function floorGeom(u,f){const size=clip(Math.min((cw-110)/f.cols,(ch-100)/f.rows),13,32)*u.cam.floorZoom;return {size,x:(cw-f.cols*size)/2+u.cam.floorX,y:(ch-f.rows*size)/2+u.cam.floorY};}
 function floorHit(mx,my,u,b){const f=b.floors[u.floorIndex]||b.floors[0],g=floorGeom(u,f),fx=(mx-g.x)/g.size,fy=(my-g.y)/g.size;return {x:Math.floor(fx),y:Math.floor(fy),nx:Math.round(fx),ny:Math.round(fy),fx,fy,inside:fx>=0&&fy>=0&&fx<f.cols&&fy<f.rows,g};}
 function drawText(text,x,y,size,color,bold,align){
  c.save();c.font=(bold?"600 ":"")+" "+size+"px Inter,Segoe UI,Arial,sans-serif";c.fillStyle=color;c.textAlign=align||"center";c.textBaseline="middle";c.fillText(text,x,y);c.restore();
 }
 function diamond(x,y,u,fill,stroke){const pts=[worldP(x,y,0,u),worldP(x+1,y,0,u),worldP(x+1,y+1,0,u),worldP(x,y+1,0,u)];polygon(c,pts,fill,stroke);}
 function roofLabel(x,y,u,name,sub){let p=worldP(x,y,0,u);c.save();c.font="600 11px Inter,Segoe UI,Arial";const width=Math.max(c.measureText(name).width+18,88);const h=34;c.fillStyle="rgba(17,35,49,.9)";c.beginPath();c.roundRect(p.x-width/2,p.y-h/2,width,h,8);c.fill();drawText(name,p.x,p.y-7,11,"#fff",true);drawText(sub,p.x,p.y+7,9,"#bdcfd9",false);c.restore();}
 function hash(x,y,k=0){let n=Math.imul((x|0)+k*17,374761393)+Math.imul(y|0,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
 function ellipse(x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,TAU);c.fill();}
 function paintTree(x,y,u){
   const n=hash(x,y),pine=n>.79,z=u.cam.zoom,p=worldP(x+.47,y+.51,0,u),r=(6.5+n*4.5)*z;
   ellipse(p.x+4*z,p.y+3*z,r*1.08,r*.43,"rgba(30,54,40,.16)");
   c.strokeStyle="#745d47";c.lineWidth=2.8*z;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-r*1.7);c.stroke();
   if(pine){
     polygon(c,[{x:p.x,y:p.y-r*3.2},{x:p.x-r*.72,y:p.y-r*.55},{x:p.x+r*.72,y:p.y-r*.55}],"#345d4a","#2a5140");
     polygon(c,[{x:p.x,y:p.y-r*2.1},{x:p.x-r*.88,y:p.y-r*.15},{x:p.x+r*.88,y:p.y-r*.15}],"#407559");
   }else{
     const colors=n>.45?["#497c62","#568a69","#74a07b"]:["#64865c","#719569","#83a37b"];
     ellipse(p.x-r*.15,p.y-r*1.7,r*.82,r*.9,colors[0]);
     ellipse(p.x+r*.41,p.y-r*1.85,r*.77,r*.86,colors[1]);
     ellipse(p.x-r*.45,p.y-r*1.22,r*.7,r*.70,colors[1]);
     ellipse(p.x+r*.31,p.y-r*1.21,r*.67,r*.73,colors[2]);
     if(z>.7){ellipse(p.x-r*.17,p.y-r*2.1,r*.35,r*.31,"rgba(205,226,179,.13)");}
   }
 }
 function vehicle(p,u,color,rotation,scale){
   c.save();c.translate(p.x,p.y);c.rotate(rotation);
   const z=u.cam.zoom*(scale||1),w=23*z,h=10*z;
   ellipse(2*z,4*z,w*.55,h*.60,"rgba(30,48,57,.22)");
   c.fillStyle="#273c48";c.fillRect(-w*.33,-h*.65,5*z,3*z);c.fillRect(w*.19,-h*.65,5*z,3*z);
   c.fillRect(-w*.33,h*.35,5*z,3*z);c.fillRect(w*.19,h*.35,5*z,3*z);
   c.fillStyle=color;c.beginPath();c.roundRect(-w*.5,-h*.5,w,h,3.2*z);c.fill();
   c.strokeStyle="rgba(24,53,62,.48)";c.lineWidth=.8*z;c.stroke();
   c.fillStyle="#3d6174";c.beginPath();c.roundRect(-w*.19,-h*.43,w*.44,h*.86,1.5*z);c.fill();
   c.fillStyle="#a9d0da";c.fillRect(-w*.15,-h*.37,w*.20,h*.75);
   c.fillStyle="rgba(255,255,255,.2)";c.fillRect(w*.06,-h*.3,w*.07,h*.6);
   c.fillStyle="#f2e3bb";c.fillRect(w*.43,-h*.3,1.5*z,2*z);c.fillRect(w*.43,h*.12,1.5*z,2*z);
   c.fillStyle="#b85049";c.fillRect(-w*.47,-h*.26,1.5*z,2*z);c.fillRect(-w*.47,h*.14,1.5*z,2*z);
   c.restore();
 }
 function streetFurniture(x,y,u,kind){
   const p=worldP(x+.5,y+.5,0,u),z=u.cam.zoom;
   if(kind==="lamp"){
     c.strokeStyle="#536d76";c.lineWidth=2*z;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-23*z);c.stroke();
     c.strokeStyle="#486775";c.lineWidth=2*z;c.beginPath();c.moveTo(p.x,p.y-23*z);c.lineTo(p.x+6*z,p.y-23*z);c.stroke();
     ellipse(p.x+6*z,p.y-22*z,3.8*z,2*z,"#fff0be");
     ellipse(p.x+6*z,p.y-21*z,7*z,3.5*z,"rgba(255,236,178,.12)");
   }else if(kind==="bench"){
     const a=worldP(x+.23,y+.43,0,u),b=worldP(x+.8,y+.43,0,u);
     line(c,a,b,"#806a56",4*z);
     line(c,{x:a.x,y:a.y-3*z},{x:b.x,y:b.y-3*z},"#a58762",2*z);
     c.strokeStyle="#4d5d64";c.lineWidth=1.5*z;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x,a.y+4*z);c.moveTo(b.x,b.y);c.lineTo(b.x,b.y+4*z);c.stroke();
   }else if(kind==="sign"){
     c.strokeStyle="#6c7e83";c.lineWidth=2*z;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-17*z);c.stroke();
     c.fillStyle="#e2e8e5";c.fillRect(p.x-11*z,p.y-27*z,22*z,12*z);
     c.fillStyle="#346f87";c.fillRect(p.x-11*z,p.y-27*z,3*z,12*z);
   }
 }
 function paintBuilding(b,s,u){
  const construction=b.construction>0,hover=u.hover&&u.hover.x>=b.x&&u.hover.x<b.x+b.w&&u.hover.y>=b.y&&u.hover.y<b.y+b.h;
  const selected=u.selectedId===b.id;
  const h=(20+b.floors.length*30);
  const a=worldP(b.x,b.y,0,u),e=worldP(b.x+b.w,b.y,0,u),d=worldP(b.x+b.w,b.y+b.h,0,u),f=worldP(b.x,b.y+b.h,0,u);
  const at=worldP(b.x,b.y,h,u),et=worldP(b.x+b.w,b.y,h,u),dt=worldP(b.x+b.w,b.y+b.h,h,u),ft=worldP(b.x,b.y+b.h,h,u);
  c.save();
  polygon(c,[{x:f.x+9,y:f.y+8},{x:d.x+10,y:d.y+9},{x:e.x+13,y:e.y+12},{x:a.x+12,y:a.y+10}],"rgba(32,51,58,.17)");
  const colors={office:["#9bafbb","#bccbd2","#dbe7e8"],warehouse:["#879b9e","#a9b6b6","#cbd2ce"],workshop:["#b69b87","#c7b2a2","#ded1c3"],cafe:["#a5a68b","#c5c3a8","#e3dbc0"],service:["#7c98a6","#acc2ca","#d6e0df"]};
  const [side,front,top]=colors[b.type];
  polygon(c,[f,d,dt,ft],front,"rgba(40,62,69,.2)");
  polygon(c,[d,e,et,dt],side,"rgba(40,62,69,.22)");
  polygon(c,[at,et,dt,ft],construction?"#b7a78c":top,selected?"#ebac4e":hover?"#9ec8de":"#60767a",selected?3:1);
  if(b.type==="warehouse"){
    for(let j=1;j<6;j++){const q=mix(ft,dt,j/6),t=mix(at,et,j/6);line(c,q,t,"rgba(104,123,127,.22)",2*u.cam.zoom);}
    for(let j=1;j<=3;j++){const center=mix(f,d,j/4),topP=mix(ft,dt,j/4);polygon(c,[mix(f,d,(j-.30)/4),mix(f,d,(j+.30)/4),mix(ft,dt,(j+.30)/4),mix(ft,dt,(j-.30)/4)],"#657e87","#455c61");line(c,center,topP,"#93acb2",1);}
  }else{
    for(let floor=0;floor<b.floors.length;floor++){
      for(let j=1;j<=b.w*2;j++){
        const t=j/(b.w*2+1),low=mix(f,d,t),hi=mix(ft,dt,t),mid=mix(low,hi,(floor+.4)/(b.floors.length+1));
        const w=5*u.cam.zoom,hh=8*u.cam.zoom;
        polygon(c,[{x:mid.x-w,y:mid.y-hh},{x:mid.x+w,y:mid.y-hh-2*u.cam.zoom},{x:mid.x+w,y:mid.y+hh-2*u.cam.zoom},{x:mid.x-w,y:mid.y+hh}],"#496b7a","#d5e3e8",.8*u.cam.zoom);
      }
      for(let j=1;j<=b.h*2;j++){
        const t=j/(b.h*2+1),low=mix(e,d,t),hi=mix(et,dt,t),mid=mix(low,hi,(floor+.4)/(b.floors.length+1));
        polygon(c,[{x:mid.x-4*u.cam.zoom,y:mid.y-8*u.cam.zoom},{x:mid.x+4*u.cam.zoom,y:mid.y-6*u.cam.zoom},{x:mid.x+4*u.cam.zoom,y:mid.y+7*u.cam.zoom},{x:mid.x-4*u.cam.zoom,y:mid.y+5*u.cam.zoom}],"#537487","#c2d5dc",.5*u.cam.zoom);
      }
    }
    if(b.type==="cafe"){const tent=mix(ft,dt,.42);polygon(c,[{x:tent.x-20*u.cam.zoom,y:tent.y+2*u.cam.zoom},{x:tent.x+12*u.cam.zoom,y:tent.y-12*u.cam.zoom},{x:tent.x+12*u.cam.zoom,y:tent.y+0*u.cam.zoom},{x:tent.x-20*u.cam.zoom,y:tent.y+15*u.cam.zoom}],"#9a5949");}
    else{
      const vent=mix(at,dt,.5);c.fillStyle="#81989e";c.fillRect(vent.x-11*u.cam.zoom,vent.y-9*u.cam.zoom,22*u.cam.zoom,15*u.cam.zoom);
      c.strokeStyle="#596d72";c.strokeRect(vent.x-11*u.cam.zoom,vent.y-9*u.cam.zoom,22*u.cam.zoom,15*u.cam.zoom);
    }
  }
  if(!construction&&u.cam.zoom>.53){
    const roof=(xx,yy,height=0)=>worldP(b.x+xx,b.y+yy,h+height,u);
    const flat=(xx,yy,ww,hh,fill,stroke)=>polygon(c,[roof(xx,yy),roof(xx+ww,yy),roof(xx+ww,yy+hh),roof(xx,yy+hh)],fill,stroke||"rgba(52,80,87,.18)",.7*u.cam.zoom);
    const z=u.cam.zoom;
    if(b.type==="office"||b.type==="service"){
      const cols=Math.max(2,Math.floor(b.w/1.3));
      for(let j=0;j<cols;j++){
        flat(.65+j*.96,.7,.72,.76,"#426a7c","#a8c7c9");
        line(c,roof(.69+j*.96,1.05),roof(1.28+j*.96,1.05),"rgba(192,224,231,.55)",.6*z);
      }
      flat(b.w-.95,b.h-.95,.65,.57,"#718f96","#4e6e78");
      const p=roof(b.w-.65,b.h-.65,5);
      polygon(c,[roof(b.w-.9,b.h-.85),roof(b.w-.32,b.h-.85),p,roof(b.w-.9,b.h-.35)],"#6e8b92");
      const entry=worldP(b.x+b.w*.57,b.y+b.h,8,u);
      c.fillStyle="#3f6575";c.beginPath();c.roundRect(entry.x-7*z,entry.y-15*z,15*z,19*z,z);c.fill();
      c.strokeStyle="#bad7db";c.lineWidth=.7*z;c.strokeRect(entry.x-7*z,entry.y-15*z,15*z,19*z);
      line(c,{x:entry.x,y:entry.y-13*z},{x:entry.x,y:entry.y+3*z},"#bad0d4",.8*z);
    }else if(b.type==="warehouse"){
      for(let xx=.75;xx<b.w-1;xx+=1.4){
        flat(xx,.8,.86,b.h-1.6,"#516b78","#84a9b3");
        line(c,roof(xx+.43,.81),roof(xx+.43,b.h-.81),"rgba(166,204,217,.5)",z);
      }
      const vent=roof(b.w-.7,.4,2);ellipse(vent.x,vent.y,4*z,2.1*z,"#708a8e");
    }else if(b.type==="workshop"){
      for(let xx=.65;xx<b.w-.55;xx+=1.1)flat(xx,.78,.58,b.h-1.6,"#7897a0","#e6eff1");
      const frontage=worldP(b.x+b.w*.55,b.y+b.h,3,u);
      c.fillStyle="#455b64";c.fillRect(frontage.x-10*z,frontage.y-12*z,20*z,13*z);
      for(let j=1;j<4;j++)line(c,{x:frontage.x-10*z,y:frontage.y-12*z+j*3*z},{x:frontage.x+10*z,y:frontage.y-12*z+j*3*z},"#becdca",z);
    }else if(b.type==="cafe"){
      flat(.6,.6,1,.7,"#849b83","#cadac2");
      const terrace=worldP(b.x+b.w+.6,b.y+b.h*.6,0,u);
      ellipse(terrace.x,terrace.y,9*z,4*z,"#d0c6ad");
      ellipse(terrace.x,terrace.y-5*z,7*z,3*z,"#9d7762");
      line(c,{x:terrace.x,y:terrace.y-5*z},{x:terrace.x,y:terrace.y+3*z},"#7e6757",2*z);
    }
  }
  if(construction){
    const p=worldP(b.x+b.w/2,b.y+b.h/2,h+12,u);
    c.fillStyle="#f5bb63";c.fillRect(p.x-27*u.cam.zoom,p.y-3*u.cam.zoom,54*u.cam.zoom,6*u.cam.zoom);
    drawText("BAU "+b.construction+" T",p.x,p.y-17*u.cam.zoom,11*u.cam.zoom,"#533a14",true);
  }
  if(selected||hover||u.cam.zoom>1.25){
    const p=worldP(b.x+b.w/2,b.y+b.h/2,h+24,u);
    // The nameplate lives above the roof rather than covering the building.
    c.fillStyle="rgba(17,33,44,.91)";const txt=b.name,tw=Math.min(210,txt.length*6.6+22);
    c.beginPath();c.roundRect(p.x-tw/2,p.y-12*u.cam.zoom,tw,26*u.cam.zoom,7);c.fill();
    drawText(txt,p.x,p.y,11*u.cam.zoom,"#f7fbfc",true);
  }
  c.restore();
 }
 function pedestrians(s,u,t){
  for(const b of s.buildings.filter(b=>b.construction===0&&b.tenantId)){
    const company=s.companies.find(x=>x.id===b.tenantId);if(!company)continue;
    const hour=new Date(s.clock).getUTCHours();const amount=hour>6&&hour<19?Math.min(9,Math.ceil(company.employees/7)):0;
    for(let i=0;i<amount;i++){
      const a=i*2.399+t*.00013*(i%2?1:-1),r=(1.8+i%4);
      const x=b.x+b.w/2+Math.cos(a)*(b.w/2+r),y=b.y+b.h/2+Math.sin(a)*(b.h/2+r);
      const p=worldP(x,y,0,u),z=u.cam.zoom;
      c.fillStyle="rgba(37,58,51,.2)";c.beginPath();c.ellipse(p.x,p.y,3*z,2*z,0,0,TAU);c.fill();
      c.strokeStyle=i%3===0?"#42637d":i%3===1?"#7a6257":"#4b665d";c.lineWidth=3*z;c.beginPath();c.moveTo(p.x,p.y-2*z);c.lineTo(p.x,p.y-8*z);c.stroke();
      c.fillStyle="#e7bba0";c.beginPath();c.arc(p.x,p.y-10*z,2.6*z,0,TAU);c.fill();
    }
  }
 }
 function world(s,u,t){
  const bg=c.createLinearGradient(0,0,0,ch);
  bg.addColorStop(0,"#d9e7de");bg.addColorStop(1,"#bad1c3");
  c.fillStyle=bg;c.fillRect(0,0,cw,ch);
  const roads=new Set(s.roads),parks=new Set(s.parking),trees=new Set(s.trees);
  const z=u.cam.zoom;
  const busyHours=(new Date(s.clock).getUTCHours()>=7&&new Date(s.clock).getUTCHours()<=18);
  for(let y=0;y<s.world.h;y++)for(let x=0;x<s.world.w;x++){
    const k=S.key(x,y),road=roads.has(k),park=parks.has(k),n=roads.has(S.key(x,y-1)),e=roads.has(S.key(x+1,y)),w=roads.has(S.key(x-1,y)),south=roads.has(S.key(x,y+1));
    const near=n||e||w||south,v=hash(x,y,3);
    diamond(x,y,u,road?"#647278":park?"#a6b2b0":near?"#bdc9bd":v>.8?"#91a98f":v>.4?"#9eb39b":"#a7bda3",road?"rgba(232,237,236,.045)":"rgba(46,73,54,.065)");
    if(road){
      const corners=[worldP(x,y,0,u),worldP(x+1,y,0,u),worldP(x+1,y+1,0,u),worldP(x,y+1,0,u)];
      if(!n)line(c,corners[0],corners[1],"#c5d0cc",2*z);
      if(!e)line(c,corners[1],corners[2],"#c5d0cc",2*z);
      if(!south)line(c,corners[2],corners[3],"#c5d0cc",2*z);
      if(!w)line(c,corners[3],corners[0],"#c5d0cc",2*z);
      if(south&&!n&&e&&w&&x%2===0)line(c,worldP(x+.12,y+1,0,u),worldP(x+.77,y+1,0,u),"rgba(243,218,152,.72)",1.6*z);
      if(e&&!w&&n&&south&&y%2===0)line(c,worldP(x+1,y+.12,0,u),worldP(x+1,y+.77,0,u),"rgba(243,218,152,.72)",1.6*z);
    }else if(park){
      line(c,worldP(x+.02,y+.08,0,u),worldP(x+.97,y+.08,0,u),"rgba(255,255,253,.86)",1.3*z);
      line(c,worldP(x+.02,y+.92,0,u),worldP(x+.97,y+.92,0,u),"rgba(255,255,253,.86)",1.3*z);
      line(c,worldP(x+.48,y+.09,0,u),worldP(x+.48,y+.92,0,u),"rgba(255,255,253,.82)",1.3*z);
      const density=busyHours?.78:.23;
      if(hash(x,y,11)<density)vehicle(worldP(x+.26,y+.5,0,u),u,["#afc0c1","#4d6474","#e2dfd3","#83969b"][Math.floor(hash(x,y,5)*4)],.46,.54);
      if(hash(x,y,10)<density*.8)vehicle(worldP(x+.73,y+.5,0,u),u,["#d1dcda","#5b727e","#c8b2a8","#6e8086"][Math.floor(hash(x,y,6)*4)],.46,.54);
    }else if(!near&&v>.39&&v<.45&&z>.76){
      line(c,worldP(x+.3,y+.40,0,u),worldP(x+.27,y+.57,0,u),"rgba(60,118,66,.3)",z);
    }
    if(trees.has(k)&&z>.4)paintTree(x,y,u);
  }
  if(z>.57){
    for(let x=4;x<s.world.w-3;x+=7){
      if(roads.has(S.key(x,8)))streetFurniture(x,7,u,"lamp");
      if(roads.has(S.key(x,29)))streetFurniture(x,31,u,x%3===0?"bench":"lamp");
    }
    for(let y=11;y<36;y+=9){
      if(roads.has(S.key(8,y)))streetFurniture(7,y,u,"lamp");
      if(roads.has(S.key(39,y)))streetFurniture(41,y,u,"lamp");
    }
    streetFurniture(20,16,u,"sign");streetFurniture(22,25,u,"bench");
  }
  if(u.overlay==="traffic"){
    const m=S.metrics(s);const color=m.demand>m.parking?"rgba(213,98,67,.48)":"rgba(62,163,111,.45)";
    for(const p of s.parking){const [x,y]=p.split(",").map(Number);diamond(x,y,u,color);}
  }
  const things=s.buildings.slice().sort((a,b)=>(a.x+a.y+a.w+a.h)-(b.x+b.y+b.w+b.h));
  things.forEach(b=>paintBuilding(b,s,u));
  const hour=new Date(s.clock).getUTCHours();
  const count=hour>=6&&hour<20?Math.min(28,Math.max(8,S.metrics(s).jobs/10)):4;
  const colors=["#cfdbdb","#627e92","#c7a28d","#384d61","#a8b6a3"];
  for(let i=0;i<count;i++){
    const path=i%4,phase=((t*.000035*(1+i%3)+i*.17)%1);
    let x,y,dir;
    if(path===0){x=2+phase*41;y=8.5;dir=.46;}
    else if(path===1){x=38.5;y=9+phase*27;dir=2.58;}
    else if(path===2){x=9;y=9+phase*27;dir=2.60;}
    else{x=9+phase*29;y=29.4;dir=.46;}
    vehicle(worldP(x,y,0,u),u,colors[i%colors.length],dir,i%7===0?1.7:1);
  }
  pedestrians(s,u,t);
  if(u.overlay==="vacancy"){
    for(const b of s.buildings){
      const p=worldP(b.x+b.w/2,b.y+b.h/2,30+b.floors.length*30,u);
      const vacant=!b.tenantId&&b.construction===0;
      c.fillStyle=vacant?"#ebad61":"#428e87";
      c.strokeStyle="#fff";c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,10*u.cam.zoom,0,TAU);c.fill();c.stroke();
      if(u.cam.zoom>.65)drawText(vacant?"FREI":"MIETE",p.x,p.y-15*u.cam.zoom,9*u.cam.zoom,"#2d4a55",true);
    }
  }
  if(u.overlay==="utilities"){
    for(const ut of s.utilities){
      const p=worldP(ut.x,ut.y,0,u);
      for(const b of s.buildings){
        const q=worldP(b.x+b.w/2,b.y+b.h/2,0,u);
        c.save();c.setLineDash([4,7]);line(c,p,q,"rgba(45,145,174,.34)",1.8*u.cam.zoom);c.restore();
      }
      c.fillStyle=ut.type==="power"?"#cba24a":ut.type==="fibre"?"#438ab5":"#64abc5";
      c.strokeStyle="#e8f8fa";c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,9*u.cam.zoom,0,TAU);c.fill();c.stroke();
      drawText(ut.type==="power"?"E":ut.type==="fibre"?"F":"W",p.x,p.y,9*u.cam.zoom,"#fff",true);
    }
  }
  if(u.hover&&u.tool!=="select"){
    const x=u.hover.x,y=u.hover.y;
    if(S.TYPES[u.tool]){
      const b=S.TYPES[u.tool],pts=[worldP(x,y,0,u),worldP(x+b.w,y,0,u),worldP(x+b.w,y+b.h,0,u),worldP(x,y+b.h,0,u)];
      polygon(c,pts,"rgba(92,181,190,.25)","#4b91a9",2);
    }else if(["road","parking","tree","demolish"].includes(u.tool))diamond(x,y,u,"rgba(93,186,190,.35)","#4b91a9");
  }
 }
 function drawItem(it,p,size,s){
  const x=p.x,y=p.y,z=size;
  c.save();c.translate(x+z*.5,y+z*.5);
  const dev=s.devices.find(d=>d.id===it.deviceId),broken=dev&&dev.state!=="ok";
  c.fillStyle=broken?"#be6651":"#6a8698";
  switch(it.type){
    case "desk":c.fillStyle="#b18c68";c.fillRect(-z*.35,-z*.25,z*.7,z*.5);c.fillStyle="#344f5b";c.fillRect(-z*.15,-z*.15,z*.3,z*.15);break;
    case "chair":c.fillStyle="#3d5663";c.beginPath();c.arc(0,0,z*.22,0,TAU);c.fill();break;
    case "table":c.fillStyle="#aa8968";c.beginPath();c.ellipse(0,0,z*.40,z*.28,0,0,TAU);c.fill();break;
    case "plant":c.fillStyle="#477c53";c.beginPath();c.arc(0,0,z*.34,0,TAU);c.fill();break;
    case "shelf":c.fillStyle="#897c71";c.fillRect(-z*.38,-z*.30,z*.76,z*.6);c.strokeStyle="#c4b0a3";c.beginPath();c.moveTo(-z*.35,0);c.lineTo(z*.35,0);c.stroke();break;
    case "pallet":c.fillStyle="#ba8d60";c.fillRect(-z*.38,-z*.35,z*.75,z*.7);break;
    case "printer":c.fillStyle=broken?"#b75d52":"#e3e8e9";c.fillRect(-z*.34,-z*.3,z*.68,z*.6);c.fillStyle="#3b5b70";c.fillRect(-z*.2,-z*.25,z*.4,z*.15);break;
    case "toilet":c.fillStyle="#fff";c.beginPath();c.ellipse(0,z*.05,z*.28,z*.35,0,0,TAU);c.fill();c.strokeStyle="#93adb2";c.stroke();break;
    case "sink":c.fillStyle="#f4f9f8";c.fillRect(-z*.32,-z*.31,z*.65,z*.63);c.strokeStyle="#8daeb6";c.strokeRect(-z*.20,-z*.17,z*.4,z*.34);break;
    case "light":c.fillStyle=broken?"#d67867":"#f9f0c3";c.beginPath();c.arc(0,0,z*.26,0,TAU);c.fill();break;
    case "camera":c.fillStyle="#283d4b";c.fillRect(-z*.32,-z*.15,z*.64,z*.3);c.fillStyle="#88c4df";c.beginPath();c.arc(z*.22,0,z*.07,0,TAU);c.fill();break;
    case "alarm":c.fillStyle=broken?"#cf6d5c":"#d2e0e0";c.beginPath();c.arc(0,0,z*.25,0,TAU);c.fill();c.strokeStyle="#b1473b";c.stroke();break;
    case "hvac":case "machine":c.fillStyle=broken?"#b55f51":"#7e949c";c.fillRect(-z*.36,-z*.32,z*.72,z*.64);c.strokeStyle="#445d65";for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-z*.26,z*i*.13);c.lineTo(z*.26,z*i*.13);c.stroke();}break;
    default:c.fillStyle=broken?"#cf7660":"#718c96";c.beginPath();c.arc(0,0,z*.25,0,TAU);c.fill();
  }
  if(broken){c.fillStyle="#e4b04f";c.beginPath();c.arc(z*.24,-z*.25,z*.11,0,TAU);c.fill();}
  c.restore();
 }
 function floor(s,u){
  c.fillStyle="#e6edf0";c.fillRect(0,0,cw,ch);
  const b=s.buildings.find(b=>b.id===u.selectedId);if(!b)return;
  const f=b.floors[u.floorIndex]||b.floors[0],g=floorGeom(u,f),z=g.size;
  c.save();c.shadowColor="rgba(23,50,60,.19)";c.shadowBlur=30;c.shadowOffsetY=12;c.fillStyle="#fff";c.fillRect(g.x-10,g.y-10,f.cols*z+20,f.rows*z+20);c.restore();
  for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++){
    const type=f.tiles[S.key(x,y)]||"office";
    c.fillStyle=roomColors[type]||"#eff0ef";c.fillRect(g.x+x*z,g.y+y*z,z,z);
    c.strokeStyle="rgba(78,113,128,.09)";c.lineWidth=.6;c.strokeRect(g.x+x*z,g.y+y*z,z,z);
    if(z>23&&x%4===1&&y%4===1){drawText(S.FLOOR_TYPES[type]||"",g.x+(x+.5)*z,g.y+(y+.5)*z,8,"rgba(58,82,96,.25)",false);}
  }
  for(const it of f.items)drawItem(it,{x:g.x+it.x*z,y:g.y+it.y*z},z,s);
  c.strokeStyle="#526a79";c.lineWidth=Math.max(4,z*.19);c.strokeRect(g.x,g.y,f.cols*z,f.rows*z);
  for(const edge of Object.keys(f.walls)){
    const [o,xs,ys]=edge.split(":"),x=Number(xs),y=Number(ys);
    const a={x:g.x+x*z,y:g.y+y*z},bb=o==="H"?{x:a.x+z,y:a.y}:{x:a.x,y:a.y+z};
    line(c,a,bb,f.doors[edge]?"#d6a45f":"#4b6777",f.doors[edge]?Math.max(3,z*.09):Math.max(4,z*.19));
    if(f.doors[edge]){c.beginPath();c.arc(a.x,a.y,z*.7,o==="H"?0:-Math.PI/2,o==="H"?Math.PI/2:0);c.lineWidth=1.2;c.strokeStyle="#c69b65";c.stroke();}
  }
  if(u.hoverFloor&&u.hoverFloor.inside){
    const h=u.hoverFloor;c.fillStyle="rgba(56,143,175,.2)";c.fillRect(g.x+h.x*z,g.y+h.y*z,z,z);c.strokeStyle="#3b8eb0";c.lineWidth=2;c.strokeRect(g.x+h.x*z,g.y+h.y*z,z,z);
  }
  if(u.wallStart&&u.hoverFloor&&u.tool==="wall"){
    const p={x:g.x+u.wallStart.x*z,y:g.y+u.wallStart.y*z},q={x:g.x+u.hoverFloor.nx*z,y:g.y+u.hoverFloor.ny*z};
    line(c,p,q,"#24a0b4",Math.max(3,z*.16));
  }
  drawText(b.name+" · "+f.label,cw/2,25,14,"#3b5968",true);
 }
 function render(s,u,t){if(!cw||!ch)resize();c.setTransform(dpr,0,0,dpr,0,0);if(u.mode==="floor")floor(s,u);else world(s,u,t||0);}
 return {resize,render,hitWorld:(x,y,u)=>unproject(x,y,u),hitFloor:floorHit,worldP,viewport:()=>({w:cw,h:ch})};
}
root.IPRender={create:factory};
})(window);
