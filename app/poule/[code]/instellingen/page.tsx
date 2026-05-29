"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, updatePouleInstellingen, slaMatchResultaatOp, rondeAfPoule } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Poule } from "@/lib/types";
import { TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN, TOERNOOIWINNAAR_PUNTEN, EERSTE_DOELPUNTENMAKER_PUNTEN } from "@/lib/storage";
import { SpelerAutocomplete } from "@/components/SpelerAutocomplete";
import { LMS_RONDES, getWedstrijdenVoorRonde } from "@/lib/lms";

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${aan ? "bg-green-500" : "bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aan ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function InstellingenPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [topscorerResultaatInput, setTopscorerResultaatInput] = useState("");
  const [geleKaartenResultaatInput, setGeleKaartenResultaatInput] = useState("");
  const [toernooiwinaarResultaatInput, setToernooiwinaarResultaatInput] = useState("");
  const [eersteDoelpuntenmakerResultaatInput, setEersteDoelpuntenmakerResultaatInput] = useState("");
  const [eersteDoelpuntenminuutResultaatInput, setEersteDoelpuntenminuutResultaatInput] = useState<number | null>(null);
  const [clFinaleThuis, setClFinaleThuis] = useState<string>("");
  const [clFinaleUit, setClFinaleUit] = useState<string>("");
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [clFout, setClFout] = useState("");
  const [clBezig, setClBezig] = useState(false);
  const [verwijderBevestiging, setVerwijderBevestiging] = useState(false);
  const [verwijderDeelnemerId, setVerwijderDeelnemerId] = useState<string | null>(null);
  const [lmsVerwerkRonde, setLmsVerwerkRonde] = useState<number | null>(null);
  const [lmsVerwerkBezig, setLmsVerwerkBezig] = useState(false);
  const [lmsVerwerkResultaat, setLmsVerwerkResultaat] = useState<{ verwerkt: number; ontbreekt: number } | null>(null);
  const [betaaldBezig, setBetaaldBezig] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      const [p, userRes] = await Promise.all([
        getPoule(code),
        fetch("/api/user").then((r) => r.json()).catch(() => ({})),
      ]);
      const isAdmin = userRes?.isAdmin === true;
      if (!p || (p.organisatorId !== user.id && !isAdmin)) { router.push(`/poule/${code}`); return; }
      setPoule(p);
      setTopscorerResultaatInput(p.topscorerResultaat ?? "");
      setGeleKaartenResultaatInput(p.geleKaartenResultaat ?? "");
      setToernooiwinaarResultaatInput(p.toernooiwinaarResultaat ?? "");
      setEersteDoelpuntenmakerResultaatInput(p.eersteDoelpuntenmakerResultaat ?? "");
      setEersteDoelpuntenminuutResultaatInput(p.eersteDoelpuntenminuutResultaat ?? null);
      const clResult = p.resultaten["CL1"];
      setClFinaleThuis(clResult ? String(clResult.thuis) : "");
      setClFinaleUit(clResult ? String(clResult.uit) : "");
    });
  }, [code, router]);

  function toonOpgeslagen() {
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
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
      toonOpgeslagen();
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
      toonOpgeslagen();
    } catch {
      setPoule({ ...poule, eersteDoelpuntenminuutResultaat: prev });
    }
  }

  async function slaClFinaleResultaatOp() {
    if (!poule || clFinaleThuis === "" || clFinaleUit === "") return;
    setClBezig(true);
    setClFout("");
    try {
      const res = await fetch(`/api/poules/${code}/resultaat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedstrijdId: "CL1", thuis: parseInt(clFinaleThuis), uit: parseInt(clFinaleUit) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setClFout(data.error ?? `Fout ${res.status} — controleer of je de beheerder bent van deze poule`);
        return;
      }
      setPoule({ ...poule, resultaten: { ...poule.resultaten, CL1: { thuis: parseInt(clFinaleThuis), uit: parseInt(clFinaleUit) } } });
      toonOpgeslagen();
    } catch (e) {
      setClFout("Verbindingsfout — probeer het opnieuw");
    } finally {
      setClBezig(false);
    }
  }

  async function rondeAf() {
    if (!poule) return;
    try {
      await rondeAfPoule(code);
      setPoule({ ...poule, afgerond: true });
    } catch { /* silent */ }
  }

  async function verwerkLmsRonde(rondeNr: number) {
    setLmsVerwerkBezig(true);
    setLmsVerwerkResultaat(null);
    try {
      const res = await fetch(`/api/poules/${code}/lms/verwerk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rondeNr }),
      });
      const body = await res.json();
      if (res.ok) {
        setLmsVerwerkResultaat({ verwerkt: body.verwerkt, ontbreekt: body.ontbreekt });
        const fresh = await getPoule(code);
        if (fresh) setPoule(fresh);
      } else {
        alert(body.error ?? "Verwerken mislukt");
      }
    } catch {
      alert("Netwerkfout — probeer opnieuw");
    } finally {
      setLmsVerwerkBezig(false);
    }
  }

  async function verwijderDeelnemer(deelnemerId: string) {
    if (!poule) return;
    try {
      const res = await fetch(`/api/poules/${code}/deelnemers/${deelnemerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPoule({ ...poule, deelnemers: poule.deelnemers.filter((d) => d.id !== deelnemerId) });
    } catch {
      alert("Verwijderen mislukt. Probeer het opnieuw.");
    } finally {
      setVerwijderDeelnemerId(null);
    }
  }

  async function toggleBetaald(deelnemerId: string, huidigeBetaald: boolean) {
    if (!poule) return;
    setBetaaldBezig(deelnemerId);
    try {
      const res = await fetch(`/api/poules/${code}/deelnemers/${deelnemerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betaald: !huidigeBetaald }),
      });
      if (!res.ok) throw new Error();
      setPoule({
        ...poule,
        deelnemers: poule.deelnemers.map((d) =>
          d.id === deelnemerId ? { ...d, betaald: !huidigeBetaald } : d
        ),
      });
    } catch {
      alert("Betaald-status bijwerken mislukt. Probeer het opnieuw.");
    } finally {
      setBetaaldBezig(null);
    }
  }

  async function verwijderPoule() {
    try {
      const res = await fetch(`/api/poules/${code}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/");
    } catch {
      alert("Verwijderen mislukt. Probeer het opnieuw.");
    }
  }

  if (!poule) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isCL = (poule.soort ?? "wk") === "cl_finale";
  const isLMS = (poule.soort ?? "wk") === "lms";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <Link href={`/poule/${code}`} className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
            ← {poule.naam}
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <h1 className="text-2xl font-black text-white">Instellingen</h1>
            {opgeslagen && <span className="text-xs text-green-400 font-medium">✓ Opgeslagen</span>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Bonus categorieën — alleen voor wk/cl_finale */}
        {!isLMS && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Bonus categorieën</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Schakel bonussen in of uit en vul resultaten in</p>
          </div>
          <div className="p-5 space-y-5">

            {!isCL && (
              <>
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
                        <p className="text-xs text-blue-400 mt-2">Live leider: <span className="font-semibold">{poule.liveStats.topscorer}</span></p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <SpelerAutocomplete soort={poule.soort ?? "wk"} value={topscorerResultaatInput} onChange={setTopscorerResultaatInput} placeholder="Definitieve topscorer invullen..." ringColor="green" className="flex-1" />
                        <button onClick={() => slaResultaatOp("topscorerResultaat", topscorerResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-zinc-800" />

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
                        <p className="text-xs text-blue-400 mt-2">Live leider: <span className="font-semibold">{poule.liveStats.geleKaarten}</span></p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <SpelerAutocomplete soort={poule.soort ?? "wk"} value={geleKaartenResultaatInput} onChange={setGeleKaartenResultaatInput} placeholder="Definitieve speler invullen..." ringColor="green" className="flex-1" />
                        <button onClick={() => slaResultaatOp("geleKaartenResultaat", geleKaartenResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-zinc-800" />

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
                      <input type="text" value={toernooiwinaarResultaatInput} onChange={(e) => setToernooiwinaarResultaatInput(e.target.value)} placeholder="Winnaar invullen zodra bekend..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button onClick={() => slaResultaatOp("toernooiwinaarResultaat", toernooiwinaarResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isCL && (
              <>
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
                      <SpelerAutocomplete soort={poule.soort ?? "wk"} value={eersteDoelpuntenmakerResultaatInput} onChange={setEersteDoelpuntenmakerResultaatInput} placeholder="Kies de eerste doelpuntenmaker..." ringColor="green" className="flex-1" />
                      <button onClick={() => slaResultaatOp("eersteDoelpuntenmakerResultaat", eersteDoelpuntenmakerResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800" />

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
                      <input type="number" min={1} max={120} value={eersteDoelpuntenminuutResultaatInput ?? ""} onChange={(e) => setEersteDoelpuntenminuutResultaatInput(e.target.value === "" ? null : parseInt(e.target.value))} placeholder="bijv. 34" className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <span className="text-xs text-zinc-500">minuut</span>
                      <button onClick={() => slaMinuutResultaatOp(eersteDoelpuntenminuutResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800" />

                <div>
                  <p className="text-sm font-semibold text-white mb-1">CL Finale uitslag</p>
                  <p className="text-xs text-zinc-500 mb-3">PSG 🇫🇷 vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Arsenal — vul de eindstand in na de wedstrijd</p>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={clFinaleThuis} onChange={(e) => { setClFinaleThuis(e.target.value); setClFout(""); }} placeholder="0" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                    <span className="text-zinc-600 font-bold">–</span>
                    <input type="number" min={0} value={clFinaleUit} onChange={(e) => { setClFinaleUit(e.target.value); setClFout(""); }} placeholder="0" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                    <button onClick={slaClFinaleResultaatOp} disabled={clBezig} className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                      {clBezig ? "Opslaan..." : "Opslaan"}
                    </button>
                  </div>
                  {clFout && <p className="text-red-400 text-xs mt-2">{clFout}</p>}
                </div>
              </>
            )}

          </div>
        </div>}

        {/* LMS rondebeheer */}
        {isLMS && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Rondes verwerken</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Verwerk een ronde om picks te beoordelen en spelers uit te schakelen</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Ronde selector */}
              <div className="flex gap-2 flex-wrap">
                {LMS_RONDES.map((r) => (
                  <button
                    key={r.nr}
                    onClick={() => { setLmsVerwerkRonde(r.nr); setLmsVerwerkResultaat(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      lmsVerwerkRonde === r.nr
                        ? "bg-white text-zinc-900 border-white"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    R{r.nr}
                  </button>
                ))}
              </div>

              {lmsVerwerkRonde !== null && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300 font-medium">
                    {LMS_RONDES.find((r) => r.nr === lmsVerwerkRonde)?.naam}
                  </p>

                  {/* Overzicht picks voor deze ronde */}
                  <div className="space-y-1.5">
                    {poule.deelnemers.map((d) => {
                      const naam = d.user.gebruikersnaam ?? d.user.email.split("@")[0];
                      const pick = d.lmsPicks?.find((p) => p.rondeNr === lmsVerwerkRonde);
                      const wedstrijden = getWedstrijdenVoorRonde(lmsVerwerkRonde);
                      const w = pick ? wedstrijden.find((x) => x.id === pick.wedstrijdId) : null;
                      const team = w && pick ? (w.thuis.code === pick.teamCode ? w.thuis : w.uit) : null;
                      return (
                        <div key={d.id} className="flex items-center gap-3 text-sm">
                          <span className="text-zinc-600 w-4 text-center flex-shrink-0">
                            {(d.lmsActief ?? true) ? "🟢" : "💀"}
                          </span>
                          <span className="text-zinc-400 flex-1 truncate">{naam}</span>
                          {pick && team ? (
                            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
                              pick.uitkomst === "win"
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : pick.uitkomst === "verlies" || pick.uitkomst === "gelijk"
                                ? "bg-red-500/10 border-red-500/30 text-red-400"
                                : "bg-zinc-800 border-zinc-700 text-zinc-300"
                            }`}>
                              {team.vlag} {team.naam}
                              {pick.uitkomst === "win" && " ✓"}
                              {(pick.uitkomst === "verlies" || pick.uitkomst === "gelijk") && " ✗"}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-700 italic">geen pick</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {lmsVerwerkResultaat && (
                    <p className="text-xs text-green-400 font-medium">
                      ✓ {lmsVerwerkResultaat.verwerkt} picks verwerkt
                      {lmsVerwerkResultaat.ontbreekt > 0 && ` · ${lmsVerwerkResultaat.ontbreekt} uitslag(en) ontbreken`}
                    </p>
                  )}

                  <button
                    onClick={() => verwerkLmsRonde(lmsVerwerkRonde)}
                    disabled={lmsVerwerkBezig}
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {lmsVerwerkBezig ? "Verwerken..." : `Ronde ${lmsVerwerkRonde} verwerken`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deelnemers beheren */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Deelnemers</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Beheer deelnemers en markeer wie betaald heeft</p>
            {poule.deelnemers.length > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                {poule.deelnemers.filter((d) => d.betaald).length} van {poule.deelnemers.length} betaald
              </p>
            )}
          </div>
          <div className="divide-y divide-zinc-800">
            {poule.deelnemers.map((d) => {
              const weergavenaam = d.user.naam
                ? `${d.user.naam} (${d.user.gebruikersnaam ?? d.user.email.split("@")[0]})`
                : (d.user.gebruikersnaam ?? d.user.email.split("@")[0]);
              const isBetaald = d.betaald ?? false;
              return (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-300 truncate flex-1">{weergavenaam}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleBetaald(d.id, isBetaald)}
                      disabled={betaaldBezig === d.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${
                        isBetaald
                          ? "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                      } disabled:opacity-50`}
                    >
                      {betaaldBezig === d.id ? "..." : isBetaald ? "Betaald ✓" : "Niet betaald"}
                    </button>
                    {verwijderDeelnemerId === d.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Zeker?</span>
                        <button onClick={() => verwijderDeelnemer(d.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Ja</button>
                        <button onClick={() => setVerwijderDeelnemerId(null)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Nee</button>
                      </div>
                    ) : (
                      <button onClick={() => setVerwijderDeelnemerId(d.id)} className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                        Verwijderen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {poule.deelnemers.length === 0 && (
              <p className="px-5 py-4 text-xs text-zinc-600 italic">Nog geen deelnemers</p>
            )}
          </div>
        </div>

        {/* Toernooi afronden */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-1">Toernooi afronden</p>
          <p className="text-xs text-zinc-500 mb-3">Sluit het toernooi af, bepaal de winnaar en ken de trofee toe. Dit kan niet ongedaan worden gemaakt.</p>
          {poule.afgerond ? (
            <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
              <span>✓</span><span>Toernooi is afgerond</span>
            </div>
          ) : (
            <>
              {poule.deelnemers.some((d) => !d.betaald) && (
                <p className="text-xs text-yellow-400 mb-3">
                  ⚠ {poule.deelnemers.filter((d) => !d.betaald).length} deelnemer{poule.deelnemers.filter((d) => !d.betaald).length !== 1 ? "s zijn" : " is"} niet als betaald gemarkeerd en telt niet mee
                </p>
              )}
              <button onClick={rondeAf} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                🏆 Toernooi afronden
              </button>
            </>
          )}
        </div>

        {/* Poule verwijderen */}
        <div className="bg-zinc-900 border border-red-900/40 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-1">Poule verwijderen</p>
          <p className="text-xs text-zinc-500 mb-3">Verwijdert de poule inclusief alle deelnemers en voorspellingen. Dit kan niet ongedaan worden gemaakt.</p>
          {!verwijderBevestiging ? (
            <button onClick={() => setVerwijderBevestiging(true)} className="bg-red-900/40 hover:bg-red-800/50 text-red-400 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors border border-red-900/60">
              Verwijder poule
            </button>
          ) : (
            <div className="flex gap-3 items-center">
              <span className="text-xs text-zinc-400">Weet je het zeker?</span>
              <button onClick={verwijderPoule} className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                Ja, verwijder
              </button>
              <button onClick={() => setVerwijderBevestiging(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                Annuleer
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
