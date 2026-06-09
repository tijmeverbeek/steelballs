-- Fix positie- en naamfouten in 7 teams op basis van officiële Wikipedia-selecties

-- ENG: O'Reilly MID→VER, Eze AAN→MID
UPDATE "Speler" SET positie = 'VER' WHERE soort = 'wk' AND team = 'ENG' AND naam = 'O''Reilly';
UPDATE "Speler" SET positie = 'MID' WHERE soort = 'wk' AND team = 'ENG' AND naam = 'Eze';

-- GER: Sané MID→AAN
UPDATE "Speler" SET positie = 'AAN' WHERE soort = 'wk' AND team = 'GER' AND naam = 'Sané';

-- GHA: Fatawu AAN→MID, Sulemana AAN→MID, Semenyo MID→AAN
UPDATE "Speler" SET positie = 'MID' WHERE soort = 'wk' AND team = 'GHA' AND naam = 'Fatawu';
UPDATE "Speler" SET positie = 'MID' WHERE soort = 'wk' AND team = 'GHA' AND naam = 'Sulemana';
UPDATE "Speler" SET positie = 'AAN' WHERE soort = 'wk' AND team = 'GHA' AND naam = 'Semenyo';

-- ECU: Willian Corozo → Janner Corozo
DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'ECU' AND naam = 'Willian Corozo';
INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Janner Corozo', 'ECU', 'AAN', 'wk');

-- POR: Ricardo Velho → Rui Silva
DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'POR' AND naam = 'Ricardo Velho';
INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Rui Silva', 'POR', 'DOE', 'wk');

-- SEN: verwijder verkeerde spelers, voeg ontbrekenden toe
DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'SEN' AND naam IN ('Nampalys Mendy', 'Souleymane Aw');
INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Krépin Diatta', 'SEN', 'VER', 'wk'),
(gen_random_uuid(), 'Bara Sapoko Ndiaye', 'SEN', 'MID', 'wk'),
(gen_random_uuid(), 'Ibrahim Mbaye', 'SEN', 'AAN', 'wk');

-- HAI: volledige herindeling (posities waren door elkaar gehaald)
DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'HAI';
INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Placide', 'HAI', 'DOE', 'wk'),
(gen_random_uuid(), 'Alexandre Pierre', 'HAI', 'DOE', 'wk'),
(gen_random_uuid(), 'Duverger', 'HAI', 'DOE', 'wk'),
(gen_random_uuid(), 'Ade', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Arcus', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Delcroix', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Experience', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'J.K.Duverne', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Duke Lacroix', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Paugain', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Thermoncy', 'HAI', 'VER', 'wk'),
(gen_random_uuid(), 'Bellegarde', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'L.Pierre', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'Sainte', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'Jean-Jacques', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'D.Simon', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'W.Pierre', 'HAI', 'MID', 'wk'),
(gen_random_uuid(), 'Isidor', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Fortune', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Pierrot', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Deedson', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Providence', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Casimir', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Etienne Jr', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Nazon', 'HAI', 'AAN', 'wk'),
(gen_random_uuid(), 'Joseph', 'HAI', 'AAN', 'wk');
