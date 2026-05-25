"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, saveVoorspellingen } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { wedstrijden, getGroepen } from "@/lib/matches";
import { Voorspelling, Poule } from "@/lib/types";
import { TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN, TOERNOOIWINNAAR_PUNTEN, EERSTE_DOELPUNTENMAKER_PUNTEN } from "@/lib/storage";

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
  const [poule, setPoule] = useState<Poule | null>(null);
  const [poulenaam, setPoulenaam] = useState("");
  const [deelnemerid, setDeelnemerid] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [topscorerInput, setTopscorerInput] = useState("");
  const [geleKaartenInput, setGeleKaartenInput] = useState("");
  const [toernooiwinaarInput, setToernooiwinaarInput] = useState("");
  const [eersteDoelpuntenmakerInput, setEersteDoelpuntenmakerInput] = useState("");
  const [eersteDoelpuntenminuutInput, setEersteDoelpuntenminuutInput] = useState<number | null>(null);
  const [actieveGroep, setActieveGroep] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deelnemerRef = useRef<string | null>(null);
  const topscorerRef = useRef("");
  const geleKaartenRef = useRef("");
  const toernooiwinaarRef = useRef("");
  const eersteDoelpuntenmakerRef = useRef("");
  const eersteDoelpuntenminuutRef = useRef<number | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const groepen = useMemo(() => getGroepen(), []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const geladen = await getPoule(code);
      if (!geladen) { router.push("/"); return; }

      setPoule(geladen);
      setPoulenaam(geladen.naam);

      const deelnemer = geladen.deelnemers.find((d) => d.userId === user.id);
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

      const ts = deelnemer.topscorerVoorspelling ?? "";
      const gk = deelnemer.geleKaartenVoorspelling ?? "";
      const tw = deelnemer.toernooiwinaarVoorspelling ?? "";
      const edm = deelnemer.eersteDoelpuntenmakerVoorspelling ?? "";
      const edmin = deelnemer.eersteDoelpuntenminuutVoorspelling ?? null;
      setTopscorerInput(ts);
      setGeleKaartenInput(gk);
      setToernooiwinaarInput(tw);
      setEersteDoelpuntenmakerInput(edm);
      setEersteDoelpuntenminuutInput(edmin);
      topscorerRef.current = ts;
      geleKaartenRef.current = gk;
      toernooiwinaarRef.current = tw;
      eersteDoelpuntenmakerRef.current = edm;
      eersteDoelpuntenminuutRef.current = edmin;
    }
    load();
    setActieveGroep(groepen[0] ?? null);
  }, [code, router, groepen]);

  const doAutoSave = useCallback(
    async (
      latestScores: ScoreMap,
      topscorer?: string,
      geleKaarten?: string,
      toernooiwinnaar?: string,
      eersteDoelpuntenmaker?: string,
      eersteDoelpuntenminuut?: number | null,
    ) => {
      const id = deelnemerRef.current;
      if (!id) return;
      setSaveStatus("saving");
      const vps: Voorspelling[] = wedstrijden.map((w) => ({
        wedstrijdId: w.id,
        thuis: latestScores[w.id]?.thuis ?? null,
        uit: latestScores[w.id]?.uit ?? null,
      }));
      const ts = topscorer !== undefined ? topscorer : topscorerRef.current;
      const gk = geleKaarten !== undefined ? geleKaarten : geleKaartenRef.current;
      const tw = toernooiwinnaar !== undefined ? toernooiwinnaar : toernooiwinaarRef.current;
      const edm = eersteDoelpuntenmaker !== undefined ? eersteDoelpuntenmaker : eersteDoelpuntenmakerRef.current;
      const edmin = eersteDoelpuntenminuut !== undefined ? eersteDoelpuntenminuut : eersteDoelpuntenminuutRef.current;
      try {
        await saveVoorspellingen(code, id, vps, {
          topscorerVoorspelling: ts || null,
          geleKaartenVoorspelling: gk || null,
          toernooiwinaarVoorspelling: tw || null,
          eersteDoelpuntenmakerVoorspelling: edm || null,
          eersteDoelpuntenminuutVoorspelling: edmin,
        });
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

  function updateTopscorer(waarde: string) {
    setTopscorerInput(waarde);
    topscorerRef.current = waarde;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(scores, waarde, geleKaartenRef.current), 700);
  }

  function updateGeleKaarten(waarde: string) {
    setGeleKaartenInput(waarde);
    geleKaartenRef.current = waarde;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(scores, topscorerRef.current, waarde, toernooiwinaarRef.current), 700);
  }

  function updateToernooiwinnaar(waarde: string) {
    setToernooiwinaarInput(waarde);
    toernooiwinaarRef.current = waarde;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(scores, topscorerRef.current, geleKaartenRef.current, waarde), 700);
  }

  function updateEersteDoelpuntenmaker(waarde: string) {
    setEersteDoelpuntenmakerInput(waarde);
    eersteDoelpuntenmakerRef.current = waarde;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(scores, topscorerRef.current, geleKaartenRef.current, toernooiwinaarRef.current, waarde, eersteDoelpuntenminuutRef.current), 700);
  }

  function updateEersteDoelpuntenminuut(waarde: number | null) {
    setEersteDoelpuntenminuutInput(waarde);
    eersteDoelpuntenminuutRef.current = waarde;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doAutoSave(scores, topscorerRef.current, geleKaartenRef.current, toernooiwinaarRef.current, eersteDoelpuntenmakerRef.current, waarde), 700);
  }

  const totalIngevuld = Object.values(scores).filter(
    (v) => v.thuis !== null && v.uit !== null
  ).length;

  const heeftBonusCategorieen = poule?.topscorerActief || poule?.geleKaartenActief || poule?.toernooiwinaarActief || poule?.eersteDoelpuntenmakerActief || poule?.eersteDoelpuntenminuutActief;

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

        {/* ── Bonus voorspellingen ── */}
        {heeftBonusCategorieen && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Bonus voorspellingen</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Correct = extra punten bovenop je wedstrijdpunten</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {poule?.topscorerActief && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white">Topscorer</label>
                    <span className="text-xs text-yellow-500 font-semibold">{TOPSCORER_PUNTEN} pt</span>
                  </div>
                  <input
                    type="text"
                    value={topscorerInput}
                    onChange={(e) => updateTopscorer(e.target.value)}
                    placeholder="Naam van de topscorer..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              )}
              {poule?.geleKaartenActief && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white">Meeste gele kaarten</label>
                    <span className="text-xs text-yellow-500 font-semibold">{GELE_KAARTEN_PUNTEN} pt</span>
                  </div>
                  <input
                    type="text"
                    value={geleKaartenInput}
                    onChange={(e) => updateGeleKaarten(e.target.value)}
                    placeholder="Naam van de speler met de meeste gele kaarten..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              )}
              {poule?.toernooiwinaarActief && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white">Winnaar van het toernooi</label>
                    <span className="text-xs text-yellow-500 font-semibold">{TOERNOOIWINNAAR_PUNTEN} pt</span>
                  </div>
                  <input
                    type="text"
                    value={toernooiwinaarInput}
                    onChange={(e) => updateToernooiwinnaar(e.target.value)}
                    placeholder="Welk land wint het WK 2026?..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              )}
              {poule?.eersteDoelpuntenmakerActief && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white">Eerste doelpuntenmaker</label>
                    <span className="text-xs text-yellow-500 font-semibold">{EERSTE_DOELPUNTENMAKER_PUNTEN} pt</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">Wie scoort het eerste doelpunt van de CL finale?</p>
                  <input
                    type="text"
                    value={eersteDoelpuntenmakerInput}
                    onChange={(e) => updateEersteDoelpuntenmaker(e.target.value)}
                    placeholder="Naam van de speler..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              )}
              {poule?.eersteDoelpuntenminuutActief && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white">Minuut eerste doelpunt</label>
                    <span className="text-xs text-zinc-500 font-semibold">tiebreaker</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">In welke minuut valt het eerste doelpunt? Bij gelijke stand wordt degene met de nauwkeurigste minuut hoger geplaatst.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={eersteDoelpuntenminuutInput ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : parseInt(e.target.value);
                        updateEersteDoelpuntenminuut(v && v > 0 ? v : null);
                      }}
                      placeholder="bijv. 34"
                      className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                    <span className="text-sm text-zinc-500">minuut (1–120)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
