# INDUSTRIAL PARK — v1.1

Offline-Wirtschafts- und Aufbausimulation für Windows. Du entwickelst einen Gewerbepark selbst von einer leeren Fläche zur vermieteten, betriebenen Gewerbelandschaft.

## Windows EXE

1. Auf GitHub **Actions → Windows Offline EXE** öffnen.
2. Den neuesten erfolgreichen Build auswählen.
3. Unter **Artifacts** das Windows-Buildpaket herunterladen.
4. ZIP entpacken und Industrial-Park-1.1.0-Windows.exe starten.

Das Spiel ist ohne Installation und ohne Server spielbar. Der Build wird bei jedem Push nach main erstellt; die EXE benötigt keine Anmeldung oder Internetverbindung. Die ausführbare Datei ist nicht signiert, daher kann Windows SmartScreen eine Warnung anzeigen.

Lokal entwickeln (Node.js ab 22):

    npm install
    npm test
    npm start

EXE lokal auf Windows erzeugen:

    npm run dist:win

Spielstände werden lokal in industrial-park-v2.json unter dem Electron-Benutzerdatenverzeichnis gespeichert. Alte v1-Speicherstände werden nicht überschrieben, die neue Karriere ist ein eigener Spielstand.

## Leerer Spielstart

Du erhältst 790.000 € Startkapital, genau ein unbebautes Grundstück und eine öffentliche Straße am Standort. Keine Gebäude, keine Mieter, keine Parkplätze, keine internen Straßen und keine eigenen Mitarbeiter.

- **Flächen:** Neue Parzellen individuell ankaufen. Bau nur auf eigenem Grundstück erlaubt.
- **Bauaufträge:** Gebäudegrundriss oder Außenbaufläche wählen, dann Angebote mehrerer externer Bauunternehmen mit Preis, Dauer und Qualität vergleichen. Die Arbeiten werden sichtbar und erst nach Bauzeit fertiggestellt.
- **Eigener Baubetrieb:** Später gegen einmalige Investition aufbauen, Bauarbeiter und Geräte vorhalten, laufende Löhne bezahlen und eigene Aufträge statt Fremdunternehmen durchführen. Eigene Kolonnen haben begrenzte Kapazität.
- **Bauaufträge stornieren:** Noch offene Baustellen lassen sich gegen anteilige Rückzahlung der Kosten zurückziehen. Zeit um einen oder sieben Tage vorspulen.

## Innenräume: 2,5D statt nur Grundriss

Die Innenansicht öffnet jetzt standardmäßig in **isometrischem 2,5D**. Du siehst erhöhte Wände, offene Türdurchgänge, perspektivisch platzierte Ausstattung, Außenwände als Schnittmodell und Böden. Die vorderen Außenwände werden niedriger gezeichnet, damit der Innenraum sichtbar bleibt.

- Mit zwei Klicks neue Wandsegmente ziehen.
- Auf eine Wand klicken, um eine Tür zu setzen.
- Raumtyp mit Ziehen auf mehrere Felder auftragen.
- Ausstattung je einzelnem Raumfeld platzieren.
- **Jedes Wandsegment einzeln gestalten:** Warmweiß, Beige, Navy, Salbei, Sichtbeton, Klinker, Eichenpaneele, Anthrazit und Glastrennwände. Die Wände haben echte sichtbare Flächen und Materialdetails; jeder Anstrich kostet Geld.
- **Bodenbeläge pro Quadratmeter:** Teppich, Eichenparkett, Feinsteinzeug, Industriebeton, Vinyl und Epoxidharz. Per Klick oder Ziehen verlegen, die Materialkosten werden unmittelbar berechnet und im lokalen Spielstand gespeichert.
- Über den Ansichtsumschalter zwischen **2,5D-Innenraum** und **2D-Bauplan** wechseln. Beides sind Ansichten derselben Gebäudedaten. Die vorderen Wände sind als Cutaway sichtbar, um Möbel und andere Räume einzusehen.
- Änderungen rückgängig mit Strg+Z, wiederholen mit Strg+Y.

Die Grafiken sind derzeit prozedural erzeugte 2D- und 2,5D-Darstellungen, keine fotorealistischen 3D-Objekte.

## Verwaltung und Gameplay

Alle Verwaltungsmodule öffnen sich **vollflächig** statt als schmales rechtes Menü: Flächen, Bauaufträge, Objekte, Vermietung, Firmen, Betrieb, Verkehr, Finanzen und Meldungen.

Auf der Karte: Mausrad zoomt, Leertaste + Ziehen verschiebt die Ansicht, R dreht Gebäude, Strg+Z macht einen Bearbeitungsschritt rückgängig. Straßen können in zusammenhängenden Zügen, Parkplätze als Flächen geplant werden. Rot/grüne Vorschau zeigt Platzierung und Kosten, externe Angebote werden erst anschließend eingeholt.

Mieter mit eigener Wirtschaftsentwicklung, Monatsmieten, Cashflow, Personal, technische Störungen und Reparaturaufträge sind als grundlegende Simulation integriert.

## Projektstruktur

- src/sim.js — Simulationszustand, Grundstücke, Bauvergabe, Wirtschaft, Wand- und Bodenmaterialien.
- src/render.js — Gewerbepark, Straßen, Gebäude, 2,5D-Schnittansicht, 2D-Bauplan.
- src/app.js — Bedienung, Werkzeugleisten, Bauangebote, Verwaltung, lokale Spielstände.
- src/style.css und src/v11.css — UI.
- electron/ — Offline-Desktop-App.
- tests/ — Simulation, Platzierung, Materialien, Projektionen und Rendering-Smoke-Tests.
- .github/workflows/windows-exe.yml — automatische Windows-x64-EXE.

**Stand:** Eine spielbare Kernversion, noch keine komplette Premium-Asset-Bibliothek oder vollständig realistische Mitarbeiter-, Bau-, Verkehrs- und Behördenmechanik.

[INDUSTRIAL-PARK auf GitHub](https://github.com/Alibu06/INDUSTRIAL-PARK)
