"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminStats {
  gebruikers: number;
  poules: number;
  poulesSoort: { wk: number; cl_finale: number; lms: number };
  actievePoules: number;
  voorspellingen: number;
}

interface SyncTestRapport {
  apiQuota?: { gebruikt: number; limiet: number; resterend: number; fout?: string };
  clFinale?: {
    gevonden?: false;
    fixtureId?: number;
    uitslag?: string;
    aantalGoals?: number;
    eersteGoal?: { speler: string; minuut: number; detail: string } | null;
    dbUitslag?: string | null;
    dryRun?: { uitslag: string; eersteDoelpuntenmaker: string | null; eersteDoelpuntenminuut: number | null };
    poules?: Array<{ naam: string; afgerond: boolean; eersteDoelpuntenmakerActief: boolean; eersteDoelpuntenmakerResultaat: string | null; eersteDoelpuntenminuutResultaat: number | null }>;
    fout?: string;
  };
  wk?: {
    aantalAfgelopen: number;
    eersteVerwachteWedstrijd: string | null;
    fixtures: Array<{ thuis: string; uit: string; thuisCode: string | null; uitCode: string | null; wedstrijdId: string | null; score: string; status: string }>;
    fout?: string;
  };
}

function AdminNav({ active }: { active: string }) {
  const tabs = [
    { label: "Dashboard", href: "/admin" },
    { label: "Gebruikers", href: "/admin/gebruikers" },
    { label: "Poules", href: "/admin/poules" },
    { label: "Flags", href: "/admin/flags" },
  ];
  return (
    <nav className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-8">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-colors ${
            active === tab.label
              ? "bg-green-500 text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingSpelers, setSyncingSpelers] = useState(false);
  const [syncSpelersResult, setSyncSpelersResult] = useState<string | null>(null);
  const [syncingOefSpelers, setSyncingOefSpelers] = useState(false);
  const [syncOefSpelersResult, setSyncOefSpelersResult] = useState<string | null>(null);
  const [syncingAlles, setSyncingAlles] = useState(false);
  const [syncAllesResult, setSyncAllesResult] = useState<string | null>(null);
  const [testingSync, setTestingSync] = useState(false);
  const [testRapport, setTestRapport] = useState<SyncTestRapport | null>(null);

  async function syncSpelers() {
    setSyncingSpelers(true);
    setSyncSpelersResult(null);
    try {
      const res = await fetch("/api/admin/sync-spelers", { method: "POST" });
      const data = await res.json();
      if (data.success) setSyncSpelersResult(`✓ ${data.opgeslagen} spelers gesynchroniseerd`);
      else setSyncSpelersResult(`Fout: ${data.error}`);
    } catch {
      setSyncSpelersResult("Verbindingsfout");
    } finally {
      setSyncingSpelers(false);
    }
  }

  async function syncOefSpelers() {
    setSyncingOefSpelers(true);
    setSyncOefSpelersResult(null);
    try {
      const res = await fetch("/api/admin/sync-spelers-oef", { method: "POST" });
      const data = await res.json();
      if (data.success) setSyncOefSpelersResult(`✓ ${data.opgeslagen} spelers opgeslagen`);
      else setSyncOefSpelersResult(`Fout: ${data.error}`);
    } catch {
      setSyncOefSpelersResult("Verbindingsfout");
    } finally {
      setSyncingOefSpelers(false);
    }
  }

  async function runSyncTest() {
    setTestingSync(true);
    setTestRapport(null);
    try {
      const res = await fetch("/api/admin/sync-test");
      if (res.ok) setTestRapport(await res.json());
      else setTestRapport({ apiQuota: { gebruikt: 0, limiet: 0, resterend: 0, fout: `HTTP ${res.status}` } });
    } catch {
      setTestRapport({ apiQuota: { gebruikt: 0, limiet: 0, resterend: 0, fout: "Verbindingsfout" } });
    } finally {
      setTestingSync(false);
    }
  }

  async function syncAlles() {
    setSyncingAlles(true);
    setSyncAllesResult(null);
    try {
      const res = await fetch("/api/admin/sync-uitslagen", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const parts = [];
        if (data.uitslagen > 0) parts.push(`${data.uitslagen} uitslag${data.uitslagen !== 1 ? "en" : ""}`);
        if (data.eersteDoelpunt > 0) parts.push(`eerste doelpunt ${data.eersteDoelpunt} poule${data.eersteDoelpunt !== 1 ? "s" : ""}`);
        setSyncAllesResult(parts.length ? `✓ ${parts.join(", ")} bijgewerkt` : "✓ Alles al up-to-date");
      } else {
        setSyncAllesResult(`Fout: ${data.error}`);
      }
    } catch {
      setSyncAllesResult("Verbindingsfout");
    } finally {
      setSyncingAlles(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (res.status === 403) { router.replace("/"); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => { router.replace("/"); });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block">
              ← Terug naar home
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Admin</h1>
          </div>
        </div>

        <AdminNav active="Dashboard" />

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Gebruikers</p>
            <p className="text-4xl font-black text-white">{stats.gebruikers}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Poules</p>
            <p className="text-4xl font-black text-white">{stats.poules}</p>
            <p className="text-xs text-zinc-500 mt-1">{stats.actievePoules} actief</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Voorspellingen</p>
            <p className="text-4xl font-black text-white">{stats.voorspellingen}</p>
          </div>
        </div>

        {/* Poule type breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Poule types</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <span className="bg-zinc-800 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full block mb-2">WK</span>
              <p className="text-3xl font-black">{stats.poulesSoort.wk}</p>
            </div>
            <div className="text-center">
              <span className="bg-zinc-800 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full block mb-2">CL Finale</span>
              <p className="text-3xl font-black">{stats.poulesSoort.cl_finale}</p>
            </div>
            <div className="text-center">
              <span className="bg-zinc-800 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full block mb-2">LMS</span>
              <p className="text-3xl font-black">{stats.poulesSoort.lms}</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/gebruikers" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm font-bold text-white mb-1">Gebruikers beheren</p>
            <p className="text-xs text-zinc-500">Admin-rechten toewijzen</p>
          </Link>
          <Link href="/admin/poules" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm font-bold text-white mb-1">Alle poules</p>
            <p className="text-xs text-zinc-500">Overzicht van alle poules</p>
          </Link>
          <Link href="/admin/flags" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm font-bold text-white mb-1">Feature flags</p>
            <p className="text-xs text-zinc-500">Functies in- en uitschakelen</p>
          </Link>
        </div>

        {/* Data synchronisatie */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Data synchronisatie</p>
            <span className="text-xs text-zinc-600">automatisch elke 2u via cron</span>
          </div>
          <p className="text-xs text-zinc-600 mb-4">Uitslagen worden maximaal ~2 uur na een wedstrijd bijgewerkt. Gebruik de knoppen hieronder om direct te synchroniseren of te testen.</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={syncAlles}
                  disabled={syncingAlles}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {syncingAlles ? "Bezig…" : "Nu synchroniseren"}
                </button>
                {syncAllesResult && (
                  <span className={`text-sm ${syncAllesResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                    {syncAllesResult}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">Haalt WK + UCL uitslagen op en schrijft eerste doelpuntenmaker naar actieve poules. Goed om te testen met de CL Finale (al gespeeld op 30 mei).</p>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={syncSpelers}
                  disabled={syncingSpelers}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {syncingSpelers ? "Bezig…" : "WK selecties ophalen"}
                </button>
                {syncSpelersResult && (
                  <span className={`text-sm ${syncSpelersResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                    {syncSpelersResult}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">Eenmalig uitvoeren zodra de WK-selecties beschikbaar zijn in api-football (begin juni). Daarna werkt de autocomplete met échte namen.</p>
            </div>
            <div className="border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={syncOefSpelers}
                  disabled={syncingOefSpelers}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {syncingOefSpelers ? "Bezig…" : "🇳🇱 Uitzwaai selecties laden"}
                </button>
                {syncOefSpelersResult && (
                  <span className={`text-sm ${syncOefSpelersResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                    {syncOefSpelersResult}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">Laadt de NED en ALG selecties in de database zodat de autocomplete werkt bij de uitzwaai poule.</p>
            </div>
          </div>
        </div>

        {/* Dry-run test */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Sync dry-run</p>
            <span className="text-xs text-zinc-600">schrijft niks — alleen lezen</span>
          </div>
          <p className="text-xs text-zinc-600 mb-4">Toont wat de API teruggeeft en wat er al in de database staat, zonder iets te wijzigen.</p>
          <button
            onClick={runSyncTest}
            disabled={testingSync}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            {testingSync ? "Ophalen…" : "API & DB controleren"}
          </button>

          {testRapport && (
            <div className="mt-4 space-y-4 text-xs">

              {/* API quota */}
              {testRapport.apiQuota && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="font-semibold text-zinc-300 mb-2">API quota</p>
                  {testRapport.apiQuota.fout ? (
                    <p className="text-red-400">{testRapport.apiQuota.fout}</p>
                  ) : (
                    <p className="text-zinc-400">
                      {testRapport.apiQuota.gebruikt} / {testRapport.apiQuota.limiet} gebruikt
                      <span className="text-zinc-500 ml-2">({testRapport.apiQuota.resterend} resterend)</span>
                    </p>
                  )}
                </div>
              )}

              {/* CL Finale */}
              {testRapport.clFinale && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="font-semibold text-zinc-300 mb-2">CL Finale (UCL league 2 / seizoen 2025)</p>
                  {testRapport.clFinale.gevonden === false ? (
                    <p className="text-yellow-400">Fixture niet gevonden in api-football</p>
                  ) : testRapport.clFinale.fout ? (
                    <p className="text-red-400">{testRapport.clFinale.fout}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-6">
                        <span className="text-zinc-400">Uitslag API: <span className="text-white font-semibold">{testRapport.clFinale.uitslag}</span></span>
                        <span className="text-zinc-400">Uitslag DB: <span className="text-white font-semibold">{testRapport.clFinale.dbUitslag ?? "–"}</span></span>
                        <span className="text-zinc-400">{testRapport.clFinale.aantalGoals} goals in events</span>
                      </div>
                      {testRapport.clFinale.eersteGoal ? (
                        <p className="text-zinc-400">
                          Eerste goal: <span className="text-white font-semibold">{testRapport.clFinale.eersteGoal.speler}</span>
                          <span className="text-zinc-500 ml-2">{testRapport.clFinale.eersteGoal.minuut}&apos;</span>
                          <span className="text-zinc-600 ml-2">({testRapport.clFinale.eersteGoal.detail})</span>
                        </p>
                      ) : (
                        <p className="text-yellow-400">Geen scorende goal gevonden in events</p>
                      )}
                      {testRapport.clFinale.poules && testRapport.clFinale.poules.length > 0 && (
                        <div className="mt-2 border-t border-zinc-700 pt-2">
                          <p className="text-zinc-500 mb-1">Poules (cl_finale)</p>
                          {testRapport.clFinale.poules.map((p) => (
                            <div key={p.naam} className="flex flex-wrap gap-x-4 gap-y-0.5 text-zinc-400 py-0.5">
                              <span className="font-medium text-zinc-300">{p.naam}</span>
                              <span>{p.afgerond ? "✓ afgerond" : "actief"}</span>
                              {p.eersteDoelpuntenmakerActief && (
                                <span>
                                  1e doelpuntenmaker: <span className={p.eersteDoelpuntenmakerResultaat ? "text-green-400" : "text-zinc-500"}>{p.eersteDoelpuntenmakerResultaat ?? "niet ingevuld"}</span>
                                  {p.eersteDoelpuntenminuutResultaat != null && <span className="text-zinc-500 ml-1">(min. {p.eersteDoelpuntenminuutResultaat})</span>}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* WK */}
              {testRapport.wk && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="font-semibold text-zinc-300 mb-2">WK 2026 (league {process.env.NEXT_PUBLIC_FOOTBALL_LEAGUE_ID ?? "1"} / seizoen 2026)</p>
                  {testRapport.wk.fout ? (
                    <p className="text-red-400">{testRapport.wk.fout}</p>
                  ) : (
                    <div className="space-y-1 text-zinc-400">
                      <p>{testRapport.wk.aantalAfgelopen} afgeronde fixtures gevonden</p>
                      <p>Eerste verwachte wedstrijd: <span className="text-zinc-300">{testRapport.wk.eersteVerwachteWedstrijd ?? "–"}</span></p>
                      {testRapport.wk.fixtures.length > 0 ? (
                        <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                          {testRapport.wk.fixtures.map((f, i) => (
                            <div key={i} className="flex gap-3">
                              <span className="text-zinc-500 w-6">{f.status}</span>
                              <span>{f.thuis} vs {f.uit}</span>
                              <span className="text-white">{f.score}</span>
                              <span className={f.wedstrijdId ? "text-green-400" : "text-red-400"}>
                                {f.wedstrijdId ?? `! ${f.thuisCode ?? "?"} / ${f.uitCode ?? "?"} niet gemapped`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 italic">Nog geen wedstrijden gespeeld (WK start 11 juni)</p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
