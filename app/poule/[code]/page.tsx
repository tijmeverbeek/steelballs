"use client";

import { Component, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, rondeAfPoule } from "@/lib/api";
import { berekenPunten, berekenMinuutAfstand, heeftCorrectEersteDoelpuntenmaker, TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN, TOERNOOIWINNAAR_PUNTEN, EERSTE_DOELPUNTENMAKER_PUNTEN } from "@/lib/storage";
import { wedstrijden, CL_FINALE } from "@/lib/matches";
import { createClient } from "@/lib/supabase/client";
import { Poule, Deelnemer } from "@/lib/types";
import { slaMatchResultaatOp, updatePouleInstellingen } from "@/lib/api";

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

type StandItem = {
  id: string;
  userId: string;
  gebruikersnaam: string | null;
  displayNaam: string;
  punten: number;
  ingevuld: number;
  correctDoelpuntenmaker: boolean;
  minuutAfstand: number;
  eersteDoelpuntenmakerVoorspelling?: string | null;
  eersteDoelpuntenminuutVoorspelling?: number | null;
  voorspellingen: Deelnemer["voorspellingen"];
};

function EindstandModal({
  poule,
  stand,
  mijnUserId,
  onSluit,
}: {
  poule: Poule;
  stand: StandItem[];
  mijnUserId: string | null;
  onSluit: () => void;
}) {
  const isWinnaar = mijnUserId !== null && poule.winnaarId === mijnUserId;
  const winnaar = stand[0];
  const clResultaat = poule.resultaten["CL1"];

  function keuzeRegel(deelnemer: StandItem) {
    const vp = deelnemer.voorspellingen.find((v) => v.wedstrijdId === "CL1");
    const punten = deelnemer.punten;
    return (
      <div className="space-y-1.5">
        {clResultaat && vp?.thuis != null && vp?.uit != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={vp.thuis === clResultaat.thuis && vp.uit === clResultaat.uit ? "text-green-400" : "text-zinc-400"}>
              {vp.thuis === clResultaat.thuis && vp.uit === clResultaat.uit ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              PSG {vp.thuis}–{vp.uit} Arsenal
              {clResultaat && (
                <span className="text-zinc-600 ml-1">(werkelijk: {clResultaat.thuis}–{clResultaat.uit})</span>
              )}
            </span>
          </div>
        )}
        {poule.eersteDoelpuntenmakerActief && deelnemer.eersteDoelpuntenmakerVoorspelling && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.correctDoelpuntenmaker ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.correctDoelpuntenmaker ? "✓" : "✗"}
            </span>
            <span className="text-zinc-300">
              {deelnemer.eersteDoelpuntenmakerVoorspelling}
              {poule.eersteDoelpuntenmakerResultaat && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteDoelpuntenmakerResultaat})</span>
              )}
            </span>
          </div>
        )}
        {poule.eersteDoelpuntenminuutActief && deelnemer.eersteDoelpuntenminuutVoorspelling != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.minuutAfstand === 0 ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.minuutAfstand === 0 ? "✓" : "⏱"}
            </span>
            <span className="text-zinc-300">
              minuut {deelnemer.eersteDoelpuntenminuutVoorspelling}
              {poule.eersteDoelpuntenminuutResultaat != null && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteDoelpuntenminuutResultaat})</span>
              )}
            </span>
          </div>
        )}
        <div className="text-xs text-zinc-500 pt-0.5">{punten} punten totaal</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onSluit} />

      <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        {isWinnaar ? (
          <div
            className="px-6 pt-8 pb-6 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #78350f 0%, #92400e 40%, #78350f 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(253,224,71,0.6) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <div className="text-6xl mb-3 animate-bounce">🏆</div>
              <h2 className="text-3xl font-black text-yellow-300 tracking-tight">Gewonnen!</h2>
              <p className="text-yellow-100/80 text-sm mt-1">Jij hebt de staalste ballen</p>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-7 pb-5 text-center bg-zinc-800">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-black text-white">Toernooi afgerond</h2>
            {winnaar && (
              <p className="text-zinc-400 text-sm mt-1">
                <Link
                  href={`/speler/${encodeURIComponent(winnaar.userId)}`}
                  className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                  onClick={onSluit}
                >
                  {winnaar.displayNaam}
                </Link>{" "}heeft gewonnen
              </p>
            )}
          </div>
        )}

        {/* Scroll content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Winnaar's keuzes */}
          {winnaar && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {isWinnaar ? "Jouw winnende keuzes" : `Keuzes van ${winnaar.displayNaam}`}
              </p>
              <div className="bg-zinc-800/60 rounded-xl p-4">
                {keuzeRegel(winnaar)}
              </div>
            </div>
          )}

          {/* Eindstand */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Eindstand</p>
            <div className="bg-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-700/50">
              {stand.map((d, i) => (
                <div
                  key={d.id}
                  className={`px-4 py-3 flex items-center gap-3 ${d.userId === mijnUserId ? "bg-zinc-700/40" : ""}`}
                >
                  <span className="text-base w-6 text-center flex-shrink-0">
                    {i === 0 ? "🏆" : i < 3 ? ["🥈", "🥉"][i - 1] : <span className="text-xs text-zinc-600 font-bold">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      <Link
                        href={`/speler/${encodeURIComponent(d.userId)}`}
                        className="hover:text-zinc-300 transition-colors"
                        onClick={onSluit}
                      >
                        {d.displayNaam}
                      </Link>
                      {d.userId === mijnUserId && <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>}
                    </p>
                    {poule.eersteDoelpuntenminuutActief && d.eersteDoelpuntenminuutVoorspelling != null && poule.eersteDoelpuntenminuutResultaat != null && (
                      <p className="text-xs text-zinc-600">
                        minuut {d.eersteDoelpuntenminuutVoorspelling}
                        {d.minuutAfstand < Infinity && ` (±${d.minuutAfstand})`}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-white">{d.punten}</span>
                    <span className="text-xs text-zinc-600 ml-1">pt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-zinc-800">
          <button
            onClick={onSluit}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

function PoulePagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [mijnUserId, setMijnUserId] = useState<string | null>(null);
  const [gedeeld, setGedeeld] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [toonEindstand, setToonEindstand] = useState(false);
  const [topscorerResultaatInput, setTopscorerResultaatInput] = useState("");
  const [geleKaartenResultaatInput, setGeleKaartenResultaatInput] = useState("");
  const [toernooiwinaarResultaatInput, setToernooiwinaarResultaatInput] = useState("");
  const [eersteDoelpuntenmakerResultaatInput, setEersteDoelpuntenmakerResultaatInput] = useState("");
  const [eersteDoelpuntenminuutResultaatInput, setEersteDoelpuntenminuutResultaatInput] = useState<number | null>(null);
  const [clFinaleThuis, setClFinaleThuis] = useState<number | null>(null);
  const [clFinaleUit, setClFinaleUit] = useState<number | null>(null);
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
      setToernooiwinaarResultaatInput(p.toernooiwinaarResultaat ?? "");
      setEersteDoelpuntenmakerResultaatInput(p.eersteDoelpuntenmakerResultaat ?? "");
      setEersteDoelpuntenminuutResultaatInput(p.eersteDoelpuntenminuutResultaat ?? null);
      const clResult = p.resultaten["CL1"];
      if (clResult) { setClFinaleThuis(clResult.thuis); setClFinaleUit(clResult.uit); }
      if (p.afgerond) {
        const gezienKey = `eindstand-gezien-${p.code}`;
        if (!localStorage.getItem(gezienKey)) {
          setToonEindstand(true);
        }
      }
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

  async function toggleInstelling(key: "topscorerActief" | "geleKaartenActief" | "toernooiwinaarActief" | "eersteDoelpuntenmakerActief" | "eersteDoelpuntenminuutActief", waarde: boolean) {
    if (!poule) return;
    setPoule({ ...poule, [key]: waarde });
    try {
      await updatePouleInstellingen(code, { [key]: waarde });
    } catch {
      setPoule({ ...poule, [key]: !waarde });
    }
  }

  async function slaResultaatOp(key: "topscorerResultaat" | "geleKaartenResultaat" | "toernooiwinaarResultaat" | "eersteDoelpuntenmakerResultaat", waarde: string) {
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

  async function slaMinuutResultaatOp(minuut: number | null) {
    if (!poule) return;
    const prev = poule.eersteDoelpuntenminuutResultaat;
    setPoule({ ...poule, eersteDoelpuntenminuutResultaat: minuut });
    try {
      await updatePouleInstellingen(code, { eersteDoelpuntenminuutResultaat: minuut });
      setInstellingenOpgeslagen(true);
      setTimeout(() => setInstellingenOpgeslagen(false), 2000);
    } catch {
      setPoule({ ...poule, eersteDoelpuntenminuutResultaat: prev });
    }
  }

  async function slaClFinaleResultaatOp() {
    if (!poule || clFinaleThuis === null || clFinaleUit === null) return;
    try {
      await slaMatchResultaatOp(code, "CL1", clFinaleThuis, clFinaleUit);
      setPoule({ ...poule, resultaten: { ...poule.resultaten, CL1: { thuis: clFinaleThuis, uit: clFinaleUit } } });
      setInstellingenOpgeslagen(true);
      setTimeout(() => setInstellingenOpgeslagen(false), 2000);
    } catch {
      // silently fail
    }
  }

  async function rondeAf() {
    if (!poule) return;
    try {
      await rondeAfPoule(code);
      const bijgewerkt = { ...poule, afgerond: true };
      setPoule(bijgewerkt);
      setToonEindstand(true);
    } catch {
      // silently fail
    }
  }

  function sluitEindstand() {
    localStorage.setItem(`eindstand-gezien-${code}`, "1");
    setToonEindstand(false);
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

  const heeftBonusCategorieen = poule.topscorerActief || poule.geleKaartenActief || poule.toernooiwinaarActief || poule.eersteDoelpuntenmakerActief || poule.eersteDoelpuntenminuutActief;

  const stand: StandItem[] = poule.deelnemers
    .map((d) => ({
      id: d.id,
      userId: d.userId,
      gebruikersnaam: d.user.gebruikersnaam,
      displayNaam: deelnemerNaam(d),
      punten: berekenPunten(d.voorspellingen, poule.resultaten, d, poule),
      ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
      correctDoelpuntenmaker: heeftCorrectEersteDoelpuntenmaker(d, poule),
      minuutAfstand: berekenMinuutAfstand(d.eersteDoelpuntenminuutVoorspelling, poule.eersteDoelpuntenminuutResultaat),
      eersteDoelpuntenmakerVoorspelling: d.eersteDoelpuntenmakerVoorspelling,
      eersteDoelpuntenminuutVoorspelling: d.eersteDoelpuntenminuutVoorspelling,
      voorspellingen: d.voorspellingen,
    }))
    .sort((a, b) => {
      if (b.punten !== a.punten) return b.punten - a.punten;
      if (a.correctDoelpuntenmaker !== b.correctDoelpuntenmaker) return a.correctDoelpuntenmaker ? -1 : 1;
      return a.minuutAfstand - b.minuutAfstand;
    });

  const eersteWedstrijden = wedstrijden.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {toonEindstand && (
        <EindstandModal
          poule={poule}
          stand={stand}
          mijnUserId={mijnUserId}
          onSluit={sluitEindstand}
        />
      )}

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

        {/* ── Afgerond banner ── */}
        {poule.afgerond && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-yellow-300 text-sm">Toernooi afgerond</p>
                <p className="text-xs text-zinc-500">
                  {stand[0] ? `${stand[0].displayNaam} heeft gewonnen met ${stand[0].punten} punten` : "Eindstand bekend"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToonEindstand(true)}
              className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Bekijk →
            </button>
          </div>
        )}

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
              {poule.toernooiwinaarActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Winnaar van het toernooi</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.toernooiwinaarVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.toernooiwinaarVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{TOERNOOIWINNAAR_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.toernooiwinaarVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteDoelpuntenmakerActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Eerste doelpuntenmaker</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteDoelpuntenmakerVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.eersteDoelpuntenmakerVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{EERSTE_DOELPUNTENMAKER_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={`/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteDoelpuntenmakerVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteDoelpuntenminuutActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Minuut eerste doelpunt</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling != null
                        ? <span className="text-zinc-300">minuut {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}tiebreaker
                    </p>
                  </div>
                  <Link href={`/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling != null ? "Wijzig →" : "Invullen →"}
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
              <Link
                key={d.id}
                href={`/speler/${encodeURIComponent(d.userId)}`}
                className={`px-5 py-4 flex items-center gap-3 active:bg-zinc-800 transition-colors ${d.userId === mijnUserId ? "bg-zinc-800/50" : ""}`}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">
                  {poule.afgerond && i === 0 ? "🏆" : i < 3 ? MEDAILLES[i] : <span className="text-sm text-zinc-600 font-bold">{i + 1}</span>}
                </span>
                <Initialen naam={d.displayNaam} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    <Link
                      href={`/speler/${encodeURIComponent(d.userId)}`}
                      className="hover:text-zinc-300 transition-colors"
                    >
                      {d.displayNaam}
                    </Link>
                    {d.userId === mijnUserId && (
                      <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>
                    )}
                    {poule.afgerond && i === 0 && d.userId !== mijnUserId && (
                      <span className="ml-1.5 text-xs text-yellow-400 font-normal">winnaar</span>
                    )}
                    {poule.afgerond && i === 0 && d.userId === mijnUserId && (
                      <span className="ml-1.5 text-xs text-yellow-400 font-normal">jij gewonnen!</span>
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
              </Link>
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
                  <>
                    {poule.liveStats?.topscorer && (
                      <p className="text-xs text-blue-400 mt-2">
                        Live leider: <span className="font-semibold">{poule.liveStats.topscorer}</span>
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={topscorerResultaatInput}
                        onChange={(e) => setTopscorerResultaatInput(e.target.value)}
                        placeholder="Definitieve topscorer invullen..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => slaResultaatOp("topscorerResultaat", topscorerResultaatInput)}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Opslaan
                      </button>
                    </div>
                  </>
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
                  <>
                    {poule.liveStats?.geleKaarten && (
                      <p className="text-xs text-blue-400 mt-2">
                        Live leider: <span className="font-semibold">{poule.liveStats.geleKaarten}</span>
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={geleKaartenResultaatInput}
                        onChange={(e) => setGeleKaartenResultaatInput(e.target.value)}
                        placeholder="Definitieve speler invullen..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => slaResultaatOp("geleKaartenResultaat", geleKaartenResultaatInput)}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Opslaan
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* Toernooiwinnaar toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Winnaar van het toernooi</p>
                    <p className="text-xs text-zinc-500">Deelnemers raden welk land het WK wint ({TOERNOOIWINNAAR_PUNTEN} pt)</p>
                  </div>
                  <Toggle aan={poule.toernooiwinaarActief} onChange={(v) => toggleInstelling("toernooiwinaarActief", v)} />
                </div>
                {poule.toernooiwinaarActief && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={toernooiwinaarResultaatInput}
                      onChange={(e) => setToernooiwinaarResultaatInput(e.target.value)}
                      placeholder="Winnaar invullen zodra bekend..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => slaResultaatOp("toernooiwinaarResultaat", toernooiwinaarResultaatInput)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Opslaan
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* Eerste doelpuntenmaker toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Eerste doelpuntenmaker</p>
                    <p className="text-xs text-zinc-500">Wie scoort het eerste doelpunt van de CL finale? ({EERSTE_DOELPUNTENMAKER_PUNTEN} pt)</p>
                  </div>
                  <Toggle aan={poule.eersteDoelpuntenmakerActief} onChange={(v) => toggleInstelling("eersteDoelpuntenmakerActief", v)} />
                </div>
                {poule.eersteDoelpuntenmakerActief && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={eersteDoelpuntenmakerResultaatInput}
                      onChange={(e) => setEersteDoelpuntenmakerResultaatInput(e.target.value)}
                      placeholder="Naam van de eerste doelpuntenmaker..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => slaResultaatOp("eersteDoelpuntenmakerResultaat", eersteDoelpuntenmakerResultaatInput)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Opslaan
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* Minuut tiebreaker toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">Minuut eerste doelpunt</p>
                    <p className="text-xs text-zinc-500">Tiebreaker — dichtstbijzijnde minuut wint bij gelijke stand</p>
                  </div>
                  <Toggle aan={poule.eersteDoelpuntenminuutActief} onChange={(v) => toggleInstelling("eersteDoelpuntenminuutActief", v)} />
                </div>
                {poule.eersteDoelpuntenminuutActief && (
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={eersteDoelpuntenminuutResultaatInput ?? ""}
                      onChange={(e) => setEersteDoelpuntenminuutResultaatInput(e.target.value === "" ? null : parseInt(e.target.value))}
                      placeholder="bijv. 34"
                      className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <span className="text-xs text-zinc-500">minuut</span>
                    <button
                      onClick={() => slaMinuutResultaatOp(eersteDoelpuntenminuutResultaatInput)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Opslaan
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* CL Finale uitslag */}
              <div>
                <p className="text-sm font-semibold text-white mb-1">CL Finale uitslag</p>
                <p className="text-xs text-zinc-500 mb-3">
                  PSG 🇫🇷 vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Arsenal — vul de eindstand in na de wedstrijd
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={clFinaleThuis ?? ""}
                    onChange={(e) => setClFinaleThuis(e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="PSG"
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  />
                  <span className="text-zinc-600 font-bold">–</span>
                  <input
                    type="number"
                    min={0}
                    value={clFinaleUit ?? ""}
                    onChange={(e) => setClFinaleUit(e.target.value === "" ? null : parseInt(e.target.value))}
                    placeholder="ARS"
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                  />
                  <button
                    onClick={slaClFinaleResultaatOp}
                    disabled={clFinaleThuis === null || clFinaleUit === null}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Opslaan
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-800" />

              {/* Afronden */}
              <div>
                <p className="text-sm font-semibold text-white mb-1">Toernooi afronden</p>
                <p className="text-xs text-zinc-500 mb-3">
                  Sluit het toernooi af, bepaal de winnaar en ken de trofee toe. Dit kan niet ongedaan worden gemaakt.
                </p>
                {poule.afgerond ? (
                  <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                    <span>✓</span>
                    <span>Toernooi is afgerond — {stand[0]?.displayNaam} heeft gewonnen</span>
                  </div>
                ) : (
                  <button
                    onClick={rondeAf}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    🏆 Toernooi afronden
                  </button>
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
