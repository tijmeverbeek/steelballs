"use client";

import { Component, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, updatePouleInstellingen } from "@/lib/api";
import { berekenPunten, TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN } from "@/lib/storage";
import { wedstrijden } from "@/lib/matches";
import { createClient } from "@/lib/supabase/client";
import { Poule } from "@/lib/types";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
          <p className="text-red-400 text-sm break-all">Render fout: {this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const MEDAILLES = ["🥇", "🥈", "🥉"];

function Initialen({ naam }: { naam: string }) {
  const parts = naam.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : naam.slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase flex-shrink-0">
      {letters}
    </div>
  );
}

function deelnemerNaam(d: { user: { gebruikersnaam: string | null; email: string } }) {
  return d.user.gebruikersnaam ?? d.user.email.split("@")[0];
}

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${aan ? "bg-green-500" : "bg-zinc-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aan ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function PoulePagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [mijnUserId, setMijnUserId] = useState<string | null>(null);
  const [gedeeld, setGedeeld] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [topscorerResultaatInput, setTopscorerResultaatInput] = useState("");
  const [geleKaartenResultaatInput, setGeleKaartenResultaatInput] = useState("");
  const [instellingenOpgeslagen, setInstellingenOpgeslagen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setMijnUserId(user.id);
    });
    getPoule(code).then((p) => {
      if (!p) { router.push("/"); return; }
      setPoule(p);
      setTopscorerResultaatInput(p.topscorerResultaat ?? "");
      setGeleKaartenResultaatInput(p.geleKaartenResultaat ?? "");
    }).catch((err) => {
      setFout(String(err));
    });
  }, [code, router]);

  async function deelUitnodiging() {
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${poule?.naam} — Steelballs`,
          text: `Doe mee aan de WK poule "${poule?.naam}"! Voorspel alle wedstrijden en bewijs wie de staalste ballen heeft.`,
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setGedeeld(true);
      setTimeout(() => setGedeeld(false), 2500);
    }
  }

  async function toggleInstelling(key: "topscorerActief" | "geleKaartenActief", waarde: boolean) {
    if (!poule) return;
    setPoule({ ...poule, [key]: waarde });
    try {
      await updatePouleInstellingen(code, { [key]: waarde });
    } catch {
      setPoule({ ...poule, [key]: !waarde });
    }
  }

  async function slaResultaatOp(key: "topscorerResultaat" | "geleKaartenResultaat", waarde: string) {
    if (!poule) return;
    const prev = poule[key];
    setPoule({ ...poule, [key]: waarde || null });
    try {
      await updatePouleInstellingen(code, { [key]: waarde || null });
      setInstellingenOpgeslagen(true);
      setTimeout(() => setInstellingenOpgeslagen(false), 2000);
    } catch {
      setPoule({ ...poule, [key]: prev });
    }
  }

  if (fout) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">Fout bij laden</p>
          <p className="text-zinc-500 text-sm break-all">{fout}</p>
        </div>
      </div>
    );
  }

  if (!poule) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isOrganisator = mijnUserId !== null && poule.organisatorId === mijnUserId;
  const huidigDeelnemer = poule.deelnemers.find((d) => d.userId === mijnUserId);
  const aantalWedstrijden = wedstrijden.length;
  const jouwIngevuld = huidigDeelnemer?.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length ?? 0;

  const heeftBonusCategorieen = poule.topscorerActief || poule.geleKaartenActief;

  const stand = poule.deelnemers
    .map((d) => ({
      ...d,
      displayNaam: deelnemerNaam(d),
      punten: berekenPunten(d.voorspellingen, poule.resultaten, d, poule),
      ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
    }))
    .sort((a, b) => b.punten - a.punten || b.ingevuld - a.ingevuld);

  const eersteWedstrijden = wedstrijden.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
            ← STEELBALLS
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">{poule.naam}</h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {poule.deelnemers.length} deelnemer{poule.deelnemers.length !== 1 ? "s" : ""} · WK 2026
              </p>
            </div>
            <button
              onClick={deelUitnodiging}
              className="flex-shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {gedeeld ? "✓ Gekopieerd!" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Nodig uit
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* ── Jouw voorspellingen CTA ── */}
        {huidigDeelnemer && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Jouw voorspellingen</p>
                <p className="text-white font-bold">
                  {jouwIngevuld}
                  <span className="text-zinc-500 font-normal"> van {aantalWedstrijden} ingevuld</span>
                </p>
              </div>
              <Link
                href={`/poule/${code}/voorspellingen`}
                className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {jouwIngevuld === 0 ? "Beginnen →" : jouwIngevuld === aantalWedstrijden ? "Bekijken →" : "Verder →"}
              </Link>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full">
              <div
                className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(jouwIngevuld / aantalWedstrijden) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Bonus categorieën overzicht (voor deelnemers) ── */}
        {heeftBonusCategorieen && huidigDeelnemer && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500 mb-3">Bonus voorspellingen</p>
            <div className="space-y-3">
              {poule.topscorerActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Topscorer</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.topscorerVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.topscorerVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{TOPSCORER_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.topscorerVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.geleKaartenActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Meeste gele kaarten</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.geleKaartenVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.geleKaartenVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{GELE_KAARTEN_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.geleKaartenVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stand ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Stand</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Punten worden bijgewerkt zodra uitslagen bekend zijn</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {stand.map((d, i) => (
              <div
                key={d.id}
                className={`px-5 py-4 flex items-center gap-3 ${d.userId === mijnUserId ? "bg-zinc-800/50" : ""}`}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">
                  {i < 3 ? MEDAILLES[i] : <span className="text-sm text-zinc-600 font-bold">{i + 1}</span>}
                </span>
                <Initialen naam={d.displayNaam} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {d.displayNaam}
                    {d.userId === mijnUserId && (
                      <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-24 bg-zinc-700 rounded-full">
                      <div
                        className="h-1 bg-zinc-400 rounded-full"
                        style={{ width: `${(d.ingevuld / aantalWedstrijden) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-600">{d.ingevuld}/{aantalWedstrijden}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-black text-white">{d.punten}</span>
                  <span className="text-xs text-zinc-600 ml-1">pt</span>
                </div>
              </div>
            ))}
            {stand.length === 0 && (
              <p className="px-5 py-4 text-sm text-zinc-600">Nog geen deelnemers.</p>
            )}
          </div>
        </div>

        {/* ── Organizer instellingen ── */}
        {isOrganisator && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">Poule-instellingen</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Alleen zichtbaar voor jou als organisator</p>
              </div>
              {instellingenOpgeslagen && (
                <span className="text-xs text-green-400 font-medium">✓ Opgeslagen</span>
              )}
            </div>
            <div className="p-5 space-y-5">

              {/* Topscorer toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Topscorer</p>
                    <p className="text-xs text-zinc-500">Deelnemers raden de topscorer van het toernooi ({TOPSCORER_PUNTEN} pt)</p>
                  </div>
                  <Toggle aan={poule.topscorerActief} onChange={(v) => toggleInstelling("topscorerActief", v)} />
                </div>
                {poule.topscorerActief && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={topscorerResultaatInput}
                      onChange={(e) => setTopscorerResultaatInput(e.target.value)}
                      placeholder="Vul de echte topscorer in zodra bekend..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => slaResultaatOp("topscorerResultaat", topscorerResultaatInput)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Opslaan
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* Gele kaarten toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Meeste gele kaarten</p>
                    <p className="text-xs text-zinc-500">Deelnemers raden wie de meeste gele kaarten krijgt ({GELE_KAARTEN_PUNTEN} pt)</p>
                  </div>
                  <Toggle aan={poule.geleKaartenActief} onChange={(v) => toggleInstelling("geleKaartenActief", v)} />
                </div>
                {poule.geleKaartenActief && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={geleKaartenResultaatInput}
                      onChange={(e) => setGeleKaartenResultaatInput(e.target.value)}
                      placeholder="Vul de speler met de meeste gele kaarten in..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => slaResultaatOp("geleKaartenResultaat", geleKaartenResultaatInput)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Opslaan
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── Uitnodigen ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-1">Vrienden uitnodigen</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Deel de link — iedereen kan meedoen via de uitnodiging.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 tracking-widest truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`}
            </div>
            <button
              onClick={deelUitnodiging}
              className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-5 rounded-xl transition-colors whitespace-nowrap"
            >
              {gedeeld ? "✓ Gekopieerd" : "Deel link"}
            </button>
          </div>
        </div>

        {/* ── Eerste wedstrijden ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Eerste wedstrijden</h2>
            <Link href={`/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
              Alle {aantalWedstrijden} →
            </Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {eersteWedstrijden.map((w) => {
              const vpThuis = huidigDeelnemer?.voorspellingen.find((v) => v.wedstrijdId === w.id);
              const heeftVp = vpThuis?.thuis != null && vpThuis?.uit != null;
              return (
                <div key={w.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-zinc-600 mb-1">
                      {w.groep} · {new Date(w.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} {w.tijd}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      <span>{w.thuis.vlag}</span>
                      <span>{w.thuis.naam}</span>
                      <span className="text-zinc-600 font-normal mx-1">vs</span>
                      <span>{w.uit.naam}</span>
                      <span>{w.uit.vlag}</span>
                    </div>
                  </div>
                  {heeftVp ? (
                    <div className="bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-bold text-white whitespace-nowrap">
                      {vpThuis!.thuis} – {vpThuis!.uit}
                    </div>
                  ) : (
                    <Link
                      href={`/poule/${code}/voorspellingen`}
                      className="text-xs text-zinc-600 hover:text-zinc-400 whitespace-nowrap"
                    >
                      Voorspel →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function PoulePaginaWrapper() {
  return (
    <ErrorBoundary>
      <PoulePagina />
    </ErrorBoundary>
  );
}
