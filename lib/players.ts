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
  { naam: "Quentin Ndjantou",       positie: "AAN", team: "PSG" },
  { naam: "Ibrahim Mbaye",          positie: "AAN", team: "PSG" },
  // ── PSG – Middenvelders ───────────────────────────────────
  { naam: "Vitinha",                positie: "MID", team: "PSG" },
  { naam: "Fabian Ruiz",            positie: "MID", team: "PSG" },
  { naam: "Warren Zaïre-Emery",     positie: "MID", team: "PSG" },
  { naam: "João Neves",             positie: "MID", team: "PSG" },
  { naam: "Lee Kang-in",            positie: "MID", team: "PSG" },
  { naam: "Senny Mayulu",           positie: "MID", team: "PSG" },
  { naam: "Dro Fernández",          positie: "MID", team: "PSG" },
  // ── PSG – Verdedigers ─────────────────────────────────────
  { naam: "Achraf Hakimi",          positie: "VER", team: "PSG" },
  { naam: "Marquinhos",             positie: "VER", team: "PSG" },
  { naam: "Willian Pacho",          positie: "VER", team: "PSG" },
  { naam: "Lucas Hernández",        positie: "VER", team: "PSG" },
  { naam: "Nuno Mendes",            positie: "VER", team: "PSG" },
  { naam: "Lucas Beraldo",          positie: "VER", team: "PSG" },
  { naam: "Illia Zabarnyi",         positie: "VER", team: "PSG" },
  // ── PSG – Doelmannen ──────────────────────────────────────
  { naam: "Matvey Safonov",         positie: "DOE", team: "PSG" },
  { naam: "Lucas Chevalier",        positie: "DOE", team: "PSG" },
  { naam: "Renato Marin",           positie: "DOE", team: "PSG" },

  // ── Arsenal – Aanvallers ──────────────────────────────────
  { naam: "Viktor Gyökeres",        positie: "AAN", team: "Arsenal" },
  { naam: "Bukayo Saka",            positie: "AAN", team: "Arsenal" },
  { naam: "Eberechi Eze",           positie: "AAN", team: "Arsenal" },
  { naam: "Gabriel Martinelli",     positie: "AAN", team: "Arsenal" },
  { naam: "Noni Madueke",           positie: "AAN", team: "Arsenal" },
  { naam: "Leandro Trossard",       positie: "AAN", team: "Arsenal" },
  { naam: "Kai Havertz",            positie: "AAN", team: "Arsenal" },
  { naam: "Gabriel Jesus",          positie: "AAN", team: "Arsenal" },
  // ── Arsenal – Middenvelders ───────────────────────────────
  { naam: "Martin Ødegaard",        positie: "MID", team: "Arsenal" },
  { naam: "Declan Rice",            positie: "MID", team: "Arsenal" },
  { naam: "Mikel Merino",           positie: "MID", team: "Arsenal" },
  { naam: "Martin Zubimendi",       positie: "MID", team: "Arsenal" },
  { naam: "Christian Nørgaard",     positie: "MID", team: "Arsenal" },
  // ── Arsenal – Verdedigers ─────────────────────────────────
  { naam: "William Saliba",         positie: "VER", team: "Arsenal" },
  { naam: "Gabriel Magalhães",      positie: "VER", team: "Arsenal" },
  { naam: "Riccardo Calafiori",     positie: "VER", team: "Arsenal" },
  { naam: "Myles Lewis-Skelly",     positie: "VER", team: "Arsenal" },
  { naam: "Piero Hincapié",         positie: "VER", team: "Arsenal" },
  { naam: "Cristhian Mosquera",     positie: "VER", team: "Arsenal" },
  { naam: "Jurrien Timber",         positie: "VER", team: "Arsenal" },
  { naam: "Ben White",              positie: "VER", team: "Arsenal" },
  // ── Arsenal – Doelmannen ──────────────────────────────────
  { naam: "David Raya",             positie: "DOE", team: "Arsenal" },
  { naam: "Kepa Arrizabalaga",      positie: "DOE", team: "Arsenal" },
  { naam: "Tommy Setford",          positie: "DOE", team: "Arsenal" },
];

// WK 2026 selecties worden hier toegevoegd zodra ze bekend zijn (begin juni 2026)
const WK_SPELERS: Speler[] = [];

