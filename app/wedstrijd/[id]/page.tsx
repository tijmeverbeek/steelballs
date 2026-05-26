"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWedstrijd } from "@/lib/matches";
import { getSpelers, Speler, Positie } from "@/lib/players";
import { getStadion } from "@/lib/stadions";
import { Wedstrijd } from "@/lib/types";

interface Resultaat {
  wedstrijdId: string;
  thuis: number;
  uit: number;
}

const POSITIE_LABEL: Record<Positie, string> = {
  AAN: "Aanvallers",
  MID: "Middenvelders",
  VER: "Verdedigers",
  DOE: "Keeper",
};

const POSITIE_VOLGORDE: Positie[] = ["AAN", "MID", "VER", "DOE"];

function formatDatum(datum: string): string {
  const d = new Date(datum + "T00:00:00");
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function isGestart(wedstrijd: Wedstrijd): boolean {
  const now = new Date();
  const matchStart = new Date(`${wedstrijd.datum}T${wedstrijd.tijd}:00`);
  return now >= matchStart;
}

function SpelerGroep({ spelers, teamCode }: { spelers: Speler[]; teamCode: string }) {
  const teamSpelers = spelers.filter((s) => s.team === teamCode);

  if (teamSpelers.length === 0) {
    return (
      <p className="text-xs text-zinc-500 italic">Selectie nog niet beschikbaar</p>
    );
  }

  return (
    <div className="space-y-3">
      {POSITIE_VOLGORDE.map((pos) => {
        const groep = teamSpelers.filter((s) => s.positie === pos);
        if (groep.length === 0) return null;
        return (
          <div key={pos}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
              {POSITIE_LABEL[pos]}
            </p>
            <ul className="space-y-1">
              {groep.map((s) => (
                <li key={s.naam} className="text-sm text-zinc-300">
                  {s.naam}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function WedstrijdPagina() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resultaat, setResultaat] = useState<Resultaat | null | undefined>(undefined);
  const [laden, setLaden] = useState(true);

  const wedstrijd = getWedstrijd(id);

  useEffect(() => {
    fetch(`/api/wedstrijden/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        setResultaat(data.resultaat ?? null);
        setLaden(false);
      })
      .catch(() => {
        setResultaat(null);
        setLaden(false);
      });
  }, [id]);

  if (laden) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!wedstrijd) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <p className="text-zinc-400 text-sm">Wedstrijd niet gevonden</p>
      </div>
    );
  }

  const soort = wedstrijd.id === "CL1" ? "cl_finale" : "wk";
  const spelers = getSpelers(soort);
  const stadion = getStadion(wedstrijd.groep);
  const gestart = isGestart(wedstrijd);

  let scoreDisplay: string;
  if (resultaat != null) {
    scoreDisplay = `${resultaat.thuis} – ${resultaat.uit}`;
  } else if (gestart) {
    scoreDisplay = "Bezig";
  } else {
    scoreDisplay = wedstrijd.tijd;
  }

  const scoreKlasse =
    resultaat != null
      ? "text-4xl font-black text-white"
      : gestart
      ? "text-2xl font-bold text-yellow-400"
      : "text-2xl font-bold text-zinc-400";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-5 py-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            ← Terug
          </button>
          <span className="text-zinc-700 text-xs">|</span>
          <h1 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Wedstrijd
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* ── Teams banner ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Thuis */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-6xl">{wedstrijd.thuis.vlag}</span>
              <p className="font-bold text-white text-center text-sm leading-tight">
                {wedstrijd.thuis.naam}
              </p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className={scoreKlasse}>{scoreDisplay}</span>
            </div>

            {/* Uit */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-6xl">{wedstrijd.uit.vlag}</span>
              <p className="font-bold text-white text-center text-sm leading-tight">
                {wedstrijd.uit.naam}
              </p>
            </div>
          </div>
        </div>

        {/* ── Info row ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-zinc-300">{formatDatum(wedstrijd.datum)}</span>
          {stadion && (
            <span className="text-zinc-500">
              {stadion.naam}, {stadion.stad}
            </span>
          )}
          <span className="bg-zinc-800 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
            {wedstrijd.groep}
          </span>
        </div>

        {/* ── Selecties ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Selecties</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            {/* Thuis team */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {wedstrijd.thuis.vlag} {wedstrijd.thuis.naam}
              </p>
              <SpelerGroep spelers={spelers} teamCode={wedstrijd.thuis.code} />
            </div>
            {/* Uit team */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {wedstrijd.uit.vlag} {wedstrijd.uit.naam}
              </p>
              <SpelerGroep spelers={spelers} teamCode={wedstrijd.uit.code} />
            </div>
          </div>
        </div>

        {/* ── Opstelling ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-5">
          <h2 className="font-bold text-white mb-2">Opstelling</h2>
          <p className="text-sm text-zinc-500">
            Opstelling wordt ca. 1 uur voor aftrap bekendgemaakt
          </p>
        </div>

      </main>
    </div>
  );
}
