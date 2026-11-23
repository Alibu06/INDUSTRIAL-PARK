# INDUSTRIAL PARK — v1.2

Offline-Wirtschafts- und Aufbausimulation für Windows. Du entwickelst einen Gewerbepark selbst von einer leeren Fläche zur vermieteten, betriebenen Gewerbelandschaft.

## Windows EXE

1. Auf GitHub **Actions → Windows Offline EXE** öffnen.
2. Den neuesten erfolgreichen Build auswählen.
3. Unter **Artifacts** das Windows-Buildpaket herunterladen.
4. ZIP entpacken und Industrial-Park-1.2.0-Windows.exe starten.

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

## Construction Studio – Baueditor v1.2 (erste Ausbaustufe)

- **Freie Gebäudegrundrisse:** Auf der Parkkarte einen Gebäudetyp wählen und mit der Maus Flächen aufziehen. Mit weiteren Zügen angrenzende Flächen hinzufügen, mit **Umschalt + Ziehen** Teile entfernen. L- und U-Formen einschließlich Innenhöfen werden unterstützt. Anschließend **Angebote einholen** und einen Bauunternehmer beauftragen. Jede Karte misst 4 × 4 m; die Kosten berücksichtigen die tatsächliche Fläche. Nur zusammenhängende Grundrisse sind erlaubt.
- **Baukatalog:** Im Gebäudeeditor **Alle Objekte** wählen. Eine vollflächige Suche und Filter zeigen Möbel, Einrichtungssets, IT & Netzwerk, CCTV/Zutritt, Brandschutz, Sanitär, Technik, Lager, Industrie, Türen, Fenster, Bodenbeläge, Wandfarben und Raumzonen. Das Katalogobjekt auswählen, zurück in der 2,5D-Ansicht anklicken und mit **R** bei Bedarf drehen.
- **Reale Größen:** Die 90 Produktmodelle besitzen eigene Maße (in Metern) und Preise. Das Platzieren rastet auf 25 cm ein, und Möbel nehmen unterschiedliche Flächen ein. Ein Computer kann auf einem Schreibtisch stehen. Arbeitsplätze und Konferenztische sind außerdem als **Komplettsets** erhältlich.
- **Bauteilvarianten:** Acht Türmodelle einschließlich T30/T90, Sicherheitstür, Glas- und Schiebetür; sechs Fenstertypen einschließlich Sicherheitsverglasung. Fenster benötigen eine Außenwand; Doppeltüren nehmen die passende Anzahl von Wandsegmenten ein.
- **Sicherheitskatalog:** Dome-, Bullet-, Turret- und PTZ-Kameras, Einbruchmelder, Zutrittsleser, Gegensprechstellen, Brandmeldezentralen, Rauch- und Wärmemelder, Sprinkler, Feuerlöscher, Notbeleuchtung und Fluchtwegbeschilderung. Kameramodelle erhalten verschiedene technische Stammdaten; ein komplettes Alarm- und Sichtfeldsystem folgt in einer späteren Ausbaustufe.
- **IT:** All-in-One-Computer im iMac-Stil, Laptops, Netzwerkracks, Server, Switches, Firewall, Router, WLAN-Access-Points, Repeater, USV, Drucker und Dosen. **Verkabelung, WLAN-Abdeckung und tatsächliche Netzwerkverbindungen sind noch nicht durchgehend simuliert.**
- **Funktionszonen:** Im Baukatalog Zonen wie Büro, Besprechung, Sanitär, Serverraum oder Lager auswählen und Flächen bemalen. Normalerweise sind diese unsichtbar; per **Zonenfilter** erscheinen transparente Farben mit Bezeichnungen. Über **Raumprüfung** werden bisher grundlegende Ausstattungsanforderungen ausgewertet.

**Einschränkungen:** Die dargestellten Objekte sind derzeit stilisierte, im Canvas gezeichnete 2,5D-Grafiken und noch keine vollständig modellierte Premium-Asset-Bibliothek. Möbelplatzierung ist bereits maßbasiert, aber Feinheiten wie echte Kollisions- und Zugangswege, genaue Montagehöhen, Verkabelung und Bauaufträge für sämtliche Innenausbauarbeiten sind noch in Entwicklung. Die Innenausstattung wird derzeit direkt gekauft und platziert, statt von der beim Rohbau beauftragten Firma zeitverzögert eingebaut zu werden.

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

## Construction Studio v1.2 – frei gestaltbare Gebäude

Gebäude auf der Parkkarte mit gedrückter Maustaste zeichnen; weitere Flächen ergänzen, mit **Umschalt+Ziehen** Teilflächen abtragen und damit L-/U-Grundrisse erstellen. Anschließend über **Angebote einholen** den Bauauftrag an ein Unternehmen vergeben. Das Außenbauraster beträgt derzeit 4 m pro Feld.

Im 2,5D-Inneneditor **Baukatalog** öffnen: Suche und Kategorien für Räume, Wände, Bodenbeläge, Möbel, Möbelsets, IT/Netzwerk, Sicherheit, Brandschutz, Fenster, Türen, Sanitär, Lager, Industrie und Dekoration. 90 einzelne Katalogobjekte besitzen eigene Preise und physische Maße; Objekte rasten in 25-cm-Schritten ein und berücksichtigen Kollisionsflächen. Drei vollständige Einrichtungsvorlagen ergänzen die Einzelplatzierung.

Acht Türarten (u. a. Glas, Schiebetür, Brandschutz T30/T90, RC3, Sektionaltor) und sechs Fensterarten (u. a. Panoramafenster, Brandschutzglas und RC3) benötigen passende Wandsegmente. Sicherheitsobjekte umfassen Dome-, Bullet-, Turret- und PTZ-Kameras, Brandmelder, Sprinkler, Feuerlöscher, Fluchtwegbeleuchtung, Zutrittsleser, Alarmzentrale, Glasbruchmelder und Bewegungsmelder. IT-Ausstattung enthält All-in-One-Rechner, Monitore, Racks, Router, Switches, NAS, Firewall, WLAN-Access-Points und USV.

Unsichtbare Raumzonen lassen sich zeichnen, über den **Zonenfilter** einblenden und im Menü **Raumprüfung** anhand grundlegender Ausstattungsregeln prüfen.

**Stand der Umsetzung:** Funktionaler Ausbau des Baueditors und Datenmodells, nicht vollständiger Premium-Asset-Release. Noch fehlen aufwendig produzierte hochwertige Einzelmodelle, vollständig simulierte Kamerabilder/Alarmketten, echte Kabelverlegung und der mehrstufige, von Bauunternehmen ausgeführte Innenausbau. Bestehende Spielstände (Format v2) bleiben mit der neuen Datenstruktur kompatibel.
