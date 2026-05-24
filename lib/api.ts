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
  speciale?: { topscorerVoorspelling?: string | null; geleKaartenVoorspelling?: string | null }
): Promise<void> {
  const res = await fetch(`/api/poules/${code}/deelnemers/${deelnemerId}/voorspellingen`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voorspellingen, ...speciale }),
  });
  if (!res.ok) throw new Error("Opslaan mislukt");
}

export async function updatePouleInstellingen(
  code: string,
  instellingen: {
    topscorerActief?: boolean;
    geleKaartenActief?: boolean;
    topscorerResultaat?: string | null;
    geleKaartenResultaat?: string | null;
  }
): Promise<void> {
  const res = await fetch(`/api/poules/${code}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(instellingen),
  });
  if (!res.ok) throw new Error("Bijwerken mislukt");
}
