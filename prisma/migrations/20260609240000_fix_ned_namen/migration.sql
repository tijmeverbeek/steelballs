DELETE FROM "Speler" WHERE soort = 'wk' AND team = 'NED' AND naam IN (
  'Micky van der Wieffer',
  'Etienne Roefs',
  'Calvin Stengs'
);

INSERT INTO "Speler" (id, naam, team, positie, soort) VALUES
(gen_random_uuid(), 'Mats Wieffer', 'NED', 'MID', 'wk'),
(gen_random_uuid(), 'Robin Roefs', 'NED', 'DOE', 'wk'),
(gen_random_uuid(), 'Crysencio Summerville', 'NED', 'AAN', 'wk');
