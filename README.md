# INDUSTRIAL PARK — Version 1.0 (Offline)

Ein lokal ausführbarer 2D-Wirtschafts- und Aufbausimulator für die fiktive **AM Gewerbepark GmbH**. Eigentum, Bau, Vermietung, Unternehmen und Gebäudebetrieb sind in einem gemeinsamen Spielstand verknüpft.

## Windows-EXE herunterladen

1. Auf GitHub **Actions** öffnen.
2. Workflow **Windows Offline EXE** auswählen.
3. Den neuesten **erfolgreichen** Durchlauf öffnen.
4. Unter **Artifacts** Industrial-Park-Windows-v1 herunterladen und ZIP entpacken.
5. Industrial-Park-1.0.0-Windows.exe direkt starten.

**Keine Installation und kein Server erforderlich.** GitHub Actions erstellt nach **jedem Push auf main** automatisch eine Windows-x64-EXE. Das Spiel führt keine HTTP-Anfragen aus und benötigt nach dem Download kein Internet. Keine Cloud-Anmeldung und keine Telemetrie.

Die EXE wird auf GitHub Actions gebaut. Sie ist **nicht digital signiert**; Windows SmartScreen kann deshalb eine Warnung anzeigen. Nur selbst geprüfte Dateien aus dem eigenen Repository ausführen.

## Lokal aus Quellcode starten

Voraussetzung: Node.js 22 oder neuer.

    npm install
    npm test
    npm start

Windows-EXE selbst bauen (auf Windows):

    npm run dist:win

Der portable Build liegt unter dist/Industrial-Park-1.0.0-Windows.exe.

## Bereits spielbare Mechaniken in v1

- Isometrische Gewerbepark-Karte mit Gebäuden, Straßen, Grünflächen, Parkplätzen, Pkw und bewegten Passanten.
- Bürogebäude, Lagerhallen, Werkstätten, Gastronomie und Betriebsgebäude platzieren: Grundstücks-/Kollisionsprüfung, Baukosten und Bauzeiten.
- Gebäudeeditor in 2D-Draufsicht: einzelne Wände, Türen, Raumkategorien, Gegenstände und technische Anlagen.
- Mehrere Stockwerke und aus dem Raumlayout abgeleitete Arbeitsplatzkapazität.
- Mieter mit Beschäftigten, Umsatzbasis, Liquidität, monatlicher Geschäftsentwicklung, Wachstum und Personalabbau.
- Mietangebote: Unternehmen benötigen passende Gebäude und können zu hohe Mieten ablehnen.
- Monatliche Cashflow-Abrechnung: Kaltmieten, Gebäudeunterhalt, Gehälter, Zinsen, Darlehen.
- Technische Störungen und Reinigungsaufträge: Gerätezustand, Standort, Ticket, Zuständigkeit, Personaldisposition, Materialaufwand und Reparaturdauer.
- Personal für Technik, Reinigung und Sicherheit; manuelle oder automatische Auftragsvergabe.
- Parkraumbedarf und optionaler Werks-Shuttle, der die Pkw-Nachfrage beeinflusst.
- Kartenebenen für Standard, Verkehr, Leerstand und Versorgung.
- Offline-Speicherung: automatische und manuelle Sicherung, neue Karriere.
- Pause sowie 1x, 4x und 16x Zeitgeschwindigkeit.

## Bedienung

**Außenansicht:** Werkzeug wählen, auf Gelände klicken. Linksklick wählt Objekte; Rechtsklick zeigt Kontextaktionen. Mausrad zoomt. Leertaste + Mausziehen oder Ziehen im Auswahlwerkzeug verschiebt die Welt.

**Innenausbau:** Gebäude anklicken → Innenausbau. Wandwerkzeug: zweimal klicken (Anfang, Ende). Tür: Wandsegment anklicken. Raumkategorie und Gegenstände per Klick setzen. Außen führt zurück zur Karte.

**Vermietung:** Mietinteressenten öffnen, freies fertiggestelltes Gebäude wählen, Kaltmiete eingeben, Angebot verschicken.

**Facility Management:** Im Betriebsfenster Aufträge einem verfügbaren Mitarbeiter zuweisen oder automatische Disposition aktivieren. Aufträge werden durch tatsächliche simulierte Arbeitstage abgeschlossen.

**Speichern:** Strg+S oder Schaltfläche oben rechts. Spielstände liegen im anwendungsspezifischen lokalen Nutzerdatenverzeichnis als industrial-park-v1.json.

## Architektur

- src/sim.js: deterministische Simulation, unabhängige Welt- und Wirtschaftsregeln.
- src/render.js: Canvas-Welt und Etagenansicht, prozedural gezeichnete 2D-Assets.
- src/app.js: Interaktion, Werkzeugleiste, Verwaltung, Laden/Speichern.
- src/style.css und index.html: Desktop-Oberfläche.
- electron/: offline Electron-Host, isolierter Renderer, IPC, lokale JSON-Spielstände.
- tests/: reproduzierbare Simulationsprüfungen.
- .github/workflows/windows-exe.yml: Windows-x64-EXE wird bei jedem Push auf main getestet und erstellt.

## Noch nicht Bestandteil von v1

Die 1.0 ist eine **spielbare Kernversion**, nicht die vollständige Umsetzung sämtlicher langfristiger Wünsche aus dem Konzept. Noch nicht realisiert: tatsächliche Live-Kamerastreams, realistische dynamische Feuer-/Rauchberechnung, autonome Wegfindung für jedes Fahrzeug und jede Person, vollständige baurechtliche Prüfungen, Handelsbilanz, individuell animierte Arbeitsabläufe, vollumfängliche Polizei-/Feuerwehr-/Rettungsdienstlogik, umfassende 3D-Asset-Bibliothek, ausformulierte Mietvertragsdokumente und detaillierte Netzsimulation.

Die prozeduralen Gebäude-, Baum- und Fahrzeugdarstellungen werden vollständig im eigenen Quellcode gezeichnet; keine unklar lizenzierten Fremdassets. Externe bezahlte Asset-Generierung wurde nicht ausgelöst.

## Qualität

npm test prüft acht zentrale miteinander verknüpfte Simulationsabläufe. Der erfolgreiche Windows-Build belegt die Erstellung der EXE, ersetzt aber noch keinen vollständigen visuellen Windows-Playtest.

[GitHub-Projekt](https://github.com/Alibu06/INDUSTRIAL-PARK)
