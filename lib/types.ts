export interface Team {
  code: string;
  naam: string;
  vlag: string;
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

export interface Deelnemer {
  id: string;
  userId: string;
  user: { gebruikersnaam: string | null; email: string };
  voorspellingen: Voorspelling[];
  topscorerVoorspelling?: string | null;
  geleKaartenVoorspelling?: string | null;
}

export interface Poule {
  id: string;
  naam: string;
  code: string;
  deelnemers: Deelnemer[];
  aangemaaktOp: string;
  resultaten: Record<string, { thuis: number; uit: number }>;
  organisatorId?: string | null;
  topscorerActief: boolean;
  geleKaartenActief: boolean;
  topscorerResultaat?: string | null;
  geleKaartenResultaat?: string | null;
}
