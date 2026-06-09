"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getPoule } from "@/lib/api";
import {
  LMS_RONDES,
  LmsRonde,
  getWedstrijdenVoorRonde,
  getDeadlineVoorRonde,
  isRondeGesloten,
  getHuidigeRonde,
} from "@/lib/lms";
import { Wedstrijd, Deelnemer, LmsPick } from "@/lib/types";

interface DeelnemerMet extends Deelnemer {
  lmsActief: boolean;
  lmsUitgeschakeldRonde: number | null;
  lmsPicks: LmsPick[];
}

interface LmsKnockoutWedstrijd {
  id: string;
  rondeNr: number;
  thuisCode: string;
  thuisNaam: string;
  thuisVlag: string;
  uitCode: string;
  uitNaam: string;
  uitVlag: string;
  datum: string | null;
  tijd: string | null;
}

function isRondeToegankelijk(rondeNr: number, d: DeelnemerMet): boolean {
  if (rondeNr === 1) return true;
  const vorigePick = d.lmsPicks.find((p) => p.rondeNr === rondeNr - 1);
  return vorigePick?.uitkomst === "win";
}

function lmsWedstrijdNaarWedstrijd(w: LmsKnockoutWedstrijd): Wedstrijd {
  return {
    id: w.id,
    thuis: { code: w.thuisCode, naam: w.thuisNaam, vlag: w.thuisVlag },
    uit: { code: w.uitCode, naam: w.uitNaam, vlag: w.uitVlag },
    datum: w.datum ?? "",
    tijd: w.tijd ?? "",
    groep: `Ronde ${w.rondeNr}`,
    fase: "knockout",
  };
}

