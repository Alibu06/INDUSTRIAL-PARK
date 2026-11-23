(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IPSim = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const VERSION = 1;
  const TYPES = {
    office:{name:"Bürogebäude",w:5,h:4,cost:320000,days:10,levels:2,color:"#9db2c4",monthly:1500,unit:"Büro"},
    warehouse:{name:"Logistikhalle",w:6,h:5,cost:390000,days:13,levels:1,color:"#9ba7a7",monthly:2400,unit:"Lager"},
    workshop:{name:"Handwerkerhof",w:4,h:3,cost:175000,days:8,levels:1,color:"#c7a78f",monthly:950,unit:"Werkstatt"},
    cafe:{name:"Café / Kantine",w:3,h:3,cost:145000,days:8,levels:1,color:"#b7b99c",monthly:900,unit:"Gastronomie"},
    service:{name:"Betriebszentrale",w:4,h:3,cost:195000,days:9,levels:2,color:"#829ba7",monthly:1150,unit:"Verwaltung"}
  };
  const FLOOR_TYPES = {office:"Büro",meeting:"Besprechung",hall:"Lager",workshop:"Werkstatt",kitchen:"Küche",bath:"Sanitär",lobby:"Empfang",corridor:"Flur",server:"Serverraum",break:"Pausenraum"};
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
    const f={id:"F"+idx,label:idx===0?"EG":idx+". OG",cols:b.w*4,rows:b.h*4,tiles:{},walls:{},doors:{},items:[]};
    for(let y=0;y<f.rows;y++)for(let x=0;x<f.cols;x++)f.tiles[key(x,y)]=kind;
    return f;
  }
  function makeBuilding(s,type,x,y,ready){
    const t=TYPES[type]; const b={id:id(s,"B"),name:t.name+" "+String.fromCharCode(65+s.buildings.length),type,x,y,w:t.w,h:t.h,condition:88,construction:ready?0:t.days,levels:t.levels,floors:[],tenantId:null};
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
  function create(){
    const s={version:VERSION,serial:0,seed:931177,clock:"2027-05-03T07:30:00.000Z",cash:1240000,debt:480000,monthlyNet:0,companyIncome:0,expenses:0,mode:"career",world:{w:48,h:40},roads:[],parking:[],trees:[],utilities:[],buildings:[],companies:[],applicants:clone(APPLICANTS),devices:[],tickets:[],messages:[],history:[],stats:{visitors:0,carDemand:0,powerDemand:0},bus:false,staff:{technicians:2,cleaners:3,security:1},autodispatch:false};
    const rs=new Set();for(let x=2;x<=44;x++){rs.add(key(x,8));rs.add(key(x,9));}
    for(let y=8;y<=36;y++){rs.add(key(8,y));rs.add(key(9,y));rs.add(key(38,y));rs.add(key(39,y));}
    for(let x=8;x<=39;x++){rs.add(key(x,29));rs.add(key(x,30));}
    for(let x=9;x<=39;x++){rs.add(key(x,19));rs.add(key(x,20));}
    s.roads=Array.from(rs);
    for(let x=12;x<20;x++)for(let y=18;y<=18;y++)s.parking.push(key(x,y));
    for(let x=24;x<33;x++)s.parking.push(key(x,18));
    for(let x=11;x<21;x++)s.parking.push(key(x,28));
    for(let i=0;i<185;i++){const x=1+Math.floor(rand(s)*46),y=1+Math.floor(rand(s)*38);if(!rs.has(key(x,y))&&rand(s)>.2)s.trees.push(key(x,y));}
    const b1=makeBuilding(s,"office",15,11,true);b1.name="Bürohaus Nord";
    const b2=makeBuilding(s,"warehouse",28,22,true);b2.name="Logistikzentrum West";
    const b3=makeBuilding(s,"cafe",12,22,true);b3.name="Parkcafé";
    const b4=makeBuilding(s,"service",24,12,true);b4.name="AM Betriebszentrale";
    makeCompany(s,{name:"Novatec Software GmbH",industry:"IT & Software",kind:"office",employees:35,turnover:220000,health:83},b1,6200);
    makeCompany(s,{name:"WestCargo Logistik GmbH",industry:"Logistik",kind:"warehouse",employees:42,turnover:390000,health:78},b2,8900);
    makeCompany(s,{name:"Kantinenbetrieb Berg & Sohn",industry:"Gastronomie",kind:"cafe",employees:11,turnover:69000,health:71},b3,2900);
    device(s,b1,"hvac",9,2);const printer=device(s,b1,"printer",4,5);device(s,b1,"light",11,8);
    device(s,b1,"alarm",15,2);device(s,b2,"camera",3,3);device(s,b2,"machine",11,12);
    const dispenser=device(s,b3,"dispenser",4,5);device(s,b4,"reader",2,2);
    printer.condition=11;ticketFor(s,printer);dispenser.condition=9;ticketFor(s,dispenser);
    s.utilities=[{id:id(s,"UT"),x:6,y:7,type:"power",capacity:480},{id:id(s,"UT"),x:40,y:22,type:"fibre",capacity:1000},{id:id(s,"UT"),x:40,y:32,type:"water",capacity:1000}];
    s.trees=s.trees.filter(p=>{const [x,y]=p.split(",").map(Number);return !s.buildings.some(b=>x>=b.x-1&&y>=b.y-1&&x<b.x+b.w+1&&y<b.y+b.h+1)&&!s.parking.includes(p);});
    addMessage(s,"Willkommen im Gewerbepark","Vier Bestandsgebäude sind vorhanden. Vermiete die freie Betriebszentrale oder entwickle ein weiteres Grundstück.");
    addMessage(s,"Die ersten Mietinteressenten sind da","Öffne »Vermietung«, um Unternehmen anzusiedeln.");
    return s;
  }
  function overlap(s,x,y,w,h){
    if(x<1||y<1||x+w>=s.world.w||y+h>=s.world.h)return "Außerhalb der Grundstücksgrenze";
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(s.roads.includes(key(xx,yy)))return "Straße liegt im Baufeld";
    if(s.buildings.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y))return "Gebäude steht im Baufeld";
    return "";
  }
  function place(s,tool,x,y){
    x=Math.floor(x);y=Math.floor(y);
    if(TYPES[tool]){
      const t=TYPES[tool],err=overlap(s,x,y,t.w,t.h);
      if(err)return {ok:false,message:err};
      if(s.cash<t.cost)return {ok:false,message:"Nicht ausreichend Liquidität"};
      s.cash-=t.cost;
      const b=makeBuilding(s,tool,x,y,false);
      s.parking=s.parking.filter(p=>{const [px,py]=p.split(",").map(Number);return !(px>=x&&px<x+t.w&&py>=y&&py<y+t.h);});
      s.trees=s.trees.filter(p=>{const [px,py]=p.split(",").map(Number);return !(px>=x-1&&px<x+t.w+1&&py>=y-1&&py<y+t.h+1);});
      addMessage(s,"Bauauftrag vergeben",b.name+" wird in "+t.days+" Tagen fertiggestellt. Investition: "+t.cost.toLocaleString("de-DE")+" €.");
      return {ok:true,building:b};
    }
    const p=key(x,y);
    if(x<0||y<0||x>=s.world.w||y>=s.world.h)return {ok:false,message:"Außerhalb des Kartenbereichs"};
    if(s.buildings.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))return {ok:false,message:"Hier steht ein Gebäude"};
    const costs={road:9000,parking:4400,tree:750};
    if(!(tool in costs))return {ok:false,message:"Unbekanntes Bauwerkzeug"};
    if(s.cash<costs[tool])return {ok:false,message:"Nicht ausreichend Liquidität"};
    if(tool==="road"){if(s.roads.includes(p))return {ok:false,message:"Straße bereits vorhanden"};s.roads.push(p);s.parking=s.parking.filter(a=>a!==p);}
    if(tool==="parking"){if(s.parking.includes(p)||s.roads.includes(p))return {ok:false,message:"Stellfläche nicht verfügbar"};s.parking.push(p);}
    if(tool==="tree"){if(s.roads.includes(p)||s.trees.includes(p))return {ok:false,message:"Fläche ist belegt"};s.trees.push(p);}
    s.cash-=costs[tool];return {ok:true};
  }
  function demolish(s,x,y){
    const b=s.buildings.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
    if(b){if(b.tenantId)return {ok:false,message:"Vermietetes Gebäude kann nicht abgerissen werden"};s.cash-=12000;s.buildings=s.buildings.filter(a=>a!==b);s.devices=s.devices.filter(d=>d.buildingId!==b.id);addMessage(s,"Rückbau abgeschlossen",b.name+" wurde zurückgebaut.");return {ok:true};}
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
    if(x1===x2){const x=x1;for(let y=Math.min(y1,y2);y<Math.max(y1,y2);y++){if(x<0||x>f.cols||y<0||y>=f.rows)continue;const k=wallKey(x,y,"V");if(remove){delete f.walls[k];delete f.doors[k];}else{f.walls[k]=1;}count++;}}
    else{const y=y1;for(let x=Math.min(x1,x2);x<Math.max(x1,x2);x++){if(y<0||y>f.rows||x<0||x>=f.cols)continue;const k=wallKey(x,y,"H");if(remove){delete f.walls[k];delete f.doors[k];}else{f.walls[k]=1;}count++;}}
    return {ok:count>0,message:count?"":"Keine Segmente ausgewählt"};
  }
  function toggleDoor(s,bid,level,edge){
    const b=s.buildings.find(x=>x.id===bid),f=b&&b.floors[level];if(!f||!f.walls[edge])return {ok:false,message:"Setze zunächst eine Wand"};
    if(f.doors[edge])delete f.doors[edge];else f.doors[edge]=1;return {ok:true};
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
    const staff=s.staff.technicians*3500+s.staff.cleaners*2600+s.staff.security*3150;
    const power=s.buildings.reduce((n,b)=>n+(b.type==="warehouse"?75:b.type==="office"?35:19),0);
    return {jobs,demand,parking:parkingCount(s),rent,upkeep,staff,power,occupancy:s.buildings.length?Math.round(100*s.buildings.filter(b=>b.tenantId).length/s.buildings.length):0,companies:s.companies.length};
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
    for(const b of s.buildings){
      if(b.construction>0){b.construction--;if(b.construction===0)addMessage(s,"Bau abgeschlossen",b.name+" kann jetzt vermietet oder eingerichtet werden.");}
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
    const expenses=m.upkeep+m.staff+Math.round(s.debt*.004)+1700;
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
  return {VERSION,TYPES,FLOOR_TYPES,ITEM_TYPES,create,place,demolish,rent,canRent,addFloor,setWall,toggleDoor,paint,putItem,capacity,metrics,advance,dispatch,buyBus,setStaff,validateLoaded,wallKey,key};
});
