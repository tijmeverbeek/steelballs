-- Fix Curaçao teamcode: CUR → CUW (matches lib/matches.ts)
UPDATE "Speler" SET team = 'CUW' WHERE team = 'CUR' AND soort = 'wk';
