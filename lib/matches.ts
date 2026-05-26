import { Team, Wedstrijd } from "./types";

export const CL_FINALE: Wedstrijd = {
  id: "CL1",
  thuis: { code: "PSG", naam: "PSG", vlag: "🇫🇷", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
  uit: { code: "ARS", naam: "Arsenal", vlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  datum: "2026-05-30",
  tijd: "21:00",
  groep: "CL Finale",
  fase: "knockout",
};

const groepen: Record<string, Team[]> = {
  A: [
    { code: "NED", naam: "Nederland", vlag: "🇳🇱" },
    { code: "SEN", naam: "Senegal", vlag: "🇸🇳" },
    { code: "PER", naam: "Peru", vlag: "🇵🇪" },
    { code: "NZL", naam: "Nieuw-Zeeland", vlag: "🇳🇿" },
  ],
  B: [
    { code: "ARG", naam: "Argentinië", vlag: "🇦🇷" },
    { code: "USA", naam: "VS", vlag: "🇺🇸" },
    { code: "MEX", naam: "Mexico", vlag: "🇲🇽" },
    { code: "MAR", naam: "Marokko", vlag: "🇲🇦" },
  ],
  C: [
    { code: "BRA", naam: "Brazilië", vlag: "🇧🇷" },
    { code: "CRO", naam: "Kroatië", vlag: "🇭🇷" },
    { code: "SUI", naam: "Zwitserland", vlag: "🇨🇭" },
    { code: "AUS", naam: "Australië", vlag: "🇦🇺" },
  ],
  D: [
    { code: "GER", naam: "Duitsland", vlag: "🇩🇪" },
    { code: "POR", naam: "Portugal", vlag: "🇵🇹" },
    { code: "TUR", naam: "Turkije", vlag: "🇹🇷" },
    { code: "ESP", naam: "Spanje", vlag: "🇪🇸" },
  ],
  E: [
    { code: "ENG", naam: "Engeland", vlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "URU", naam: "Uruguay", vlag: "🇺🇾" },
    { code: "SRB", naam: "Servië", vlag: "🇷🇸" },
    { code: "CIV", naam: "Ivoorkust", vlag: "🇨🇮" },
  ],
  F: [
    { code: "FRA", naam: "Frankrijk", vlag: "🇫🇷" },
    { code: "NGA", naam: "Nigeria", vlag: "🇳🇬" },
    { code: "COL", naam: "Colombia", vlag: "🇨🇴" },
    { code: "ECU", naam: "Ecuador", vlag: "🇪🇨" },
  ],
  G: [
    { code: "BEL", naam: "België", vlag: "🇧🇪" },
    { code: "JPN", naam: "Japan", vlag: "🇯🇵" },
    { code: "KOR", naam: "Zuid-Korea", vlag: "🇰🇷" },
    { code: "CHI", naam: "Chili", vlag: "🇨🇱" },
  ],
  H: [
    { code: "MEX", naam: "Mexico", vlag: "🇲🇽" },
    { code: "POL", naam: "Polen", vlag: "🇵🇱" },
    { code: "CMR", naam: "Kameroen", vlag: "🇨🇲" },
    { code: "QAT", naam: "Qatar", vlag: "🇶🇦" },
  ],
};

// Per ronde: [dag offset van 11 juni, tijd]
const schema: [number, string][][] = [
  // Ronde 1 (juni 11–14)
  [[0, "18:00"], [0, "21:00"], [1, "18:00"], [1, "21:00"], [2, "18:00"], [2, "21:00"], [3, "18:00"], [3, "21:00"]],
  // Ronde 2 (juni 17–20)
  [[6, "18:00"], [6, "21:00"], [7, "18:00"], [7, "21:00"], [8, "18:00"], [8, "21:00"], [9, "18:00"], [9, "21:00"]],
  // Ronde 3 (juni 23–26, gelijktijdig)
  [[12, "21:00"], [12, "21:00"], [13, "21:00"], [13, "21:00"], [14, "21:00"], [14, "21:00"], [15, "21:00"], [15, "21:00"]],
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
    // 6 wedstrijden per groep: ronde-robin
    const paren: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

    paren.forEach(([a, b], matchIndex) => {
      const ronde = Math.floor(matchIndex / 2);
      const slot = ronde === 2 ? matchIndex - 4 : matchIndex % 2;
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

export const wedstrijden: Wedstrijd[] = [CL_FINALE, ...WK_WEDSTRIJDEN];

export function getWedstrijdenVoorSoort(soort: string): Wedstrijd[] {
  return soort === "cl_finale" ? CL_FINALE_WEDSTRIJDEN : WK_WEDSTRIJDEN;
}

export function getWedstrijd(id: string): Wedstrijd | undefined {
  return wedstrijden.find((w) => w.id === id);
}

export function getGroepen(): string[] {
  return [...new Set(wedstrijden.map((w) => w.groep))].sort();
}
