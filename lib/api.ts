import { Poule, Voorspelling } from "./types";

export async function createPoule(naam: string): Promise<{ code: string; deelnemerId: string }> {
  const res = await fetch("/api/poules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naam }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Aanmaken mislukt (${res.status})`);
  }
  return res.json();
}

export async function joinPoule(code: string): Promise<{ deelnemerId: string } | null> {
  const res = await fetch(`/api/poules/${code}/deelnemers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Deelnemen mislukt");
  return res.json();
}

export async function getPoule(code: string): Promise<Poule | null> {
  const res = await fetch(`/api/poules/${code}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Ophalen mislukt");
  return res.json();
}

export async function saveVoorspellingen(
  code: string,
  deelnemerId: string,
  voorspellingen: Voorspelling[],
  speciale?: {
    topscorerVoorspelling?: string | null;
    geleKaartenVoorspelling?: string | null;
    toernooiwinaarVoorspelling?: string | null;
    eersteDoelpuntenmakerVoorspelling?: string | null;
    eersteDoelpuntenminuutVoorspelling?: number | null;
  }
): Promise<void> {
  const res = await fetch(`/api/poules/${code}/deelnemers/${deelnemerId}/voorspellingen`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voorspellingen, ...speciale }),
  });
  if (!res.ok) throw new Error("Opslaan mislukt");
}

export async function slaMatchResultaatOp(
  code: string,
  wedstrijdId: string,
  thuis: number,
  uit: number
): Promise<void> {
  const res = await fetch(`/api/poules/${code}/resultaat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wedstrijdId, thuis, uit }),
  });
  if (!res.ok) throw new Error("Resultaat opslaan mislukt");
}

export async function updatePouleInstellingen(
  code: string,
  instellingen: {
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    toernooiwinaarActief?: boolean;
    eersteDoelpuntenmakerActief?: boolean;
    eersteDoelpuntenminuutActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
    toernooiwinaarResultaat?: string | null;
    eersteDoelpuntenmakerResultaat?: string | null;
    eersteDoelpuntenminuutResultaat?: number | null;
  }
): Promise<void> {
  const res = await fetch(`/api/poules/${code}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(instellingen),
  });
  if (!res.ok) throw new Error("Bijwerken mislukt");
}

export async function rondeAfPoule(code: string): Promise<{ winnaarId: string }> {
  const res = await fetch(`/api/poules/${code}/afronden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Afronden mislukt");
  return res.json();
}