// NED vs ALG oefenwedstrijd 3 juni 2026 — WK-selecties
const OEF_NED_ALG_SPELERS: Speler[] = [
  // ── Nederland – Aanvallers ────────────────────────────────
  { naam: "Cody Gakpo",              positie: "AAN", team: "NED" },
  { naam: "Donyell Malen",           positie: "AAN", team: "NED" },
  { naam: "Brian Brobbey",           positie: "AAN", team: "NED" },
  { naam: "Noa Lang",                positie: "AAN", team: "NED" },
  { naam: "Memphis Depay",           positie: "AAN", team: "NED" },
  { naam: "Crysencio Summerville",   positie: "AAN", team: "NED" },
  { naam: "Wout Weghorst",           positie: "AAN", team: "NED" },
  { naam: "Justin Kluivert",         positie: "AAN", team: "NED" },
  // ── Nederland – Middenvelders ─────────────────────────────
  { naam: "Tijjani Reijnders",       positie: "MID", team: "NED" },
  { naam: "Frenkie de Jong",         positie: "MID", team: "NED" },
  { naam: "Ryan Gravenberch",        positie: "MID", team: "NED" },
  { naam: "Teun Koopmeiners",        positie: "MID", team: "NED" },
  { naam: "Marten de Roon",          positie: "MID", team: "NED" },
  { naam: "Guus Til",                positie: "MID", team: "NED" },
  { naam: "Quinten Timber",          positie: "MID", team: "NED" },
  { naam: "Mats Wieffer",            positie: "MID", team: "NED" },
  // ── Nederland – Verdedigers ───────────────────────────────
  { naam: "Virgil van Dijk",         positie: "VER", team: "NED" },
  { naam: "Denzel Dumfries",         positie: "VER", team: "NED" },
  { naam: "Micky van de Ven",        positie: "VER", team: "NED" },
  { naam: "Nathan Aké",              positie: "VER", team: "NED" },
  { naam: "Jan Paul van Hecke",      positie: "VER", team: "NED" },
  { naam: "Jurriën Timber",          positie: "VER", team: "NED" },
  { naam: "Jorrel Hato",             positie: "VER", team: "NED" },
  // ── Nederland – Doelmannen ────────────────────────────────
  { naam: "Bart Verbruggen",         positie: "DOE", team: "NED" },

  // ── Algerije – Aanvallers ─────────────────────────────────
  { naam: "Riyad Mahrez",            positie: "AAN", team: "ALG" },
  { naam: "Amine Gouiri",            positie: "AAN", team: "ALG" },
  { naam: "Mohamed Amine Amoura",    positie: "AAN", team: "ALG" },
  { naam: "Farès Chaïbi",            positie: "AAN", team: "ALG" },
  { naam: "Nadhir Ben Bouali",       positie: "AAN", team: "ALG" },
  { naam: "Anis Haj Moussa",         positie: "AAN", team: "ALG" },
  // ── Algerije – Middenvelders ──────────────────────────────
  { naam: "Hicham Boudaoui",         positie: "MID", team: "ALG" },
  { naam: "Houssem Aouar",           positie: "MID", team: "ALG" },
  { naam: "Ramiz Zerrouki",          positie: "MID", team: "ALG" },
  { naam: "Nabil Bentaleb",          positie: "MID", team: "ALG" },
  { naam: "Ismael Bennacer",         positie: "MID", team: "ALG" },
  { naam: "Yacine Titraoui",         positie: "MID", team: "ALG" },
  { naam: "Ibrahim Maza",            positie: "MID", team: "ALG" },
  // ── Algerije – Verdedigers ────────────────────────────────
  { naam: "Ramy Bensebaini",         positie: "VER", team: "ALG" },
  { naam: "Aïssa Mandi",             positie: "VER", team: "ALG" },
  { naam: "Rayan Aït-Nouri",         positie: "VER", team: "ALG" },
  { naam: "Rafiq Belghali",          positie: "VER", team: "ALG" },
  { naam: "Zinedine Belaid",         positie: "VER", team: "ALG" },
  // ── Algerije – Doelmannen ─────────────────────────────────
  { naam: "Luca Zidane",             positie: "DOE", team: "ALG" },
];

export function getSpelers(soort: string): Speler[] {
  if (soort === "cl_finale") return CL_FINALE_SPELERS;
  if (soort === "oefenwedstrijd") return OEF_NED_ALG_SPELERS;
  if (soort === "wk") return WK_SPELERS;
  return [];
}
