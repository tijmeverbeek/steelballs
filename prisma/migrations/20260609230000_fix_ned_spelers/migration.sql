-- Herstel foute spelersnamen in het Nederlandse WK-elftal
DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'NED' AND naam IN (
  'Patrick Kluivert',
  'Myron Boadu',
  'Jerdy Schouten',
  'Kjell Scherpen'
);

INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Justin Kluivert', 'NED', 'AAN', 'wk'),
(gen_random_uuid(), 'Calvin Stengs', 'NED', 'AAN', 'wk'),
(gen_random_uuid(), 'Micky van der Wieffer', 'NED', 'MID', 'wk'),
(gen_random_uuid(), 'Etienne Roefs', 'NED', 'DOE', 'wk');
