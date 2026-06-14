"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, saveVoorspellingen } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { getWedstrijdenVoorSoort } from "@/lib/matches";
import { Poule } from "@/lib/types";
import { SpelerAutocomplete } from "@/components/SpelerAutocomplete";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function Stepper({ value, onChange, disabled = false }: { value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  const hasValue = value !== null;
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-9 h-9" />
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black bg-zinc-800/50 text-zinc-600">{value ?? "—"}</div>
        <div className="w-9 h-9" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => onChange((value ?? 0) + 1)}
        className={`w-9 h-9 rounded-full text-lg font-bold transition-colors flex items-center justify-center ${hasValue ? "bg-green-500 text-black hover:opacity-80" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}>+</button>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-colors ${hasValue ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-600"}`}>{value ?? "—"}</div>
      <button type="button" onClick={() => onChange(Math.max(0, (value ?? 0) - 1))} disabled={!hasValue || value === 0}
        className={`w-9 h-9 rounded-full text-lg font-bold transition-colors flex items-center justify-center ${hasValue && value! > 0 ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600" : "bg-zinc-800 text-zinc-700 cursor-not-allowed"}`}>−</button>
    </div>
  );
}

export default function EnkelvoudigPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [deelnemerId, setDeelnemerId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deelnemerRef = useRef<string | null>(null);

  const [thuis, setThuis] = useState<number | null>(null);
  const [uit, setUit] = useState<number | null>(null);
  const thuisRef = useRef<number | null>(null);
  const uitRef = useRef<number | null>(null);

  const [doelpuntenmaker, setDoelpuntenmaker] = useState("");
  const [minuut, setMinuut] = useState<number | null>(null);
  const [corners, setCorners] = useState<number | null>(null);
  const doelpuntenmakerRef = useRef("");
  const minuutRef = useRef<number | null>(null);
  const cornersRef = useRef<number | null>(null);

  const wedstrijd = poule?.wkWedstrijdId
    ? getWedstrijdenVoorSoort("wk").find((w) => w.id === poule.wkWedstrijdId) ?? null
    : null;

  const teamCodes = wedstrijd ? [wedstrijd.thuis.code, wedstrijd.uit.code] : undefined;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const geladen = await getPoule(code);
      if (!geladen || geladen.soort !== "enkelvoudig") { router.push("/"); return; }
      setPoule(geladen);

      const deelnemer = geladen.deelnemers.find((d) => d.userId === user.id);
      if (!deelnemer) { router.push(`/poule/${code}`); return; }

      setDeelnemerId(deelnemer.id);
      deelnemerRef.current = deelnemer.id;

      if (geladen.wkWedstrijdId) {
        const vp = deelnemer.voorspellingen.find((v) => v.wedstrijdId === geladen.wkWedstrijdId);
        if (vp) {
          setThuis(vp.thuis); thuisRef.current = vp.thuis;
          setUit(vp.uit); uitRef.current = vp.uit;
        }
      }
      const edm = deelnemer.eersteDoelpuntenmakerVoorspelling ?? "";
      const edmin = deelnemer.eersteDoelpuntenminuutVoorspelling ?? null;
      const corn = deelnemer.cornersVoorspelling ?? null;
      setDoelpuntenmaker(edm); doelpuntenmakerRef.current = edm;
      setMinuut(edmin); minuutRef.current = edmin;
      setCorners(corn); cornersRef.current = corn;
    }
    load();
  }, [code, router]);

  const doAutoSave = useCallback(async () => {
    const id = deelnemerRef.current;
    if (!id || !poule?.wkWedstrijdId) return;
    setSaveStatus("saving");
    try {
      await saveVoorspellingen(code, id,
        [{ wedstrijdId: poule.wkWedstrijdId, thuis: thuisRef.current, uit: uitRef.current }],
        {
          eersteDoelpuntenmakerVoorspelling: doelpuntenmakerRef.current || null,
          eersteDoelpuntenminuutVoorspelling: minuutRef.current,
          cornersVoorspelling: cornersRef.current,
        }
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [code, poule?.wkWedstrijdId]);

  function scheduleSave() {
    if (isGesloten) return;
    setSaveStatus("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(), 700);
  }

  function setScore(team: "thuis" | "uit", val: number) {
    if (team === "thuis") { setThuis(val); thuisRef.current = val; }
    else { setUit(val); uitRef.current = val; }
    scheduleSave();
  }

  function setDoelpuntenmakerVal(val: string) {
    setDoelpuntenmaker(val); doelpuntenmakerRef.current = val;
    scheduleSave();
  }

  function setMinuutVal(val: number | null) {
    setMinuut(val); minuutRef.current = val;
    scheduleSave();
  }

  function setCornersVal(val: number | null) {
    setCorners(val); cornersRef.current = val;
    scheduleSave();
  }

  if (!poule || !wedstrijd) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  const resultaat = poule.resultaten?.[wedstrijd.id];
  const isGesloten = new Date() >= new Date(`${wedstrijd.datum}T${wedstrijd.tijd}:00+02:00`);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/poule/${code}`} className="text-zinc-400 hover:text-white text-sm transition-colors font-medium">
            ← {poule.naam}
          </Link>
          <div className="text-xs text-right w-28">
            {saveStatus === "pending" && <span className="text-amber-400">● Niet opgeslagen</span>}
            {saveStatus === "saving" && <span className="text-zinc-400">Opslaan...</span>}
            {saveStatus === "saved" && <span className="text-green-400 font-medium">✓ Opgeslagen</span>}
            {saveStatus === "error" && <span className="text-red-400 font-medium">Fout</span>}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {isGesloten && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-center text-sm text-zinc-400">
            De wedstrijd is begonnen — voorspellingen zijn gesloten
          </div>
        )}

        {/* Wedstrijd header */}
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">{wedstrijd.groep}</div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-4xl mb-1">{wedstrijd.thuis.vlag}</div>
              <div className="text-sm font-bold text-white">{wedstrijd.thuis.naam}</div>
            </div>
            <div className="text-zinc-600 text-xl font-bold">vs</div>
            <div className="text-center">
              <div className="text-4xl mb-1">{wedstrijd.uit.vlag}</div>
              <div className="text-sm font-bold text-white">{wedstrijd.uit.naam}</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 mt-3">{wedstrijd.datum} · {wedstrijd.tijd}</div>
        </div>

        {/* Uitslag */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-5 text-center">Uitslag</p>
          {resultaat ? (
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{resultaat.thuis}</div>
                <div className="text-xs text-zinc-500 mt-1">{wedstrijd.thuis.vlag}</div>
              </div>
              <div className="text-zinc-600">—</div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{resultaat.uit}</div>
                <div className="text-xs text-zinc-500 mt-1">{wedstrijd.uit.vlag}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <Stepper value={thuis} onChange={(v) => setScore("thuis", v)} disabled={isGesloten} />
              <div className="text-zinc-600 text-xl font-bold">—</div>
              <Stepper value={uit} onChange={(v) => setScore("uit", v)} disabled={isGesloten} />
            </div>
          )}
        </div>

        {/* Eerste doelpuntenmaker */}
        {poule.eersteDoelpuntenmakerActief && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1 text-center">Eerste doelpuntenmaker</p>
            {poule.eersteDoelpuntenmakerResultaat && (
              <p className="text-center text-sm text-green-400 font-semibold mb-3">{poule.eersteDoelpuntenmakerResultaat}</p>
            )}
            <SpelerAutocomplete
              soort="wk"
              teamCodes={teamCodes}
              value={doelpuntenmaker}
              onChange={setDoelpuntenmakerVal}
              placeholder="Kies een speler..."
              ringColor="green"
            />
          </div>
        )}

        {/* Minuut eerste doelpunt */}
        {poule.eersteDoelpuntenminuutActief && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 text-center">Minuut eerste doelpunt</p>
            {poule.eersteDoelpuntenminuutResultaat != null && (
              <p className="text-center text-sm text-green-400 font-semibold mb-3">Antwoord: minuut {poule.eersteDoelpuntenminuutResultaat}</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                min={1}
                max={120}
                value={minuut ?? ""}
                onChange={(e) => setMinuutVal(e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="bijv. 34"
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-center text-lg font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-zinc-500">minuut</span>
            </div>
          </div>
        )}

        {/* Corners */}
        {poule.cornersActief && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 text-center">Totaal aantal corners</p>
            {poule.cornersResultaat != null && (
              <p className="text-center text-sm text-green-400 font-semibold mb-3">Antwoord: {poule.cornersResultaat} corners</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                min={0}
                value={corners ?? ""}
                onChange={(e) => setCornersVal(e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="bijv. 10"
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-center text-lg font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-zinc-500">corners</span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-zinc-700 pb-4">Voorspellingen worden automatisch opgeslagen</p>
      </main>
    </div>
  );
}
