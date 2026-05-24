"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, saveVoorspellingen } from "@/lib/api";
import { getSessie } from "@/lib/storage";
import { wedstrijden, getGroepen } from "@/lib/matches";
import { Voorspelling } from "@/lib/types";

type VoorspellingenMap = Record<string, { thuis: string; uit: string }>;

function scoreToNumber(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) || n < 0 ? null : n;
}

export default function VoorspellingenPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poulenaam, setPoulenaam] = useState("");
  const [deelnemerid, setDeelnemerid] = useState<string | null>(null);
  const [voorspellingen, setVoorspellingen] = useState<VoorspellingenMap>({});
  const [opgeslagen, setOpgeslagen] = useState<Record<string, boolean>>({});
  const [actieveGroep, setActieveGroep] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const groepen = getGroepen();

  useEffect(() => {
    const sessie = getSessie();
    if (!sessie || sessie.code !== code) {
      router.push("/");
      return;
    }
    setDeelnemerid(sessie.deelnemerId);

    getPoule(code).then((poule) => {
      if (!poule) { router.push("/"); return; }
      setPoulenaam(poule.naam);

      const deelnemer = poule.deelnemers.find((d) => d.id === sessie.deelnemerId);
      if (deelnemer) {
        const map: VoorspellingenMap = {};
        deelnemer.voorspellingen.forEach((v) => {
          map[v.wedstrijdId] = {
            thuis: v.thuis !== null ? String(v.thuis) : "",
            uit: v.uit !== null ? String(v.uit) : "",
          };
        });
        setVoorspellingen(map);
      }
    });

    setActieveGroep(groepen[0] ?? null);
  }, [code, router, groepen]);

  function updateScore(wedstrijdId: string, kant: "thuis" | "uit", waarde: string) {
    if (waarde !== "" && !/^\d+$/.test(waarde)) return;
    setVoorspellingen((prev) => ({
      ...prev,
      [wedstrijdId]: {
        ...prev[wedstrijdId],
        thuis: prev[wedstrijdId]?.thuis ?? "",
        uit: prev[wedstrijdId]?.uit ?? "",
        [kant]: waarde,
      },
    }));
    setOpgeslagen((prev) => ({ ...prev, [wedstrijdId]: false }));
  }

  async function slaGroepOp(groep: string) {
    if (!deelnemerid) return;
    const vps: Voorspelling[] = wedstrijden
      .filter((w) => w.groep === groep)
      .map((w) => {
        const vp = voorspellingen[w.id];
        return { wedstrijdId: w.id, thuis: vp ? scoreToNumber(vp.thuis) : null, uit: vp ? scoreToNumber(vp.uit) : null };
      });
    await saveVoorspellingen(code, deelnemerid, vps);
    const nieuweOpgeslagen: Record<string, boolean> = {};
    wedstrijden.filter((w) => w.groep === groep).forEach((w) => (nieuweOpgeslagen[w.id] = true));
    setOpgeslagen((prev) => ({ ...prev, ...nieuweOpgeslagen }));
  }

  async function slaAllesOp() {
    if (!deelnemerid) return;
    const allVoorspellingen: Voorspelling[] = wedstrijden.map((w) => {
      const vp = voorspellingen[w.id];
      return { wedstrijdId: w.id, thuis: vp ? scoreToNumber(vp.thuis) : null, uit: vp ? scoreToNumber(vp.uit) : null };
    });
    await saveVoorspellingen(code, deelnemerid, allVoorspellingen);
    const opgeslagenAll: Record<string, boolean> = {};
    wedstrijden.forEach((w) => (opgeslagenAll[w.id] = true));
    setOpgeslagen(opgeslagenAll);
  }

  const totalIngevuld = Object.values(voorspellingen).filter(
    (v) => v.thuis !== "" && v.uit !== ""
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-800 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href={`/poule/${code}`} className="text-green-300 text-sm hover:text-white transition-colors">
              ← {poulenaam || code}
            </Link>
            <h1 className="text-lg font-bold mt-0.5">Voorspellingen invullen</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalIngevuld}/{wedstrijden.length}</p>
            <p className="text-green-300 text-xs">ingevuld</p>
          </div>
        </div>
        {/* Groep tabs */}
        <div className="border-t border-green-700">
          <div className="max-w-3xl mx-auto px-6 flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {groepen.map((g) => {
              const letter = g.replace("Groep ", "");
              const groepWedstrijden = wedstrijden.filter((w) => w.groep === g);
              const ingevuld = groepWedstrijden.filter((w) => {
                const vp = voorspellingen[w.id];
                return vp && vp.thuis !== "" && vp.uit !== "";
              }).length;
              const klaar = ingevuld === groepWedstrijden.length;
              return (
                <button
                  key={g}
                  onClick={() => {
                    setActieveGroep(g);
                    refs.current[g]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    actieveGroep === g
                      ? "bg-white text-green-800"
                      : klaar
                      ? "bg-green-600 text-white"
                      : "text-green-200 hover:bg-green-700"
                  }`}
                >
                  {letter} {klaar ? "✓" : `${ingevuld}/${groepWedstrijden.length}`}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {groepen.map((groep) => {
          const groepWedstrijden = wedstrijden.filter((w) => w.groep === groep);
          const ingevuld = groepWedstrijden.filter((w) => {
            const vp = voorspellingen[w.id];
            return vp && vp.thuis !== "" && vp.uit !== "";
          }).length;

          return (
            <div
              key={groep}
              ref={(el) => { refs.current[groep] = el; }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Groep header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h2 className="font-bold text-gray-900">{groep}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{ingevuld} van {groepWedstrijden.length} ingevuld</p>
                </div>
                <button
                  onClick={() => slaGroepOp(groep)}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Opslaan
                </button>
              </div>

              {/* Wedstrijden */}
              <div className="divide-y divide-gray-50">
                {groepWedstrijden.map((w) => {
                  const vp = voorspellingen[w.id] ?? { thuis: "", uit: "" };
                  const isOpgeslagen = opgeslagen[w.id];
                  const heeftVoorspelling = vp.thuis !== "" && vp.uit !== "";

                  return (
                    <div key={w.id} className={`px-6 py-4 ${isOpgeslagen ? "bg-green-50/40" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400">
                          {new Date(w.datum).toLocaleDateString("nl-NL", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })} · {w.tijd}
                        </span>
                        {isOpgeslagen && heeftVoorspelling && (
                          <span className="text-xs text-green-600 font-medium">✓ Opgeslagen</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Thuisploeg */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-semibold text-gray-900 text-right hidden sm:block">
                            {w.thuis.naam}
                          </span>
                          <span className="text-xl">{w.thuis.vlag}</span>
                        </div>

                        {/* Score inputs */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={vp.thuis}
                            onChange={(e) => updateScore(w.id, "thuis", e.target.value)}
                            maxLength={2}
                            placeholder="—"
                            className={`w-12 h-12 text-center text-lg font-bold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              heeftVoorspelling
                                ? "border-green-300 bg-green-50 text-green-800"
                                : "border-gray-300 bg-white text-gray-900"
                            }`}
                          />
                          <span className="text-gray-400 font-bold text-lg">-</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={vp.uit}
                            onChange={(e) => updateScore(w.id, "uit", e.target.value)}
                            maxLength={2}
                            placeholder="—"
                            className={`w-12 h-12 text-center text-lg font-bold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              heeftVoorspelling
                                ? "border-green-300 bg-green-50 text-green-800"
                                : "border-gray-300 bg-white text-gray-900"
                            }`}
                          />
                        </div>

                        {/* Uitploeg */}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xl">{w.uit.vlag}</span>
                          <span className="text-sm font-semibold text-gray-900 hidden sm:block">
                            {w.uit.naam}
                          </span>
                        </div>
                      </div>

                      {/* Teamnamen op mobiel */}
                      <div className="flex items-center justify-center gap-2 mt-2 sm:hidden text-xs text-gray-500">
                        <span>{w.thuis.naam}</span>
                        <span>vs</span>
                        <span>{w.uit.naam}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Alles opslaan knop */}
        <div className="sticky bottom-6">
          <button
            onClick={slaAllesOp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors text-base"
          >
            Alle voorspellingen opslaan ({totalIngevuld}/{wedstrijden.length})
          </button>
        </div>
      </main>
    </div>
  );
}
