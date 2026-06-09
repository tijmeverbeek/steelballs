import { Wedstrijd } from "./types";
import { getWedstrijdenVoorSoort } from "./matches";

export interface LmsRonde {
  nr: number;
  naam: string;
  vanDatum: string;
  totDatum: string;
  deadline: string; // UTC ISO string — Dutch time is CEST = UTC+2 in summer
}

// 8 rounds for WK 2026 Last Man Standing
// All deadlines are in Dutch time (CEST = UTC+2):
//   R1: 11 jun 21:00 | R2: 18 jun 18:00 | R3: 25 jun 03:00
//   R4: 28 jun 21:00 | R5: 4 jul 19:00  | R6: 9 jul 22:00
//   R7: 14 jul 21:00 | R8: 19 jul 21:00
export const LMS_RONDES: LmsRonde[] = [
  { nr: 1, naam: "Groepsfase – Ronde 1", vanDatum: "2026-06-11", totDatum: "2026-06-14", deadline: "2026-06-11T19:00:00Z" },
  { nr: 2, naam: "Groepsfase – Ronde 2", vanDatum: "2026-06-17", totDatum: "2026-06-20", deadline: "2026-06-18T16:00:00Z" },
  { nr: 3, naam: "Groepsfase – Ronde 3", vanDatum: "2026-06-23", totDatum: "2026-06-26", deadline: "2026-06-25T01:00:00Z" },
  { nr: 4, naam: "Ronde van 32",         vanDatum: "2026-06-28", totDatum: "2026-07-02", deadline: "2026-06-28T19:00:00Z" },
  { nr: 5, naam: "Achtste finales",      vanDatum: "2026-07-03", totDatum: "2026-07-06", deadline: "2026-07-04T17:00:00Z" },
  { nr: 6, naam: "Kwartfinales",         vanDatum: "2026-07-07", totDatum: "2026-07-10", deadline: "2026-07-09T20:00:00Z" },
  { nr: 7, naam: "Halve finales",        vanDatum: "2026-07-11", totDatum: "2026-07-15", deadline: "2026-07-14T19:00:00Z" },
  { nr: 8, naam: "Finale",              vanDatum: "2026-07-19", totDatum: "2026-07-19", deadline: "2026-07-19T19:00:00Z" },
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

export function getDeadlineVoorRonde(rondeNr: number): Date | null {
  const ronde = LMS_RONDES.find((r) => r.nr === rondeNr);
  if (!ronde) return null;
  return new Date(ronde.deadline);
}

export function isRondeGesloten(rondeNr: number): boolean {
  const deadline = getDeadlineVoorRonde(rondeNr);
  if (!deadline) return false;
  return new Date() >= deadline;
}

export function getHuidigeRonde(): LmsRonde | null {
  const nu = new Date();
  const upcoming = LMS_RONDES.find((r) => new Date(r.deadline) >= nu);
  return upcoming ?? LMS_RONDES[LMS_RONDES.length - 1];
}
