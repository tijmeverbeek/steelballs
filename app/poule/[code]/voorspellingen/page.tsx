"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, saveVoorspellingen } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { wedstrijden, getGroepen } from "@/lib/matches";
import { Voorspelling } from "@/lib/types";

type ScoreMap = Record<string, { thuis: number | null; uit: number | null }>;
type SaveStatus = "idle" | "saving" | "saved" | "error";

function Stepper({
  value,
  onChange,
  color = "green",
}: {
  value: number | null;
  onChange: (v: number) => void;
  color?: "green" | "orange";
}) {
  const activeBg = color === "green" ? "bg-green-500" : "bg-orange-500";
  const hasValue = value !== null;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onChange((value ?? 0) + 1)}
        className={`w-9 h-9 rounded-full text-lg font-bold transition-colors flex items-center justify-center
          ${hasValue ? `${activeBg} text-black hover:opacity-80` : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
      >
        +
      </button>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-colors
          ${hasValue ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-600"}`}
      >
        {value ?? "—"}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}
        disabled={!hasValue || value === 0}
        className={`w-9 h-9 rounded-full text-lg font-bold transition-colors flex items-center justify-center
          ${hasValue && value! > 0 ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600" : "bg-zinc-800 text-zinc-700 cursor-not-allowed"}`}
      >
        −
      </button>
    </div>
  );
}

