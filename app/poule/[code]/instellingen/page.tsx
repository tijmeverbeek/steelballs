"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, updatePouleInstellingen, slaMatchResultaatOp, rondeAfPoule } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Poule, Wedstrijd } from "@/lib/types";
import { TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN, TOERNOOIWINNAAR_PUNTEN, EERSTE_DOELPUNTENMAKER_PUNTEN } from "@/lib/storage";
import { SpelerAutocomplete } from "@/components/SpelerAutocomplete";
import { LMS_RONDES, getWedstrijdenVoorRonde } from "@/lib/lms";
import { getAllWkTeams, getWedstrijdenVoorSoort } from "@/lib/matches";

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
  const [lmsPickOverrideDeelnemerId, setLmsPickOverrideDeelnemerId] = useState<string | null>(null);
  const [lmsPickOverrideWedstrijdId, setLmsPickOverrideWedstrijdId] = useState("");
  const [lmsPickOverrideTeamCode, setLmsPickOverrideTeamCode] = useState("");
  const [lmsPickOverrideBezig, setLmsPickOverrideBezig] = useState(false);
  const [betaaldBezig, setBetaaldBezig] = useState<string | null>(null);
  const [lmsResultaatRonde, setLmsResultaatRonde] = useState<number | null>(null);
  const [lmsScores, setLmsScores] = useState<Record<string, { thuis: string; uit: string }>>({});
  const [lmsScoreBezig, setLmsScoreBezig] = useState<string | null>(null);
  const [knockoutWedstrijden, setKnockoutWedstrijden] = useState<LmsKnockoutWedstrijd[]>([]);
  const [knockoutRonde, setKnockoutRonde] = useState<number>(4);
  const [nieuwThuis, setNieuwThuis] = useState("");
  const [nieuwUit, setNieuwUit] = useState("");
  const [nieuwDatum, setNieuwDatum] = useState("");
  const [nieuwTijd, setNieuwTijd] = useState("");
  const [knockoutBezig, setKnockoutBezig] = useState(false);
  const [knockoutVerwijderBezig, setKnockoutVerwijderBezig] = useState<string | null>(null);
  const wkTeams = getAllWkTeams();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return; }
      const [p, userRes, knockoutRes] = await Promise.all([
        getPoule(code),
        fetch("/api/user").then((r) => r.json()).catch(() => ({})),
        fetch("/api/lms/wedstrijden").then((r) => r.json()).catch(() => ({ wedstrijden: [] })),
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
      const scores: Record<string, { thuis: string; uit: string }> = {};
      Object.entries(p.resultaten).forEach(([wId, res]) => {
        scores[wId] = { thuis: String(res.thuis), uit: String(res.uit) };
      });
      setLmsScores(scores);
      setKnockoutWedstrijden(knockoutRes.wedstrijden ?? []);
    });
  }, [code, router]);

  function toonOpgeslagen() {
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2000);
  }

  async function toggleInstelling(key: "topscorerActief" | "geleKaartenActief" | "toernooiwinaarActief" | "eersteDoelpuntenmakerActief" | "eersteDoelpuntenminuutActief" | "cornersActief" | "schotenOpDoelActief" | "uitslagActief", waarde: boolean) {
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
    const isOef = poule?.soort === "oefenwedstrijd";
    const isEnk = poule?.soort === "enkelvoudig";
    if (!poule || clFinaleThuis === "") return;
    if (!isOef && clFinaleUit === "") return;
    setClBezig(true);
    setClFout("");
    try {
      const wedstrijdId = isOef ? "OEF1" : isEnk ? (poule.wkWedstrijdId ?? "CL1") : "CL1";
      const res = await fetch(`/api/poules/${code}/resultaat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedstrijdId, thuis: parseInt(clFinaleThuis), uit: isOef ? 0 : parseInt(clFinaleUit) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setClFout(data.error ?? `Fout ${res.status} — controleer of je de beheerder bent van deze poule`);
        return;
      }
      setPoule({ ...poule, resultaten: { ...poule.resultaten, [wedstrijdId]: { thuis: parseInt(clFinaleThuis), uit: parseInt(clFinaleUit) } } });
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

  async function slaLmsPickOverrideOp(deelnemerId: string, rondeNr: number) {
    if (!lmsPickOverrideWedstrijdId || !lmsPickOverrideTeamCode) return;
    setLmsPickOverrideBezig(true);
    try {
      const res = await fetch(`/api/poules/${code}/lms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deelnemerId, rondeNr, teamCode: lmsPickOverrideTeamCode, wedstrijdId: lmsPickOverrideWedstrijdId }),
      });
      const body = await res.json();
      if (res.ok) {
        setPoule((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            deelnemers: prev.deelnemers.map((d) => {
              if (d.id !== deelnemerId) return d;
              const filteredPicks = (d.lmsPicks ?? []).filter((p) => p.rondeNr !== rondeNr);
              return {
                ...d,
                lmsPicks: [
                  ...filteredPicks,
                  { id: body.pick.id, deelnemerId, rondeNr, teamCode: lmsPickOverrideTeamCode, wedstrijdId: lmsPickOverrideWedstrijdId, uitkomst: null },
                ],
              };
            }),
          };
        });
        setLmsPickOverrideDeelnemerId(null);
        setLmsPickOverrideWedstrijdId("");
        setLmsPickOverrideTeamCode("");
        toonOpgeslagen();
      } else {
        alert(body.error ?? "Opslaan mislukt");
      }
    } catch {
      alert("Netwerkfout — probeer opnieuw");
    } finally {
      setLmsPickOverrideBezig(false);
    }
  }

  async function slaLmsScoreOp(wedstrijdId: string) {
    const score = lmsScores[wedstrijdId];
    if (!score || score.thuis === "" || score.uit === "") return;
    setLmsScoreBezig(wedstrijdId);
    try {
      await slaMatchResultaatOp(code, wedstrijdId, parseInt(score.thuis), parseInt(score.uit));
      setPoule((prev) =>
        prev ? { ...prev, resultaten: { ...prev.resultaten, [wedstrijdId]: { thuis: parseInt(score.thuis), uit: parseInt(score.uit) } } } : prev
      );
      toonOpgeslagen();
    } catch {
      alert("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setLmsScoreBezig(null);
    }
  }

  async function voegKnockoutWedstrijdToe() {
    if (!nieuwThuis || !nieuwUit || nieuwThuis === nieuwUit) return;
    setKnockoutBezig(true);
    try {
      const thuisTeam = wkTeams.find((t) => t.code === nieuwThuis);
      const uitTeam = wkTeams.find((t) => t.code === nieuwUit);
      if (!thuisTeam || !uitTeam) return;
      const res = await fetch("/api/lms/wedstrijden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rondeNr: knockoutRonde,
          thuisCode: thuisTeam.code,
          thuisNaam: thuisTeam.naam,
          thuisVlag: thuisTeam.vlag ?? "",
          uitCode: uitTeam.code,
          uitNaam: uitTeam.naam,
          uitVlag: uitTeam.vlag ?? "",
          datum: nieuwDatum || null,
          tijd: nieuwTijd || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Toevoegen mislukt"); return; }
      const { wedstrijd } = await res.json();
      setKnockoutWedstrijden((prev) => [...prev, wedstrijd]);
      setNieuwThuis(""); setNieuwUit(""); setNieuwDatum(""); setNieuwTijd("");
      toonOpgeslagen();
    } catch {
      alert("Netwerkfout — probeer opnieuw");
    } finally {
      setKnockoutBezig(false);
    }
  }

  async function verwijderKnockoutWedstrijd(id: string) {
    setKnockoutVerwijderBezig(id);
    try {
      const res = await fetch(`/api/lms/wedstrijden/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Verwijderen mislukt"); return; }
      setKnockoutWedstrijden((prev) => prev.filter((w) => w.id !== id));
    } catch {
      alert("Netwerkfout — probeer opnieuw");
    } finally {
      setKnockoutVerwijderBezig(null);
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
  const isOefenwedstrijd = (poule.soort ?? "wk") === "oefenwedstrijd";
  const isLMS = (poule.soort ?? "wk") === "lms";
  const isEnkelvoudig = poule.soort === "enkelvoudig";

  const enkelvoudigWedstrijd = isEnkelvoudig && poule.wkWedstrijdId
    ? getWedstrijdenVoorSoort("wk").find((w) => w.id === poule.wkWedstrijdId) ?? null
    : null;
  const enkelvoudigTeamCodes = enkelvoudigWedstrijd
    ? [enkelvoudigWedstrijd.thuis.code, enkelvoudigWedstrijd.uit.code]
    : undefined;

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

        {/* Enkelvoudig bonus categorieën */}
        {isEnkelvoudig && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Voorspellingstypen</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Schakel in welke voorspellingen deelnemers kunnen doen</p>
          </div>
          <div className="p-5 space-y-5">

            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">Uitslag</p>
                  <p className="text-xs text-zinc-500">Deelnemers voorspellen de eindstand (10 pt exact, 5 pt winnaar)</p>
                </div>
                <Toggle aan={poule.uitslagActief !== false} onChange={(v) => toggleInstelling("uitslagActief", v)} />
              </div>
              {Object.entries(poule.resultaten ?? {}).map(([id, r]) => id === poule.wkWedstrijdId && (
                <p key={id} className="text-xs text-green-400 mt-1">Eindstand ingevoerd: {r.thuis}–{r.uit}</p>
              ))}
            </div>

            <div className="border-t border-zinc-800" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">Eerste doelpuntenmaker</p>
                  <p className="text-xs text-zinc-500">Deelnemers kiezen een speler uit beide elftallen</p>
                </div>
                <Toggle aan={poule.eersteDoelpuntenmakerActief} onChange={(v) => toggleInstelling("eersteDoelpuntenmakerActief", v)} />
              </div>
              {poule.eersteDoelpuntenmakerActief && (
                <div className="mt-2 flex gap-2">
                  <SpelerAutocomplete soort="wk" teamCodes={enkelvoudigTeamCodes} value={eersteDoelpuntenmakerResultaatInput} onChange={setEersteDoelpuntenmakerResultaatInput} placeholder="Kies de eerste doelpuntenmaker..." ringColor="green" className="flex-1" />
                  <button onClick={() => slaResultaatOp("eersteDoelpuntenmakerResultaat", eersteDoelpuntenmakerResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">Minuut eerste doelpunt</p>
                  <p className="text-xs text-zinc-500">Tiebreaker — dichtstbijzijnde minuut wint bij gelijke punten</p>
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
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">Totaal aantal corners</p>
                  <p className="text-xs text-zinc-500">Deelnemers raden het totale aantal corners in de wedstrijd (3 pt)</p>
                </div>
                <Toggle aan={poule.cornersActief} onChange={(v) => toggleInstelling("cornersActief", v)} />
              </div>
              {poule.cornersActief && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="number" min={0} value={clFinaleThuis} onChange={(e) => { setClFinaleThuis(e.target.value); setClFout(""); }} placeholder="bijv. 10" className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                  <span className="text-xs text-zinc-500">corners</span>
                  <button
                    onClick={async () => {
                      const val = parseInt(clFinaleThuis);
                      if (isNaN(val)) { setClFout("Voer een geldig getal in"); return; }
                      setClBezig(true);
                      try {
                        await updatePouleInstellingen(code, { cornersResultaat: val });
                        setPoule((p) => p ? { ...p, cornersResultaat: val } : p);
                        setClFinaleThuis("");
                        setOpgeslagen(true);
                        setTimeout(() => setOpgeslagen(false), 2000);
                      } catch { setClFout("Opslaan mislukt"); }
                      setClBezig(false);
                    }}
                    disabled={clBezig}
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {clBezig ? "Opslaan..." : "Opslaan"}
                  </button>
                  {clFout && <p className="text-red-400 text-xs">{clFout}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-white">Totaal schoten op doel</p>
                  <p className="text-xs text-zinc-500">Deelnemers raden het totale aantal schoten op doel (3 pt)</p>
                </div>
                <Toggle aan={poule.schotenOpDoelActief} onChange={(v) => toggleInstelling("schotenOpDoelActief", v)} />
              </div>
              {poule.schotenOpDoelActief && (
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    value={poule.schotenOpDoelResultaat ?? ""}
                    onChange={async (e) => {
                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                      setPoule((p) => p ? { ...p, schotenOpDoelResultaat: val } : p);
                      try {
                        await updatePouleInstellingen(code, { schotenOpDoelResultaat: val });
                        toonOpgeslagen();
                      } catch { /* silent */ }
                    }}
                    placeholder="bijv. 8"
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                  />
                  <span className="text-xs text-zinc-500">schoten</span>
                </div>
              )}
            </div>

          </div>
        </div>}

        {/* Uitslag invoeren — enkelvoudig */}
        {isEnkelvoudig && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Uitslag invoeren</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Vul de eindstand in na de wedstrijd</p>
            </div>
            <div className="p-5">
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
          </div>
        )}

        {/* Bonus categorieën — alleen voor wk/cl_finale */}
        {!isLMS && !isEnkelvoudig && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
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

            {(isCL || isOefenwedstrijd) && (
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
                      <input type="number" min={1} max={90} value={eersteDoelpuntenminuutResultaatInput ?? ""} onChange={(e) => setEersteDoelpuntenminuutResultaatInput(e.target.value === "" ? null : parseInt(e.target.value))} placeholder="bijv. 34" className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <span className="text-xs text-zinc-500">minuut</span>
                      <button onClick={() => slaMinuutResultaatOp(eersteDoelpuntenminuutResultaatInput)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">Opslaan</button>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800" />

                <div>
                  {isCL && (
                    <>
                      <p className="text-sm font-semibold text-white mb-1">CL Finale uitslag</p>
                      <p className="text-xs text-zinc-500 mb-3">PSG 🇫🇷 vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Arsenal — vul de eindstand in na de wedstrijd</p>
                    </>
                  )}
                  {isOefenwedstrijd && (
                    <>
                      <p className="text-sm font-semibold text-white mb-1">Uitzwaai corners</p>
                      <p className="text-xs text-zinc-500 mb-3">🇳🇱 Nederland vs 🇩🇿 Algerije — vul het totaal aantal corners in na de wedstrijd</p>
                    </>
                  )}
                  {isOefenwedstrijd ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} value={clFinaleThuis} onChange={(e) => { setClFinaleThuis(e.target.value); setClFout(""); }} placeholder="bijv. 12" className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                      <span className="text-zinc-500 text-sm">totaal corners</span>
                      <button onClick={slaClFinaleResultaatOp} disabled={clBezig} className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                        {clBezig ? "Opslaan..." : "Opslaan"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} value={clFinaleThuis} onChange={(e) => { setClFinaleThuis(e.target.value); setClFout(""); }} placeholder="0" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                      <span className="text-zinc-600 font-bold">–</span>
                      <input type="number" min={0} value={clFinaleUit} onChange={(e) => { setClFinaleUit(e.target.value); setClFout(""); }} placeholder="0" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-center" />
                      <button onClick={slaClFinaleResultaatOp} disabled={clBezig} className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
                        {clBezig ? "Opslaan..." : "Opslaan"}
                      </button>
                    </div>
                  )}
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
                  {(() => {
                    const alleWedstrijdenRonde: Wedstrijd[] = [
                      ...getWedstrijdenVoorRonde(lmsVerwerkRonde),
                      ...knockoutWedstrijden
                        .filter((kw) => kw.rondeNr === lmsVerwerkRonde)
                        .map((kw): Wedstrijd => ({
                          id: kw.id,
                          thuis: { code: kw.thuisCode, naam: kw.thuisNaam, vlag: kw.thuisVlag },
                          uit: { code: kw.uitCode, naam: kw.uitNaam, vlag: kw.uitVlag },
                          datum: kw.datum ?? "", tijd: kw.tijd ?? "",
                          groep: `Ronde ${kw.rondeNr}`, fase: "knockout",
                        })),
                    ];
                    return (
                      <div className="space-y-2">
                        {poule.deelnemers.map((d) => {
                          const naam = d.user.gebruikersnaam ?? d.user.email.split("@")[0];
                          const pick = d.lmsPicks?.find((p) => p.rondeNr === lmsVerwerkRonde);
                          const w = pick ? alleWedstrijdenRonde.find((x) => x.id === pick.wedstrijdId) : null;
                          const team = w && pick ? (w.thuis.code === pick.teamCode ? w.thuis : w.uit) : null;
                          const isEditing = lmsPickOverrideDeelnemerId === d.id;
                          const overrideWedstrijd = alleWedstrijdenRonde.find((x) => x.id === lmsPickOverrideWedstrijdId);
                          return (
                            <div key={d.id}>
                              <div className="flex items-center gap-3 text-sm">
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
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setLmsPickOverrideDeelnemerId(null);
                                    } else {
                                      setLmsPickOverrideDeelnemerId(d.id);
                                      setLmsPickOverrideWedstrijdId("");
                                      setLmsPickOverrideTeamCode("");
                                    }
                                  }}
                                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
                                >
                                  {isEditing ? "Annuleer" : "Aanpassen"}
                                </button>
                              </div>
                              {isEditing && (
                                <div className="mt-2 ml-7 flex flex-col gap-2">
                                  <select
                                    value={lmsPickOverrideWedstrijdId}
                                    onChange={(e) => { setLmsPickOverrideWedstrijdId(e.target.value); setLmsPickOverrideTeamCode(""); }}
                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">Kies wedstrijd...</option>
                                    {alleWedstrijdenRonde.map((wx) => (
                                      <option key={wx.id} value={wx.id}>{wx.thuis.vlag} {wx.thuis.naam} vs {wx.uit.naam} {wx.uit.vlag}</option>
                                    ))}
                                  </select>
                                  {overrideWedstrijd && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setLmsPickOverrideTeamCode(overrideWedstrijd.thuis.code)}
                                        className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${lmsPickOverrideTeamCode === overrideWedstrijd.thuis.code ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                                      >
                                        {overrideWedstrijd.thuis.vlag} {overrideWedstrijd.thuis.naam}
                                      </button>
                                      <button
                                        onClick={() => setLmsPickOverrideTeamCode(overrideWedstrijd.uit.code)}
                                        className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${lmsPickOverrideTeamCode === overrideWedstrijd.uit.code ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
                                      >
                                        {overrideWedstrijd.uit.vlag} {overrideWedstrijd.uit.naam}
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => slaLmsPickOverrideOp(d.id, lmsVerwerkRonde)}
                                    disabled={!lmsPickOverrideWedstrijdId || !lmsPickOverrideTeamCode || lmsPickOverrideBezig}
                                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-xs px-4 py-1.5 rounded-lg transition-colors self-start"
                                  >
                                    {lmsPickOverrideBezig ? "Opslaan..." : "Pick opslaan"}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

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

        {/* Uitslagen invoeren — voor LMS (en gedeeld met WK poules via dezelfde Resultaat tabel) */}
        {isLMS && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Uitslagen invoeren</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Scores gelden voor alle poules — LMS en WK gebruiken dezelfde resultaten</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {LMS_RONDES.map((r) => (
                  <button
                    key={r.nr}
                    onClick={() => setLmsResultaatRonde(lmsResultaatRonde === r.nr ? null : r.nr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      lmsResultaatRonde === r.nr
                        ? "bg-white text-zinc-900 border-white"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    R{r.nr}
                  </button>
                ))}
              </div>

              {lmsResultaatRonde !== null && (() => {
                const hardcodedWedstrijden = getWedstrijdenVoorRonde(lmsResultaatRonde);
                const dbWedstrijden = knockoutWedstrijden.filter((w) => w.rondeNr === lmsResultaatRonde);
                const alleWedstrijden: { id: string; thuisVlag: string; thuisNaam: string; uitNaam: string; uitVlag: string }[] = [
                  ...hardcodedWedstrijden.map((w) => ({ id: w.id, thuisVlag: w.thuis.vlag ?? "", thuisNaam: w.thuis.naam, uitNaam: w.uit.naam, uitVlag: w.uit.vlag ?? "" })),
                  ...dbWedstrijden.map((w) => ({ id: w.id, thuisVlag: w.thuisVlag, thuisNaam: w.thuisNaam, uitNaam: w.uitNaam, uitVlag: w.uitVlag })),
                ];
                if (alleWedstrijden.length === 0) {
                  return <p className="text-sm text-zinc-600 italic">Wedstrijden voor deze ronde zijn nog niet ingevoerd. Voeg ze toe via &quot;Knockout wedstrijden&quot; hieronder.</p>;
                }
                return (
                  <div className="space-y-2">
                    {alleWedstrijden.map((w) => {
                      const sc = lmsScores[w.id] ?? { thuis: "", uit: "" };
                      const heeftScore = poule.resultaten[w.id] != null;
                      return (
                        <div key={w.id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 text-xs text-zinc-400 truncate">
                            {w.thuisVlag} <span className="font-medium text-zinc-300">{w.thuisNaam}</span>
                            <span className="text-zinc-600 mx-1">vs</span>
                            <span className="font-medium text-zinc-300">{w.uitNaam}</span> {w.uitVlag}
                          </div>
                          <input
                            type="number" min={0} max={99}
                            value={sc.thuis}
                            onChange={(e) => setLmsScores((prev) => ({ ...prev, [w.id]: { ...prev[w.id] ?? { thuis: "", uit: "" }, thuis: e.target.value } }))}
                            className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="0"
                          />
                          <span className="text-zinc-600 font-bold text-xs">–</span>
                          <input
                            type="number" min={0} max={99}
                            value={sc.uit}
                            onChange={(e) => setLmsScores((prev) => ({ ...prev, [w.id]: { ...prev[w.id] ?? { thuis: "", uit: "" }, uit: e.target.value } }))}
                            className="w-12 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => slaLmsScoreOp(w.id)}
                            disabled={lmsScoreBezig === w.id || sc.thuis === "" || sc.uit === ""}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-40 whitespace-nowrap flex-shrink-0"
                          >
                            {lmsScoreBezig === w.id ? "..." : heeftScore ? "Bijwerken" : "Opslaan"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Knockout wedstrijden beheren — alleen LMS, rondes 4-8 */}
        {isLMS && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Knockout wedstrijden</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Voeg handmatig de teams in voor de knockout rondes zodra het speelschema bekend is</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Ronde selector — alleen knockout rondes (4-8) */}
              <div className="flex gap-2 flex-wrap">
                {LMS_RONDES.filter((r) => r.nr >= 4).map((r) => (
                  <button
                    key={r.nr}
                    onClick={() => setKnockoutRonde(r.nr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      knockoutRonde === r.nr
                        ? "bg-white text-zinc-900 border-white"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    R{r.nr} – {LMS_RONDES.find((r2) => r2.nr === r.nr)?.naam}
                  </button>
                ))}
              </div>

              {/* Bestaande wedstrijden voor geselecteerde ronde */}
              {knockoutWedstrijden.filter((w) => w.rondeNr === knockoutRonde).length > 0 && (
                <div className="space-y-1.5">
                  {knockoutWedstrijden.filter((w) => w.rondeNr === knockoutRonde).map((w) => (
                    <div key={w.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 text-zinc-300 truncate">
                        {w.thuisVlag} <span className="font-medium">{w.thuisNaam}</span>
                        <span className="text-zinc-600 mx-1">vs</span>
                        <span className="font-medium">{w.uitNaam}</span> {w.uitVlag}
                        {w.datum && <span className="text-zinc-600 ml-1 text-xs">{w.datum}{w.tijd ? ` ${w.tijd}` : ""}</span>}
                      </span>
                      <button
                        onClick={() => verwijderKnockoutWedstrijd(w.id)}
                        disabled={knockoutVerwijderBezig === w.id}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {knockoutVerwijderBezig === w.id ? "..." : "Verwijderen"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {knockoutWedstrijden.filter((w) => w.rondeNr === knockoutRonde).length === 0 && (
                <p className="text-xs text-zinc-600 italic">Nog geen wedstrijden voor deze ronde.</p>
              )}

              {/* Toevoeg-formulier */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Wedstrijd toevoegen</p>
                <div className="flex gap-2">
                  <select
                    value={nieuwThuis}
                    onChange={(e) => setNieuwThuis(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Thuisploeg...</option>
                    {wkTeams.filter((t) => t.code !== nieuwUit).map((t) => (
                      <option key={t.code} value={t.code}>{t.vlag} {t.naam}</option>
                    ))}
                  </select>
                  <span className="text-zinc-600 font-bold self-center">vs</span>
                  <select
                    value={nieuwUit}
                    onChange={(e) => setNieuwUit(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Uitploeg...</option>
                    {wkTeams.filter((t) => t.code !== nieuwThuis).map((t) => (
                      <option key={t.code} value={t.code}>{t.vlag} {t.naam}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={nieuwDatum}
                    onChange={(e) => setNieuwDatum(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Datum (optioneel)"
                  />
                  <input
                    type="time"
                    value={nieuwTijd}
                    onChange={(e) => setNieuwTijd(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Tijd (optioneel)"
                  />
                  <button
                    onClick={voegKnockoutWedstrijdToe}
                    disabled={knockoutBezig || !nieuwThuis || !nieuwUit || nieuwThuis === nieuwUit}
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {knockoutBezig ? "..." : "Toevoegen"}
                  </button>
                </div>
              </div>
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
          <p className="text-xs text-zinc-500 mb-3">Sluit het toernooi af, bepaal de winnaar en ken de trofee toe.</p>
          {poule.afgerond ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                <span>✓</span><span>Toernooi is afgerond</span>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/poules/${code}/afronden`, { method: "DELETE" });
                  if (res.ok) {
                    setPoule({ ...poule, afgerond: false, winnaarId: null });
                    toonOpgeslagen();
                  } else {
                    alert("Heropenen mislukt");
                  }
                }}
                className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Heropenen
              </button>
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
