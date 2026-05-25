"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SpelerProfiel {
  gebruikersnaam: string;
  aantalWinsten: number;
  aantalPoules: number;
  poules: {
    naam: string;
    afgerond: boolean;
    gewonnen: boolean;
    aantalDeelnemers: number;
    aangemaaktOp: string;
  }[];
}

function Initialen({ naam }: { naam: string }) {
  const parts = naam.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : naam.slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-black text-zinc-300 uppercase">
      {letters}
    </div>
  );
}

export default function SpelerPagina() {
  const { gebruikersnaam } = useParams<{ gebruikersnaam: string }>();
  const router = useRouter();
  const [profiel, setProfiel] = useState<SpelerProfiel | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    fetch(`/api/speler/${encodeURIComponent(gebruikersnaam)}`)
      .then((r) => {
        if (r.status === 404) { router.push("/"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setProfiel(data);
        setLaden(false);
      })
      .catch(() => setLaden(false));
  }, [gebruikersnaam, router]);

  if (laden) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profiel) return null;

  const winRatio = profiel.aantalPoules > 0
    ? Math.round((profiel.aantalWinsten / profiel.aantalPoules) * 100)
    : 0;

  const afgerond = profiel.poules.filter((p) => p.afgerond);
  const actief = profiel.poules.filter((p) => !p.afgerond);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
            ← STEELBALLS
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* ── Profiel header ── */}
        <div className="flex items-center gap-5">
          <Initialen naam={profiel.gebruikersnaam} />
          <div>
            <h1 className="text-2xl font-black text-white">{profiel.gebruikersnaam}</h1>
            {profiel.aantalWinsten > 0 ? (
              <p className="text-yellow-400 font-semibold text-sm mt-0.5">
                🏆 {profiel.aantalWinsten} toernooi{profiel.aantalWinsten !== 1 ? "en" : ""} gewonnen
              </p>
            ) : (
              <p className="text-zinc-500 text-sm mt-0.5">Nog geen toernooien gewonnen</p>
            )}
          </div>
        </div>

        {/* ── Statistieken ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-white">{profiel.aantalPoules}</p>
            <p className="text-xs text-zinc-500 mt-1">gespeeld</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-yellow-400">{profiel.aantalWinsten}</p>
            <p className="text-xs text-zinc-500 mt-1">gewonnen</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-white">{winRatio}%</p>
            <p className="text-xs text-zinc-500 mt-1">winratio</p>
          </div>
        </div>

        {/* ── Actieve poules ── */}
        {actief.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Actieve poules ({actief.length})
            </p>
            <div className="space-y-2">
              {actief.map((p, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{p.naam}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {p.aantalDeelnemers} deelnemer{p.aantalDeelnemers !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full">actief</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Afgeronde poules ── */}
        {afgerond.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Afgeronde poules ({afgerond.length})
            </p>
            <div className="space-y-2">
              {afgerond.map((p, i) => (
                <div
                  key={i}
                  className={`bg-zinc-900 rounded-2xl px-5 py-4 flex items-center justify-between border ${p.gewonnen ? "border-yellow-500/30" : "border-zinc-800"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {p.gewonnen && <span className="text-base">🏆</span>}
                      <p className="font-semibold text-white">{p.naam}</p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {p.aantalDeelnemers} deelnemer{p.aantalDeelnemers !== 1 ? "s" : ""} · {new Date(p.aangemaaktOp).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.gewonnen ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {p.gewonnen ? "gewonnen" : "deelgenomen"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profiel.aantalPoules === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">Nog geen poules gespeeld.</p>
        )}
      </main>
    </div>
  );
}