export default function LmsPickPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poulenaam, setPoulenaam] = useState("");
  const [deelnemer, setDeelnemer] = useState<DeelnemerMet | null>(null);
  const [alleDeelnemers, setAlleDeelnemers] = useState<DeelnemerMet[]>([]);
  const [actieveRonde, setActieveRonde] = useState<LmsRonde | null>(null);
  const [wedstrijden, setWedstrijden] = useState<Wedstrijd[]>([]);
  const [lmsKnockout, setLmsKnockout] = useState<LmsKnockoutWedstrijd[]>([]);
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState("");
  const [success, setSuccess] = useState(false);

  function wedstrijdenVoorRonde(r: LmsRonde): Wedstrijd[] {
    const hardcoded = getWedstrijdenVoorRonde(r.nr);
    if (hardcoded.length > 0) return hardcoded;
    return lmsKnockout.filter((w) => w.rondeNr === r.nr).map(lmsWedstrijdNaarWedstrijd);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const [poule, wRes] = await Promise.all([
        getPoule(code),
        fetch("/api/lms/wedstrijden"),
      ]);

      if (!poule || poule.soort !== "lms") { router.push(`/poule/${code}`); return; }
      setPoulenaam(poule.naam);

      if (wRes.ok) {
        const wData = await wRes.json();
        setLmsKnockout(wData.wedstrijden ?? []);
      }

      const deelnemersList = poule.deelnemers as DeelnemerMet[];
      setAlleDeelnemers(deelnemersList);

      const dl = deelnemersList.find((d) => d.userId === user.id);
      if (!dl) { router.push(`/poule/${code}`); return; }
      setDeelnemer(dl);

      // Auto-select eerste open, toegankelijke ronde zonder pick
      const ronde = (() => {
        for (const r of LMS_RONDES) {
          if (isRondeGesloten(r.nr)) continue;
          if (dl.lmsPicks.find((p) => p.rondeNr === r.nr)) continue;
          if (!isRondeToegankelijk(r.nr, dl)) continue;
          return r;
        }
        return getHuidigeRonde() ?? LMS_RONDES[0];
      })();

      setActieveRonde(ronde);
      setWedstrijden(getWedstrijdenVoorRonde(ronde.nr));
      const bestaand = dl.lmsPicks.find((p) => p.rondeNr === ronde.nr);
      if (bestaand) setGekozen(bestaand.teamCode);
    }
    load();
  }, [code, router]);

  // Update wedstrijden wanneer lmsKnockout geladen is (voor knockout rondes)
  useEffect(() => {
    if (!actieveRonde || !deelnemer) return;
    const w = wedstrijdenVoorRonde(actieveRonde);
    setWedstrijden(w);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lmsKnockout]);

  function wisselRonde(r: LmsRonde) {
    setActieveRonde(r);
    setWedstrijden(wedstrijdenVoorRonde(r));
    setGekozen(deelnemer?.lmsPicks.find((p) => p.rondeNr === r.nr)?.teamCode ?? null);
    setSuccess(false);
    setFout("");
  }

  async function submitPick() {
    if (!gekozen || !actieveRonde || !deelnemer) return;
    const wedstrijd = wedstrijden.find((w) =>
      w.thuis.code === gekozen || w.uit.code === gekozen
    );
    if (!wedstrijd) return;

    setOpslaan(true);
    setFout("");
    try {
      const res = await fetch(`/api/poules/${code}/lms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rondeNr: actieveRonde.nr, teamCode: gekozen, wedstrijdId: wedstrijd.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFout(body.error ?? "Opslaan mislukt");
      } else {
        setSuccess(true);
        const updatedPick: LmsPick = { rondeNr: actieveRonde.nr, teamCode: gekozen, wedstrijdId: wedstrijd.id, uitkomst: null };
        setDeelnemer((prev) => {
          if (!prev) return prev;
          const filtered = prev.lmsPicks.filter((p) => p.rondeNr !== actieveRonde.nr);
          return { ...prev, lmsPicks: [...filtered, updatedPick] };
        });
        setAlleDeelnemers((prev) =>
          prev.map((d) => {
            if (d.userId !== deelnemer.userId) return d;
            const filtered = d.lmsPicks.filter((p) => p.rondeNr !== actieveRonde.nr);
            return { ...d, lmsPicks: [...filtered, updatedPick] };
          })
        );
      }
    } catch {
      setFout("Netwerkfout — probeer opnieuw");
    } finally {
      setOpslaan(false);
    }
  }

  if (!deelnemer || !actieveRonde) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Uitgeschakeld scherm
  if (!deelnemer.lmsActief) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-2xl font-black text-white mb-2">Jammer!</h1>
          <p className="text-zinc-300 font-semibold mb-1">Jij bent niet de last staal man standing.</p>
          <p className="text-zinc-500 text-sm mb-6">
            Uitgeschakeld in ronde {deelnemer.lmsUitgeschakeldRonde}.
          </p>
          <Link href={`/poule/${code}`} className="text-green-400 hover:text-green-300 text-sm font-medium">
            ← Terug naar de poule
          </Link>
        </div>
      </div>
    );
  }

  const gebruiktTeams = deelnemer.lmsPicks
    .filter((p) => p.rondeNr !== actieveRonde.nr)
    .map((p) => p.teamCode);

  const gesloten = isRondeGesloten(actieveRonde.nr);
  const toegankelijk = isRondeToegankelijk(actieveRonde.nr, deelnemer);
  const deadline = getDeadlineVoorRonde(actieveRonde.nr);
  const mijnPickDezeRonde = deelnemer.lmsPicks.find((p) => p.rondeNr === actieveRonde.nr);

  const gekozenWedstrijd = wedstrijden.find((w) => w.thuis.code === gekozen || w.uit.code === gekozen);
  const gekozenTeam = gekozenWedstrijd
    ? (gekozenWedstrijd.thuis.code === gekozen ? gekozenWedstrijd.thuis : gekozenWedstrijd.uit)
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/poule/${code}`} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
            ← {poulenaam}
          </Link>
          <span className="text-xs font-bold text-white uppercase tracking-widest">Last Man Standing</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Ronde tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {LMS_RONDES.map((r) => {
            const mijnPick = deelnemer.lmsPicks.find((p) => p.rondeNr === r.nr);
            const isActief = r.nr === actieveRonde.nr;
            const tabToegankelijk = isRondeToegankelijk(r.nr, deelnemer);
            const tabGesloten = isRondeGesloten(r.nr);
            return (
              <button
                key={r.nr}
                onClick={() => wisselRonde(r)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  isActief
                    ? "bg-white text-zinc-900 border-white"
                    : mijnPick?.uitkomst === "win"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : mijnPick?.uitkomst === "verlies" || mijnPick?.uitkomst === "gelijk"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : mijnPick
                    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                    : !tabToegankelijk && !tabGesloten
                    ? "text-zinc-700 border-zinc-800"
                    : "text-zinc-500 border-zinc-700 hover:text-white hover:border-zinc-500"
                }`}
              >
                R{r.nr}
                {mijnPick && (
                  <span className="ml-1">
                    {mijnPick.uitkomst === "win" ? "✓" : mijnPick.uitkomst ? "✗" : "●"}
                  </span>
                )}
                {!mijnPick && !tabToegankelijk && !tabGesloten && <span className="ml-1 opacity-40">🔒</span>}
              </button>
            );
          })}
        </div>

        {/* ── Ronde info ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Ronde {actieveRonde.nr}</p>
              <h1 className="text-lg font-bold text-white">{actieveRonde.naam}</h1>
            </div>
            {gesloten ? (
              <span className="flex-shrink-0 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg font-semibold">
                🔒 Gesloten
              </span>
            ) : deadline ? (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-zinc-500">Deadline</p>
                <p className="text-xs font-semibold text-amber-400">
                  {deadline.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{deadline.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {gesloten
              ? "De deadline is verstreken. Hieronder zie je wat iedereen heeft gekozen."
              : !toegankelijk
              ? "Je moet eerst de huidige ronde overleven."
              : "Kies precies één team om op te winnen. Je mag elk team maar één keer in het hele toernooi gebruiken."}
          </p>
        </div>

        {/* ── Jouw pick (bevestiging) ── */}
        {mijnPickDezeRonde && (
          <div className={`rounded-2xl px-5 py-4 border ${
            mijnPickDezeRonde.uitkomst === "win"
              ? "bg-green-500/10 border-green-500/30"
              : mijnPickDezeRonde.uitkomst === "verlies" || mijnPickDezeRonde.uitkomst === "gelijk"
              ? "bg-red-500/10 border-red-500/30"
              : "bg-zinc-900 border-green-500/40"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Jouw pick</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{gekozenTeam?.vlag ?? "🏳"}</span>
              <div className="flex-1">
                <p className="font-bold text-white text-base">{gekozenTeam?.naam ?? mijnPickDezeRonde.teamCode}</p>
                {mijnPickDezeRonde.uitkomst === "win" && <p className="text-xs text-green-400 font-semibold mt-0.5">✓ Gewonnen — je bent nog actief!</p>}
                {mijnPickDezeRonde.uitkomst === "verlies" && <p className="text-xs text-red-400 font-semibold mt-0.5">✗ Verlies — uitgeschakeld</p>}
                {mijnPickDezeRonde.uitkomst === "gelijk" && <p className="text-xs text-red-400 font-semibold mt-0.5">= Gelijkspel — uitgeschakeld</p>}
                {!mijnPickDezeRonde.uitkomst && !gesloten && <p className="text-xs text-zinc-500 mt-0.5">Gekozen · je kunt nog wijzigen tot de deadline</p>}
                {!mijnPickDezeRonde.uitkomst && gesloten && <p className="text-xs text-zinc-500 mt-0.5">Wacht op uitslag</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Niet toegankelijk: moet huidige ronde eerst overleven ── */}
        {!gesloten && !toegankelijk && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-3">🔒</p>
            <p className="text-white text-sm font-bold">Je moet eerst de huidige ronde overleven</p>
            <p className="text-zinc-600 text-xs mt-1">
              Zodra ronde {actieveRonde.nr - 1} verwerkt is en jij gewonnen hebt, kun je hier kiezen.
            </p>
          </div>
        )}

        {/* ── Team kiezen (alleen als ronde open én toegankelijk is) ── */}
        {!gesloten && toegankelijk && (
          <>
            {wedstrijden.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-zinc-500 text-sm">Wedstrijden voor deze ronde zijn nog niet bekend.</p>
                <p className="text-zinc-700 text-xs mt-1">De beheerder vult de koppels in zodra de bracket bekend is.</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800">
                  <p className="text-sm font-semibold text-white">Kies één team</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Grijze teams heb je al eerder gebruikt</p>
                </div>
                <div className="divide-y divide-zinc-800">
                  {wedstrijden.map((w) => {
                    const thuisGebruikt = gebruiktTeams.includes(w.thuis.code);
                    const uitGebruikt = gebruiktTeams.includes(w.uit.code);
                    const matchGestart = w.datum && w.tijd
                      ? new Date() >= new Date(`${w.datum}T${w.tijd}:00`)
                      : false;
                    const thuisDisabled = thuisGebruikt || matchGestart;
                    const uitDisabled = uitGebruikt || matchGestart;

                    const ietsGekozen = gekozen !== null;
                    const eenVanDeze = gekozen === w.thuis.code || gekozen === w.uit.code;
                    const fadedOut = ietsGekozen && !eenVanDeze;

                    return (
                      <div key={w.id} className={`px-4 py-3 transition-opacity ${fadedOut ? "opacity-30" : ""}`}>
                        {w.datum && w.tijd && (
                          <p className="text-xs text-zinc-600 text-center mb-2">
                            {new Date(w.datum).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                            {" · "}{w.tijd}
                            {matchGestart && <span className="ml-1.5 text-zinc-700">🔒</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={thuisDisabled}
                            onClick={() => { setGekozen(w.thuis.code); setSuccess(false); setFout(""); }}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                              gekozen === w.thuis.code
                                ? "bg-green-500/20 border-green-500 text-white ring-2 ring-green-500/50"
                                : thuisDisabled
                                ? "opacity-40 border-zinc-800 cursor-not-allowed text-zinc-600"
                                : "border-zinc-700 hover:border-zinc-400 hover:bg-zinc-800 text-white"
                            }`}
                          >
                            <span className="text-2xl">{w.thuis.vlag || "🏳"}</span>
                            <span className="text-xs font-semibold leading-tight text-center">{w.thuis.naam}</span>
                            {thuisGebruikt && <span className="text-xs text-zinc-600">al gebruikt</span>}
                          </button>

                          <span className="text-zinc-700 font-bold text-sm px-1">vs</span>

                          <button
                            type="button"
                            disabled={uitDisabled}
                            onClick={() => { setGekozen(w.uit.code); setSuccess(false); setFout(""); }}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                              gekozen === w.uit.code
                                ? "bg-green-500/20 border-green-500 text-white ring-2 ring-green-500/50"
                                : uitDisabled
                                ? "opacity-40 border-zinc-800 cursor-not-allowed text-zinc-600"
                                : "border-zinc-700 hover:border-zinc-400 hover:bg-zinc-800 text-white"
                            }`}
                          >
                            <span className="text-2xl">{w.uit.vlag || "🏳"}</span>
                            <span className="text-xs font-semibold leading-tight text-center">{w.uit.naam}</span>
                            {uitGebruikt && <span className="text-xs text-zinc-600">al gebruikt</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {wedstrijden.length > 0 && (
              <div className="space-y-2">
                {fout && <p className="text-red-400 text-xs text-center">{fout}</p>}
                {success && <p className="text-green-400 text-xs text-center font-medium">✓ Pick opgeslagen</p>}
                <button
                  onClick={submitPick}
                  disabled={!gekozen || opslaan}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
                >
                  {opslaan
                    ? "Opslaan..."
                    : gekozen && gekozenTeam
                    ? `${gekozenTeam.vlag} ${gekozenTeam.naam} bevestigen →`
                    : "Kies een team hierboven"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Picks van iedereen (alleen na deadline) ── */}
        {gesloten && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-white">Picks ronde {actieveRonde.nr}</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {alleDeelnemers
                .sort((a, b) => ((a.lmsActief ?? true) === (b.lmsActief ?? true) ? 0 : (a.lmsActief ?? true) ? -1 : 1))
                .map((d) => {
                  const naam = d.user.gebruikersnaam ?? d.user.email.split("@")[0];
                  const pick = d.lmsPicks.find((p) => p.rondeNr === actieveRonde.nr);
                  const pickWedstrijd = pick ? wedstrijden.find((w) => w.id === pick.wedstrijdId) : null;
                  const pickTeam = pickWedstrijd && pick
                    ? (pickWedstrijd.thuis.code === pick.teamCode ? pickWedstrijd.thuis : pickWedstrijd.uit)
                    : null;
                  const isJij = d.userId === deelnemer.userId;
                  const actief = d.lmsActief ?? true;

                  return (
                    <div key={d.id} className={`px-5 py-3 flex items-center gap-3 ${isJij ? "bg-zinc-800/40" : ""} ${!actief ? "opacity-40" : ""}`}>
                      <span className="text-base w-6 text-center flex-shrink-0">{actief ? "🟢" : "💀"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {naam}
                          {isJij && <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>}
                        </p>
                      </div>
                      {pick && pickTeam ? (
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                          pick.uitkomst === "win"
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : pick.uitkomst === "verlies" || pick.uitkomst === "gelijk"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300"
                        }`}>
                          <span>{pickTeam.vlag}</span>
                          <span className="font-semibold">{pickTeam.naam}</span>
                          {pick.uitkomst === "win" && <span>✓</span>}
                          {(pick.uitkomst === "verlies" || pick.uitkomst === "gelijk") && <span>✗</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-700 italic flex-shrink-0">Niet gekozen</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Mijn pick-geschiedenis ── */}
        {deelnemer.lmsPicks.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-white">Mijn picks</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {LMS_RONDES.map((r) => {
                const pick = deelnemer.lmsPicks.find((p) => p.rondeNr === r.nr);
                if (!pick) {
                  if (!isRondeGesloten(r.nr)) return null;
                  return (
                    <div key={r.nr} className="px-5 py-3 flex items-center gap-3 opacity-40">
                      <span className="text-xs font-bold text-zinc-600 w-6 text-center">R{r.nr}</span>
                      <p className="text-xs text-zinc-600 flex-1">{r.naam}</p>
                      <span className="text-xs text-zinc-700 italic">Niet gekozen</span>
                    </div>
                  );
                }
                const rondeW = wedstrijdenVoorRonde(r);
                const w = rondeW.find((x) => x.id === pick.wedstrijdId);
                const team = w ? (w.thuis.code === pick.teamCode ? w.thuis : w.uit) : null;
                return (
                  <div key={r.nr} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500 w-6 text-center flex-shrink-0">R{r.nr}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-600">{r.naam}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 ${
                      pick.uitkomst === "win"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : pick.uitkomst === "verlies" || pick.uitkomst === "gelijk"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    }`}>
                      {team && <span>{team.vlag}</span>}
                      <span className="font-semibold">{team?.naam ?? pick.teamCode}</span>
                      {pick.uitkomst === "win" && <span>✓</span>}
                      {(pick.uitkomst === "verlies" || pick.uitkomst === "gelijk") && <span>✗</span>}
                      {!pick.uitkomst && <span className="text-zinc-600">●</span>}
                    </span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
