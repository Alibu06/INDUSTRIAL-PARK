(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IPSim = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const VERSION = 2;
  const TYPES = {
    office:{name:"Bürogebäude",w:5,h:4,cost:320000,days:10,levels:2,color:"#9db2c4",monthly:1500,unit:"Büro"},
    warehouse:{name:"Logistikhalle",w:6,h:5,cost:390000,days:13,levels:1,color:"#9ba7a7",monthly:2400,unit:"Lager"},
    workshop:{name:"Handwerkerhof",w:4,h:3,cost:175000,days:8,levels:1,color:"#c7a78f",monthly:950,unit:"Werkstatt"},
    cafe:{name:"Café / Kantine",w:3,h:3,cost:145000,days:8,levels:1,color:"#b7b99c",monthly:900,unit:"Gastronomie"},
    service:{name:"Betriebszentrale",w:4,h:3,cost:195000,days:9,levels:2,color:"#829ba7",monthly:1150,unit:"Verwaltung"}
  };
  const FLOOR_TYPES = {office:"Büro",meeting:"Besprechung",hall:"Lager",workshop:"Werkstatt",kitchen:"Küche",bath:"Sanitär",lobby:"Empfang",corridor:"Flur",server:"Serverraum",break:"Pausenraum"};
  const WALL_FINISHES = {
    white:{name:"Warmweiß",color:"#e9e8df",cost:42},
    beige:{name:"Sandbeige",color:"#d9c2aa",cost:55},
    navy:{name:"Navyblau",color:"#304c65",cost:68},
    sage:{name:"Salbeigrün",color:"#95ad9c",cost:60},
    concrete:{name:"Sichtbeton",color:"#98a1a4",cost:85},
    brick:{name:"Klinker",color:"#aa7561",cost:110},
    glass:{name:"Glastrennwand",color:"#a0cad7",cost:260}
  };
  const ITEM_TYPES = {
    desk:{name:"Schreibtisch",cost:430},
    chair:{name:"Bürostuhl",cost:160},
    table:{name:"Besprechungstisch",cost:870},
    shelf:{name:"Regal",cost:650},
    printer:{name:"Drucker",cost:1100,device:true},
    hvac:{name:"Klimagerät",cost:4800,device:true},
    light:{name:"Deckenleuchte",cost:230,device:true},
    toilet:{name:"WC",cost:1800,device:true},
    sink:{name:"Waschbecken",cost:990,device:true},
    dispenser:{name:"Spender",cost:160,device:true},
    camera:{name:"Überwachungskamera",cost:620,device:true},
    alarm:{name:"Brandmelder",cost:175,device:true},
    sprinkler:{name:"Sprinkler",cost:240,device:true},
    reader:{name:"Kartenleser",cost:750,device:true},
    pallet:{name:"Palette",cost:310},
    machine:{name:"Maschine",cost:8900,device:true},
    plant:{name:"Pflanze",cost:140}
  };
  const APPLICANTS = [
    {name:"Rheintal Digital GmbH",industry:"IT & Software",kind:"office",employees:18,turnover:138000,health:88,desired:380,maxRent:6900},
    {name:"Hansa Versandlogistik",industry:"Logistik",kind:"warehouse",employees:28,turnover:310000,health:77,desired:640,maxRent:9800},
    {name:"Mertens Elektrotechnik",industry:"Handwerk",kind:"workshop",employees:12,turnover:104000,health:91,desired:220,maxRent:4600},
    {name:"Kaffeequartier",industry:"Gastronomie",kind:"cafe",employees:9,turnover:53000,health:73,desired:125,maxRent:3400},
    {name:"Westerwald Ingenieure",industry:"Ingenieurbüro",kind:"office",employees:31,turnover:218000,health:84,desired:470,maxRent:7900},
    {name:"Nordwest Technikservice",industry:"Gebäudeservice",kind:"workshop",employees:15,turnover:129000,health:82,desired:245,maxRent:4900}
  ];
  const key=(x,y)=>x+","+y;
  const clone=(o)=>JSON.parse(JSON.stringify(o));
  function rand(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function id(s,p){s.serial++;return p+"-"+String(s.serial).padStart(4,"0");}
  function addMessage(s,title,body,level){s.messages.unshift({id:id(s,"MSG"),date:s.clock.slice(0,10),title,body,level:level||"info"});s.messages=s.messages.slice(0,65);}
  function floorFor(b,idx){
    const kind=b.type==="warehouse"?"hall":b.type==="workshop"?"workshop":b.type==="cafe"?"kitchen":"office";
    const f={id:"F"+idx,label:idx===0?"EG":idx+". OG",cols:b.w*4,rows:b.h*4,tiles:{},walls:{},doors:{},wallFinishes:{},items:[]};
    // Complete shell: each exterior wall is also an individually editable segment.
    for(let x=0;x<f.cols;x++){f.walls["H:"+x+":0"]=1;f.walls["H:"+x+":"+f.rows]=1;}
    for(let y=0;y<f.rows;y++){f.walls["V:0:"+y]=1;f.walls["V:"+f.cols+":"+y]=1;}
    for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++)f.tiles[key(x,y)]=kind;
    return f;
  }
  function makeBuilding(s,type,x,y,ready,rotation=0){
    const t=TYPES[type],swapped=Math.abs(rotation)%2===1; const b={id:id(s,"B"),name:t.name+" "+String.fromCharCode(65+s.buildings.length),type,x,y,w:swapped?t.h:t.w,h:swapped?t.w:t.h,rotation:swapped?1:0,condition:88,construction:ready?0:t.days,levels:t.levels,floors:[],tenantId:null};
    for(let i=0;i<t.levels;i++)b.floors.push(floorFor(b,i));
    s.buildings.push(b);return b;
  }
  function makeCompany(s,template,building,rent){
    const c={id:id(s,"FIR"),name:template.name,industry:template.industry,kind:template.kind,employees:template.employees,turnover:template.turnover,health:template.health,cash:template.turnover*2,buildingId:building.id,rent,history:[],status:"aktiv"};
    s.companies.push(c);building.tenantId=c.id;return c;
  }
  function device(s,building,type,x,y,floor){
    const d={id:id(s,"DEV"),buildingId:building.id,floor:floor||0,x,y,type,condition:72+Math.floor(rand(s)*25),state:"ok",uses:0};
    s.devices.push(d);
    building.floors[floor||0].items.push({id:d.id,type,x,y,deviceId:d.id});
    return d;
  }
  const PARCELS=[
    {id:"P-01",name:"Startgrundstück",x:4,y:10,w:20,h:16,price:0,owned:true},
    {id:"P-02",name:"Ost-Erweiterung",x:24,y:10,w:20,h:16,price:168000,owned:false},
    {id:"P-03",name:"Südwest-Areal",x:4,y:26,w:20,h:12,price:112000,owned:false},
    {id:"P-04",name:"Südost-Areal",x:24,y:26,w:20,h:12,price:128000,owned:false},
    {id:"P-05",name:"Nordwest-Flächen",x:4,y:1,w:20,h:7,price:96000,owned:false},
    {id:"P-06",name:"Nordost-Flächen",x:24,y:1,w:20,h:7,price:115000,owned:false}
  ];
  const CONTRACTORS=[
    {id:"rheinbau",name:"Rheinbau Projektbau",description:"Solider regionaler Generalunternehmer",factor:1.08,speed:1,quality:83},
    {id:"direktbau",name:"Direktbau Niederrhein",description:"Günstiger, benötigt mehr Zeit",factor:.94,speed:1.45,quality:72},
    {id:"rheinlandplus",name:"Rheinland Projekt & Bau",description:"Schnellere Ausführung und höhere Qualität",factor:1.23,speed:.76,quality:94}
  ];
  function create(){
    const s={version:VERSION,serial:0,seed:931177,clock:"2027-05-03T07:30:00.000Z",
      cash:790000,debt:0,monthlyNet:0,companyIncome:0,expenses:0,mode:"career",
      world:{w:48,h:40},roads:[],publicRoads:[],parking:[],trees:[],utilities:[],
      parcels:clone(PARCELS),projects:[],constructionDept:{active:false,workers:0,equipment:0},
      buildings:[],companies:[],applicants:clone(APPLICANTS),devices:[],tickets:[],messages:[],history:[],
      stats:{visitors:0,carDemand:0,powerDemand:0},bus:false,
      staff:{technicians:0,cleaners:0,security:0},autodispatch:false};
    for(let x=1;x<47;x++){s.publicRoads.push(key(x,8));s.publicRoads.push(key(x,9));}
    // Landscape outside the player's initial lot; its surface starts genuinely empty.
    for(let i=0;i<135;i++){
      const x=1+Math.floor(rand(s)*46),y=1+Math.floor(rand(s)*38);
      if(!isOwned(s,x,y)&&!s.publicRoads.includes(key(x,y))&&rand(s)>.30)s.trees.push(key(x,y));
    }
    addMessage(s,"Dein Gewerbepark beginnt auf der grünen Wiese",
      "Du besitzt nur das leere Startgrundstück. Baue die erste Zufahrt, beauftrage eine Baufirma und errichte deine erste vermietbare Fläche.");
    addMessage(s,"Bauunternehmen stehen bereit",
      "Beim Platzieren erhältst du Angebote mehrerer Fachunternehmen. Einen eigenen Baubetrieb kannst du später gründen.");
    return s;
  }
  function isOwned(s,x,y){
    return !!s.parcels&&s.parcels.some(p=>p.owned&&x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h);
  }
  function buyParcel(s,parcelId){
    const p=s.parcels.find(q=>q.id===parcelId);
    if(!p)return {ok:false,message:"Grundstück nicht vorhanden"};
    if(p.owned)return {ok:false,message:"Dieses Grundstück gehört dir bereits"};
    if(s.cash<p.price)return {ok:false,message:"Für diesen Grundstücksankauf fehlt Kapital"};
    s.cash-=p.price;p.owned=true;
    addMessage(s,"Flächenankauf abgeschlossen",p.name+" · "+(p.w*p.h*16).toLocaleString("de-DE")+" m² · "+p.price.toLocaleString("de-DE")+" €");
    return {ok:true,parcel:p};
  }
  function propertyArea(s){return s.parcels.filter(p=>p.owned).reduce((n,p)=>n+p.w*p.h*16,0);}
  function startConstructionDept(s){
    if(s.constructionDept.active)return {ok:false,message:"Eigener Baubetrieb bereits gegründet"};
    const cost=255000;
    if(s.cash<cost)return {ok:false,message:"Für den Aufbau benötigst du 255.000 € Startkapital"};
    s.cash-=cost;s.constructionDept={active:true,workers:5,equipment:2};
    addMessage(s,"Eigene Bauabteilung eröffnet",
      "Fünf Bauarbeiter, zwei Geräteeinheiten und ein Betriebshof wurden finanziert. Eigene Bauleistungen sind jetzt verfügbar.");
    return {ok:true,cost};
  }
  function setBuilders(s,delta){
    if(!s.constructionDept.active)return {ok:false,message:"Zuerst eine eigene Bauabteilung gründen"};
    const count=s.constructionDept.workers+delta;
    if(count<0||count>35)return {ok:false,message:"Personalgrenze erreicht"};
    if(count<5&&s.projects.some(p=>p.status==="bau"&&p.contractorId==="eigen"))return {ok:false,message:"Laufende Bauaufträge benötigen mindestens fünf Bauarbeiter"};
    s.constructionDept.workers=count;return {ok:true};
  }
  function getQuotes(s,tool,quantity=1){
    const count=Math.max(1,Math.floor(quantity));
    const base=(TYPES[tool]?TYPES[tool].cost:(SITE_COSTS[tool]||0)*count);
    if(!base)return [];
    const baseDays=TYPES[tool]?TYPES[tool].days:Math.max(1,Math.ceil(count/5));
    const external=CONTRACTORS.map(c=>({...c,price:Math.round(base*c.factor),days:Math.max(1,Math.ceil(baseDays*c.speed)),own:false,available:true}));
    const own=s.constructionDept.active?[{
      id:"eigen",name:"Eigener Baubetrieb",description:"Eigenes Personal, Maschinen und Betriebshof",
      factor:.81,price:Math.round(base*.81),days:Math.max(1,Math.ceil(baseDays*1.1)),
      quality:80,own:true,available:s.constructionDept.workers>=5&&s.projects.filter(p=>p.status==="bau"&&p.contractorId==="eigen").length<1
    }]:[];
    return external.concat(own);
  }
  function commission(s,plan,contractorId){
    if(!plan||!plan.tool)return {ok:false,message:"Kein Bauplan ausgewählt"};
    const tool=plan.tool,isBuilding=!!TYPES[tool],points=[];
    let check;
    if(isBuilding){
      check=preview(s,tool,plan.x,plan.y,plan.rotation||0);
      if(!check.ok)return {ok:false,message:check.message};
    }else{
      if(!(tool in SITE_COSTS))return {ok:false,message:"Unbekannter Baubereich"};
      const seen=new Set();
      for(const p of plan.points||[]){
        const k=key(Math.floor(p.x),Math.floor(p.y));
        if(!seen.has(k)){seen.add(k);points.push({x:Math.floor(p.x),y:Math.floor(p.y)});}
      }
      if(!points.length)return {ok:false,message:"Keine Fläche ausgewählt"};
      for(const p of points){
        check=preview(s,tool,p.x,p.y);
        if(!check.ok)return {ok:false,message:"Bauzug nicht möglich bei "+p.x+"/"+p.y+": "+check.message};
      }
    }
    const q=getQuotes(s,tool,isBuilding?1:points.length).find(x=>x.id===contractorId);
    if(!q)return {ok:false,message:"Bitte einen vorhandenen Bauunternehmer auswählen"};
    if(!q.available)return {ok:false,message:"Eigene Baukolonne derzeit nicht verfügbar"};
    if(s.cash<q.price)return {ok:false,message:"Finanzierung reicht für dieses Angebot nicht aus"};
    s.cash-=q.price;
    let building=null;
    if(isBuilding){
      building=makeBuilding(s,tool,check.x,check.y,false,plan.rotation||0);
      building.construction=q.days;
      building.condition=q.quality;
      building.contractorId=q.id;
      s.trees=s.trees.filter(k=>{const [x,y]=k.split(",").map(Number);return !(x>=building.x&&x<building.x+building.w&&y>=building.y&&y<building.y+building.h);});
    }
    const project={
      id:id(s,"BAU"),tool,buildingId:building?building.id:null,
      points:isBuilding?[]:points,contractorId:q.id,contractorName:q.name,
      quote:q.price,remaining:q.days,totalDays:q.days,quality:q.quality,status:"bau",
      created:s.clock.slice(0,10),completed:null
    };
    s.projects.push(project);
    addMessage(s,"Bauauftrag vergeben",
      q.name+" übernimmt "+(building?building.name:points.length+" Felder "+tool)+". Festpreis "+q.price.toLocaleString("de-DE")+" €, Bauzeit "+q.days+" Tage.");
    return {ok:true,project,building,cost:q.price};
  }
  function cancelProject(s,projectId){
    const p=s.projects.find(p=>p.id===projectId);
    if(!p||p.status!=="bau")return {ok:false,message:"Nur laufende Bauaufträge können storniert werden"};
    const refund=Math.round(p.quote*.70*Math.max(0,p.remaining)/p.totalDays);
    p.status="storniert";p.cancelled=s.clock.slice(0,10);p.refund=refund;
    if(p.buildingId){
      s.buildings=s.buildings.filter(b=>b.id!==p.buildingId);
      s.devices=s.devices.filter(d=>d.buildingId!==p.buildingId);
      s.tickets=s.tickets.filter(t=>t.buildingId!==p.buildingId);
    }
    s.cash+=refund;
    addMessage(s,"Bauauftrag storniert",p.contractorName+" · Rückerstattung "+refund.toLocaleString("de-DE")+" €; bereits entstandene Aufwendungen bleiben verloren.","warning");
    return {ok:true,refund};
  }
  function overlap(s,x,y,w,h){
    if(x<1||y<1||x+w>s.world.w-1||y+h>s.world.h-1)return "Außerhalb der Spielwelt";
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!isOwned(s,xx,yy))return "Grundstück nicht im Eigentum – zuerst Fläche ankaufen";
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(s.publicRoads.includes(key(xx,yy)))return "Öffentliche Straße kann nicht überbaut werden";
    if(s.projects.some(p=>p.status==="bau"&&p.points.some(a=>a.x>=x&&a.x<x+w&&a.y>=y&&a.y<y+h)))return "Fläche bereits für Bauarbeiten reserviert";
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(s.roads.includes(key(xx,yy)))return "Straße liegt im Baufeld";
    if(s.buildings.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y))return "Gebäude steht im Baufeld";
    return "";
  }
  const SITE_COSTS={road:9000,parking:4400,tree:750};
  function preview(s,tool,x,y,rotation=0){
    x=Math.floor(x);y=Math.floor(y);
    if(TYPES[tool]){
      const t=TYPES[tool],swap=Math.abs(rotation)%2===1,w=swap?t.h:t.w,h=swap?t.w:t.h;
      const error=overlap(s,x,y,w,h);
      const parkingCollision=s.parking.some(p=>{const [px,py]=p.split(",").map(Number);return px>=x&&px<x+w&&py>=y&&py<y+h;});
      const valid=!error&&!parkingCollision&&s.cash>=Math.round(t.cost*.94);
      let nearby=false;
      for(let yy=y-2;yy<y+h+2;yy++)for(let xx=x-2;xx<x+w+2;xx++){
        if(xx>=0&&yy>=0&&xx<s.world.w&&yy<s.world.h&&(s.roads.includes(key(xx,yy))||s.publicRoads.includes(key(xx,yy))))nearby=true;
      }
      return {ok:valid,x,y,w,h,cost:t.cost,roadAccess:nearby,
        message:error|| (parkingCollision?"Vorhandene Parkplätze zuerst entfernen":s.cash<Math.round(t.cost*.94)?"Zu wenig Kapital":"Baufläche frei")};
    }
    if(!(tool in SITE_COSTS))return {ok:false,x,y,w:1,h:1,cost:0,message:"Unbekanntes Bauwerkzeug"};
    if(x<0||y<0||x>=s.world.w||y>=s.world.h)return {ok:false,x,y,w:1,h:1,cost:SITE_COSTS[tool],message:"Außerhalb der Karte"};
    if(!isOwned(s,x,y))return {ok:false,x,y,w:1,h:1,cost:SITE_COSTS[tool],message:"Grundstück erst kaufen"};
    if(s.publicRoads.includes(key(x,y)))return {ok:false,x,y,w:1,h:1,cost:SITE_COSTS[tool],message:"Öffentliche Straße"};
    if(s.projects.some(p=>p.status==="bau"&&p.points.some(a=>a.x===x&&a.y===y)))return {ok:false,x,y,w:1,h:1,cost:SITE_COSTS[tool],message:"Fläche bereits für Bauarbeiten reserviert"};
    if(s.buildings.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))return {ok:false,x,y,w:1,h:1,cost:SITE_COSTS[tool],message:"Hier steht ein Gebäude"};
    const k=key(x,y),road=s.roads.includes(k),park=s.parking.includes(k),tree=s.trees.includes(k);
    const err=tool==="road"?(road?"Straße bereits vorhanden":park?"Parkplatz muss zuerst entfernt werden":""):
      tool==="parking"?(road||park?"Bereits befestigte Fläche":""):
      (road||park||tree?"Fläche ist bereits belegt":"");
    return {ok:!err&&s.cash>=SITE_COSTS[tool],x,y,w:1,h:1,cost:SITE_COSTS[tool],
      message:err|| (s.cash<Math.round(SITE_COSTS[tool]*.94)?"Zu wenig Kapital":"Baufeld frei")};
  }
  function place(s,tool,x,y,rotation=0){
    const p=preview(s,tool,x,y,rotation);
    if(!p.ok)return {ok:false,message:p.message};
    s.cash-=p.cost;
    if(TYPES[tool]){
      const t=TYPES[tool],b=makeBuilding(s,tool,p.x,p.y,false,rotation);
      s.trees=s.trees.filter(pos=>{const [tx,ty]=pos.split(",").map(Number);return !(tx>=p.x-1&&tx<p.x+p.w+1&&ty>=p.y-1&&ty<p.y+p.h+1);});
      addMessage(s,"Bauauftrag vergeben",b.name+" wird in "+t.days+" Tagen fertiggestellt. Investition: "+t.cost.toLocaleString("de-DE")+" €.");
      return {ok:true,building:b,cost:p.cost};
    }
    const k=key(p.x,p.y);
    if(tool==="road")s.roads.push(k);
    if(tool==="parking")s.parking.push(k);
    if(tool==="tree")s.trees.push(k);
    if(tool!=="tree")s.trees=s.trees.filter(v=>v!==k);
    return {ok:true,cost:p.cost};
  }
  function placePath(s,tool,points){
    if(!["road","parking","tree"].includes(tool))return {ok:false,message:"Das Werkzeug unterstützt kein Ziehen."};
    const uniq=[],seen=new Set();for(const p of points){
      const k=key(Math.floor(p.x),Math.floor(p.y));if(!seen.has(k)){seen.add(k);uniq.push({x:Math.floor(p.x),y:Math.floor(p.y)});}
    }
    const valid=uniq.filter(p=>preview(s,tool,p.x,p.y).ok);
    const cost=valid.length*SITE_COSTS[tool];
    if(!valid.length)return {ok:false,message:"Keine freie Baufläche gefunden."};
    if(cost>s.cash)return {ok:false,message:"Die gesamte Bauauswahl kostet "+cost.toLocaleString("de-DE")+" €, die Liquidität reicht nicht."};
    // Check collisions once more so a path cannot partially reserve a building footprint.
    for(const p of valid){const result=place(s,tool,p.x,p.y);if(!result.ok)return {ok:false,message:result.message};}
    return {ok:true,count:valid.length,skipped:uniq.length-valid.length,cost};
  }
  function demolish(s,x,y){
    const b=s.buildings.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
    if(b){if(s.projects.some(p=>p.buildingId===b.id&&p.status==="bau"))return {ok:false,message:"Für laufende Bauvorhaben zuerst den Bauauftrag stornieren"};if(b.tenantId)return {ok:false,message:"Vermietetes Gebäude kann nicht abgerissen werden"};s.cash-=12000;s.buildings=s.buildings.filter(a=>a!==b);s.devices=s.devices.filter(d=>d.buildingId!==b.id);addMessage(s,"Rückbau abgeschlossen",b.name+" wurde zurückgebaut.");return {ok:true};}
    const p=key(x,y);for(const name of ["roads","parking","trees"]){if(s[name].includes(p)){s[name]=s[name].filter(k=>k!==p);return {ok:true};}}
    return {ok:false,message:"Hier befindet sich kein Bauobjekt"};
  }
  function canRent(s,b,app){
    if(!b||b.construction>0)return "Gebäude ist noch nicht bezugsfertig";
    if(b.tenantId)return "Gebäude bereits vermietet";
    if(b.type!==app.kind)return "Unternehmen benötigt einen anderen Gebäudetyp";
    return "";
  }
  function rent(s,buildingId,appId,proposed){
    const b=s.buildings.find(x=>x.id===buildingId),a=s.applicants.find(x=>x.name===appId);
    if(!a)return {ok:false,message:"Mietinteressent nicht mehr verfügbar"};
    const err=canRent(s,b,a);if(err)return {ok:false,message:err};
    const amount=Math.round(Number(proposed));if(!Number.isFinite(amount)||amount<100)return {ok:false,message:"Ungültige Miete"};
    const score=(amount/a.maxRent)+((100-a.health)/300);if(score>1.17)return {ok:false,message:a.name+" lehnt diese Miethöhe ab. Höchstbudget: "+a.maxRent.toLocaleString("de-DE")+" €."};
    const c=makeCompany(s,a,b,amount);s.applicants=s.applicants.filter(x=>x!==a);
    addMessage(s,"Neuer Mietvertrag",c.name+" zieht in "+b.name+" ein. Monatliche Kaltmiete: "+amount.toLocaleString("de-DE")+" €.");
    return {ok:true,company:c};
  }
  function addFloor(s,bid){
    const b=s.buildings.find(x=>x.id===bid);if(!b)return {ok:false,message:"Gebäude nicht gefunden"};
    if(b.floors.length>=8)return {ok:false,message:"Maximal acht Etagen"};
    const price=65000+b.w*b.h*2600;if(s.cash<price)return {ok:false,message:"Nicht genug Kapital"};
    s.cash-=price;b.floors.push(floorFor(b,b.floors.length));b.levels=b.floors.length;
    addMessage(s,"Aufstockung beauftragt",b.name+" erhält eine zusätzliche Etage.");return {ok:true};
  }
  function wallKey(x,y,o){return o+":"+x+":"+y;}
  function setWall(s,bid,level,x1,y1,x2,y2,remove){
    const b=s.buildings.find(x=>x.id===bid);const f=b&&b.floors[level];if(!f)return {ok:false,message:"Etage fehlt"};
    x1=Math.round(x1);y1=Math.round(y1);x2=Math.round(x2);y2=Math.round(y2);
    if(x1!==x2&&y1!==y2)return {ok:false,message:"Wände müssen gerade verlaufen"};
    let count=0;
    if(x1===x2){const x=x1;for(let y=Math.min(y1,y2);y<Math.max(y1,y2);y++){if(x<0||x>f.cols||y<0||y>=f.rows)continue;const k=wallKey(x,y,"V");if(remove){delete f.walls[k];delete f.doors[k];if(f.wallFinishes)delete f.wallFinishes[k];}else{f.walls[k]=1;}count++;}}
    else{const y=y1;for(let x=Math.min(x1,x2);x<Math.max(x1,x2);x++){if(y<0||y>f.rows||x<0||x>=f.cols)continue;const k=wallKey(x,y,"H");if(remove){delete f.walls[k];delete f.doors[k];}else{f.walls[k]=1;}count++;}}
    return {ok:count>0,message:count?"":"Keine Segmente ausgewählt"};
  }
  function toggleDoor(s,bid,level,edge){
    const b=s.buildings.find(x=>x.id===bid),f=b&&b.floors[level];if(!f||!f.walls[edge])return {ok:false,message:"Setze zunächst eine Wand"};
    if(f.doors[edge])delete f.doors[edge];else f.doors[edge]=1;return {ok:true};
  }
  function finishWall(s,bid,level,edge,finish){
    const b=s.buildings.find(x=>x.id===bid),f=b&&b.floors[level],material=WALL_FINISHES[finish];
    if(!f)return {ok:false,message:"Etage fehlt"};
    if(!material)return {ok:false,message:"Unbekannte Wandoberfläche"};
    if(!f.walls[edge])return {ok:false,message:"Zuerst eine Wand setzen"};
    if(f.wallFinishes&&f.wallFinishes[edge]===finish)return {ok:false,message:"Diese Wand besitzt bereits die Oberfläche"};
    if(s.cash<material.cost)return {ok:false,message:"Nicht genug Kapital für die Wandgestaltung"};
    s.cash-=material.cost;
    if(!f.wallFinishes)f.wallFinishes={};
    f.wallFinishes[edge]=finish;
    return {ok:true,cost:material.cost,finish};
  }
  function paint(s,bid,level,x,y,type){
    const b=s.buildings.find(x=>x.id===bid),f=b&&b.floors[level];if(!f||x<0||y<0||x>=f.cols||y>=f.rows||!FLOOR_TYPES[type])return {ok:false,message:"Ungültiger Raum"};
    f.tiles[key(x,y)]=type;return {ok:true};
  }
  function putItem(s,bid,level,x,y,type){
    const b=s.buildings.find(x=>x.id===bid),f=b&&b.floors[level],t=ITEM_TYPES[type];
    if(!f||!t||x<0||y<0||x>=f.cols||y>=f.rows)return {ok:false,message:"Objekt passt hier nicht"};
    if(s.cash<t.cost)return {ok:false,message:"Nicht genug Kapital"};
    if(f.items.some(i=>i.x===x&&i.y===y))return {ok:false,message:"Standort bereits belegt"};
    s.cash-=t.cost;
    if(t.device)device(s,b,type,x,y,level);else f.items.push({id:id(s,"ITM"),x,y,type});
    return {ok:true};
  }
  function parkingCount(s){return s.parking.length*2;}
  function capacity(b){
    if(!b)return 0;
    let total=0;for(const f of b.floors){
      const counts={};for(const type of Object.values(f.tiles))counts[type]=(counts[type]||0)+1;
      if(b.type==="office"||b.type==="service")total+=(counts.office||0)/10+(counts.meeting||0)/38;
      else if(b.type==="warehouse")total+=(counts.hall||0)/11;
      else if(b.type==="workshop")total+=(counts.workshop||0)/8;
      else if(b.type==="cafe")total+=(counts.kitchen||0)/10+(counts.break||0)/17;
    }
    return Math.max(0,Math.floor(total));
  }
  function metrics(s){
    const jobs=s.companies.reduce((n,c)=>n+c.employees,0);
    const demand=Math.ceil(jobs*(s.bus?.38:.62));
    const rent=s.companies.reduce((n,c)=>n+c.rent,0);
    const upkeep=s.buildings.reduce((n,b)=>n+TYPES[b.type].monthly,0);
    const staff=s.staff.technicians*3500+s.staff.cleaners*2600+s.staff.security*3150+(s.constructionDept.active?s.constructionDept.workers*3350+2800:0);
    const power=s.buildings.reduce((n,b)=>n+(b.type==="warehouse"?75:b.type==="office"?35:19),0);
    return {jobs,demand,parking:parkingCount(s),rent,upkeep,staff,power,ownedArea:propertyArea(s),constructionProjects:s.projects.filter(p=>p.status==="bau").length,occupancy:s.buildings.filter(b=>b.type!=="service").length?Math.round(100*s.buildings.filter(b=>b.tenantId&&b.type!=="service").length/s.buildings.filter(b=>b.type!=="service").length):0,companies:s.companies.length};
  }
  function dispatch(s,ticketId){
    const t=s.tickets.find(x=>x.id===ticketId);if(!t||t.status!=="offen")return {ok:false,message:"Auftrag nicht offen"};
    const group=t.category==="reinigung"?"cleaners":"technicians";
    const busy=s.tickets.filter(x=>x.status==="bearbeitung"&&(x.category==="reinigung"?"cleaners":"technicians")===group).length;
    if(busy>=s.staff[group])return {ok:false,message:group==="cleaners"?"Keine freien Reinigungskräfte":"Keine freien Haustechniker"};
    if(s.cash<t.cost)return {ok:false,message:"Nicht ausreichend Liquidität"};
    s.cash-=t.cost;t.status="bearbeitung";t.remaining=1+Math.ceil(t.cost/2400);
    addMessage(s,"Arbeitsauftrag disponiert",t.id+" wurde einem Techniker zugewiesen.");
    return {ok:true};
  }
  function ticketFor(s,d){
    if(s.tickets.some(t=>t.deviceId===d.id&&t.status!=="erledigt"))return;
    const names={hvac:"Klimaanlage meldet Leistungsabfall",light:"Leuchte ausgefallen",printer:"Drucker benötigt Wartung",dispenser:"Materialspender leer",alarm:"Störung Brandmeldetechnik",camera:"Kamera ohne Verbindung",machine:"Produktionsmaschine gestört",reader:"Kartenleser ausgefallen",sink:"Wasserarmatur defekt",toilet:"Sanitäranlage gestört",sprinkler:"Sprinkleranlage prüfen"};
    d.state="defekt";
    const cleaning=d.type==="dispenser";
    const t={id:id(s,"FM"),deviceId:d.id,buildingId:d.buildingId,category:cleaning?"reinigung":"technik",status:"offen",created:s.clock.slice(0,10),description:names[d.type]||"Technische Anlage prüfen",cost:cleaning?35:Math.max(120,Math.round(200+rand(s)*1400)),remaining:0};
    s.tickets.unshift(t);const b=s.buildings.find(x=>x.id===d.buildingId);
    addMessage(s,"Neue Störungsmeldung",t.description+" · "+(b?b.name:"Gebäude"),"warning");
  }
  function daily(s){
    for(const p of s.projects.filter(x=>x.status==="bau")){
      p.remaining--;
      const b=p.buildingId&&s.buildings.find(x=>x.id===p.buildingId);
      if(b)b.construction=Math.max(0,p.remaining);
      if(p.remaining<=0){
        p.status="fertig";p.completed=s.clock.slice(0,10);
        if(!b){
          const target=p.tool==="road"?"roads":p.tool==="parking"?"parking":"trees";
          for(const q of p.points){
            const k=key(q.x,q.y);
            if(!s[target].includes(k))s[target].push(k);
            if(target!=="trees")s.trees=s.trees.filter(v=>v!==k);
          }
        }
        addMessage(s,"Bauabnahme abgeschlossen",p.contractorName+" hat "+(b?b.name:p.points.length+" Außenanlagen-Felder")+" fertiggestellt.");
      }
    }
    for(const b of s.buildings){
      if(b.construction>0&&!s.projects.some(p=>p.buildingId===b.id&&p.status==="bau")){
        b.construction--;
        if(b.construction===0)addMessage(s,"Bau abgeschlossen",b.name+" ist bezugsfertig.");
      }
      b.condition=Math.max(15,b.condition-.009);
    }
    for(const d of s.devices){
      if(d.state!=="ok")continue;
      d.uses++;const wear={dispenser:1.45,printer:.45,light:.11,hvac:.13,toilet:.18,sink:.14,camera:.12,alarm:.06,sprinkler:.05,reader:.12,machine:.18};d.condition-=(wear[d.type]||.12)*(.7+rand(s)*.6);
      if(d.condition<18||rand(s)<.0009)ticketFor(s,d);
    }
    for(const t of s.tickets.filter(t=>t.status==="bearbeitung")){
      t.remaining--;if(t.remaining<=0){t.status="erledigt";t.completed=s.clock.slice(0,10);const d=s.devices.find(x=>x.id===t.deviceId);if(d){d.condition=80+Math.round(rand(s)*18);d.state="ok";}addMessage(s,"Reparatur abgeschlossen",t.description+" – "+t.id+" wieder betriebsbereit.");}
    }
    if(s.autodispatch)for(const t of s.tickets.filter(t=>t.status==="offen"))dispatch(s,t.id);
    const day=new Date(s.clock).getUTCDate();if(day===1)monthly(s);
    if(rand(s)<.007){
      const m=metrics(s);
      if(m.demand>m.parking)addMessage(s,"Parkdruck am Standort","Rechnerischer Bedarf: "+m.demand+" Pkw, Kapazität: "+m.parking+" Stellplätze. Weitere Parkplätze oder ÖPNV können helfen.","warning");
    }
  }
  function monthly(s){
    const m=metrics(s);let tenantRent=0,positive=0;
    for(const c of s.companies){
      const sales=c.turnover*(.77+rand(s)*.48);
      const payroll=c.employees*(2200+(c.kind==="office"?1400:600));
      const op= c.turnover*.26;
      const profit=Math.round(sales-payroll-op-c.rent);
      c.cash+=profit;c.history.push({date:s.clock.slice(0,7),profit,employees:c.employees});c.history=c.history.slice(-24);
      const property=s.buildings.find(b=>b.id===c.buildingId);
      const maxStaff=capacity(property);
      c.health=Math.max(10,Math.min(98,c.health+(profit>0?1:-3)+(m.demand>m.parking?-1:0)+(c.employees>maxStaff?-3:0)));
      if(profit>c.turnover*.12&&rand(s)<.20){
        if(c.employees>=maxStaff){addMessage(s,"Erweiterungsbedarf",c.name+" kann wegen seiner Flächenaufteilung nicht weiter einstellen. Kapazität: "+maxStaff+" Arbeitsplätze.","warning");}
        else {c.employees=Math.min(maxStaff,c.employees+1+Math.floor(rand(s)*3));addMessage(s,"Unternehmen wächst",c.name+" hat neue Mitarbeiter eingestellt.");}
      }
      if(profit<0&&rand(s)<.16){c.employees=Math.max(2,c.employees-2);addMessage(s,"Personalabbau",c.name+" reduziert seine Belegschaft.");}
      if(c.cash<0&&c.health<24){const b=s.buildings.find(x=>x.id===c.buildingId);if(b)b.tenantId=null;c.status="ausgezogen";addMessage(s,"Mietausfall",c.name+" kann den Mietvertrag nicht fortführen.","warning");}
      else{tenantRent+=c.rent;positive++;}
    }
    s.companies=s.companies.filter(c=>c.status==="aktiv");
    const land=s.parcels.filter(p=>p.owned).length*350;
    const expenses=m.upkeep+m.staff+Math.round(s.debt*.004)+land+900;
    s.cash+=tenantRent-expenses;s.monthlyNet=tenantRent-expenses;s.companyIncome=tenantRent;s.expenses=expenses;
    s.history.push({date:s.clock.slice(0,7),income:tenantRent,expenses,cash:s.cash});s.history=s.history.slice(-60);
    addMessage(s,"Monatsabschluss",positive+" Mietverhältnisse · Mieten "+tenantRent.toLocaleString("de-DE")+" € · Betriebskosten "+expenses.toLocaleString("de-DE")+" €.");
  }
  function advance(s,minutes){
    const before=s.clock;const a=new Date(before),b=new Date(a.getTime()+minutes*60000);
    const n=Math.min(95,Math.floor((b-a)/86400000)+2);
    for(let j=0;j<n;j++){
      const nextMidnight=Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate()+1);
      if(nextMidnight>b.getTime())break;
      a.setTime(nextMidnight);s.clock=a.toISOString();daily(s);
    }
    s.clock=b.toISOString();return s;
  }
  function buyBus(s){if(s.bus)return {ok:false,message:"Busvertrag bereits aktiv"};if(s.cash<45000)return {ok:false,message:"45.000 € Anschubfinanzierung erforderlich"};s.cash-=45000;s.bus=true;addMessage(s,"ÖPNV-Anschluss verbessert","Eine neue Shuttleverbindung reduziert den modellierten Pkw-Anteil.");return {ok:true};}
  function setStaff(s,kind,delta){if(!(kind in s.staff))return {ok:false,message:"Unbekannter Personalbereich"};const target=s.staff[kind]+delta;if(target<0||target>25)return {ok:false,message:"Personalgrenze erreicht"};s.staff[kind]=target;return {ok:true};}
  function validateLoaded(v){if(!v||v.version!==VERSION||!Array.isArray(v.buildings)||!v.world||!Array.isArray(v.roads))throw Error("Spielstandformat wird nicht unterstützt");return v;}
  return {VERSION,TYPES,FLOOR_TYPES,WALL_FINISHES,ITEM_TYPES,PARCELS,CONTRACTORS,create,isOwned,buyParcel,propertyArea,startConstructionDept,setBuilders,getQuotes,commission,cancelProject,preview,place,placePath,demolish,rent,canRent,addFloor,setWall,toggleDoor,finishWall,paint,putItem,capacity,metrics,advance,dispatch,buyBus,setStaff,validateLoaded,wallKey,key};
});
