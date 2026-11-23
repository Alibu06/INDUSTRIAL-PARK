(function(){
"use strict";
const S=window.IPSim, canvas=document.getElementById("gameCanvas"),stage=document.getElementById("stage"),renderer=window.IPRender.create(canvas);
const $=(id)=>document.getElementById(id), euros=(n)=>Math.round(Number(n)||0).toLocaleString("de-DE")+" €";
const esc=(s)=>String(s===undefined?"":s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
let state=S.create(),toastTimeout=0,lastFrame=0,lastAutosave=0,pressed=false,drag=null,spaceDown=false,menuTarget=null;
const undoStack=[],redoStack=[];
function checkpoint(){undoStack.push(JSON.stringify(state));if(undoStack.length>28)undoStack.shift();redoStack.length=0;}
function restoreHistory(direction){const from=direction==="undo"?undoStack:redoStack,to=direction==="undo"?redoStack:undoStack;if(!from.length){notify("Keine Bearbeitungsschritte vorhanden.",true);return;}to.push(JSON.stringify(state));state=S.validateLoaded(JSON.parse(from.pop()));ui.selectedId=building(ui.selectedId)?.id||null;ui.dragBuild=null;ui.wallStart=null;refresh();notify(direction==="undo"?"Bauschritt zurückgenommen.":"Bauschritt wiederhergestellt.");}
const ui={mode:"world",nav:"world",selectedId:null,floorIndex:0,tool:"select",rotation:0,dragBuild:null,pendingPlan:null,floorView:"iso",cam:{cx:15,cy:19,zoom:.98,panX:0,panY:0,floorZoom:1,floorX:0,floorY:0},hover:null,hoverFloor:null,wallStart:null,overlay:"normal",speed:1};
function dateFormat(v,opts){return new Intl.DateTimeFormat("de-DE",Object.assign({timeZone:"UTC"},opts)).format(new Date(v));}
function clock(){return dateFormat(state.clock,{day:"2-digit",month:"2-digit",year:"numeric"})+" · "+dateFormat(state.clock,{hour:"2-digit",minute:"2-digit",hour12:false});}
function notify(message,error){const box=$("toast");box.textContent=message;box.className="toast show"+(error?" error":"");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>box.className="toast",3500);}
function choice(ok,msg){if(!ok)notify(msg||"Diese Aktion ist derzeit nicht möglich.",true);else notify(msg||"Änderung übernommen.");return ok;}
function building(id){return state.buildings.find(b=>b.id===id);}
function company(id){return state.companies.find(c=>c.id===id);}
function statusBadge(b){
 if(b.construction>0)return '<span class="pill warning">Im Bau · '+b.construction+' Tage</span>';
 return b.tenantId?'<span class="pill">Vermietet</span>':'<span class="pill blue">Frei verfügbar</span>';
}
function stat(label,value,cls){return '<div class="stat"><span>'+label+'</span><strong class="'+(cls||"")+'">'+value+'</strong></div>';}
function entry(title,sub,inner){return '<article class="entry"><div class="entrytitle">'+title+'</div><div class="entrysub">'+sub+'</div>'+(inner||"")+'</article>';}
function line(label,value){return '<div class="entryline"><span>'+label+'</span><strong>'+value+'</strong></div>';}
function button(action,label,extra,classes){return '<button class="action '+(classes||"")+'" data-action="'+action+'" '+(extra||"")+'>'+label+'</button>';}
function options(v,selected){return v.map(o=>'<option value="'+esc(o.id)+'"'+(selected===o.id?" selected":"")+'>'+esc(o.label)+'</option>').join("");}
function panelOpen(section){
 const panel=$("panel");panel.classList.remove("hidden");ui.nav=section;
 document.querySelectorAll(".navbtn").forEach(btn=>btn.classList.toggle("active",btn.dataset.nav===section||(section==="property"&&btn.dataset.nav==="buildings")));
 updatePanel();resizeSoon();
}
function closePanel(){$("panel").classList.add("hidden");ui.nav="world";document.querySelectorAll(".navbtn").forEach(btn=>btn.classList.toggle("active",btn.dataset.nav==="world"));resizeSoon();}
function setViewFloor(id){const b=building(id);if(!b){notify("Gebäude fehlt.",true);return;}ui.mode="floor";ui.selectedId=id;ui.floorIndex=0;ui.floorView="iso";ui.tool="wall";ui.wallStart=null;ui.dragBuild=null;ui.cam.floorZoom=1;ui.cam.floorX=0;ui.cam.floorY=0;closePanel();refresh();}
function setViewWorld(){ui.mode="world";ui.tool="select";ui.wallStart=null;ui.hoverFloor=null;ui.dragBuild=null;refresh();}
function selectBuilding(b){ui.selectedId=b?b.id:null;refresh();}
function redrawHUD(){
 const m=S.metrics(state),d=$("date"),t=$("time");
 d.textContent=dateFormat(state.clock,{day:"2-digit",month:"2-digit",year:"numeric"});
 t.textContent=dateFormat(state.clock,{hour:"2-digit",minute:"2-digit",hour12:false});
 $("cash").textContent=euros(state.cash);$("rent-total").textContent=euros(m.rent);$("occupancy").textContent=m.occupancy+" %";
 $("alertDot").classList.toggle("on",state.tickets.some(t=>t.status==="offen"));
 document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("active",Number(b.dataset.speed)===ui.speed));
 $("viewTitle").textContent=ui.mode==="floor"?"GEBÄUDEEDITOR · "+(building(ui.selectedId)?.name||"ETAGE"):"GEWERBEPARK · KARTE";
 $("viewHint").textContent=ui.mode==="floor"?(building(ui.selectedId)?.floors[ui.floorIndex]?.label||"Innenraum")+" · "+(ui.floorView==="iso"?"2,5D":"Bauplan"):"Isometrische Übersicht";
 $("layerName").textContent=ui.mode==="floor"?(ui.floorView==="iso"?"2D-Bauplan":"2,5D-Innenansicht"):({normal:"Normalansicht",traffic:"Verkehr & Parken",vacancy:"Immobilien",utilities:"Versorgung"})[ui.overlay];
 $("layersBtn").disabled=false;
 $("mapHint").textContent=ui.mode==="floor"?"2,5D / Bauplan umschaltbar · Wände: zwei Klicks · Farben: Wandfläche anklicken · Strg+Z rückgängig · Esc: Außenansicht":"Bauen: klicken oder ziehen · R Gebäude drehen · Strg+Z rückgängig · Leertaste + Ziehen: Karte verschieben";
}
const worldTools=[
 ["select","↖","Auswählen"],["office","▥","Büro"],["warehouse","▰","Halle"],["workshop","▤","Werkstatt"],["cafe","☕","Gastro"],
 ["service","▣","Zentrale"],["road","═","Straße"],["parking","▧","Parkplatz"],["tree","♣","Grün"],["demolish","⌫","Rückbau"]
];
const floorTools=[
 ["wall","┃","Wand"],["door","◫","Tür"],["erase","⌫","Entfernen"],["room:office","▦","Büro"],["room:meeting","▢","Besprech."],
 ["room:hall","▤","Lager"],["room:workshop","▥","Werkstatt"],["room:kitchen","♨","Küche"],
 ["room:bath","♧","Sanitär"],["room:corridor","═","Flur"],["room:server","⌗","Server"],
 ["item:desk","▣","Tisch"],["item:chair","◉","Stuhl"],["item:table","▭","Konferenz"],
 ["item:printer","▧","Drucker"],["item:hvac","❄","Klima"],["item:light","✳","Leuchte"],
 ["item:toilet","◉","WC"],["item:dispenser","▢","Spender"],["item:camera","◈","Kamera"],
 ["item:alarm","●","Melder"],["item:sprinkler","❋","Sprinkler"],["item:reader","⊡","Leser"],
 ["item:shelf","▥","Regal"],["item:machine","⚙","Maschine"],["item:plant","♣","Pflanze"],
 ["finish:white","⬜","Weiß"],["finish:beige","▤","Beige"],["finish:navy","▣","Navy"],
 ["finish:sage","◩","Salbei"],["finish:concrete","▥","Beton"],["finish:brick","▧","Klinker"],["finish:glass","◇","Glas"]
];
function updateToolbar(){
 const list=ui.mode==="floor"?floorTools:worldTools;
 let markup='<button class="toolbtn" data-action="'+(ui.mode==="floor"?"world-view":"open-buildings")+'" title="'+(ui.mode==="floor"?"Zurück zum Park":"Objektverwaltung")+'"><span class="toolicon">'+(ui.mode==="floor"?"←":"▤")+'</span><small>'+(ui.mode==="floor"?"Außen":"Objekte")+'</small></button><div class="tooldiv"></div>';
 const finishIndex=list.findIndex(v=>v[0].startsWith("finish:"));
 const groups=ui.mode==="floor"?[["STRUKTUR",0,3],["RÄUME",3,11],["AUSSTATTUNG",11,finishIndex],["WÄNDE GESTALTEN",finishIndex,list.length]]:[["WERKZEUG",0,1],["GEBÄUDE",1,6],["AUSSEN",6,list.length]];
 for(const group of groups){
   markup+='<span class="tool-category">'+group[0]+'</span>';
   markup+=list.slice(group[1],group[2]).map(v=>'<button title="'+esc(v[2])+'" class="toolbtn'+(ui.tool===v[0]?" active":"")+'" data-tool="'+v[0]+'"><span class="toolicon">'+v[1]+'</span><small>'+v[2]+'</small></button>').join("");
 }
 if(ui.mode==="world")markup+='<div class="tooldiv"></div><button class="toolbtn" data-action="rotate-build" title="Gebäude drehen (R)"><span class="toolicon">⟳</span><small>Drehen</small></button>';
 else markup+='<div class="tooldiv"></div><button class="toolbtn" data-action="floor-view-toggle" title="Innenansicht zwischen 2,5D und Bauplan umschalten"><span class="toolicon">'+(ui.floorView==="iso"?"▧":"◈")+'</span><small>'+(ui.floorView==="iso"?"Bauplan":"2,5D")+'</small></button>';
 markup+='<div class="tooldiv"></div><button class="toolbtn" data-action="undo" title="Rückgängig (Strg+Z)" '+(!undoStack.length?"disabled":"")+'><span class="toolicon">↶</span><small>Zurück</small></button><button class="toolbtn" data-action="redo" title="Wiederherstellen (Strg+Y)" '+(!redoStack.length?"disabled":"")+'><span class="toolicon">↷</span><small>Vorwärts</small></button>';
 $("toolbar").innerHTML=markup;
}
function updateToolStats(){
 const target=$("toolStats");if(!target)return;
 if(ui.mode==="floor"){
   const b=building(ui.selectedId),f=b&&b.floors[ui.floorIndex];
   target.textContent=f?f.label+" · "+(ui.floorView==="iso"?"2,5D · ":"Bauplan · ")+f.cols+" × "+f.rows+" m · "+Object.keys(f.walls).length+" Wandsegmente · "+f.items.length+" Objekte":"";
   return;
 }
 const m=S.metrics(state),dragCells=ui.dragBuild;
 if(dragCells&&dragCells.length){
   const cost=dragCells.filter(p=>S.preview(state,ui.tool,p.x,p.y).ok).length*({road:9000,parking:4400,tree:750}[ui.tool]||0);
   target.textContent="Bauplanung · "+dragCells.length+" Felder · Basis "+euros(cost)+" · Danach Unternehmer auswählen";
 }else target.textContent=state.buildings.length+" Immobilien · "+m.ownedArea.toLocaleString("de-DE")+" m² Eigentum · "+m.constructionProjects+" Baustellen · "+(ui.rotation?"Ausrichtung 90°":"Raster: 4 Meter");
}
function updateMapInfo(){
 let contents="";
 if(ui.mode==="world"){
  if(ui.selectedId&&building(ui.selectedId)){
   const b=building(ui.selectedId),c=company(b.tenantId);
   contents='<div class="info-card"><span class="kicker">OBJEKT AUSGEWÄHLT · '+esc(b.id)+'</span><b>'+esc(b.name)+'</b><p>'+esc(c?c.name:"Noch kein Mieter")+' · '+(b.w*4*b.h*4*b.levels)+' m² · '+esc(b.floors.length)+" Etage(n)"+'</p><button data-action="floor-view">Innenausbau →</button> <button data-action="property-details">Objektdaten</button></div>';
  }else if(ui.tool!=="select"){
   const tool=worldTools.find(t=>t[0]===ui.tool);
   let cost=S.TYPES[ui.tool]?S.TYPES[ui.tool].cost:({road:9000,parking:4400,tree:750})[ui.tool];
   const p=ui.hover&&ui.tool!=="demolish"&&S.preview(state,ui.tool,ui.hover.x,ui.hover.y,ui.rotation);
   contents='<div class="info-card"><span class="kicker">BAUPLANUNG · BEAUFTRAGUNG</span><b>'+esc(tool?tool[2]:"Bauen")+'</b><p>'+(S.TYPES[ui.tool]?"Grundfläche: "+(p?p.w:S.TYPES[ui.tool].w)*4+" × "+(p?p.h:S.TYPES[ui.tool].h)*4+" m · R zum Drehen":"Klicken oder Fläche mit der Maus aufziehen")+(cost?" · Basispreis ab "+euros(Math.round(cost*.94)):"")+" · Nach Auswahl Angebote vergleichen"+'</p>'+(p?'<div class="placement-info '+(p.ok?"":"invalid")+'">'+(p.ok?"✓ ":"⚠ ")+esc(p.message)+(p.ok&&!p.roadAccess&&S.TYPES[ui.tool]?" · Zufahrt prüfen":"")+'</div>':"")+'</div>';
  }else contents='<div class="info-card"><span class="kicker">DEIN STARTGRUNDSTÜCK</span><b>'+(state.buildings.length?"AM Gewerbepark":"Alles beginnt hier")+"</b><p>"+(state.buildings.length?"Wähle ein Gebäude oder plane die nächste Erweiterung.":"Noch keine Gebäude, Mieter oder internen Straßen. Wähle eine Straße oder einen Gebäudetyp, zeichne den Bauplan und vergleiche anschließend Angebote externer Bauunternehmen.")+'</p><button data-action="open-land">Grundstücke ansehen</button> <button data-action="open-projects">Bauaufträge</button></div>';
 }else{
  const b=building(ui.selectedId),f=b&&b.floors[ui.floorIndex];
  contents='<div class="info-card"><span class="kicker">FREIER INNENAUSBAU</span><b>'+esc(f?.label||"Erdgeschoss")+'</b><p>'+(f?f.cols+" × "+f.rows+" Felder":"")+" · "+(ui.wallStart?"Jetzt Endpunkt setzen.":"Raum, Wand, Tür oder Ausstattung wählen.")+'</p></div>';
 }
 $("mapInfo").innerHTML=contents;
}
function propertyPanel(){
 const b=building(ui.selectedId);if(!b)return '<p class="panel-note">Wähle zunächst ein Gebäude auf der Karte oder in der Objektliste.</p>';
 const c=company(b.tenantId),m=S.metrics(state);
 const f=b.floors[ui.floorIndex]||b.floors[0];
 return '<div class="section-label">OBJEKTDATEN</div><div class="statgrid">'
 +stat("Gebäudefläche",b.w*b.h*16*b.levels+" m²")
 +stat("Gebäudezustand",Math.round(b.condition)+" %")
 +stat("Mietzahlung",euros(c?c.rent:0))
 +stat("Arbeitsplatzkapazität",S.capacity(b)+" Plätze")
 +'</div>'+entry(esc(b.name),esc(S.TYPES[b.type].name)+' · '+b.id, statusBadge(b)
 +line("Mieter",c?esc(c.name):"Nicht vermietet")
 +line("Baujahr",dateFormat(state.clock,{year:"numeric"}))
 +line("Räumliche Lage","Parzelle "+b.x+" / "+b.y)
 +line("Etagen",b.floors.length)
 +line("Kapazität auf Grundlage der Raumaufteilung",S.capacity(b)+" Beschäftigte")
 +'<div class="buttons">'+button("floor-view","◫ Innenausbau","",'primary')+button("focus-building","Auf Karte")+button("add-floor","Etage hinzufügen")+'</div>')
 +'<div class="section-label">ETAGEN</div>'
 +b.floors.map((fl,ix)=>entry(esc(fl.label),fl.cols*fl.rows+" m² Planfläche · "+fl.items.length+" Objekte · "+Object.keys(fl.walls).length+" Wandsegmente",button("select-floor","Bearbeiten",'data-level="'+ix+'"',ix===ui.floorIndex&&ui.mode==="floor"?"primary":""))).join("")
 +'<div class="section-label">TECHNISCHE ANLAGEN</div>'
 +(state.devices.filter(d=>d.buildingId===b.id).map(d=>entry(esc(S.ITEM_TYPES[d.type]?.name||d.type),"Etage "+(d.floor+1)+" · Feld "+d.x+"/"+d.y,line("Zustand",Math.round(d.condition)+" % · "+(d.state==="ok"?"Betriebsbereit":"Störung")))).join("")||'<p class="panel-note">Noch keine Einzelanlagen erfasst. Platziere Technik im Gebäudeeditor.</p>')
 +(!c?'<div class="divider"></div>'+button("go-leasing","Mietinteressenten anzeigen","","primary full"):"");
}
function buildingsPanel(){
 const m=S.metrics(state);
 return '<div class="statgrid">'+stat("Gebäude",state.buildings.length)+stat("Vermietet",m.occupancy+" %")+'</div><p class="panel-note">Alle Bestandsgebäude und Bauprojekte auf deinem Grundstück. Öffne die Innenräume, um Etagen individuell zu gestalten.</p><div class="section-label">IMMOBILIENBESTAND</div>'
 +(state.buildings.length?state.buildings.map(b=>{const c=company(b.tenantId);return entry(esc(b.name),esc(S.TYPES[b.type].name)+" · "+b.w*b.h*16*b.levels+" m²",statusBadge(b)+line("Mieter",c?esc(c.name):"Leerstand")+line("Miete",euros(c?c.rent:0))+'<div class="buttons">'+button("inspect-building","Öffnen",'data-id="'+b.id+'"',"primary")+button("map-building","Auf Karte",'data-id="'+b.id+'"')+'</div>');}).join(""):'<div class="empty-state"><h3>Noch keine Immobilien</h3><p>Dein Startgrundstück ist unbebaut. Wähle auf der Karte einen Gebäudetyp, platziere den Bauplan und beauftrage ein Bauunternehmen.</p>'+button("world-view","Erstes Gebäude planen","","primary")+'</div>');
}
function leasingPanel(){
 const vacant=state.buildings.filter(b=>!b.tenantId&&b.construction===0);
 return '<div class="statgrid">'+stat("Anfragen",state.applicants.length)+stat("Freie Objekte",vacant.length)+'</div><p class="panel-note">Firmen suchen selbstständig passende Flächen. Du entscheidest über Mietangebote, aber die Unternehmen können Konditionen ablehnen.</p><div class="section-label">AKTUELLE MIETINTERESSENTEN</div>'
 +state.applicants.map((a,i)=>{const eligible=vacant.filter(b=>b.type===a.kind);
  return entry(esc(a.name),esc(a.industry)+" · "+a.employees+" Beschäftigte",
  line("Gesuchte Nutzung",esc(S.TYPES[a.kind].unit))+line("Mietbudget",euros(a.maxRent)+" / Monat")
  +line("Gewünschte Fläche",a.desired+" m²")
  +(eligible.length?'<label class="fieldlabel" for="leaseBuilding'+i+'">Passendes freies Objekt</label><div class="formrow"><select id="leaseBuilding'+i+'">'+options(eligible.map(b=>({id:b.id,label:b.name})))+'</select></div><label class="fieldlabel" for="leaseRent'+i+'">Angebot: Kaltmiete monatlich (€)</label><div class="formrow"><input id="leaseRent'+i+'" inputmode="numeric" type="number" min="100" value="'+Math.round(a.maxRent*.9)+'"/></div><div class="buttons">'+button("lease","Angebot unterbreiten",'data-index="'+i+'"',"primary")+'</div>':'<p class="fine">Aktuell keine passende bezugsfertige Gewerbefläche verfügbar. Errichte oder entwickle ein Objekt.</p>'));
 }).join("")
 +'<div class="section-label">LAUFENDE VERTRÄGE</div>'
 +state.companies.map(c=>entry(esc(c.name),esc(c.industry),line("Miete",euros(c.rent))+line("Beschäftigte",c.employees))).join("");
}
function companiesPanel(){
 const m=S.metrics(state);
 return '<div class="statgrid">'+stat("Unternehmen",m.companies)+stat("Arbeitsplätze",m.jobs)+'</div><p class="panel-note">Mieter entscheiden selbst über Personal, Geschäftsentwicklung und Finanzen. Deine Angebote beeinflussen den Standort, nicht ihre Geschäftsführung.</p><div class="section-label">UNTERNEHMEN</div>'
 +state.companies.map(c=>{const b=building(c.buildingId);
   return entry(esc(c.name),esc(c.industry)+" · "+esc(b?.name||"Unbekannt"),
   line("Beschäftigte",c.employees)+line("Monatlicher Umsatz (Basis)",euros(c.turnover))
   +line("Liquidität des Mieters",euros(c.cash))
   +line("Wirtschaftliche Stabilität",c.health+" %")
   +'<div class="progress-track"><div class="progress-fill" style="width:'+c.health+'%;background:'+(c.health<35?"#c9785f":"#64a99d")+'"></div></div>'
   +'<div class="buttons">'+button("map-building","Standort anzeigen",'data-id="'+esc(c.buildingId)+'"')+'</div>');}).join("");
}
function operationsPanel(){
 const active=state.tickets.filter(t=>t.status!=="erledigt");
 const d=state.devices.filter(d=>d.state==="ok").length;
 return '<div class="statgrid">'+stat("Offene Aufträge",active.length,active.length?"negative":"positive")+stat("Anlagen in Betrieb",d+" / "+state.devices.length)+'</div>'
 +entry("Disposition","Arbeitsaufträge können manuell oder automatisch vergeben werden.",'<div class="buttons">'+button("toggle-autodispatch",state.autodispatch?"Automatik deaktivieren":"Automatische Disposition", "",state.autodispatch?"":"primary")+'</div>')
 +'<div class="section-label">PERSONAL IM EIGENBETRIEB</div>'
 +Object.entries({technicians:["Haustechnik",3500],cleaners:["Reinigung",2600],security:["Sicherheitsdienst",3150]}).map(([k,v])=>'<article class="entry"><div class="entrytitle">'+v[0]+'</div><div class="entrysub">'+euros(v[1])+' / Person / Monat</div><div class="inline-controls"><span>Beschäftigte</span><div>'+button("staff-down","−",'data-kind="'+k+'"',"small")+' <b>'+state.staff[k]+'</b> '+button("staff-up","+",'data-kind="'+k+'"',"small")+'</div></div></article>').join("")
 +'<div class="section-label">TECHNISCHE TICKETS</div>'
 +(state.tickets.map(t=>{const b=building(t.buildingId),dev=state.devices.find(d=>d.id===t.deviceId);
   return entry(esc(t.description),esc(t.id)+" · "+esc(b?.name||"")+' · '+t.created,
   '<span class="pill '+(t.status==="offen"?"warning":t.status==="erledigt"?"":"blue")+'">'+(t.status==="offen"?"Offen":t.status==="bearbeitung"?"In Bearbeitung":"Abgeschlossen")+'</span>'
   +line("Geschätzte Reparaturkosten",euros(t.cost))+line("Zustand",Math.round(dev?.condition||0)+" %")
   +(t.status==="offen"?button("dispatch","Reparatur beauftragen",'data-id="'+esc(t.id)+'"',"primary full"):t.status==="bearbeitung"?'<p class="fine">Techniker im Einsatz · verbleibend ca. '+t.remaining+' Spieltage</p>':"")
   );}).join("")||'<p class="panel-note">Noch keine technischen Störungen. Die Anlagen verschleißen durch Nutzung und Alter. Du kannst im Gebäudeeditor weitere Geräte einsetzen.</p>')
 +'<div class="section-label">BETRIEBSGRUNDSATZ</div><p class="panel-note">Aufträge sind erst abgeschlossen, wenn ein geeigneter Techniker Zeit und Material hatte. Fertige Aufträge bleiben in der Historie sichtbar.</p>';
}
function transportPanel(){
 const m=S.metrics(state),short=Math.max(0,m.demand-m.parking);
 return '<div class="statgrid">'+stat("Stellplatzkapazität",m.parking)+stat("Pkw-Bedarf / Tag",m.demand,short?"negative":"positive")+'</div>'
 +entry("Parkraummanagement","Mitarbeiter und Besucher benötigen tatsächlich verfügbare Stellplätze.",
 line("Fehlende Plätze",short)+line("Vermuteter Pkw-Anteil",state.bus?"38 %":"62 %")
 +'<div class="progress-track"><div class="progress-fill" style="width:'+Math.min(100,m.demand?100*m.parking/m.demand:100)+'%;background:'+(short?"#d7a15a":"#5eb39a")+'"></div></div><p class="fine">Neue Stellplätze kosten 4.400 € pro Kartenfeld und bieten zwei Pkw-Plätze. Im Baumodus platzieren.</p>')
 +'<div class="section-label">ÖPNV UND MOBILITÄT</div>'
 +entry("Werks-Shuttle zum Bahnhof","Anschubfinanzierung 45.000 €. Die modellierte Pkw-Nachfrage sinkt nach Vertragsabschluss.",
 '<span class="pill '+(state.bus?"":"muted")+'">'+(state.bus?"Verbindung aktiv":"Noch kein Shuttle")+'</span><div class="buttons">'+(state.bus?"":button("buy-bus","Shuttle finanzieren","","primary"))+'</div>')
 +'<div class="section-label">VERKEHRSANALYSE</div>'
 +'<p class="panel-note">Mit der Kartenebene »Verkehr & Parken« kannst du belegbare Flächen erkennen. Weitere Buslinien, Radwege und komplexe Routenmodelle sind für spätere Ausbaustufen vorgesehen.</p>'
 +button("traffic-layer","Verkehrsebene öffnen","","full");
}
function financePanel(){
 const m=S.metrics(state),land=state.parcels.filter(p=>p.owned).length*350,estimate=m.rent-m.upkeep-m.staff-Math.round(state.debt*.004)-land-900;
 return '<div class="statgrid">'+stat("Liquidität",euros(state.cash),state.cash<0?"negative":"")+stat("Darlehen",euros(state.debt))+stat("Kaltmieten / Monat",euros(m.rent))+stat("Erwarteter Saldo",euros(estimate),estimate>=0?"positive":"negative")+'</div>'
 +'<div class="section-label">MONATLICHE KALKULATION</div>'
 +entry("Immobilienbetrieb","Vereinfachte Liquiditätsbetrachtung: Kaltmieten abzgl. laufender Ausgaben.",
 line("Mieteinnahmen",euros(m.rent))+line("Immobilienunterhalt","− "+euros(m.upkeep))
 +line("Personal","− "+euros(m.staff))+line("Flächenkosten und Verwaltung","− "+euros(land+900))+line("Zinsen","− "+euros(Math.round(state.debt*.004)))
 +'<div class="divider"></div>'+line("Erwarteter Monatssaldo",euros(estimate)))
 +'<div class="section-label">FINANZIERUNG</div>'+entry("Investitionsdarlehen","250.000 € Auszahlung · zusätzliche Zinsen von ca. 1.000 €/Monat im vereinfachten Modell.",
 button("loan","250.000 € Kredit aufnehmen","","primary")+' '+button("repay","50.000 € tilgen"))
 +'<div class="section-label">ABGESCHLOSSENE MONATE</div>'
 +(state.history.slice(-8).reverse().map(h=>entry(h.date,"Liquidität "+euros(h.cash),line("Einnahmen",euros(h.income))+line("Ausgaben",euros(h.expenses)))).join("")||'<p class="panel-note">Der erste vollständige Monatsabschluss erfolgt zum nächsten Monatsersten.</p>')
 +'<p class="fine">Hinweis: v1 verwendet eine vereinfachte Cashflow-Simulation, keine vollständige handelsrechtliche Buchführung.</p>';
}
function messagesPanel(){return '<div class="section-label">STANDORTCHRONIK</div>'
 +state.messages.map(m=>'<div class="feed-item"><div class="feed-mark '+(m.level==="warning"?"warning":"")+'"></div><div><strong>'+esc(m.title)+'</strong><p>'+esc(m.body)+'</p><time>'+esc(m.date)+'</time></div></div>').join("");
}
function helpPanel(){
 return '<div class="section-label">SO SPIELST DU INDUSTRIAL PARK</div><p class="panel-note">Du startest auf einem vollständig leeren Grundstück. Erschließe dein Land, kaufe neue Flächen im Ankauf-Menü, wähle externe Bauunternehmen aus und baue später einen eigenen Baubetrieb auf. Alles läuft offline.</p>'
 +'<ol class="help-list"><li><strong>Grundstücke:</strong> Du besitzt zuerst nur ein leeres Grundstück. Weitere Parzellen musst du im Menü Flächen kaufen.</li><li><strong>Bauunternehmen:</strong> Gebäude oder Straßen planen, Angebote vergleichen und Auftrag vergeben. Erst nach der simulierten Bauzeit wird die Fläche nutzbar.</li><li><strong>Eigenbetrieb:</strong> In Bauaufträge kannst du später eigene Mitarbeiter, Fahrzeuge und Maschinen finanzieren.</li><li><strong>Gebäude errichten:</strong> Im unteren Baumodus einen Gebäudetyp wählen und auf eine freie eigene Parzelle klicken.</li><li><strong>Vermieten:</strong> Ein fertiges, leeres Gebäude auswählen. Unter Vermietung einem geeigneten Interessenten ein Angebot machen.</li><li><strong>Innenräume:</strong> Gebäude auswählen und »Innenausbau« öffnen. Wände mit zwei Klicks zeichnen, Türen auf Wandsegmenten setzen, Räume einfärben und Gegenstände platzieren.</li><li><strong>Gebäudebetrieb:</strong> Geräte verschleißen, melden Störungen und erzeugen technische Aufträge. Reparaturen brauchen Personal und Zeit.</li><li><strong>Finanzen:</strong> Am Monatsanfang werden Mieten und Betriebskosten abgerechnet. Neue Gebäude und Personal kosten Geld.</li><li><strong>Mobilität:</strong> Parkplätze schaffen und einen Shuttle finanzieren, um die Pendlernachfrage zu beeinflussen.</li><li><strong>Steuerung:</strong> Mausrad zoomt, Leertaste + Ziehen verschiebt die Karte; Rechtsklick zeigt ein Kontextmenü. Die Zeit lässt sich pausieren oder beschleunigen.</li></ol>'
 +'<div class="section-label">SPIELSTAND</div>'+button("save","Jetzt speichern","","primary")+' '+button("reset","Neues Spiel beginnen","","danger")
 +'<div class="divider"></div><p class="fine">Version 1.1 ist ein spielbarer Grundausbau. Komplexe Feuerwehrtaktik, Live-Kameras, mehrstufige Bauabnahmen und volle Personeneinzelsimulation sind noch nicht implementiert.</p>';
}
function landPanel(){
 const area=S.propertyArea(state),owned=state.parcels.filter(p=>p.owned).length;
 return '<div class="statgrid">'+stat("Eigene Grundstücke",owned)+stat("Eigentumsfläche",area.toLocaleString("de-DE")+" m²")
 +stat("Freie Baufläche",state.buildings.length?"In Entwicklung":"Vollständig frei")
 +stat("Kaufangebote",state.parcels.length-owned)+'</div>'
 +'<p class="panel-note">Du startest mit einem einzigen unbebauten Grundstück. Nur erworbene Parzellen lassen sich bebauen oder erschließen. Die öffentliche Zufahrtsstraße gehört nicht zum Gewerbepark.</p>'
 +'<div class="section-label">GRUNDSTÜCKE UND ERWEITERUNGSFLÄCHEN</div>'
 +state.parcels.map(p=>entry(esc(p.name),p.id+" · "+p.w*p.h*16+" m² Grundstücksfläche",
 '<span class="pill '+(p.owned?"":"warning")+'">'+(p.owned?"Im Eigentum":"Zum Erwerb angeboten")+'</span>'
 +line("Ausdehnung",p.w*4+" × "+p.h*4+" m")
 +line("Standort","Karte "+p.x+" / "+p.y)
 +line("Kaufpreis",p.owned?"Bereits erworben":euros(p.price))
 +'<div class="buttons">'+button("focus-parcel","Auf Karte",'data-id="'+p.id+'"')
 +(p.owned?"":button("buy-parcel","Grundstück kaufen",'data-id="'+p.id+'"',state.cash>=p.price?"primary":""))+'</div>'
 )).join("")
 +'<p class="fine">Die Flächenpreise sind Spielwerte und keine regionalen Immobilienmarktangebote. Ein Ankauf verändert unmittelbar den zulässigen Baugrund.</p>';
}
function projectsPanel(){
 const active=state.projects.filter(p=>p.status==="bau"),completed=state.projects.filter(p=>p.status==="fertig");
 const own=state.constructionDept,m=S.metrics(state);
 return '<div class="statgrid">'+stat("Laufende Projekte",active.length)+stat("Fertige Bauaufträge",completed.length)
 +stat("Eigene Bauarbeiter",own.workers)+stat("Baustellenbudget",euros(state.cash))+'</div>'
 +'<p class="panel-note">Vor jeder Baumaßnahme holst du mehrere echte Angebote ein. Bis zum Aufbau deines eigenen Bauunternehmens übernehmen fremde Betriebe sämtliche Hoch- und Tiefbauarbeiten. Zeit, Preis und Qualität variieren je Auftragnehmer.</p>'
 +'<div class="section-label">AKTUELLE BAUSTELLEN</div>'
 +'<div class="entry"><div class="entrytitle">Bauzeit planen</div><div class="entrysub">Vorspulen, bis laufende Bauarbeiten abgeschlossen sind.</div><div class="buttons">'+button("advance-day","1 Tag vorspulen")+button("advance-week","7 Tage vorspulen")+'</div></div>'
 +(active.map(p=>{
 const b=p.buildingId&&building(p.buildingId),label=b?b.name:p.tool==="road"?"Straßen- und Wegebau":p.tool==="parking"?"Parkplatzbau":"Außenanlagen und Grünpflege";
 const done=Math.round(100*(1-p.remaining/p.totalDays));
 return entry(esc(label),esc(p.id)+" · "+esc(p.contractorName),
 '<span class="pill warning">Im Bau</span>'+line("Auftragssumme",euros(p.quote))
 +line("Restbauzeit",p.remaining+" Tage")+line("Fortschritt",done+" %")
 +'<div class="progress-track"><div class="progress-fill" style="width:'+done+'%"></div></div>'
 +(b?button("map-building","Baustelle ansehen",'data-id="'+b.id+'"'):"")+' '+button("cancel-project","Auftrag stornieren",'data-id="'+p.id+'"',"danger"));
 }).join("")||'<div class="empty-state"><h3>Noch kein Bauauftrag vergeben</h3><p>Wähle auf der Parkkarte zuerst eine Straße, eine Stellfläche oder ein Gebäude. Beim Platzieren öffnet sich die Vergabe mit mehreren Angeboten.</p>'+button("world-view","Bauvorhaben auf der Karte planen","","primary")+'</div>')
 +'<div class="section-label">EIGENE BAUABTEILUNG</div>'
 +entry(own.active?"Eigener Baubetrieb · aktiv":"Eigene Bauabteilung gründen",
 own.active?"Eigene Maschinen und Fachkräfte sind verfügbar.":"Wirtschaftlicher Ausbauschritt mit dauerhaftem Personal- und Geräteaufwand.",
 own.active?'<span class="pill">Eigenbetrieb</span>'
 +line("Bauarbeiter",own.workers)+line("Geräteeinheiten",own.equipment)
 +line("Monatlicher Baustellenpersonalaufwand",euros(own.workers*3350+2800))
 +'<div class="inline-controls"><span>Bauarbeiter einstellen / entlassen</span><div>'+button("builders-down","−","","small")+' <b>'+own.workers+'</b> '+button("builders-up","+","","small")+'</div></div>'
 +'<p class="fine">Eigene Projekte sind günstiger, aber nur bei wenigstens fünf verfügbaren Bauarbeitern und einer freien Baukolonne durchführbar.</p>'
 :line("Investition in Personal und Maschinen",euros(255000))
 +line("Startbesetzung","5 Bauarbeiter · 2 Geräteeinheiten")
 +line("Laufende Kosten","19.550 € / Monat")
 +'<p class="fine">Ein eigener Betrieb rechnet sich erst bei ausreichend vielen Bauaufträgen und entsprechender Auslastung.</p>'
 +button("found-crew","Eigenen Baubetrieb aufbauen","","primary full"))
 +'<div class="section-label">ABGESCHLOSSENE BAUARBEITEN</div>'
 +(completed.slice(-9).reverse().map(p=>entry(esc(p.contractorName),p.id+" · Abschluss "+p.completed,
 line("Auftragswert",euros(p.quote))+line("Ausführungszeit",p.totalDays+" Tage"))).join("")||'<p class="panel-note">Noch keine abgeschlossenen Maßnahmen.</p>');
}
function openConstructionOffer(plan){
 const tool=plan.tool,isBuilding=!!S.TYPES[tool];
 if(isBuilding){
   const p=S.preview(state,tool,plan.x,plan.y,plan.rotation||0);
   if(!p.ok){notify(p.message,true);return;}
 }else{
   const points=plan.points||[],unique=new Set();
   for(const p of points){const pr=S.preview(state,tool,p.x,p.y);if(!pr.ok){notify(pr.message+" · "+p.x+"/"+p.y,true);return;}unique.add(p.x+","+p.y);}
   if(!unique.size){notify("Bitte zuerst einen Bauzug zeichnen.",true);return;}
   plan.points=Array.from(unique,k=>{const [x,y]=k.split(",").map(Number);return {x,y};});
 }
 ui.pendingPlan=plan;
 const count=isBuilding?1:plan.points.length;
 const quote=S.getQuotes(state,tool,count),name=isBuilding?S.TYPES[tool].name:tool==="road"?"Straßenbau":tool==="parking"?"Parkplatzbau":"Begrünung";
 $("contractorTitle").textContent=name+" beauftragen";
 $("contractorSummary").textContent=isBuilding?
 "Gebäude "+S.TYPES[tool].w*4+" × "+S.TYPES[tool].h*4+" Meter · Mehrere Angebote für Bauzeit, Preis und Ausführungsqualität":
 count+" Felder · "+(count*16).toLocaleString("de-DE")+" m² · Bauarbeiten werden erst nach Fertigstellung sichtbar";
 $("contractorOffers").innerHTML=quote.map(q=>
 '<div class="contractor-offer'+(!q.available?" disabled":"")+'"><div><h3>'+esc(q.name)+'</h3><p>'+esc(q.description)+'</p>'
 +'<div class="offer-facts"><span>◷ '+q.days+' Tage</span><span>Qualität '+q.quality+' / 100</span><span>'+(q.own?"Eigenbetrieb":"Externer Unternehmer")+'</span></div></div>'
 +'<div class="offer-price"><strong>'+euros(q.price)+'</strong>'
 +button("commission-project",q.available?(state.cash>=q.price?"Auftrag vergeben":"Kapital reicht nicht"):"Kolonne beschäftigt",
 'data-contractor="'+esc(q.id)+'" '+(!q.available||state.cash<q.price?"disabled":""),"primary")+'</div></div>').join("");
 $("contractorModal").classList.remove("hidden");
}
function closeConstructionOffer(){ui.pendingPlan=null;$("contractorModal").classList.add("hidden");}
function focusParcel(id){
 const p=state.parcels.find(p=>p.id===id);if(!p)return;
 setViewWorld();ui.cam.cx=p.x+p.w/2;ui.cam.cy=p.y+p.h/2;ui.cam.panX=0;ui.cam.panY=0;ui.cam.zoom=1;
 closePanel();refresh();
}
function updatePanel(){
 const panel=$("panel");if(panel.classList.contains("hidden"))return;
 const sections={property:["Immobilienobjekt",propertyPanel],land:["Grundstücke und Ankauf",landPanel],projects:["Bauaufträge und Eigenbetrieb",projectsPanel],buildings:["Immobilienbestand",buildingsPanel],leasing:["Vermietung",leasingPanel],companies:["Unternehmen",companiesPanel],operations:["Facility Management",operationsPanel],transport:["Verkehr & ÖPNV",transportPanel],finance:["Finanzübersicht",financePanel],messages:["Meldungen",messagesPanel],help:["Spielanleitung",helpPanel]};
 const section=sections[ui.nav]||sections.buildings;$("panelTitle").textContent=section[0];$("panelBody").innerHTML=section[1]();
}
function refresh(){redrawHUD();updateToolbar();updateMapInfo();updateToolStats();updatePanel();}
function resizeSoon(){setTimeout(()=>renderer.resize(),30);}
function toolAction(tool){ui.tool=tool;ui.wallStart=null;ui.dragBuild=null;updateToolbar();updateMapInfo();updateToolStats();}
async function saveGame(silent){
 try{const data=JSON.stringify(state);if(window.IPBridge)await window.IPBridge.save(data);else localStorage.setItem("industrial-park-save-v2",data);if(!silent)notify("Spielstand lokal gespeichert.");}
 catch(e){if(!silent)notify("Speichern fehlgeschlagen: "+e.message,true);}
}
async function loadGame(){
 try{
  let raw=window.IPBridge?await window.IPBridge.load():null;
  if(!raw)raw=localStorage.getItem("industrial-park-save-v2");
  if(raw){state=S.validateLoaded(JSON.parse(raw));notify("Lokaler Spielstand geladen.");}
 }catch(e){notify("Spielstand konnte nicht geladen werden: "+e.message,true);}
 refresh();
}
function focusBuilding(b){if(!b)return;ui.cam.cx=b.x+b.w/2;ui.cam.cy=b.y+b.h/2;ui.cam.panX=0;ui.cam.panY=0;ui.cam.zoom=Math.max(.85,ui.cam.zoom);ui.selectedId=b.id;}
function getLocation(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function pickWall(f,h){
 const vr=Math.abs(h.fx-Math.round(h.fx)),hr=Math.abs(h.fy-Math.round(h.fy));
 const v=S.wallKey(Math.round(h.fx),Math.floor(h.fy),"V"),ho=S.wallKey(Math.floor(h.fx),Math.round(h.fy),"H");
 if(vr<hr)return f.walls[v]?v:ho;
 return f.walls[ho]?ho:v;
}
function pathCells(tool,a,b){
 const out=[],seen=new Set();
 const add=(x,y)=>{const k=x+","+y;if(!seen.has(k)){seen.add(k);out.push({x,y});}};
 if(tool==="road"){
   const dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),sx=b.x>=a.x?1:-1,sy=b.y>=a.y?1:-1;
   if(dx>=dy){
     for(let x=a.x;x!==b.x+sx;x+=sx)add(x,a.y);
     for(let y=a.y+sy;y!==b.y+sy;y+=sy)add(b.x,y);
   }else{
     for(let y=a.y;y!==b.y+sy;y+=sy)add(a.x,y);
     for(let x=a.x+sx;x!==b.x+sx;x+=sx)add(x,b.y);
   }
 }else{
   for(let y=Math.min(a.y,b.y);y<=Math.max(a.y,b.y);y++)
     for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++)add(x,y);
 }
 return out.slice(0,700);
}
function floorClick(e){
 const b=building(ui.selectedId);if(!b)return;const pos=getLocation(e),h=renderer.hitFloor(pos.x,pos.y,ui,b),f=b.floors[ui.floorIndex];
 if(!h.inside)return;
 if(ui.tool==="wall"){
  if(!ui.wallStart){ui.wallStart={x:h.nx,y:h.ny};notify("Endpunkt der Wand wählen.");}
  else{const a=ui.wallStart;ui.wallStart=null;let ex=h.nx,ey=h.ny;if(a.x!==ex&&a.y!==ey){if(Math.abs(a.x-ex)>Math.abs(a.y-ey))ey=a.y;else ex=a.x;}checkpoint();const res=S.setWall(state,b.id,ui.floorIndex,a.x,a.y,ex,ey,false);choice(res.ok,res.message||"Wand eingefügt.");}
 }else if(ui.tool==="door"){const edge=pickWall(f,h);if(f.walls[edge])checkpoint();const res=S.toggleDoor(state,b.id,ui.floorIndex,edge);choice(res.ok,res.message||"Tür gesetzt.");}
 else if(ui.tool==="erase"){
  const i=f.items.find(i=>i.x===h.x&&i.y===h.y);checkpoint();
  if(i){f.items=f.items.filter(j=>j!==i);if(i.deviceId)state.devices=state.devices.filter(d=>d.id!==i.deviceId);notify("Objekt entfernt.");}
  else{const edge=pickWall(f,h);delete f.walls[edge];delete f.doors[edge];notify("Wandsegment entfernt.");}
 }else if(ui.tool.startsWith("room:")){checkpoint();const r=S.paint(state,b.id,ui.floorIndex,h.x,h.y,ui.tool.slice(5));if(!r.ok)notify(r.message,true);}
 else if(ui.tool.startsWith("item:")){checkpoint();const r=S.putItem(state,b.id,ui.floorIndex,h.x,h.y,ui.tool.slice(5));choice(r.ok,r.message||"Ausstattung platziert.");if(!r.ok)undoStack.pop();}
 refresh();
}
function worldClick(e){
 const pos=getLocation(e),h=renderer.hitWorld(pos.x,pos.y,ui);
 if(ui.tool==="select"){
  const b=renderer.pickBuilding(pos.x,pos.y,ui,state)||state.buildings.slice().reverse().find(b=>h.x>=b.x&&h.x<b.x+b.w&&h.y>=b.y&&h.y<b.y+b.h);
  selectBuilding(b);return;
 }
 const isDemolition=ui.tool==="demolish",p=isDemolition?{ok:true}:S.preview(state,ui.tool,h.x,h.y,ui.rotation);
 if(!p.ok){notify(p.message,true);return;}
 if(!isDemolition){openConstructionOffer(S.TYPES[ui.tool]?{tool:ui.tool,x:h.x,y:h.y,rotation:ui.rotation}:{tool:ui.tool,points:[{x:h.x,y:h.y}]});return;}
 checkpoint();const res=S.demolish(state,h.x,h.y);if(!res.ok)undoStack.pop();
 choice(res.ok,res.message||"Rückbau abgeschlossen.");refresh();
}
function menuAt(e){
 e.preventDefault();const p=getLocation(e),menu=$("contextMenu");menu.style.left=Math.min(p.x,stage.clientWidth-210)+"px";menu.style.top=Math.min(p.y,stage.clientHeight-160)+"px";
 if(ui.mode==="floor"){
  menu.innerHTML='<button data-action="floor-door">Tür auf Wand einfügen</button><button data-action="floor-remove">Wand / Objekt entfernen</button><hr/><button data-action="world-view">Außenansicht</button>';
  menuTarget=p;
 }else{
  const h=renderer.hitWorld(p.x,p.y,ui),b=renderer.pickBuilding(p.x,p.y,ui,state)||state.buildings.find(b=>h.x>=b.x&&h.x<b.x+b.w&&h.y>=b.y&&h.y<b.y+b.h);
  menuTarget=b?{buildingId:b.id}:h;
  menu.innerHTML=b?'<button data-action="context-inspect">Objektdaten</button><button data-action="context-floor">Innenausbau</button><button data-action="context-leasing">Vermietung</button>':'<button data-action="context-road">Hier Straße bauen</button><button data-action="context-parking">Hier Parkplatz bauen</button><button data-action="context-office">Hier Bürogebäude planen</button>';
 }menu.classList.remove("hidden");
}
function act(name,element){
 const id=element.dataset.id,kind=element.dataset.kind;
 let res;
 switch(name){
 case "floor-view":setViewFloor(ui.selectedId);break;
 case "property-details":panelOpen("property");break;
 case "open-buildings":panelOpen("buildings");break;
 case "open-land":panelOpen("land");break;
 case "open-projects":panelOpen("projects");break;
 case "buy-parcel":checkpoint();res=S.buyParcel(state,id);if(!res.ok)undoStack.pop();choice(res.ok,res.message||"Grundstück erworben.");refresh();break;
 case "focus-parcel":focusParcel(id);break;
 case "found-crew":checkpoint();res=S.startConstructionDept(state);if(!res.ok)undoStack.pop();choice(res.ok,res.message||"Eigene Bauabteilung gegründet.");refresh();break;
 case "builders-up":case "builders-down":checkpoint();res=S.setBuilders(state,name==="builders-up"?1:-1);if(!res.ok)undoStack.pop();choice(res.ok,res.message||"Baupersonal angepasst.");refresh();break;
 case "cancel-project":if(confirm("Bauauftrag wirklich stornieren? Es wird nur ein Teil der Kosten erstattet.")){checkpoint();res=S.cancelProject(state,id);if(!res.ok)undoStack.pop();choice(res.ok,res.ok?"Bauauftrag storniert · "+euros(res.refund)+" erstattet":res.message);refresh();}break;
 case "advance-day":case "advance-week":S.advance(state,(name==="advance-week"?7:1)*1440);refresh();notify(name==="advance-week"?"7 Tage vorgespult.":"1 Tag vorgespult.");break;
 case "cancel-contract":closeConstructionOffer();break;
 case "commission-project":{
   if(!ui.pendingPlan){notify("Kein Bauvorhaben ausgewählt.",true);break;}
   checkpoint();res=S.commission(state,ui.pendingPlan,element.dataset.contractor);
   if(!res.ok)undoStack.pop();
   choice(res.ok,res.message||(res.ok?res.project.contractorName+" beauftragt · "+res.project.totalDays+" Tage Bauzeit":"Vergabe nicht möglich"));
   if(res.ok){ui.selectedId=res.building?res.building.id:null;closeConstructionOffer();}
   refresh();break;
 }
 case "rotate-build":ui.rotation=(ui.rotation+1)%2;refresh();notify("Gebäudeausrichtung: "+(ui.rotation?"90°":"0°"));break;
 case "undo":restoreHistory("undo");break;
 case "redo":restoreHistory("redo");break;
 case "world-view":setViewWorld();closePanel();refresh();break;
 case "floor-view-toggle":ui.floorView=ui.floorView==="iso"?"plan":"iso";ui.wallStart=null;refresh();notify(ui.floorView==="iso"?"2,5D-Innenansicht aktiv.":"Präziser 2D-Bauplan aktiv.");break;
 case "focus-building":if(building(ui.selectedId)){setViewWorld();focusBuilding(building(ui.selectedId));closePanel();refresh();}break;
 case "select-floor":ui.floorIndex=Number(element.dataset.level);ui.floorView="iso";ui.mode="floor";ui.tool="wall";ui.wallStart=null;closePanel();refresh();break;
 case "add-floor":checkpoint();res=S.addFloor(state,ui.selectedId);if(!res.ok)undoStack.pop();choice(res.ok,res.message||"Etage ergänzt.");refresh();break;
 case "go-leasing":panelOpen("leasing");break;
 case "inspect-building":ui.selectedId=id;panelOpen("property");break;
 case "map-building":setViewWorld();focusBuilding(building(id));closePanel();refresh();break;
 case "lease":{
  const i=Number(element.dataset.index),a=state.applicants[i],sel=$("leaseBuilding"+i),r=$("leaseRent"+i);
  if(!a||!sel||!r)return;
  checkpoint();res=S.rent(state,sel.value,a.name,Number(r.value));if(!res.ok)undoStack.pop();choice(res.ok,res.message||"Mietvertrag angenommen.");refresh();break;
 }
 case "dispatch":res=S.dispatch(state,id);choice(res.ok,res.message||"Reparaturauftrag vergeben.");refresh();break;
 case "toggle-autodispatch":state.autodispatch=!state.autodispatch;refresh();notify(state.autodispatch?"Automatische Disposition aktiv.":"Automatische Disposition deaktiviert.");break;
 case "staff-up":case "staff-down":res=S.setStaff(state,kind,name==="staff-up"?1:-1);choice(res.ok,res.message||"Personalplan aktualisiert.");refresh();break;
 case "buy-bus":res=S.buyBus(state);choice(res.ok,res.message||"Shuttlevertrag abgeschlossen.");refresh();break;
 case "traffic-layer":ui.overlay="traffic";setViewWorld();closePanel();break;
 case "loan":state.debt+=250000;state.cash+=250000;refresh();notify("250.000 € Darlehen ausgezahlt. Rückzahlung und Zinsen werden berücksichtigt.");break;
 case "repay":if(state.cash<50000||state.debt<50000)notify("Tilgung aktuell nicht möglich.",true);else{state.cash-=50000;state.debt-=50000;refresh();notify("50.000 € Darlehen getilgt.");}break;
 case "save":saveGame();break;
 case "reset":if(confirm("Neues Spiel beginnen? Der aktuelle lokale Spielstand wird überschrieben.")){undoStack.length=0;redoStack.length=0;state=S.create();ui.mode="world";ui.selectedId=null;ui.tool="select";ui.rotation=0;ui.cam={cx:15,cy:19,zoom:.98,panX:0,panY:0,floorZoom:1,floorX:0,floorY:0};closeConstructionOffer();closePanel();refresh();saveGame(true);notify("Neues Spiel auf leerem Grundstück begonnen.");}break;
 case "context-inspect":ui.selectedId=menuTarget.buildingId;panelOpen("property");break;
 case "context-floor":setViewFloor(menuTarget.buildingId);break;
 case "context-leasing":panelOpen("leasing");break;
 case "context-road":case "context-parking":case "context-office":{
  const type=name.replace("context-","");openConstructionOffer(S.TYPES[type]?{tool:type,x:menuTarget.x,y:menuTarget.y,rotation:ui.rotation}:{tool:type,points:[{x:menuTarget.x,y:menuTarget.y}]});break;
 }
 case "floor-door":ui.tool="door";floorClick({clientX:menuTarget.x+canvas.getBoundingClientRect().left,clientY:menuTarget.y+canvas.getBoundingClientRect().top});break;
 case "floor-remove":ui.tool="erase";floorClick({clientX:menuTarget.x+canvas.getBoundingClientRect().left,clientY:menuTarget.y+canvas.getBoundingClientRect().top});break;
 }
}
document.addEventListener("click",e=>{
 const speed=e.target.closest("[data-speed]");if(speed){ui.speed=Number(speed.dataset.speed);redrawHUD();return;}
 const nav=e.target.closest("[data-nav]");if(nav){if(nav.dataset.nav==="world"){setViewWorld();closePanel();}else panelOpen(nav.dataset.nav);return;}
 const tool=e.target.closest("[data-tool]");if(tool){toolAction(tool.dataset.tool);return;}
 const button=e.target.closest("[data-action]");if(button){act(button.dataset.action,button);$("contextMenu").classList.add("hidden");return;}
 if(!e.target.closest("#contextMenu"))$("contextMenu").classList.add("hidden");
});
$("saveBtn").addEventListener("click",()=>saveGame());
$("closePanel").addEventListener("click",closePanel);
$("layersBtn").addEventListener("click",()=>{if(ui.mode==="floor"){ui.floorView=ui.floorView==="iso"?"plan":"iso";ui.wallStart=null;}else{const list=["normal","traffic","vacancy","utilities"];ui.overlay=list[(list.indexOf(ui.overlay)+1)%list.length];}refresh();});
$("fitBtn").addEventListener("click",()=>{if(ui.mode==="floor"){ui.cam.floorZoom=1;ui.cam.floorX=0;ui.cam.floorY=0;}else{ui.cam.zoom=.86;ui.cam.panX=0;ui.cam.panY=0;ui.cam.cx=23;ui.cam.cy=20;}refresh();});
$("contractorModal").addEventListener("click",e=>{if(e.target===$("contractorModal"))closeConstructionOffer();});
canvas.addEventListener("contextmenu",menuAt);
canvas.addEventListener("pointerdown",e=>{
 if(e.button!==0&&e.button!==1)return;
 $("contextMenu").classList.add("hidden");
 const p=getLocation(e);
 if(e.button===1||(e.button===0&&spaceDown)){
   drag={mode:"pan",x:e.clientX,y:e.clientY,moved:false};
 }else if(ui.mode==="world"&&["road","parking","tree"].includes(ui.tool)){
   const h=renderer.hitWorld(p.x,p.y,ui);
   drag={mode:"build",start:h,end:h,x:e.clientX,y:e.clientY,moved:false};
   ui.dragBuild=pathCells(ui.tool,h,h);updateToolStats();
 }else if(ui.mode==="floor"&&ui.tool.startsWith("room:")){
   drag={mode:"paint",x:e.clientX,y:e.clientY,seen:new Set(),moved:false};
   const b=building(ui.selectedId),h=b&&renderer.hitFloor(p.x,p.y,ui,b);
   if(h&&h.inside){checkpoint();S.paint(state,b.id,ui.floorIndex,h.x,h.y,ui.tool.slice(5));drag.seen.add(h.x+","+h.y);}
 }else{
   drag={mode:"click",x:e.clientX,y:e.clientY,moved:false};
 }
 pressed=true;canvas.setPointerCapture(e.pointerId);
 if(e.button===1||spaceDown)e.preventDefault();
});
canvas.addEventListener("pointermove",e=>{
 const p=getLocation(e),last=ui.hover,oldFloor=ui.hoverFloor;
 if(ui.mode==="floor"&&building(ui.selectedId))ui.hoverFloor=renderer.hitFloor(p.x,p.y,ui,building(ui.selectedId));
 else ui.hover=renderer.hitWorld(p.x,p.y,ui);
 if(drag){
   if(drag.mode==="pan"){
     const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
     if(Math.abs(dx)+Math.abs(dy)>0)drag.moved=true;
     if(ui.mode==="floor"){ui.cam.floorX+=dx;ui.cam.floorY+=dy;}
     else{ui.cam.panX+=dx;ui.cam.panY+=dy;}
     drag.x=e.clientX;drag.y=e.clientY;
   }else if(drag.mode==="build"){
     const h=renderer.hitWorld(p.x,p.y,ui);
     if(h.x!==drag.end.x||h.y!==drag.end.y){
       drag.end=h;drag.moved=true;
       ui.dragBuild=pathCells(ui.tool,drag.start,drag.end);
       updateToolStats();
     }
   }else if(drag.mode==="paint"){
     const h=ui.hoverFloor,b=building(ui.selectedId);
     if(h&&h.inside&&b&&!drag.seen.has(h.x+","+h.y)){
       S.paint(state,b.id,ui.floorIndex,h.x,h.y,ui.tool.slice(5));
       drag.seen.add(h.x+","+h.y);drag.moved=true;
     }
   }else if(drag.mode==="click"&&ui.mode==="world"&&ui.tool==="select"){
     const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
     if(Math.abs(dx)+Math.abs(dy)>5){
       drag.mode="pan";drag.moved=true;ui.cam.panX+=dx;ui.cam.panY+=dy;
       drag.x=e.clientX;drag.y=e.clientY;
     }
   }else if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>9)drag.moved=true;
 }
 if(ui.mode==="world"&&ui.hover&&(!last||ui.hover.x!==last.x||ui.hover.y!==last.y)){updateMapInfo();}
 else if(ui.mode==="floor"&&ui.hoverFloor&&oldFloor&&(ui.hoverFloor.x!==oldFloor.x||ui.hoverFloor.y!==oldFloor.y)){updateMapInfo();}
});
canvas.addEventListener("pointerup",e=>{
 const held=drag;drag=null;pressed=false;
 if(!held||e.button!==0){ui.dragBuild=null;return;}
 if(held.mode==="build"){
   const points=ui.dragBuild||pathCells(ui.tool,held.start,held.end);
   ui.dragBuild=null;
   openConstructionOffer({tool:ui.tool,points});refresh();return;
 }
 if(held.mode==="paint"){refresh();return;}
 if(held.mode==="click"&&!held.moved){if(ui.mode==="floor")floorClick(e);else worldClick(e);}
});
canvas.addEventListener("pointercancel",()=>{drag=null;pressed=false;ui.dragBuild=null;refresh();});
canvas.addEventListener("pointerleave",()=>{if(!drag){ui.hover=null;ui.hoverFloor=null;updateMapInfo();}});
canvas.addEventListener("wheel",e=>{
 e.preventDefault();if(ui.mode==="floor")ui.cam.floorZoom=Math.max(.65,Math.min(2,ui.cam.floorZoom*(e.deltaY>0?.88:1.13)));
 else ui.cam.zoom=Math.max(.43,Math.min(2.4,ui.cam.zoom*(e.deltaY>0?.88:1.13)));
},{passive:false});
window.addEventListener("keydown",e=>{
 if(e.key===" "&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){spaceDown=true;e.preventDefault();}
 if(e.key==="Escape"){if(ui.pendingPlan)closeConstructionOffer();else if(ui.mode==="floor")setViewWorld();else if(ui.tool!=="select")toolAction("select");else closePanel();}
 if(e.ctrlKey&&e.key.toLowerCase()==="s"){e.preventDefault();saveGame();}
 if(e.ctrlKey&&e.key.toLowerCase()==="z"){e.preventDefault();restoreHistory(e.shiftKey?"redo":"undo");}
 if(e.ctrlKey&&e.key.toLowerCase()==="y"){e.preventDefault();restoreHistory("redo");}
 if(e.key.toLowerCase()==="r"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)&&ui.mode==="world"){ui.rotation=(ui.rotation+1)%2;refresh();notify("Ausrichtung: "+(ui.rotation?"90°":"0°"));}
 if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)&&e.target.tagName!=="INPUT"){const amt=28;e.preventDefault();ui.cam.panX+=e.key==="ArrowLeft"?amt:e.key==="ArrowRight"?-amt:0;ui.cam.panY+=e.key==="ArrowUp"?amt:e.key==="ArrowDown"?-amt:0;}
});
window.addEventListener("keyup",e=>{if(e.key===" ")spaceDown=false;});
function frame(t){if(t-lastFrame>38){renderer.render(state,ui,t);lastFrame=t;}requestAnimationFrame(frame);}
new ResizeObserver(()=>renderer.resize()).observe(stage);renderer.resize();refresh();
setInterval(()=>{
 if(ui.speed>0){const prev=state.clock.slice(0,10);S.advance(state,5*ui.speed);redrawHUD();if(prev!==state.clock.slice(0,10))updatePanel();}
 if(Date.now()-lastAutosave>30000){lastAutosave=Date.now();saveGame(true);}
},1000);
loadGame();requestAnimationFrame(frame);
})();
