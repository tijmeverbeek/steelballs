import { Team, Wedstrijd } from "./types";

export const CL_FINALE: Wedstrijd = {
  id: "CL1",
  thuis: { code: "PSG", naam: "PSG", vlag: "🇫🇷", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
  uit: { code: "ARS", naam: "Arsenal", vlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  datum: "2026-05-30",
  tijd: "18:00",
  groep: "CL Finale",
  fase: "knockout",
};

export const OEF_NED_ALG: Wedstrijd = {
  id: "OEF1",
  thuis: { code: "NED", naam: "Nederland", vlag: "🇳🇱", logo: "https://flagcdn.com/nl.svg" },
  uit: { code: "ALG", naam: "Algerije", vlag: "🇩🇿", logo: "https://flagcdn.com/dz.svg" },
  datum: "2026-06-03",
  tijd: "20:45",
  groep: "Oefenwedstrijd",
  fase: "groepsfase",
};

// WK 2026 groups — all 48 teams
const groepen: Record<string, Team[]> = {
  A: [
    { code: "MEX", naam: "Mexico", vlag: "🇲🇽" },
    { code: "ZAF", naam: "Zuid-Afrika", vlag: "🇿🇦" },
    { code: "KOR", naam: "Zuid-Korea", vlag: "🇰🇷" },
    { code: "CZE", naam: "Tsjechië", vlag: "🇨🇿" },
  ],
  B: [
    { code: "CAN", naam: "Canada", vlag: "🇨🇦" },
    { code: "BIH", naam: "Bosnië & Herzegovina", vlag: "🇧🇦" },
    { code: "QAT", naam: "Qatar", vlag: "🇶🇦" },
    { code: "SUI", naam: "Zwitserland", vlag: "🇨🇭" },
  ],
  C: [
    { code: "BRA", naam: "Brazilië", vlag: "🇧🇷" },
    { code: "MAR", naam: "Marokko", vlag: "🇲🇦" },
    { code: "HAI", naam: "Haïti", vlag: "🇭🇹" },
    { code: "SCO", naam: "Schotland", vlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ],
  D: [
    { code: "USA", naam: "Verenigde Staten", vlag: "🇺🇸" },
    { code: "PAR", naam: "Paraguay", vlag: "🇵🇾" },
    { code: "AUS", naam: "Australië", vlag: "🇦🇺" },
    { code: "TUR", naam: "Turkije", vlag: "🇹🇷" },
  ],
  E: [
    { code: "GER", naam: "Duitsland", vlag: "🇩🇪" },
    { code: "CUW", naam: "Curaçao", vlag: "🇨🇼" },
    { code: "CIV", naam: "Ivoorkust", vlag: "🇨🇮" },
    { code: "ECU", naam: "Ecuador", vlag: "🇪🇨" },
  ],
  F: [
    { code: "NED", naam: "Nederland", vlag: "🇳🇱" },
    { code: "JPN", naam: "Japan", vlag: "🇯🇵" },
    { code: "SWE", naam: "Zweden", vlag: "🇸🇪" },
    { code: "TUN", naam: "Tunesië", vlag: "🇹🇳" },
  ],
  G: [
    { code: "BEL", naam: "België", vlag: "🇧🇪" },
    { code: "EGY", naam: "Egypte", vlag: "🇪🇬" },
    { code: "IRN", naam: "Iran", vlag: "🇮🇷" },
    { code: "NZL", naam: "Nieuw-Zeeland", vlag: "🇳🇿" },
  ],
  H: [
    { code: "ESP", naam: "Spanje", vlag: "🇪🇸" },
    { code: "CPV", naam: "Kaapverdië", vlag: "🇨🇻" },
    { code: "SAU", naam: "Saoedi-Arabië", vlag: "🇸🇦" },
    { code: "URU", naam: "Uruguay", vlag: "🇺🇾" },
  ],
  I: [
    { code: "FRA", naam: "Frankrijk", vlag: "🇫🇷" },
    { code: "SEN", naam: "Senegal", vlag: "🇸🇳" },
    { code: "IRQ", naam: "Irak", vlag: "🇮🇶" },
    { code: "NOR", naam: "Noorwegen", vlag: "🇳🇴" },
  ],
  J: [
    { code: "ARG", naam: "Argentinië", vlag: "🇦🇷" },
    { code: "ALG", naam: "Algerije", vlag: "🇩🇿" },
    { code: "AUT", naam: "Oostenrijk", vlag: "🇦🇹" },
    { code: "JOR", naam: "Jordanië", vlag: "🇯🇴" },
  ],
  K: [
    { code: "POR", naam: "Portugal", vlag: "🇵🇹" },
    { code: "COD", naam: "Congo DR", vlag: "🇨🇩" },
    { code: "UZB", naam: "Oezbekistan", vlag: "🇺🇿" },
    { code: "COL", naam: "Colombia", vlag: "🇨🇴" },
  ],
  L: [
    { code: "ENG", naam: "Engeland", vlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "CRO", naam: "Kroatië", vlag: "🇭🇷" },
    { code: "GHA", naam: "Ghana", vlag: "🇬🇭" },
    { code: "PAN", naam: "Panama", vlag: "🇵🇦" },
  ],
};

function t(code: string): Team {
  for (const teams of Object.values(groepen)) {
    const team = teams.find((x) => x.code === code);
    if (team) return team;
  }
  throw new Error(`Team ${code} niet gevonden`);
}

function w(id: string, thuis: string, uit: string, datum: string, tijd: string, groep: string): Wedstrijd {
  return { id, thuis: t(thuis), uit: t(uit), datum, tijd, groep: `Groep ${groep}`, fase: "groepsfase" };
}

// All 72 group stage matches — times in Dutch time (CEST = UTC+2)
const WK_WEDSTRIJDEN: Wedstrijd[] = [
  // ── Groep A ──────────────────────────────────
  w("A1", "MEX", "ZAF", "2026-06-11", "21:00", "A"),
  w("A2", "KOR", "CZE", "2026-06-12", "04:00", "A"),
  w("A3", "CZE", "ZAF", "2026-06-18", "18:00", "A"),
  w("A4", "MEX", "KOR", "2026-06-19", "03:00", "A"),
  w("A5", "CZE", "MEX", "2026-06-25", "03:00", "A"),
  w("A6", "ZAF", "KOR", "2026-06-25", "03:00", "A"),

  // ── Groep B ──────────────────────────────────
  w("B1", "CAN", "BIH", "2026-06-12", "21:00", "B"),
  w("B2", "QAT", "SUI", "2026-06-13", "21:00", "B"),
  w("B3", "SUI", "BIH", "2026-06-18", "21:00", "B"),
  w("B4", "CAN", "QAT", "2026-06-19", "00:00", "B"),
  w("B5", "SUI", "CAN", "2026-06-24", "21:00", "B"),
  w("B6", "BIH", "QAT", "2026-06-24", "21:00", "B"),

  // ── Groep C ──────────────────────────────────
  w("C1", "BRA", "MAR", "2026-06-14", "00:00", "C"),
  w("C2", "HAI", "SCO", "2026-06-14", "03:00", "C"),
  w("C3", "SCO", "MAR", "2026-06-20", "00:00", "C"),
  w("C4", "BRA", "HAI", "2026-06-20", "02:30", "C"),
  w("C5", "SCO", "BRA", "2026-06-25", "00:00", "C"),
  w("C6", "MAR", "HAI", "2026-06-25", "00:00", "C"),

  // ── Groep D ──────────────────────────────────
  w("D1", "USA", "PAR", "2026-06-13", "03:00", "D"),
  w("D2", "AUS", "TUR", "2026-06-14", "06:00", "D"),
  w("D3", "USA", "AUS", "2026-06-19", "21:00", "D"),
  w("D4", "TUR", "PAR", "2026-06-20", "06:00", "D"),
  w("D5", "TUR", "USA", "2026-06-26", "04:00", "D"),
  w("D6", "PAR", "AUS", "2026-06-26", "04:00", "D"),

  // ── Groep E ──────────────────────────────────
  w("E1", "GER", "CUW", "2026-06-14", "19:00", "E"),
  w("E2", "CIV", "ECU", "2026-06-15", "01:00", "E"),
  w("E3", "GER", "CIV", "2026-06-20", "22:00", "E"),
  w("E4", "ECU", "CUW", "2026-06-21", "02:00", "E"),
  w("E5", "ECU", "GER", "2026-06-25", "22:00", "E"),
  w("E6", "CUW", "CIV", "2026-06-25", "22:00", "E"),

  // ── Groep F ──────────────────────────────────
  w("F1", "NED", "JPN", "2026-06-14", "22:00", "F"),
  w("F2", "SWE", "TUN", "2026-06-15", "04:00", "F"),
  w("F3", "NED", "SWE", "2026-06-20", "19:00", "F"),
  w("F4", "TUN", "JPN", "2026-06-21", "06:00", "F"),
  w("F5", "JPN", "SWE", "2026-06-26", "01:00", "F"),
  w("F6", "TUN", "NED", "2026-06-26", "01:00", "F"),

  // ── Groep G ──────────────────────────────────
  w("G1", "BEL", "EGY", "2026-06-15", "21:00", "G"),
  w("G2", "IRN", "NZL", "2026-06-16", "03:00", "G"),
  w("G3", "BEL", "IRN", "2026-06-21", "21:00", "G"),
  w("G4", "NZL", "EGY", "2026-06-22", "03:00", "G"),
  w("G5", "EGY", "IRN", "2026-06-27", "05:00", "G"),
  w("G6", "NZL", "BEL", "2026-06-27", "05:00", "G"),

  // ── Groep H ──────────────────────────────────
  w("H1", "ESP", "CPV", "2026-06-15", "18:00", "H"),
  w("H2", "SAU", "URU", "2026-06-16", "00:00", "H"),
  w("H3", "ESP", "SAU", "2026-06-21", "18:00", "H"),
  w("H4", "URU", "CPV", "2026-06-22", "00:00", "H"),
  w("H5", "CPV", "SAU", "2026-06-27", "02:00", "H"),
  w("H6", "URU", "ESP", "2026-06-27", "02:00", "H"),

  // ── Groep I ──────────────────────────────────
  w("I1", "FRA", "SEN", "2026-06-16", "21:00", "I"),
  w("I2", "IRQ", "NOR", "2026-06-17", "00:00", "I"),
  w("I3", "FRA", "IRQ", "2026-06-22", "23:00", "I"),
  w("I4", "NOR", "SEN", "2026-06-23", "02:00", "I"),
  w("I5", "NOR", "FRA", "2026-06-26", "21:00", "I"),
  w("I6", "SEN", "IRQ", "2026-06-26", "21:00", "I"),

  // ── Groep J ──────────────────────────────────
  w("J1", "ARG", "ALG", "2026-06-17", "03:00", "J"),
  w("J2", "AUT", "JOR", "2026-06-17", "06:00", "J"),
  w("J3", "ARG", "AUT", "2026-06-22", "19:00", "J"),
  w("J4", "JOR", "ALG", "2026-06-23", "05:00", "J"),
  w("J5", "ALG", "AUT", "2026-06-28", "04:00", "J"),
  w("J6", "JOR", "ARG", "2026-06-28", "04:00", "J"),

  // ── Groep K ──────────────────────────────────
  w("K1", "POR", "COD", "2026-06-17", "19:00", "K"),
  w("K2", "UZB", "COL", "2026-06-18", "04:00", "K"),
  w("K3", "POR", "UZB", "2026-06-23", "19:00", "K"),
  w("K4", "COL", "COD", "2026-06-24", "04:00", "K"),
  w("K5", "COL", "POR", "2026-06-28", "01:30", "K"),
  w("K6", "COD", "UZB", "2026-06-28", "01:30", "K"),

  // ── Groep L ──────────────────────────────────
  w("L1", "ENG", "CRO", "2026-06-17", "22:00", "L"),
  w("L2", "GHA", "PAN", "2026-06-18", "01:00", "L"),
  w("L3", "ENG", "GHA", "2026-06-23", "22:00", "L"),
  w("L4", "PAN", "CRO", "2026-06-24", "01:00", "L"),
  w("L5", "PAN", "ENG", "2026-06-27", "23:00", "L"),
  w("L6", "CRO", "GHA", "2026-06-27", "23:00", "L"),
].sort((a, b) => `${a.datum}${a.tijd}`.localeCompare(`${b.datum}${b.tijd}`));

// Explicit match ID → LMS round mapping (group stage only; knockout rounds via LmsWedstrijd)
export const LMS_RONDE_MATCHES: Record<number, string[]> = {
  1: ["A1","A2","B1","B2","C1","C2","D1","D2","E1","E2","F1","F2","G1","G2","H1","H2","I1","I2","J1","J2","K1","K2","L1","L2"],
  2: ["A3","A4","B3","B4","C3","C4","D3","D4","E3","E4","F3","F4","G3","G4","H3","H4","I3","I4","J3","J4","K3","K4","L3","L4"],
  3: ["A5","A6","B5","B6","C5","C6","D5","D6","E5","E6","F5","F6","G5","G6","H5","H6","I5","I6","J5","J6","K5","K6","L5","L6"],
};

export function getWedstrijdenByIds(ids: string[]): Wedstrijd[] {
  return ids.flatMap((id) => {
    const match = WK_WEDSTRIJDEN.find((x) => x.id === id);
    return match ? [match] : [];
  });
}

const CL_FINALE_WEDSTRIJDEN: Wedstrijd[] = [CL_FINALE];
const OEF_NED_ALG_WEDSTRIJDEN: Wedstrijd[] = [OEF_NED_ALG];

export const wedstrijden: Wedstrijd[] = [CL_FINALE, ...WK_WEDSTRIJDEN];

export function getWedstrijdenVoorSoort(soort: string): Wedstrijd[] {
  if (soort === "cl_finale") return CL_FINALE_WEDSTRIJDEN;
  if (soort === "oefenwedstrijd") return OEF_NED_ALG_WEDSTRIJDEN;
  return WK_WEDSTRIJDEN;
}

export function getWedstrijd(id: string): Wedstrijd | undefined {
  return [...WK_WEDSTRIJDEN, CL_FINALE, OEF_NED_ALG].find((x) => x.id === id);
}

export function getGroepen(): string[] {
  return [...new Set(WK_WEDSTRIJDEN.map((x) => x.groep))].sort();
}

export function getAllWkTeams(): Team[] {
  const seen = new Set<string>();
  return Object.values(groepen)
    .flat()
    .filter((team) => { if (seen.has(team.code)) return false; seen.add(team.code); return true; })
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

export function getTeamByCode(code: string): Team | undefined {
  return Object.values(groepen).flat().find((team) => team.code === code);
}
