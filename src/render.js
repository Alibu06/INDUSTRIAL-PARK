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
 function floorGeom(u,f){
   if(u.floorView==="plan"){
     const size=clip(Math.min((cw-110)/f.cols,(ch-100)/f.rows),13,32)*u.cam.floorZoom;
     return {size,x:(cw-f.cols*size)/2+u.cam.floorX,y:(ch-f.rows*size)/2+u.cam.floorY,iso:false,cols:f.cols,rows:f.rows};
   }
   const sum=f.cols+f.rows;
   const size=clip(Math.min((cw-110)/sum,(ch-160)/(sum*.5)),5,23)*u.cam.floorZoom;
   return {size,x:(cw-sum*size)/2+u.cam.floorX,y:(ch-sum*size*.5)/2+u.cam.floorY+16,iso:true,cols:f.cols,rows:f.rows};
 }
 function floorPoint(g,x,y,z=0){
   if(g.iso)return {x:g.x+(x-y+g.rows)*g.size,y:g.y+(x+y)*g.size*.5-z*g.size};
   return {x:g.x+x*g.size,y:g.y+y*g.size-z*g.size};
 }
 function floorHit(mx,my,u,b){
   const f=b.floors[u.floorIndex]||b.floors[0],g=floorGeom(u,f);
   let fx,fy;
   if(g.iso){
     const dx=(mx-g.x)/g.size-g.rows,dy=(my-g.y)/(g.size*.5);
     fx=(dx+dy)/2;fy=(dy-dx)/2;
   }else{fx=(mx-g.x)/g.size;fy=(my-g.y)/g.size;}
   return {x:Math.floor(fx),y:Math.floor(fy),nx:Math.round(fx),ny:Math.round(fy),fx,fy,inside:fx>=0&&fy>=0&&fx<f.cols&&fy<f.rows&&S.validCell(f,fx,fy),g};
 }
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
  if(b.shape&&b.shape.length){
    const z=u.cam.zoom,h=20+b.floors.length*30,occupied=new Set(b.shape.map(([x,y])=>x+","+y));
    const colors={office:["#adc3cd","#879fae","#d9e6e8"],warehouse:["#abbaba","#88979a","#d7dddb"],workshop:["#c5af9c","#a48f81","#e3d5c5"],cafe:["#b8b9a0","#a5a68c","#e6ddc6"],service:["#a3bdc8","#819da9","#dde9e9"]}[b.type];
    c.save();
    for(const [xx,yy] of b.shape.slice().sort((a,b)=>a[0]+a[1]-b[0]-b[1])){
      const x=b.x+xx,y=b.y+yy;
      const p=worldP(x,y,0,u),q=worldP(x+1,y,0,u),r=worldP(x+1,y+1,0,u),t=worldP(x,y+1,0,u);
      const pt=worldP(x,y,h,u),qt=worldP(x+1,y,h,u),rt=worldP(x+1,y+1,h,u),tt=worldP(x,y+1,h,u);
      if(!occupied.has(xx+","+(yy+1))){
        polygon(c,[t,r,rt,tt],colors[0],"rgba(37,61,72,.25)",.7);
        for(let n=0;n<b.floors.length;n++){
          const a=mix(t,tt,(n+.45)/b.floors.length),bb=mix(r,rt,(n+.45)/b.floors.length);
          polygon(c,[mix(a,bb,.22),mix(a,bb,.78),{...mix(a,bb,.78),y:mix(a,bb,.78).y-8*z},{...mix(a,bb,.22),y:mix(a,bb,.22).y-8*z}],"#527387","#d9e9e8",.7*z);
        }
      }
      if(!occupied.has((xx+1)+","+yy)){
        polygon(c,[q,r,rt,qt],colors[1],"rgba(36,57,68,.23)",.7);
        for(let n=0;n<b.floors.length;n++){
          const a=mix(q,qt,(n+.45)/b.floors.length),bb=mix(r,rt,(n+.45)/b.floors.length);
          polygon(c,[mix(a,bb,.25),mix(a,bb,.75),{...mix(a,bb,.75),y:mix(a,bb,.75).y-7*z},{...mix(a,bb,.25),y:mix(a,bb,.25).y-7*z}],"#4c7186","#e2eeee",.7*z);
        }
      }
      polygon(c,[pt,qt,rt,tt],b.construction?"#b4a688":colors[2],selected?"#e6b068":hover?"#a4d8df":"#77949c",selected?2*z:.8);
      if(!b.construction&&b.type==="office"&&(xx+yy)%2===0){
        polygon(c,[worldP(x+.12,y+.18,h+.35,u),worldP(x+.76,y+.18,h+.35,u),worldP(x+.76,y+.75,h+.35,u),worldP(x+.12,y+.75,h+.35,u)],"#547889","#bfdae2",.6*z);
      }
    }
    if(b.construction||selected||hover||z>1.25){
      const p=worldP(b.x+b.w/2,b.y+b.h/2,h+20,u);
      drawText(b.construction?"BAU · "+b.construction+" Tage":b.name,p.x,p.y,11*z,"#2d5463",true);
    }
    c.restore();return;
  }
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
  const roads=new Set([...(s.publicRoads||[]),...s.roads]),publicRoads=new Set(s.publicRoads||[]),parks=new Set(s.parking),trees=new Set(s.trees);
  const z=u.cam.zoom;
  const busyHours=(new Date(s.clock).getUTCHours()>=7&&new Date(s.clock).getUTCHours()<=18);
  for(let y=0;y<s.world.h;y++)for(let x=0;x<s.world.w;x++){
    const k=S.key(x,y),road=roads.has(k),park=parks.has(k),n=roads.has(S.key(x,y-1)),e=roads.has(S.key(x+1,y)),w=roads.has(S.key(x-1,y)),south=roads.has(S.key(x,y+1));
    const near=n||e||w||south,v=hash(x,y,3);
    diamond(x,y,u,road?(publicRoads.has(k)?"#66767d":"#647278"):park?"#a6b2b0":near?"#bdc9bd":v>.8?"#91a98f":v>.4?"#9eb39b":"#a7bda3",road?"rgba(232,237,236,.045)":"rgba(46,73,54,.065)");
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
  // Parcel outlines are game-world geometry; only parcels actually bought can be developed.
  if(s.parcels){
    for(const parcel of s.parcels){
      const a=worldP(parcel.x,parcel.y,0,u),b=worldP(parcel.x+parcel.w,parcel.y,0,u),
        d=worldP(parcel.x+parcel.w,parcel.y+parcel.h,0,u),f=worldP(parcel.x,parcel.y+parcel.h,0,u);
      const poly=[a,b,d,f];
      c.save();
      if(parcel.owned){
        polygon(c,poly,"rgba(122,190,167,.065)","rgba(52,134,117,.80)",Math.max(1.6,2.4*u.cam.zoom));
        c.setLineDash([5*u.cam.zoom,4*u.cam.zoom]);polygon(c,poly,null,"rgba(215,251,231,.62)",.9*u.cam.zoom);
      }else{
        polygon(c,poly,"rgba(58,81,82,.10)","rgba(90,124,118,.23)",Math.max(1,.9*u.cam.zoom));
      }
      c.restore();
      const p=worldP(parcel.x+parcel.w/2,parcel.y+parcel.h/2,0,u);
      if(u.cam.zoom>.59){
        const txt=parcel.owned?"EIGENES GRUNDSTÜCK":parcel.name.toUpperCase();
        c.font="600 10px Segoe UI,Arial";const ww=Math.max(96,c.measureText(txt).width+19);
        c.fillStyle=parcel.owned?"rgba(28,87,79,.85)":"rgba(43,64,63,.53)";
        c.beginPath();c.roundRect(p.x-ww/2,p.y-11,ww,22,6);c.fill();
        drawText(txt,p.x,p.y,10,"#f1faf5",true);
      }
    }
  }
  if(u.overlay==="traffic"){
    const m=S.metrics(s);const color=m.demand>m.parking?"rgba(213,98,67,.48)":"rgba(62,163,111,.45)";
    for(const p of s.parking){const [x,y]=p.split(",").map(Number);diamond(x,y,u,color);}
  }
  // Visible road works and landscaping works (nothing appears magically completed).
  for(const project of s.projects||[]){
    if(project.status!=="bau"||project.buildingId)continue;
    for(const p of project.points){
      const poly=[worldP(p.x,p.y,0,u),worldP(p.x+1,p.y,0,u),worldP(p.x+1,p.y+1,0,u),worldP(p.x,p.y+1,0,u)];
      polygon(c,poly,"rgba(235,161,67,.19)","#d7a351",Math.max(1.2,1.8*u.cam.zoom));
      if(u.cam.zoom>.57){
        const q=worldP(p.x+.5,p.y+.5,0,u);
        line(c,{x:q.x-6*u.cam.zoom,y:q.y-4*u.cam.zoom},{x:q.x+6*u.cam.zoom,y:q.y+4*u.cam.zoom},"#f7d68b",2*u.cam.zoom);
      }
    }
    if(project.points.length){
      const p=project.points[Math.floor(project.points.length/2)],q=worldP(p.x+.5,p.y+.5,8,u);
      if(u.cam.zoom>.61){
        c.fillStyle="rgba(99,72,36,.88)";c.beginPath();c.roundRect(q.x-38*u.cam.zoom,q.y-17*u.cam.zoom,76*u.cam.zoom,20*u.cam.zoom,5*u.cam.zoom);c.fill();
        drawText("BAU · "+project.remaining+" T",q.x,q.y-7*u.cam.zoom,9*u.cam.zoom,"#fff0cf",true);
      }
    }
  }
  const things=s.buildings.slice().sort((a,b)=>(a.x+a.y+a.w+a.h)-(b.x+b.y+b.w+b.h));
  things.forEach(b=>paintBuilding(b,s,u));
  const trafficHour=new Date(s.clock).getUTCHours();
  const trafficCount=trafficHour>=6&&trafficHour<20?8:3;
  const carColors=["#dae0da","#698595","#c4a99c","#3e5b6a","#a5bab2","#cfcab9"];
  for(let i=0;i<trafficCount;i++){
    // Public street remains in the surrounding landscape, even while the park is still empty.
    const progress=(t*.000021*(i%3+1)+i/trafficCount)%1;
    const x=i%2===0?1+45*progress:46-45*progress;
    const p=worldP(x,i%2===0?8.55:9.40,0,u);
    vehicle(p,u,carColors[i%carColors.length],i%2===0?.46:3.6,i%7===0?1.6:1);
  }
  // Private traffic only appears on streets that the player has actually completed.
  const jobs=S.metrics(s).jobs,privateCount=Math.min(12,Math.floor(jobs/12));
  if(privateCount&&s.roads.length){
    const built=new Set(s.roads);
    for(let i=0;i<privateCount;i++){
      const pcell=s.roads[Math.floor(hash(i,22)*s.roads.length)];
      if(!pcell)continue;
      const [cx,cy]=pcell.split(",").map(Number);
      const axis=built.has(S.key(cx+1,cy))?"x":built.has(S.key(cx,cy+1))?"y":null;
      const pct=(.15+(t*.000085+i*.13)%1)*.6;
      const dx=axis==="x"?pct:0,dy=axis==="y"?pct:0;
      vehicle(worldP(cx+.30+dx,cy+.45+dy,0,u),u,carColors[(i+2)%carColors.length],axis==="y"?2.58:.46,.83);
    }
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
  // World light reacts to simulation time. Preview is drawn afterwards so placement stays readable.
  const lightHour=new Date(s.clock).getUTCHours();
  if(lightHour>=20||lightHour<6){
    c.fillStyle=lightHour>=22||lightHour<5?"rgba(20,36,61,.34)":"rgba(25,43,61,.20)";
    c.fillRect(0,0,cw,ch);
  }else if(lightHour>=18){c.fillStyle="rgba(205,157,108,.07)";c.fillRect(0,0,cw,ch);}
  if(u.tool!=="select"){
    const footprints=u.dragBuild&&u.dragBuild.length?u.dragBuild:u.hover?[u.hover]:[];
    if(S.TYPES[u.tool]&&u.sketch){
      const set=new Set(u.sketch.cells.map(p=>p.x+","+p.y)),working=u.dragBuild||[];
      const all=u.sketch.cells.concat(working.filter(p=>!set.has(p.x+","+p.y)));
      const preview=S.previewFootprint(s,u.tool,all);
      for(const p of u.sketch.cells)diamond(p.x,p.y,u,"rgba(47,159,142,.41)","#328f7e");
      for(const p of working)diamond(p.x,p.y,u,"rgba(119,213,213,.36)","#7bd3ca");
      if(all.length){
        const last=all[all.length-1],pos=worldP(last.x+.5,last.y+.5,15,u);
        const label=all.length*16+" m² · "+(preview.ok?"Skizze bereit":preview.message);
        c.font="600 10px Segoe UI,Arial";const w=Math.min(340,c.measureText(label).width+20);
        c.fillStyle=preview.ok?"rgba(25,94,88,.94)":"rgba(151,69,54,.94)";
        c.beginPath();c.roundRect(pos.x-w/2,pos.y-17,w,26,7);c.fill();drawText(label,pos.x,pos.y-4,10,"#f4ffff",true);
      }
    }else if(S.TYPES[u.tool]&&u.dragBuild&&u.dragBuild.length){
      for(const p of u.dragBuild)diamond(p.x,p.y,u,"rgba(75,189,172,.4)","#4caeaa");
    }else if(S.TYPES[u.tool]&&u.hover){
      const p=S.preview(s,u.tool,u.hover.x,u.hover.y,u.rotation||0);
      const ok=p.ok,color=ok?"#54a99a":"#d67665",soft=ok?"rgba(63,180,149,.33)":"rgba(205,88,75,.32)";
      const poly=[worldP(p.x,p.y,0,u),worldP(p.x+p.w,p.y,0,u),worldP(p.x+p.w,p.y+p.h,0,u),worldP(p.x,p.y+p.h,0,u)];
      const z=15+S.TYPES[u.tool].levels*26;
      const roof=[worldP(p.x,p.y,z,u),worldP(p.x+p.w,p.y,z,u),worldP(p.x+p.w,p.y+p.h,z,u),worldP(p.x,p.y+p.h,z,u)];
      c.save();polygon(c,poly,soft,color,2.5*u.cam.zoom);
      polygon(c,[poly[3],poly[2],roof[2],roof[3]],soft,color,1.3);
      polygon(c,[poly[2],poly[1],roof[1],roof[2]],soft,color,1.3);
      polygon(c,roof,ok?"rgba(156,236,218,.45)":"rgba(247,175,159,.45)",color,2.6);
      const mid=worldP(p.x+p.w/2,p.y+p.h/2,z+13,u);
      const label=(ok?"✓ ":"✕ ")+p.w*4+" × "+p.h*4+" m · "+(p.cost/1000).toLocaleString("de-DE")+" T€";
      c.font="600 11px Segoe UI,Arial";const width=c.measureText(label).width+26;
      c.fillStyle=ok?"#1d5b56":"#8c3b33";c.beginPath();c.roundRect(mid.x-width/2,mid.y-14,width,28,8);c.fill();
      drawText(label,mid.x,mid.y,11,"#f6ffff",true);
      c.restore();
    }else{
      for(const p of footprints){
        const val=u.tool==="demolish"?{ok:true}:S.preview(s,u.tool,p.x,p.y);
        diamond(p.x,p.y,u,val.ok?"rgba(55,178,150,.37)":"rgba(223,92,73,.40)",val.ok?"#33ab94":"#d76b5d");
      }
      if(footprints.length>1){
        const last=footprints[footprints.length-1],p=worldP(last.x+.5,last.y+.5,12,u);
        c.fillStyle="#1e535e";c.beginPath();c.roundRect(p.x-40,p.y-18,80,24,6);c.fill();
        drawText(footprints.length+" Felder",p.x,p.y-6,10,"#fff",true);
      }
    }
  }
 }
 function drawItem(it,p,size,s){
  const z=size,dev=s.devices.find(d=>d.id===it.deviceId),broken=dev&&dev.state!=="ok";
  const fill=broken?"#b96b5e":"#607c8b";
  c.save();c.translate(p.x+z*.5,p.y+z*.5);
  c.shadowColor="rgba(33,54,64,.17)";c.shadowBlur=z*.15;c.shadowOffsetY=z*.05;
  const rect=(x,y,w,h,color,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x*z,y*z,w*z,h*z,r*z);c.fill();};
  const circle=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x*z,y*z,Math.abs(rx*z),Math.abs(ry*z),0,0,TAU);c.fill();};
  const lineLocal=(x1,y1,x2,y2,color,width)=>{c.strokeStyle=color;c.lineWidth=(width||.05)*z;c.beginPath();c.moveTo(x1*z,y1*z);c.lineTo(x2*z,y2*z);c.stroke();};
  switch(it.type){
    case "desk":
      rect(-.43,-.3,.86,.6,"#b4946c",.05);
      rect(-.37,-.25,.74,.49,"#ceb18b",.035);
      rect(-.4,-.23,.05,.48,"#907051",.009);
      rect(.35,-.23,.05,.48,"#907051",.009);
      lineLocal(-.31,-.14,.30,-.14,"rgba(96,68,44,.3)",.018);
      rect(.22,.11,.13,.09,"#dfc39f",.01);
      break;
    case "computer":
      rect(-.40,-.35,.80,.61,"#a9afb1",.045);
      rect(-.37,-.32,.74,.53,"#1c303c",.028);
      rect(-.34,-.28,.68,.46,it.assetId==="imacPro"?"#2b536c":"#477b92",.025);
      rect(-.1,.28,.20,.06,"#acb7ba",.012);
      rect(-.22,.34,.44,.035,"#d6dedc",.01);
      circle(0,-.315,.014,.014,"#0e232e");
      break;
    case "rack":
      rect(-.4,-.41,.8,.82,"#384650",.035);
      rect(-.34,-.35,.68,.7,"#182b37",.022);
      for(let k=0;k<7;k++){
        rect(-.27,-.30+k*.092,.54,.063,"#667e87",.012);
        circle(.2,-.27+k*.092,.019,.021,k%3===0?"#e0ab5c":"#73d1a0");
      }
      break;
    case "switch":case "server":case "firewall":case "router":case "nvr":
      rect(-.43,-.27,.86,.55,it.type==="firewall"?"#526779":"#6f828a",.055);
      rect(-.36,-.19,.72,.39,"#344b58",.025);
      for(let k=0;k<6;k++)rect(-.27+k*.095,-.08,.065,.085,"#203a47",.01);
      circle(.28,.1,.028,.03,it.type==="firewall"?"#e9ae61":"#70c49c");
      break;
    case "wifi":
      if(it.assetId==="wlanCeiling"){circle(0,0,.37,.34,"#eef3f1");circle(0,0,.29,.26,"#ccd9d8");circle(.14,-.05,.025,.025,"#71caab");}
      else{rect(-.3,-.36,.6,.72,"#eef1ef",.07);circle(0,.19,.055,.055,"#7db7bb");lineLocal(0,-.22,0,.02,"#b9c9ce",.055);}
      break;
    case "ups":
      rect(-.38,-.41,.76,.82,"#435563",.04);rect(-.28,-.29,.56,.16,"#96aebe",.015);
      rect(-.19,.07,.38,.22,"#283a46",.025);circle(.23,-.25,.04,.04,"#72c8a1");
      break;
    case "sofa":
      rect(-.45,-.37,.9,.67,"#547485",.09);
      rect(-.42,-.33,.84,.17,"#304e5f",.07);
      rect(-.36,-.08,.31,.26,"#7796a4",.055);
      rect(.05,-.08,.31,.26,"#7796a4",.055);
      break;
    case "whiteboard":case "display":
      rect(-.48,-.39,.96,.78,it.type==="display"?"#1a343f":"#748990",.035);
      rect(-.43,-.34,.86,.68,it.type==="display"?"#3e7891":"#f1f5ed",.016);
      if(it.type==="whiteboard"){lineLocal(-.33,.22,.10,-.18,"#6a9aac",.04);lineLocal(-.07,.04,.29,.16,"#8da876",.035);}
      break;
    case "exitSign":
      rect(-.43,-.23,.86,.46,"#428e72",.025);rect(-.36,-.16,.72,.32,"#79c5a3",.02);
      lineLocal(.02,0,.30,0,"#f7ffff",.07);circle(-.15,-.04,.07,.07,"#f7ffff");
      break;
    case "extinguisher":
      circle(0,.1,.19,.22,"#a94239");rect(-.12,-.32,.24,.38,"#ca4940",.04);
      rect(-.10,-.23,.20,.12,"#e8e5df",.015);lineLocal(.08,-.30,.24,-.42,"#384e54",.055);
      break;
    case "motion":case "contact":case "socket":
      rect(-.32,-.34,.64,.68,"#e9eeeb",.07);circle(0,-.10,.13,.13,it.type==="socket"?"#7f9399":"#abc5c8");
      rect(-.23,.18,.46,.065,"#a8bcbf",.015);break;
    case "emergencyLight":
      rect(-.42,-.25,.84,.5,"#edf3f1",.055);
      circle(-.20,0,.12,.1,"#fff3c6");circle(.20,0,.12,.1,"#fff3c6");break;
    case "kitchen":case "shower":
      rect(-.43,-.42,.86,.84,"#e3eae6",.04);
      rect(-.34,-.3,.68,.58,"#9ebbc2",.03);circle(.1,.05,.14,.12,"#ecf4f4");break;
    case "chair":
      circle(0,.04,.29,.28,"#415663");
      rect(-.27,-.36,.54,.18,"#5c7382",.08);
      lineLocal(-.32,-.14,-.32,.22,"#334c59",.055);
      lineLocal(.32,-.14,.32,.22,"#334c59",.055);
      circle(0,.04,.16,.15,"#5d7889");
      break;
    case "table":
      if(it.assetId==="tableRound"){circle(0,0,.42,.31,"#ad8a67");circle(0,0,.38,.27,"#c6a17a");}
      else{rect(-.47,-.32,.94,.64,"#987451",.055);rect(-.44,-.29,.88,.58,"#c3a180",.04);}
      circle(-.12,-.4,.12,.07,"#4b6573");
      circle(.16,.4,.12,.07,"#4b6573");
      circle(-.46,0,.09,.14,"#4b6573");
      circle(.46,0,.09,.14,"#4b6573");
      break;
    case "plant":
      circle(0,.12,.28,.23,"#b58b67");
      circle(0,.12,.22,.19,"#5e7056");
      circle(-.16,-.11,.21,.18,"#47795b");
      circle(.16,-.1,.20,.20,"#609472");
      circle(0,-.26,.14,.2,"#75a77c");
      lineLocal(0,-.24,0,.13,"#476e51",.035);
      break;
    case "shelf":
      rect(-.44,-.39,.88,.78,"#75858a",.03);
      rect(-.38,-.33,.76,.19,"#bdab91",.01);
      rect(-.38,-.04,.76,.17,"#c0b19b",.01);
      rect(-.38,.22,.76,.12,"#a9a296",.01);
      rect(-.30,-.30,.17,.12,"#927d66",.015);
      rect(-.02,-.29,.24,.12,"#c5b792",.015);
      rect(-.27,-.01,.35,.11,"#a68f72",.015);
      rect(.13,-.01,.20,.1,"#bfa985",.015);
      break;
    case "pallet":
      rect(-.43,-.39,.86,.77,"#89694e",.01);
      for(let i=0;i<3;i++)rect(-.41,-.3+i*.25,.82,.12,"#c29b70",.01);
      rect(-.27,-.24,.23,.24,"#d0bc96",.025);
      rect(.04,-.26,.23,.25,"#b49c79",.025);
      rect(-.21,.08,.42,.18,"#a78e73",.02);
      break;
    case "printer":
      rect(-.40,-.36,.80,.74,broken?"#b88377":"#edf1f0",.055);
      rect(-.32,-.22,.63,.16,"#5d7785",.02);
      rect(-.23,-.17,.26,.06,"#a4d1e0",.01);
      rect(-.32,.13,.64,.18,"#c7d1d2",.02);
      rect(-.2,.24,.38,.055,"#f8faf7",.01);
      circle(.27,-.14,.045,.045,broken?"#f0a060":"#55b59b");
      break;
    case "toilet":
      rect(-.33,-.40,.65,.21,"#fff",.04);
      circle(0,.07,.30,.34,"#f5fbfb");
      circle(0,.07,.22,.25,"#9ebbc4");
      circle(0,.09,.14,.17,"#ecf3f3");
      break;
    case "sink":
      rect(-.39,-.37,.78,.75,"#e9f0ee",.045);
      circle(0,.03,.26,.24,"#9fbdc4");
      circle(0,.03,.19,.18,"#e8f1f1");
      rect(-.045,-.29,.09,.23,"#718e9b",.03);
      circle(0,-.17,.055,.05,"#a9c5c7");
      break;
    case "dispenser":
      rect(-.28,-.41,.56,.79,broken?"#b97a6f":"#f1f3ef",.09);
      rect(-.20,-.32,.4,.25,"#c6d5db",.04);
      rect(-.19,.22,.38,.075,"#7f9faa",.02);
      circle(0,.09,.09,.11,"#6eacb1");
      break;
    case "light":
      rect(-.37,-.32,.74,.64,broken?"#be786f":"#e6e9dc",.04);
      rect(-.29,-.26,.58,.51,broken?"#d5aaa1":"#fff4c8",.04);
      if(!broken){c.shadowColor="rgba(255,238,169,.8)";c.shadowBlur=.4*z;circle(0,0,.14,.12,"#fffef0");}
      break;
    case "camera":
      if(it.assetId==="dome"){circle(0,0,.36,.34,"#f5f8f5");circle(0,0,.27,.26,"#b9d0d4");circle(.06,-.03,.16,.17,"#344f60");circle(.10,-.04,.06,.07,"#88c3d4");}
      else if(it.assetId==="ptz"){rect(-.23,-.38,.47,.19,"#e7edef",.06);circle(0,.06,.34,.33,"#f0f6f4");circle(.08,.13,.2,.19,"#587c8b");circle(.09,.15,.10,.10,"#223c4c");}
      else if(it.assetId==="turret"){circle(-.12,0,.28,.27,"#eef4f2");rect(-.05,-.19,.39,.37,"#d3e2e4",.10);circle(.24,0,.11,.11,"#223c4b");}
      else{rect(-.42,-.08,.19,.16,"#657c81",.02);rect(-.26,-.19,.6,.35,broken?"#c07867":"#e4e9e6",.06);circle(.22,-.02,.09,.1,"#6c9eae");circle(.23,-.02,.045,.055,"#172f43");}
      break;
    case "alarm":
      circle(0,0,.28,.28,broken?"#ca8b7b":"#e3edec");
      circle(0,0,.20,.20,"#c8574f");
      circle(0,0,.095,.095,"#e7a99b");
      break;
    case "sprinkler":
      circle(0,0,.22,.22,"#d9e6e6");
      circle(0,0,.17,.17,broken?"#ca7f69":"#cb564b");
      for(let i=0;i<4;i++){const a=i*Math.PI/2;lineLocal(Math.cos(a)*.15,Math.sin(a)*.15,Math.cos(a)*.36,Math.sin(a)*.36,"#889da3",.045);}
      circle(0,0,.07,.07,"#d9e2d9");
      break;
    case "reader":
      rect(-.22,-.42,.44,.84,broken?"#b56e68":"#355669",.05);
      rect(-.15,-.27,.3,.32,"#a7c8d0",.02);
      circle(0,.25,.065,.065,broken?"#e6a064":"#65d2a6");
      break;
    case "hvac":
      rect(-.43,-.40,.86,.80,broken?"#a96c63":"#90a1a7",.045);
      circle(0,0,.29,.28,"#617982");
      for(let i=0;i<6;i++){
        const a=i*TAU/6;lineLocal(0,0,.24*Math.cos(a),.24*Math.sin(a),"#bfd1d3",.08);
      }
      circle(0,0,.065,.065,"#d9e6e6");
      break;
    case "machine":
      rect(-.44,-.39,.88,.78,broken?"#ab726b":"#738b94",.045);
      rect(-.34,-.3,.45,.42,"#455d6c",.02);
      rect(.18,-.27,.19,.25,"#d8c19b",.01);
      circle(-.11,.20,.15,.12,"#aabdbd");
      for(let i=0;i<4;i++)lineLocal(-.3+i*.17,.31,-.26+i*.17,.39,"#e4b05d",.06);
      break;
    default:
      circle(0,0,.25,.25,fill);
  }
  c.shadowBlur=0;c.shadowOffsetY=0;
  if(broken){
    circle(.32,-.32,.13,.13,"#e6ab54");
    lineLocal(.32,-.4,.32,-.30,"#4d3b2c",.05);
    circle(.32,-.245,.018,.018,"#4d3b2c");
  }
  c.restore();
 }
 function wallFinish(f,edge){
   const id=f.wallFinishes&&f.wallFinishes[edge]||"white";
   return S.WALL_FINISHES&&S.WALL_FINISHES[id]?S.WALL_FINISHES[id]:{color:"#e9e8df",name:"Warmweiß"};
 }
 function floorSurface(f,x,y,roomType){
   const chosen=f.floorFinishes&&f.floorFinishes[S.key(x,y)];
   const mat=S.FLOOR_FINISHES&&S.FLOOR_FINISHES[chosen];
   return mat||{color:roomColors[roomType]||"#eff0eb",pattern:"plain",name:"Standardboden"};
 }
 function floorDetail(g,x,y,pattern){
   if(!g.iso||g.size<10||!pattern||pattern==="plain")return;
   const z=g.size;
   const w=(a,b,color,width=.6)=>line(c,floorPoint(g,a[0],a[1],.008),floorPoint(g,b[0],b[1],.008),color,width*Math.max(.7,z/19));
   if(pattern==="tile"){
     w([x+.5,y+.03],[x+.5,y+.97],"rgba(255,255,255,.58)");
     w([x+.03,y+.5],[x+.97,y+.5],"rgba(108,131,131,.22)");
   }else if(pattern==="wood"){
     w([x+.08,y+.35],[x+.93,y+.35],"rgba(93,75,53,.28)",.7);
     w([x+.08,y+.7],[x+.93,y+.7],"rgba(255,244,220,.36)");
     w([x+.53,y+.03],[x+.53,y+.35],"rgba(103,83,63,.24)");
     w([x+.22,y+.35],[x+.22,y+.7],"rgba(103,83,63,.24)");
   }else if(pattern==="vinyl"){
     w([x+.04,y+.49],[x+.94,y+.49],"rgba(255,255,255,.26)",.6);
     w([x+.72,y+.08],[x+.72,y+.92],"rgba(73,95,93,.11)",.5);
   }else if(pattern==="carpet"||pattern==="concrete"||pattern==="epoxy"){
     for(let i=0;i<3;i++){
       const fx=x+.18+hash(x*3+i,y*9,12)*.65,fy=y+.13+hash(x*5,y*3+i,8)*.72;
       const p=floorPoint(g,fx,fy,.015);
       ellipse(p.x,p.y,(pattern==="carpet"?.8:1.2)*z/20,.45*z/20,
         pattern==="epoxy"?"rgba(238,250,251,.31)":pattern==="concrete"?"rgba(75,84,81,.17)":"rgba(74,84,89,.1)");
     }
   }
 }
 function floorPlan(s,u,b,f,g){
   const z=g.size;
   c.save();c.shadowColor="rgba(23,50,60,.19)";c.shadowBlur=30;c.shadowOffsetY=12;
   if(!f.mask){c.fillStyle="#fff";c.fillRect(g.x-10,g.y-10,f.cols*z+20,f.rows*z+20);}c.restore();
   for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++){
     if(!S.validCell(f,x,y))continue;
     const type=f.tiles[S.key(x,y)]||"office";
     const surf=floorSurface(f,x,y,type);
    c.fillStyle=surf.color;c.fillRect(g.x+x*z,g.y+y*z,z,z);
     c.strokeStyle="rgba(78,113,128,.09)";c.lineWidth=.6;c.strokeRect(g.x+x*z,g.y+y*z,z,z);
     if(z>23&&x%4===1&&y%4===1)drawText(S.FLOOR_TYPES[type]||"",g.x+(x+.5)*z,g.y+(y+.5)*z,8,"rgba(58,82,96,.25)");
   }
   for(const it of f.items)drawItem(it,{x:g.x+it.x*z,y:g.y+it.y*z},z,s);
   for(const edge of Object.keys(f.walls)){
     const [o,xs,ys]=edge.split(":"),x=Number(xs),y=Number(ys);
     const p=floorPoint(g,x,y),q=floorPoint(g,x+(o==="H"?1:0),y+(o==="V"?1:0));
     const paint=wallFinish(f,edge).color;
     line(c,p,q,f.doors[edge]?"#b48756":f.windows&&f.windows[edge]?"#64a8bd":paint,Math.max(4,z*.24));
     if(f.doors[edge]){
       const mid=mix(p,q,.5);
       c.fillStyle="#f5f8f6";c.beginPath();c.arc(mid.x,mid.y,z*.14,0,TAU);c.fill();
       line(c,mid,mix(p,q,.86),"#9e805f",1.1);
     }
   }
   if(u.zoneFilter&&f.zones)for(const k of Object.keys(f.zones)){
     const [x,y]=k.split(",").map(Number),ztype=S.ZONE_TYPES[f.zones[k]];
     if(!ztype||!S.validCell(f,x,y))continue;
     c.fillStyle=ztype.color+"99";c.fillRect(g.x+x*g.size,g.y+y*g.size,g.size,g.size);
     if((x+y)%4===0&&g.size>18)drawText(ztype.name,g.x+(x+.5)*g.size,g.y+(y+.5)*g.size,10,"#39505c",true);
   }
   const h=u.hoverFloor;
   if(h&&h.inside){
     c.fillStyle="rgba(56,143,175,.2)";c.fillRect(g.x+h.x*z,g.y+h.y*z,z,z);
     c.strokeStyle="#3b8eb0";c.lineWidth=2;c.strokeRect(g.x+h.x*z,g.y+h.y*z,z,z);
   }
   if(u.wallStart&&h&&u.tool==="wall"){
     line(c,floorPoint(g,u.wallStart.x,u.wallStart.y),floorPoint(g,h.nx,h.ny),"#24a0b4",Math.max(3,z*.16));
   }
 }
 function drawIsoWall(f,g,edge,highlight){
   const [o,xs,ys]=edge.split(":"),x=Number(xs),y=Number(ys);
   const a=floorPoint(g,x,y),b=floorPoint(g,x+(o==="H"?1:0),y+(o==="V"?1:0));
   const exterior=(o==="H"&&(!S.validCell(f,x,y-1)||!S.validCell(f,x,y)))||(o==="V"&&(!S.validCell(f,x-1,y)||!S.validCell(f,x,y)));
   const near=(o==="H"&&S.validCell(f,x,y-1)&&!S.validCell(f,x,y))||(o==="V"&&S.validCell(f,x-1,y)&&!S.validCell(f,x,y));
   const height=near?.42:exterior?1.9:1.5;
   const mat=wallFinish(f,edge),glass=(f.wallFinishes&&f.wallFinishes[edge]==="glass");
   const color=mat.color,door=!!f.doors[edge],windowModel=f.windows&&f.windows[edge],z=g.size,matId=(f.wallFinishes&&f.wallFinishes[edge])||"white";
   const drawPart=(start,end,lo,hi)=>{
     if(end<=start||hi<=lo)return;
     const aa=mix(a,b,start),bb=mix(a,b,end);
     const a0={x:aa.x,y:aa.y-lo*z},b0={x:bb.x,y:bb.y-lo*z};
     const at={x:aa.x,y:aa.y-hi*z},bt={x:bb.x,y:bb.y-hi*z};
     c.save();c.globalAlpha=glass?.47:1;
     polygon(c,[a0,b0,bt,at],color,highlight?"#39c3c5":"rgba(44,75,86,.35)",highlight?2:.65);
     if(matId==="brick"||matId==="oakwall"||matId==="concrete"||matId==="glass"){
       c.save();
       c.strokeStyle=matId==="brick"?"rgba(255,236,208,.49)":matId==="oakwall"?"rgba(91,58,37,.35)":matId==="glass"?"rgba(232,252,255,.65)":"rgba(225,229,226,.27)";
       c.lineWidth=matId==="glass"?1.2:.75;
       if(matId==="brick"){
         for(const part of [.28,.55,.82]){
           const ta=mix(a0,at,part),tb=mix(b0,bt,part);line(c,ta,tb,"rgba(245,220,194,.47)",.8);
         }
         const centerA=mix(a0,b0,.5),centerB=mix(at,bt,.5);line(c,centerA,centerB,"rgba(80,56,46,.15)",.7);
       }else if(matId==="oakwall"||matId==="glass"){
         for(const part of [.33,.67])line(c,mix(a0,b0,part),mix(at,bt,part),matId==="glass"?"rgba(208,236,250,.80)":"rgba(94,61,37,.33)",1);
       }else{
         for(const part of [.42,.8])line(c,mix(a0,at,part),mix(b0,bt,part),"rgba(255,255,255,.11)",.6);
       }
       c.restore();
     }
     polygon(c,[at,bt,{x:bt.x+z*.09,y:bt.y-z*.02},{x:at.x+z*.09,y:at.y-z*.02}],
       glass?"#bde7f0":"#f5f6f1","rgba(57,76,81,.15)",.45);
     c.restore();
     if(glass)line(c,at,bt,"rgba(52,101,128,.85)",1);
   };
   if(door){
     drawPart(0,.16,0,height);drawPart(.84,1,0,height);
     if(!near)drawPart(.16,.84,Math.min(height*.78,1.22),height);
     const p=mix(a,b,.18),q=mix(a,b,.74);
     line(c,p,q,"#a67f54",Math.max(1.2,z*.065));
     // Swing arc indicates a real doorway instead of a painted rectangle.
     c.strokeStyle="#a78a66";c.lineWidth=1;c.beginPath();
     c.arc(p.x,p.y,z*.46,-Math.PI*.24,Math.PI*.17);c.stroke();
   }else if(windowModel){
     drawPart(0,1,0,.39);drawPart(0,1,Math.min(1.37,height*.8),height);
     drawPart(0,.09,.38,Math.min(1.37,height));drawPart(.91,1,.38,Math.min(1.37,height));
     const lo=mix(a,b,.08),hi=mix(a,b,.92),rise=Math.min(1.35,height*.9)*z;
     const pts=[{x:lo.x,y:lo.y-.39*z},{x:hi.x,y:hi.y-.39*z},{x:hi.x,y:hi.y-rise},{x:lo.x,y:lo.y-rise}];
     polygon(c,pts,windowModel.model==="secure"?"rgba(82,131,153,.55)":"rgba(143,204,219,.34)","#7ea3ae",1.25*z);
     line(c,{x:lo.x,y:lo.y-(rise+.39*z)/2},{x:hi.x,y:hi.y-(rise+.39*z)/2},"rgba(204,232,235,.82)",1*z);
   }else drawPart(0,1,0,height);
 }
 function isoItem(it,g,s){
   const z=g.size,x=it.x,y=it.y,w=it.w||1,d0=it.d||1,p=floorPoint(g,x,y);
   const heights={desk:.47,chair:.28,table:.4,shelf:.88,printer:.68,hvac:.8,machine:.95,
     plant:.38,toilet:.31,sink:.48,dispenser:.65,light:.20,camera:.34,
     alarm:.16,sprinkler:.12,reader:.38,pallet:.20};
   const h=Math.min(2.5,it.h||heights[it.type]||.42);
   const ztop=h*z;
   const a=floorPoint(g,x+.06*w,y+.06*d0),b=floorPoint(g,x+.94*w,y+.06*d0),
     d=floorPoint(g,x+.94*w,y+.94*d0),e=floorPoint(g,x+.06*w,y+.94*d0);
   const lift=q=>({x:q.x,y:q.y-ztop});
   const tone=it.type==="desk"||it.type==="table"?"#93785d":"#8599a0";
   polygon(c,[e,d,lift(d),lift(e)],tone,"rgba(45,65,74,.23)",.4);
   polygon(c,[b,d,lift(d),lift(b)],"#718993","rgba(38,65,77,.24)",.4);
   polygon(c,[lift(a),lift(b),lift(d),lift(e)],"#d6d9d3","rgba(37,69,77,.26)",.7);
   const top=floorPoint(g,x,y,h);
   c.save();c.translate(top.x,top.y);
   c.transform(1,.5,-1,.5,0,0);
   c.scale(Math.min(3,w),Math.min(2.5,d0));
   drawItem(it,{x:0,y:0},z,s);
   c.restore();
 }
 function floorIso(s,u,b,f,g){
   if(f.mask){
     for(const cell of f.mask){
       const [x,y]=cell.split(",").map(Number),a=floorPoint(g,x,y),b=floorPoint(g,x+1,y),
         d=floorPoint(g,x+1,y+1),e=floorPoint(g,x,y+1),drop=p=>({x:p.x,y:p.y+g.size*.54});
       if(!S.validCell(f,x+1,y))polygon(c,[b,d,drop(d),drop(b)],"#91a4ad","#718b99",.6);
       if(!S.validCell(f,x,y+1))polygon(c,[e,d,drop(d),drop(e)],"#aab9bd","#8d9fa8",.6);
     }
   }else{
     const a=floorPoint(g,0,0),bb=floorPoint(g,f.cols,0),
       d=floorPoint(g,f.cols,f.rows),e=floorPoint(g,0,f.rows);
     const down=p=>({x:p.x,y:p.y+g.size*.54});
     c.save();c.shadowColor="rgba(25,47,59,.16)";c.shadowBlur=26;c.shadowOffsetY=12;
     polygon(c,[e,d,down(d),down(e)],"#bac4c7");c.restore();
     polygon(c,[e,d,down(d),down(e)],"#a9b6ba","#93a7af",1);
     polygon(c,[bb,d,down(d),down(bb)],"#8f9fa7","#8699a4",1);
     polygon(c,[a,bb,d,e],"#d7d9d6","#708a96",1.3);
   }
   for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++){
     if(!S.validCell(f,x,y))continue;
     const type=f.tiles[S.key(x,y)]||"office";
     const pts=[floorPoint(g,x,y),floorPoint(g,x+1,y),floorPoint(g,x+1,y+1),floorPoint(g,x,y+1)];
     const surface=floorSurface(f,x,y,type);
     polygon(c,pts,surface.color,"rgba(70,92,100,.10)",.5);
     floorDetail(g,x,y,surface.pattern);
     if(x%4===0&&y%4===0&&g.size>12){
       line(c,floorPoint(g,x+.14,y+.5),floorPoint(g,x+.32,y+.5),"rgba(88,107,112,.13)",.45);
     }
   }
   if(u.zoneFilter&&f.zones){
     for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++){
       const zone=f.zones[S.key(x,y)],info=S.ZONE_TYPES[zone];
       if(!info)continue;
       const poly=[floorPoint(g,x,y,.04),floorPoint(g,x+1,y,.04),floorPoint(g,x+1,y+1,.04),floorPoint(g,x,y+1,.04)];
       polygon(c,poly,info.color+"88",info.color,1);
       if((x+y)%4===0&&g.size>10){const p=floorPoint(g,x+.5,y+.5,.07);drawText(info.name,p.x,p.y,Math.min(11,g.size*.46),"#365262",true);}
     }
   }
   const drawing=[];
   const hovers=u.hoverFloor&&u.hoverFloor.inside?u.hoverFloor:null;
   for(const edge of Object.keys(f.walls)){
     const [o,xs,ys]=edge.split(":"),x=Number(xs),y=Number(ys);
     drawing.push({depth:o==="H"?x+.5+y:x+y+.5,wall:true,edge,draw:()=>drawIsoWall(f,g,edge,u.hoverWall===edge&&(u.tool==="door"||u.tool==="erase"||u.tool.startsWith("finish:")))});
   }
   for(const it of f.items){
     drawing.push({depth:it.x+it.y+1,wall:false,draw:()=>isoItem(it,g,s)});
   }
   drawing.sort((a,b)=>a.depth-b.depth||(a.wall&&!b.wall?-1:!a.wall&&b.wall?1:0));
   for(const thing of drawing)thing.draw();
   if(hovers){
     const pts=[floorPoint(g,hovers.x,hovers.y,.08),floorPoint(g,hovers.x+1,hovers.y,.08),
       floorPoint(g,hovers.x+1,hovers.y+1,.08),floorPoint(g,hovers.x,hovers.y+1,.08)];
     polygon(c,pts,"rgba(60,177,191,.22)","#3da6ba",1.5);
   }
   if(u.wallStart&&hovers&&u.tool==="wall"){
     const p=floorPoint(g,u.wallStart.x,u.wallStart.y,.12),q=floorPoint(g,hovers.nx,hovers.ny,.12);
     line(c,p,q,"#1bb5bd",Math.max(2.2,g.size*.14));
   }
 }
 function floor(s,u){
   c.fillStyle="#e5eeeb";c.fillRect(0,0,cw,ch);
   const b=s.buildings.find(b=>b.id===u.selectedId);if(!b)return;
   const f=b.floors[u.floorIndex]||b.floors[0],g=floorGeom(u,f);
   if(g.iso)floorIso(s,u,b,f,g);else floorPlan(s,u,b,f,g);
   drawText(b.name+" · "+f.label+" · "+(g.iso?"2,5D-INNENANSICHT":"2D-BAUPLAN"),cw/2,24,14,"#315261",true);
 }
 function insidePoly(point,poly){
   let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
     const pi=poly[i],pj=poly[j];
     if(((pi.y>point.y)!==(pj.y>point.y))&&(point.x<(pj.x-pi.x)*(point.y-pi.y)/(pj.y-pi.y)+pi.x))yes=!yes;
   }return yes;
 }
 function pickFloorWall(mx,my,u,b){
   const f=b.floors[u.floorIndex]||b.floors[0],g=floorGeom(u,f);
   const p={x:mx,y:my},hits=[];
   for(const edge of Object.keys(f.walls)){
     const [o,xs,ys]=edge.split(":"),x=Number(xs),y=Number(ys);
     const a=floorPoint(g,x,y),bb=floorPoint(g,x+(o==="H"?1:0),y+(o==="V"?1:0));
     if(g.iso){
       const low=(o==="H"&&y===f.rows)||(o==="V"&&x===f.cols);
       const height=low?.42:((o==="H"&&y===0)||(o==="V"&&x===0))?1.9:1.5;
       const at={x:a.x,y:a.y-height*g.size},bt={x:bb.x,y:bb.y-height*g.size};
       if(insidePoly(p,[a,bb,bt,at]))hits.push({edge,depth:x+y});
     }else{
       const dx=bb.x-a.x,dy=bb.y-a.y,len=Math.hypot(dx,dy)||1;
       const t=Math.max(0,Math.min(1,((mx-a.x)*dx+(my-a.y)*dy)/(len*len)));
       if(Math.hypot(mx-(a.x+dx*t),my-(a.y+dy*t))<Math.max(8,g.size*.32))hits.push({edge,depth:x+y});
     }
   }
   hits.sort((a,b)=>b.depth-a.depth);
   return hits.length?hits[0].edge:null;
 }
 function pickBuilding(px,py,u,s){
   const p={x:px,y:py},sorted=s.buildings.slice().sort((a,b)=>(b.x+b.y+b.w+b.h)-(a.x+a.y+a.w+a.h));
   for(const b of sorted){
     const h=20+b.floors.length*30;
     const a=worldP(b.x,b.y,0,u),e=worldP(b.x+b.w,b.y,0,u),d=worldP(b.x+b.w,b.y+b.h,0,u),f=worldP(b.x,b.y+b.h,0,u);
     const at=worldP(b.x,b.y,h,u),et=worldP(b.x+b.w,b.y,h,u),dt=worldP(b.x+b.w,b.y+b.h,h,u),ft=worldP(b.x,b.y+b.h,h,u);
     if(b.shape&&b.shape.length){
       const height=20+b.floors.length*30;
       for(const [dx,dy] of b.shape){
         const x=b.x+dx,y=b.y+dy;
         const a=worldP(x,y,0,u),c1=worldP(x+1,y,0,u),d1=worldP(x+1,y+1,0,u),e1=worldP(x,y+1,0,u);
         const A=worldP(x,y,height,u),C=worldP(x+1,y,height,u),D=worldP(x+1,y+1,height,u),E=worldP(x,y+1,height,u);
         if(insidePoly(p,[A,C,D,E])||insidePoly(p,[E,D,d1,e1])||insidePoly(p,[C,D,d1,c1]))return b;
       }
     }else if(insidePoly(p,[at,et,dt,ft])||insidePoly(p,[ft,dt,d,f])||insidePoly(p,[dt,et,e,d]))return b;
   }
   return null;
 }
 function render(s,u,t){if(!cw||!ch)resize();c.setTransform(dpr,0,0,dpr,0,0);if(u.mode==="floor")floor(s,u);else world(s,u,t||0);}
 return {resize,render,hitWorld:(x,y,u)=>unproject(x,y,u),hitFloor:floorHit,pickFloorWall,pickBuilding,worldP,viewport:()=>({w:cw,h:ch})};
}
root.IPRender={create:factory};
})(window);