export default function VoorspellingenPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poulenaam, setPoulenaam] = useState("");
  const [deelnemerid, setDeelnemerid] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [actieveGroep, setActieveGroep] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deelnemerRef = useRef<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const groepen = useMemo(() => getGroepen(), []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const poule = await getPoule(code);
      if (!poule) { router.push("/"); return; }

      setPoulenaam(poule.naam);

      const deelnemer = poule.deelnemers.find((d) => d.userId === user.id);
      if (!deelnemer) {
        router.push(`/poule/${code}`);
        return;
      }

      setDeelnemerid(deelnemer.id);
      deelnemerRef.current = deelnemer.id;

      const map: ScoreMap = {};
      deelnemer.voorspellingen.forEach((v) => {
        map[v.wedstrijdId] = { thuis: v.thuis, uit: v.uit };
      });
      setScores(map);
    }
    load();
    setActieveGroep(groepen[0] ?? null);
  }, [code, router, groepen]);

  const doAutoSave = useCallback(
    async (latestScores: ScoreMap) => {
      const id = deelnemerRef.current;
      if (!id) return;
      setSaveStatus("saving");
      const vps: Voorspelling[] = wedstrijden.map((w) => ({
        wedstrijdId: w.id,
        thuis: latestScores[w.id]?.thuis ?? null,
        uit: latestScores[w.id]?.uit ?? null,
      }));
      try {
        await saveVoorspellingen(code, id, vps);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [code]
  );

  function autoFill() {
    setScores((prev) => {
      const updated = { ...prev };
      for (const w of wedstrijden) {
        if (updated[w.id]?.thuis != null && updated[w.id]?.uit != null) continue;
        const goals = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];
        const thuis = goals[Math.floor(Math.random() * goals.length)];
        const uit = goals[Math.floor(Math.random() * goals.length)];
        updated[w.id] = { thuis, uit };
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doAutoSave(updated), 700);
      return updated;
    });
  }

  function updateScore(wedstrijdId: string, kant: "thuis" | "uit", waarde: number) {
    setScores((prev) => {
      const updated = {
        ...prev,
        [wedstrijdId]: {
          thuis: prev[wedstrijdId]?.thuis ?? null,
          uit: prev[wedstrijdId]?.uit ?? null,
          [kant]: waarde,
        },
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doAutoSave(updated), 700);
      return updated;
    });
  }

  const totalIngevuld = Object.values(scores).filter(
    (v) => v.thuis !== null && v.uit !== null
  ).length;

  if (!deelnemerid) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/poule/${code}`}
            className="text-zinc-400 hover:text-white text-sm transition-colors font-medium"
          >
            ← {poulenaam || "Terug"}
          </Link>
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {totalIngevuld}
              <span className="text-zinc-500">/{wedstrijden.length}</span>
            </div>
            <div className="text-xs text-zinc-500">voorspeld</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-right w-20">
              {saveStatus === "saving" && <span className="text-zinc-400">Opslaan...</span>}
              {saveStatus === "saved" && <span className="text-green-400 font-medium">✓ Opgeslagen</span>}
              {saveStatus === "error" && <span className="text-red-400 font-medium">Fout — probeer opnieuw</span>}
            </div>
            <button
              onClick={autoFill}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors whitespace-nowrap"
            >
              Auto-fill
            </button>
          </div>
        </div>

        <div className="h-0.5 bg-zinc-800">
          <div
            className="h-0.5 bg-green-500 transition-all duration-500"
            style={{ width: `${(totalIngevuld / wedstrijden.length) * 100}%` }}
          />
        </div>

        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {groepen.map((g) => {
            const letter = g.replace("Groep ", "");
            const gWedstrijden = wedstrijden.filter((w) => w.groep === g);
            const ingevuld = gWedstrijden.filter(
              (w) => scores[w.id]?.thuis !== null && scores[w.id]?.uit !== null
            ).length;
            const klaar = ingevuld === gWedstrijden.length;
            return (
              <button
                key={g}
                onClick={() => {
                  setActieveGroep(g);
                  refs.current[g]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  actieveGroep === g
                    ? "bg-white text-zinc-900"
                    : klaar
                    ? "bg-green-500/20 text-green-400"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {letter} {klaar ? "✓" : `${ingevuld}/${gWedstrijden.length}`}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {groepen.map((groep) => {
          const groepWedstrijden = wedstrijden.filter((w) => w.groep === groep);
          const ingevuld = groepWedstrijden.filter(
            (w) => scores[w.id]?.thuis !== null && scores[w.id]?.uit !== null
          ).length;
          const klaar = ingevuld === groepWedstrijden.length;

          return (
            <div
              key={groep}
              ref={(el) => { refs.current[groep] = el; }}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-white">{groep}</h2>
                {klaar ? (
                  <span className="text-xs text-green-400 font-semibold">✓ Klaar</span>
                ) : (
                  <span className="text-xs text-zinc-500">{ingevuld}/{groepWedstrijden.length} ingevuld</span>
                )}
              </div>

              <div className="divide-y divide-zinc-800">
                {groepWedstrijden.map((w) => {
                  const vp = scores[w.id];
                  const heeftBeide = vp?.thuis !== null && vp?.uit !== null;

                  return (
                    <div
                      key={w.id}
                      className={`px-5 py-5 transition-colors ${heeftBeide ? "bg-zinc-800/30" : ""}`}
                    >
                      <p className="text-xs text-zinc-600 text-center mb-4">
                        {new Date(w.datum).toLocaleDateString("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        · {w.tijd}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 text-right">
                          <div className="text-2xl mb-1">{w.thuis.vlag}</div>
                          <div className="text-sm font-semibold text-white leading-tight">{w.thuis.naam}</div>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                          <Stepper
                            value={vp?.thuis ?? null}
                            onChange={(v) => updateScore(w.id, "thuis", v)}
                            color="green"
                          />
                          <span className="text-zinc-700 font-bold text-lg">—</span>
                          <Stepper
                            value={vp?.uit ?? null}
                            onChange={(v) => updateScore(w.id, "uit", v)}
                            color="orange"
                          />
                        </div>

                        <div className="flex-1 text-left">
                          <div className="text-2xl mb-1">{w.uit.vlag}</div>
                          <div className="text-sm font-semibold text-white leading-tight">{w.uit.naam}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pb-8 text-center text-xs text-zinc-700">
          Voorspellingen worden automatisch opgeslagen
        </div>
      </main>
    </div>
  );
}
