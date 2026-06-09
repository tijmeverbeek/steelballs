export type SpecialType = "speler" | "tekst" | "nummer";

export interface SpecialCategorie {
  key: string;
  label: string;
  prijsNaam?: string;
  beschrijving: string;
  type: SpecialType;
  adminKiest?: boolean;
}

export const SPECIALS_CATEGORIEEN: SpecialCategorie[] = [
  {
    key: "topscorer",
    label: "Topscorer",
    beschrijving: "Wie wordt topscorer van het hele WK 2026?",
    type: "speler",
  },
  {
    key: "topscorer_doelpunten",
    label: "Aantal doelpunten topscorer",
    beschrijving: "Hoeveel doelpunten scoort de topscorer van het WK 2026?",
    type: "nummer",
  },
  {
    key: "meeste_gele_kaarten",
    label: "Meeste gele kaarten",
    prijsNaam: "Tommy Beugelsdijk prijs",
    beschrijving: "Welke speler krijgt de meeste gele kaarten op het WK?",
    type: "speler",
  },
  {
    key: "gele_kaarten_aantal",
    label: "Aantal gele kaarten",
    prijsNaam: "Tommy Beugelsdijk prijs",
    beschrijving: "Hoeveel gele kaarten krijgt die speler in totaal?",
    type: "nummer",
  },
  {
    key: "doelpunt_toernooi",
    label: "Doelpunt van het toernooi",
    beschrijving: "Wie scoort het mooiste doelpunt van het toernooi?",
    type: "speler",
  },
  {
    key: "totaal_penalties",
    label: "Totaal aantal penalties",
    prijsNaam: "Stervende Swaan prijs",
    beschrijving: "Hoeveel penalties worden er totaal genomen op het WK (inclusief penalty series)?",
    type: "nummer",
  },
  {
    key: "var_afgekeurd",
    label: "VAR afgekeurde goals",
    prijsNaam: "Toon's toevoeging",
    beschrijving: "Hoeveel goals worden er afgekeurd door de VAR op het hele WK?",
    type: "nummer",
  },
];
