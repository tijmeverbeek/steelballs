export interface Team {
  code: string;
  naam: string;
  vlag: string;
  logo?: string; // URL naar clublogo; als afwezig: toon vlag emoji
}

export interface Wedstrijd {
  id: string;
  thuis: Team;
  uit: Team;
  datum: string;
  tijd: string;
  groep: string;
  fase: "groepsfase" | "knockout";
}

export interface Voorspelling {
  wedstrijdId: string;
  thuis: number | null;
  uit: number | null;
}

export interface LmsPick {
  rondeNr: number;
  teamCode: string;
  wedstrijdId: string;
  uitkomst: string | null;
}

export interface Deelnemer {
  id: string;
  userId: string;
  user: { gebruikersnaam: string | null; email: string; naam?: string | null; isAdmin?: boolean };
  voorspellingen: Voorspelling[];
  topscorerVoorspelling?: string | null;
  geleKaartenVoorspelling?: string | null;
  toernooiwinaarVoorspelling?: string | null;
  eersteDoelpuntenmakerVoorspelling?: string | null;
  eersteDoelpuntenminuutVoorspelling?: number | null;
  cornersVoorspelling?: number | null;
  schotenOpDoelVoorspelling?: number | null;
  eersteKaartSpelerVoorspelling?: string | null;
  eersteKaartMinuutVoorspelling?: number | null;
  lmsActief?: boolean;
  lmsUitgeschakeldRonde?: number | null;
  lmsPicks?: LmsPick[];
  betaald?: boolean;
}

export interface Poule {
  id: string;
  naam: string;
  code: string;
  soort: string;
  deelnemers: Deelnemer[];
  aangemaaktOp: string;
  resultaten: Record<string, { thuis: number; uit: number }>;
  organisatorId?: string | null;
  topscorerActief: boolean;
  geleKaartenActief: boolean;
  toernooiwinaarActief: boolean;
  eersteDoelpuntenmakerActief: boolean;
  eersteDoelpuntenminuutActief: boolean;
  topscorerResultaat?: string | null;
  geleKaartenResultaat?: string | null;
  toernooiwinaarResultaat?: string | null;
  eersteDoelpuntenmakerResultaat?: string | null;
  eersteDoelpuntenminuutResultaat?: number | null;
  cornersActief: boolean;
  cornersResultaat?: number | null;
  schotenOpDoelActief: boolean;
  schotenOpDoelResultaat?: number | null;
  eersteKaartActief: boolean;
  eersteKaartSpelerResultaat?: string | null;
  eersteKaartMinuutActief: boolean;
  eersteKaartMinuutResultaat?: number | null;
  uitslagActief: boolean;
  wkWedstrijdId?: string | null;
  afgerond: boolean;
  winnaarId?: string | null;
  liveStats?: Record<string, string>;
  featured?: boolean;
}
