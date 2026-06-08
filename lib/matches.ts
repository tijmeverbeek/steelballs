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

const groepen: Record<string, Team[]> = {
  A: [
    { code: "MEX", naam: "Mexico",              vlag: "🇲🇽" },
    { code: "ZAF", naam: "Zuid-Afrika",          vlag: "🇿🇦" },
    { code: "KOR", naam: "Zuid-Korea",           vlag: "🇰🇷" },
    { code: "CZE", naam: "Tsjechië",             vlag: "🇨🇿" },
  ],
  B: [
    { code: "CAN", naam: "Canada",               vlag: "🇨🇦" },
    { code: "BIH", naam: "Bosnië-Herzegovina",   vlag: "🇧🇦" },
    { code: "QAT", naam: "Qatar",                vlag: "🇶🇦" },
    { code: "SUI", naam: "Zwitserland",          vlag: "🇨🇭" },
  ],
  C: [
    { code: "BRA", naam: "Brazilië",             vlag: "🇧🇷" },
    { code: "MAR", naam: "Marokko",              vlag: "🇲🇦" },
    { code: "HAI", naam: "Haïti",                vlag: "🇭🇹" },
    { code: "SCO", naam: "Schotland",            vlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ],
  D: [
    { code: "USA", naam: "VS",                   vlag: "🇺🇸" },
    { code: "PAR", naam: "Paraguay",             vlag: "🇵🇾" },
    { code: "AUS", naam: "Australië",            vlag: "🇦🇺" },
    { code: "TUR", naam: "Turkije",              vlag: "🇹🇷" },
  ],
  E: [
    { code: "GER", naam: "Duitsland",            vlag: "🇩🇪" },
    { code: "CUR", naam: "Curaçao",              vlag: "🇨🇼" },
    { code: "CIV", naam: "Ivoorkust",            vlag: "🇨🇮" },
    { code: "ECU", naam: "Ecuador",              vlag: "🇪🇨" },
  ],
  F: [
    { code: "NED", naam: "Nederland",            vlag: "🇳🇱" },
    { code: "JPN", naam: "Japan",                vlag: "🇯🇵" },
    { code: "SWE", naam: "Zweden",               vlag: "🇸🇪" },
    { code: "TUN", naam: "Tunesië",              vlag: "🇹🇳" },
  ],
  G: [
    { code: "BEL", naam: "België",               vlag: "🇧🇪" },
    { code: "EGY", naam: "Egypte",               vlag: "🇪🇬" },
    { code: "IRN", naam: "Iran",                 vlag: "🇮🇷" },
    { code: "NZL", naam: "Nieuw-Zeeland",        vlag: "🇳🇿" },
  ],
  H: [
    { code: "ESP", naam: "Spanje",               vlag: "🇪🇸" },
    { code: "CPV", naam: "Kaapverdië",           vlag: "🇨🇻" },
    { code: "KSA", naam: "Saoedi-Arabië",        vlag: "🇸🇦" },
    { code: "URU", naam: "Uruguay",              vlag: "🇺🇾" },
  ],
  I: [
    { code: "FRA", naam: "Frankrijk",            vlag: "🇫🇷" },
    { code: "SEN", naam: "Senegal",              vlag: "🇸🇳" },
    { code: "IRQ", naam: "Irak",                 vlag: "🇮🇶" },
    { code: "NOR", naam: "Noorwegen",            vlag: "🇳🇴" },
  ],
  J: [
    { code: "ARG", naam: "Argentinië",           vlag: "🇦🇷" },
    { code: "ALG", naam: "Algerije",             vlag: "🇩🇿" },
    { code: "AUT", naam: "Oostenrijk",           vlag: "🇦🇹" },
    { code: "JOR", naam: "Jordanië",             vlag: "🇯🇴" },
  ],
  K: [
    { code: "POR", naam: "Portugal",             vlag: "🇵🇹" },
    { code: "COD", naam: "Congo DR",             vlag: "🇨🇩" },
    { code: "UZB", naam: "Oezbekistan",          vlag: "🇺🇿" },
    { code: "COL", naam: "Colombia",             vlag: "🇨🇴" },
  ],
  L: [
    { code: "ENG", naam: "Engeland",             vlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "CRO", naam: "Kroatië",              vlag: "🇭🇷" },
    { code: "GHA", naam: "Ghana",                vlag: "🇬🇭" },
    { code: "PAN", naam: "Panama",               vlag: "🇵🇦" },
  ],
};

// Per ronde: [dag offset van 11 juni, tijd] — 12 groepen (A t/m L)
const schema: [number, string][][] = [
  // Ronde 1 (juni 11–16)
  [[0,"18:00"],[0,"21:00"],[1,"18:00"],[1,"21:00"],[2,"18:00"],[2,"21:00"],[3,"18:00"],[3,"21:00"],[4,"18:00"],[4,"21:00"],[5,"18:00"],[5,"21:00"]],
  // Ronde 2 (juni 19–24)
  [[8,"18:00"],[8,"21:00"],[9,"18:00"],[9,"21:00"],[10,"18:00"],[10,"21:00"],[11,"18:00"],[11,"21:00"],[12,"18:00"],[12,"21:00"],[13,"18:00"],[13,"21:00"]],
  // Ronde 3 (juni 27–jul 2, gelijktijdig per poule)
  [[16,"21:00"],[16,"21:00"],[17,"21:00"],[17,"21:00"],[18,"21:00"],[18,"21:00"],[19,"21:00"],[19,"21:00"],[20,"21:00"],[20,"21:00"],[21,"21:00"],[21,"21:00"]],
];

function datumVanOffset(offsetDagen: number): string {
  const start = new Date("2026-06-11");
  start.setDate(start.getDate() + offsetDagen);
  return start.toISOString().split("T")[0];
}

function genereerMatches(): Wedstrijd[] {
  const matches: Wedstrijd[] = [];
  const groepLetters = Object.keys(groepen);

  groepLetters.forEach((groep, gi) => {
    const teams = groepen[groep];
    const paren: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

    paren.forEach(([a, b], matchIndex) => {
      const ronde = Math.floor(matchIndex / 2);
      const [dagOffset, tijd] = schema[ronde][gi];

      matches.push({
        id: `${groep}${matchIndex + 1}`,
        thuis: teams[a],
        uit: teams[b],
        datum: datumVanOffset(dagOffset),
        tijd,
        groep: `Groep ${groep}`,
        fase: "groepsfase",
      });
    });
  });

  return matches.sort((a, b) => `${a.datum}${a.tijd}`.localeCompare(`${b.datum}${b.tijd}`));
}

const WK_WEDSTRIJDEN: Wedstrijd[] = genereerMatches();
const CL_FINALE_WEDSTRIJDEN: Wedstrijd[] = [CL_FINALE];
const OEF_NED_ALG_WEDSTRIJDEN: Wedstrijd[] = [OEF_NED_ALG];

export const wedstrijden: Wedstrijd[] = [CL_FINALE, ...WK_WEDSTRIJDEN];

export function getWedstrijdenVoorSoort(soort: string): Wedstrijd[] {
  if (soort === "cl_finale") return CL_FINALE_WEDSTRIJDEN;
  if (soort === "oefenwedstrijd") return OEF_NED_ALG_WEDSTRIJDEN;
  return WK_WEDSTRIJDEN;
}

export function getWedstrijd(id: string): Wedstrijd | undefined {
  return [...WK_WEDSTRIJDEN, CL_FINALE, OEF_NED_ALG].find((w) => w.id === id);
}

export function getGroepen(): string[] {
  return [...new Set(WK_WEDSTRIJDEN.map((w) => w.groep))].sort();
}

export function getWkTeams(): Team[] {
  const seen = new Set<string>();
  const teams: Team[] = [];
  for (const teams4 of Object.values(groepen)) {
    for (const t of teams4) {
      if (!seen.has(t.code)) {
        seen.add(t.code);
        teams.push(t);
      }
    }
  }
  return teams;
}
