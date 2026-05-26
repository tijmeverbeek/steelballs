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
import { Wedstrijd } from "@/lib/types";

interface LmsPick {
  rondeNr: number;
  teamCode: string;
  wedstrijdId: string;
  uitkomst: string | null;
}

interface DeelnemerMet {
  id: string;
  userId: string;
  lmsActief: boolean;
  lmsUitgeschakeldRonde: number | null;
  lmsPicks: LmsPick[];
}

export default function LmsPickPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poulenaam, setPoulenaam] = useState("");
  const [deelnemer, setDeelnemer] = useState<DeelnemerMet | null>(null);
  const [actieveRonde, setActieveRonde] = useState<LmsRonde | null>(null);
  const [wedstrijden, setWedstrijden] = useState<Wedstrijd[]>([]);
  const [gekozen, setGekozen] = useState<string | null>(null); // teamCode
  const [opslaan, setOpslaan] = useState(false);
  const [fout, setFout] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const poule = await getPoule(code);
      if (!poule || poule.soort !== "lms") { router.push(`/poule/${code}`); return; }
      setPoulenaam(poule.naam);

      const dl = poule.deelnemers.find((d) => d.userId === user.id) as DeelnemerMet | undefined;
      if (!dl) { router.push(`/poule/${code}`); return; }
      setDeelnemer(dl);

      const ronde = getHuidigeRonde();
      setActieveRonde(ronde);
      if (ronde) {
        setWedstrijden(getWedstrijdenVoorRonde(ronde.nr));
        // Pre-fill if already picked this round
        const bestaand = dl.lmsPicks.find((p) => p.rondeNr === ronde.nr);
        if (bestaand) setGekozen(bestaand.teamCode);
      }
    }
    load();
  }, [code, router]);

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
        body: JSON.stringify({
          rondeNr: actieveRonde.nr,
          teamCode: gekozen,
          wedstrijdId: wedstrijd.id,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFout(body.error ?? "Opslaan mislukt");
      } else {
        setSuccess(true);
        // Update local deelnemer picks
        setDeelnemer((prev) => {
          if (!prev) return prev;
          const filtered = prev.lmsPicks.filter((p) => p.rondeNr !== actieveRonde.nr);
          return { ...prev, lmsPicks: [...filtered, { rondeNr: actieveRonde.nr, teamCode: gekozen, wedstrijdId: wedstrijd.id, uitkomst: null }] };
        });
      }
    } catch {
      setFout("Netwerkfout — probeer opnieuw");
    } finally {
      setOpslaan(false);
    }
  }

  const gebruiktTeams = deelnemer?.lmsPicks
    .filter((p) => p.rondeNr !== actieveRonde?.nr)
    .map((p) => p.teamCode) ?? [];

  const gesloten = actieveRonde ? isRondeGesloten(actieveRonde.nr) : false;
  const deadline = actieveRonde ? getDeadlineVoorRonde(actieveRonde.nr) : null;

  if (!deelnemer || !actieveRonde) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!deelnemer.lmsActief) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">💀</div>
          <h1 className="text-xl font-bold text-white mb-2">Uitgeschakeld</h1>
          <p className="text-zinc-500 mb-1">
            Je werd uitgeschakeld in ronde {deelnemer.lmsUitgeschakeldRonde}.
          </p>
          <p className="text-zinc-600 text-sm mb-6">Beter geluk volgende keer.</p>
          <Link href={`/poule/${code}`} className="text-green-400 hover:text-green-300 text-sm font-medium">
            ← Terug naar de poule
          </Link>
        </div>
      </div>
    );
  }

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

        {/* Ronde navigatie */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LMS_RONDES.map((r) => {
            const mijnPick = deelnemer.lmsPicks.find((p) => p.rondeNr === r.nr);
            const isActief = r.nr === actieveRonde.nr;
            return (
              <button
                key={r.nr}
                onClick={() => {
                  setActieveRonde(r);
                  setWedstrijden(getWedstrijdenVoorRonde(r.nr));
                  setGekozen(deelnemer.lmsPicks.find((p) => p.rondeNr === r.nr)?.teamCode ?? null);
                  setSuccess(false);
                  setFout("");
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  isActief
                    ? "bg-white text-zinc-900 border-white"
                    : mijnPick?.uitkomst === "win"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : mijnPick?.uitkomst === "verlies" || mijnPick?.uitkomst === "gelijk"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "text-zinc-500 border-zinc-700 hover:text-white hover:border-zinc-500"
                }`}
              >
                R{r.nr}
                {mijnPick && (
                  <span className="ml-1">
                    {mijnPick.uitkomst === "win" ? "✓" : mijnPick.uitkomst ? "✗" : "●"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Ronde header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                Ronde {actieveRonde.nr}
              </p>
              <h1 className="text-lg font-bold text-white">{actieveRonde.naam}</h1>
            </div>
            {gesloten ? (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg font-semibold">
                🔒 Gesloten
              </span>
            ) : deadline ? (
              <div className="text-right">
                <p className="text-xs text-zinc-500">Deadline</p>
                <p className="text-xs font-semibold text-amber-400">
                  {deadline.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{deadline.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : null}
          </div>
          {!gesloten && (
            <p className="text-xs text-zinc-500 mt-2">
              Kies één team om te winnen. Je kunt elk team maar één keer kiezen in het hele toernooi.
            </p>
          )}
        </div>

        {/* Pick: wedstrijden van deze ronde */}
        {wedstrijden.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">Wedstrijden voor deze fase zijn nog niet bekend.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Kies je team</p>
              {gekozen && !gesloten && (
                <span className="text-xs text-zinc-500">{wedstrijden.find(w => w.thuis.code === gekozen || w.uit.code === gekozen)?.thuis.code === gekozen
                  ? wedstrijden.find(w => w.thuis.code === gekozen)?.thuis.naam
                  : wedstrijden.find(w => w.uit.code === gekozen)?.uit.naam
                } gekozen</span>
              )}
            </div>
            <div className="divide-y divide-zinc-800">
              {wedstrijden.map((w) => {
                const thuisGebruikt = gebruiktTeams.includes(w.thuis.code);
                const uitGebruikt = gebruiktTeams.includes(w.uit.code);
                const matchGesloten = gesloten || new Date() >= new Date(`${w.datum}T${w.tijd}:00`);

                return (
                  <div key={w.id} className="px-4 py-3">
                    <p className="text-xs text-zinc-600 text-center mb-3">
                      {new Date(w.datum).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}{w.tijd}
                      {matchGesloten && <span className="ml-2 text-zinc-700">🔒</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Thuis */}
                      <button
                        type="button"
                        disabled={thuisGebruikt || matchGesloten}
                        onClick={() => { setGekozen(w.thuis.code); setSuccess(false); setFout(""); }}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                          gekozen === w.thuis.code
                            ? "bg-green-500/20 border-green-500 text-white"
                            : thuisGebruikt || matchGesloten
                            ? "opacity-30 border-zinc-800 cursor-not-allowed"
                            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-2xl">{w.thuis.vlag}</span>
                        <span className="text-xs font-semibold leading-tight text-center">{w.thuis.naam}</span>
                        {thuisGebruikt && <span className="text-xs text-zinc-600">al gebruikt</span>}
                      </button>

                      <div className="flex flex-col items-center gap-1 px-1">
                        <span className="text-zinc-700 font-bold text-sm">VS</span>
                      </div>

                      {/* Uit */}
                      <button
                        type="button"
                        disabled={uitGebruikt || matchGesloten}
                        onClick={() => { setGekozen(w.uit.code); setSuccess(false); setFout(""); }}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                          gekozen === w.uit.code
                            ? "bg-green-500/20 border-green-500 text-white"
                            : uitGebruikt || matchGesloten
                            ? "opacity-30 border-zinc-800 cursor-not-allowed"
                            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-2xl">{w.uit.vlag}</span>
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

        {/* Submit */}
        {!gesloten && wedstrijden.length > 0 && (
          <div className="space-y-2">
            {fout && <p className="text-red-400 text-xs text-center">{fout}</p>}
            {success && <p className="text-green-400 text-xs text-center font-medium">✓ Pick opgeslagen</p>}
            <button
              onClick={submitPick}
              disabled={!gekozen || opslaan}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-colors"
            >
              {opslaan ? "Opslaan..." : gekozen ? "Pick bevestigen →" : "Kies een team"}
            </button>
          </div>
        )}

        {/* Overzicht gebruikte teams */}
        {gebruiktTeams.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Al gebruikt</p>
            <div className="flex flex-wrap gap-2">
              {deelnemer.lmsPicks
                .sort((a, b) => a.rondeNr - b.rondeNr)
                .filter((p) => p.rondeNr !== actieveRonde.nr)
                .map((p) => {
                  const alle = getWedstrijdenVoorRonde(p.rondeNr);
                  const w = alle.find((x) => x.id === p.wedstrijdId);
                  const team = w
                    ? (w.thuis.code === p.teamCode ? w.thuis : w.uit)
                    : null;
                  return (
                    <span
                      key={p.rondeNr}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
                        p.uitkomst === "win"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : p.uitkomst === "verlies" || p.uitkomst === "gelijk"
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {team && <span>{team.vlag}</span>}
                      <span>{team?.naam ?? p.teamCode}</span>
                      <span className="text-zinc-600">R{p.rondeNr}</span>
                      {p.uitkomst === "win" && <span>✓</span>}
                      {(p.uitkomst === "verlies" || p.uitkomst === "gelijk") && <span>✗</span>}
                    </span>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
