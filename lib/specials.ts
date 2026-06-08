export interface SpecialCategorie {
  key: string;
  label: string;
  beschrijving: string;
  type: "speler";
}

export const SPECIALS_CATEGORIEEN: SpecialCategorie[] = [
  {
    key: "topscorer",
    label: "Topscorer",
    beschrijving: "Wie wordt topscorer van het hele WK 2026?",
    type: "speler",
  },
  {
    key: "meeste_gele_kaarten",
    label: "Meeste gele kaarten",
    beschrijving: "Welke speler krijgt de meeste gele kaarten op het WK?",
    type: "speler",
  },
  {
    key: "mooiste_doelpunt",
    label: "Mooiste doelpunt",
    beschrijving: "Wie scoort het mooiste doelpunt van het toernooi?",
    type: "speler",
  },
];
