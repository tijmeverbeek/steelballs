export type Positie = "AAN" | "MID" | "VER" | "DOE";

export interface Speler {
  naam: string;
  positie: Positie;
  team: string;
}

// Order: AAN → MID → VER → DOE (meeste kans op scoren eerst)
// Verifieer/update dit bestand wanneer de definitieve selecties bekend zijn
const CL_FINALE_SPELERS: Speler[] = [
  // ── PSG – Aanvallers ──────────────────────────────────────
  { naam: "Ousmane Dembélé",        positie: "AAN", team: "PSG" },
  { naam: "Khvicha Kvaratskhelia",  positie: "AAN", team: "PSG" },
  { naam: "Bradley Barcola",        positie: "AAN", team: "PSG" },
  { naam: "Désiré Doué",            positie: "AAN", team: "PSG" },
  { naam: "Gonçalo Ramos",          positie: "AAN", team: "PSG" },
  { naam: "Lee Kang-in",            positie: "AAN", team: "PSG" },
  // ── PSG – Middenvelders ───────────────────────────────────
  { naam: "Vitinha",                positie: "MID", team: "PSG" },
  { naam: "Fabian Ruiz",            positie: "MID", team: "PSG" },
  { naam: "Warren Zaïre-Emery",     positie: "MID", team: "PSG" },
  { naam: "João Neves",             positie: "MID", team: "PSG" },
  { naam: "Marco Asensio",          positie: "MID", team: "PSG" },
  // ── PSG – Verdedigers ─────────────────────────────────────
  { naam: "Achraf Hakimi",          positie: "VER", team: "PSG" },
  { naam: "Marquinhos",             positie: "VER", team: "PSG" },
  { naam: "Willian Pacho",          positie: "VER", team: "PSG" },
  { naam: "Lucas Hernández",        positie: "VER", team: "PSG" },
  { naam: "Nuno Mendes",            positie: "VER", team: "PSG" },
  { naam: "Lucas Beraldo",          positie: "VER", team: "PSG" },
  { naam: "Milan Škriniar",         positie: "VER", team: "PSG" },
  // ── PSG – Doelmannen ──────────────────────────────────────
  { naam: "Gianluigi Donnarumma",   positie: "DOE", team: "PSG" },
  { naam: "Matvey Safonov",         positie: "DOE", team: "PSG" },

  // ── Arsenal – Aanvallers ──────────────────────────────────
  { naam: "Bukayo Saka",            positie: "AAN", team: "Arsenal" },
  { naam: "Gabriel Martinelli",     positie: "AAN", team: "Arsenal" },
  { naam: "Leandro Trossard",       positie: "AAN", team: "Arsenal" },
  { naam: "Kai Havertz",            positie: "AAN", team: "Arsenal" },
  { naam: "Gabriel Jesus",          positie: "AAN", team: "Arsenal" },
  { naam: "Eddie Nketiah",          positie: "AAN", team: "Arsenal" },
  // ── Arsenal – Middenvelders ───────────────────────────────
  { naam: "Martin Ødegaard",        positie: "MID", team: "Arsenal" },
  { naam: "Declan Rice",            positie: "MID", team: "Arsenal" },
  { naam: "Thomas Partey",          positie: "MID", team: "Arsenal" },
  { naam: "Jorginho",               positie: "MID", team: "Arsenal" },
  { naam: "Ethan Nwaneri",          positie: "MID", team: "Arsenal" },
  // ── Arsenal – Verdedigers ─────────────────────────────────
  { naam: "Ben White",              positie: "VER", team: "Arsenal" },
  { naam: "William Saliba",         positie: "VER", team: "Arsenal" },
  { naam: "Gabriel Magalhães",      positie: "VER", team: "Arsenal" },
  { naam: "Oleksandr Zinchenko",    positie: "VER", team: "Arsenal" },
  { naam: "Takehiro Tomiyasu",      positie: "VER", team: "Arsenal" },
  { naam: "Jakub Kiwior",           positie: "VER", team: "Arsenal" },
  { naam: "Riccardo Calafiori",     positie: "VER", team: "Arsenal" },
  { naam: "Jurrien Timber",         positie: "VER", team: "Arsenal" },
  // ── Arsenal – Doelmannen ──────────────────────────────────
  { naam: "David Raya",             positie: "DOE", team: "Arsenal" },
  { naam: "Neto",                   positie: "DOE", team: "Arsenal" },
];

// WK 2026 selecties worden hier toegevoegd zodra ze bekend zijn (begin juni 2026)
const WK_SPELERS: Speler[] = [];

export function getSpelers(soort: string): Speler[] {
  if (soort === "cl_finale") return CL_FINALE_SPELERS;
  if (soort === "wk") return WK_SPELERS;
  return [];
}
