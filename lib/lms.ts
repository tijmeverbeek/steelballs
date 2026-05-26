import { Wedstrijd } from "./types";
import { getWedstrijdenVoorSoort } from "./matches";

export interface LmsRonde {
  nr: number;
  naam: string;
  // Inclusive date range — picks must be in before the earliest match of the round
  vanDatum: string;
  totDatum: string;
}

// WK 2026 group phase: 3 rounds based on the schedule in matches.ts
// Round 1: June 11–14  |  Round 2: June 17–20  |  Round 3: June 23–26
// Knockout rounds are defined here but match data (teams) is TBD
export const LMS_RONDES: LmsRonde[] = [
  { nr: 1, naam: "Groepsfase – Ronde 1", vanDatum: "2026-06-11", totDatum: "2026-06-14" },
  { nr: 2, naam: "Groepsfase – Ronde 2", vanDatum: "2026-06-17", totDatum: "2026-06-20" },
  { nr: 3, naam: "Groepsfase – Ronde 3", vanDatum: "2026-06-23", totDatum: "2026-06-26" },
  { nr: 4, naam: "Achtste finales",       vanDatum: "2026-07-01", totDatum: "2026-07-04" },
  { nr: 5, naam: "Kwartfinales",          vanDatum: "2026-07-05", totDatum: "2026-07-06" },
  { nr: 6, naam: "Halve finales",         vanDatum: "2026-07-14", totDatum: "2026-07-15" },
  { nr: 7, naam: "Finale",               vanDatum: "2026-07-19", totDatum: "2026-07-19" },
];

export function getRondeVoorWedstrijd(datum: string): LmsRonde | undefined {
  return LMS_RONDES.find((r) => datum >= r.vanDatum && datum <= r.totDatum);
}

export function getWedstrijdenVoorRonde(rondeNr: number): Wedstrijd[] {
  const ronde = LMS_RONDES.find((r) => r.nr === rondeNr);
  if (!ronde) return [];
  const alle = getWedstrijdenVoorSoort("wk");
  return alle.filter((w) => w.datum >= ronde.vanDatum && w.datum <= ronde.totDatum);
}

// Earliest kickoff in a round = deadline for submitting picks
export function getDeadlineVoorRonde(rondeNr: number): Date | null {
  const wedstrijden = getWedstrijdenVoorRonde(rondeNr);
  if (wedstrijden.length === 0) return null;
  const sorted = [...wedstrijden].sort((a, b) =>
    `${a.datum}T${a.tijd}`.localeCompare(`${b.datum}T${b.tijd}`)
  );
  const w = sorted[0];
  return new Date(`${w.datum}T${w.tijd}:00`);
}

export function isRondeGesloten(rondeNr: number): boolean {
  const deadline = getDeadlineVoorRonde(rondeNr);
  if (!deadline) return false;
  return new Date() >= deadline;
}

export function getHuidigeRonde(): LmsRonde | null {
  const nu = new Date().toISOString().split("T")[0];
  // Find the earliest upcoming round, or the last past round
  const upcoming = LMS_RONDES.find((r) => r.totDatum >= nu);
  return upcoming ?? LMS_RONDES[LMS_RONDES.length - 1];
}
