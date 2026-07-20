"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPoule } from "@/lib/api";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";
import { getWedstrijdenVoorSoort } from "@/lib/matches";
import { LMS_RONDES } from "@/lib/lms";
import { LandSpelerPicker } from "@/components/LandSpelerPicker";

interface AdminStats {
  gebruikers: number;
  poules: number;
  poulesSoort: { wk: number; cl_finale: number; lms: number };
  actievePoules: number;
  voorspellingen: number;
}

interface SyncTestRapport {
  apiQuota?: { gebruikt: number; limiet: number; resterend: number; fout?: string };
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
            active === tab.label ? "bg-green-500 text-black" : "text-zinc-400 hover:text-white"
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

  // Poule aanmaken
  const [poulenaam, setPoulenaam] = useState("");
  const [pouleSoort, setPouleSoort] = useState<"wk" | "cl_finale" | "lms" | "oefenwedstrijd" | "enkelvoudig">("wk");
  const [wkWedstrijdId, setWkWedstrijdId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [knockoutWedstrijden, setKnockoutWedstrijden] = useState<Array<{
    id: string; rondeNr: number; thuisCode: string; thuisNaam: string; thuisVlag: string;
    uitCode: string; uitNaam: string; uitVlag: string; datum: string | null; tijd: string | null;
  }>>([]);

  const vandaag = new Date().toISOString().split("T")[0];
  const alleWkWedstrijden = getWedstrijdenVoorSoort("wk").filter((w) => w.datum >= vandaag);
  const wkGroepen = [...new Set(alleWkWedstrijden.map((w) => w.groep))].sort();
  const toekomstigeKnockout = knockoutWedstrijden.filter((w) => w.datum && w.datum >= vandaag);
  const knockoutRondes = [...new Set(toekomstigeKnockout.map((w) => w.rondeNr))].sort((a, b) => a - b);

  // Specials resultaten
  const [specialsResultaten, setSpecialsResultaten] = useState<Record<string, string>>({});
  const [specialsSaving, setSpecialsSaving] = useState(false);
  const [specialsSaveStatus, setSpecialsSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Sync
  const [syncingAlles, setSyncingAlles] = useState(false);
  const [syncAllesResult, setSyncAllesResult] = useState<string | null>(null);
  const [testingSync, setTestingSync] = useState(false);
  const [testRapport, setTestRapport] = useState<SyncTestRapport | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (res.status === 403) { router.replace("/"); return null; }
        return res.json();
      })
      .then((data) => { if (data) setStats(data); setLoading(false); })
      .catch(() => { router.replace("/"); });

    fetch("/api/admin/specials-resultaten")
      .then((res) => res.ok ? res.json() : {})
      .then((data) => setSpecialsResultaten(data));

    fetch("/api/lms/wedstrijden")
      .then((res) => res.ok ? res.json() : { wedstrijden: [] })
      .then((data) => setKnockoutWedstrijden(data.wedstrijden ?? []));
  }, [router]);

  async function handleCreatePoule(e: React.FormEvent) {
    e.preventDefault();
    if (!poulenaam.trim()) return;
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const { code } = await createPoule(poulenaam.trim(), pouleSoort, pouleSoort === "enkelvoudig" ? wkWedstrijdId : undefined);
      setCreateSuccess(`Poule aangemaakt! Code: ${code} · Uitnodigingslink: /join/${code}`);
      setPoulenaam("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function saveSpecials() {
    setSpecialsSaving(true);
    setSpecialsSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/specials-resultaten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialsResultaten),
      });
      setSpecialsSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSpecialsSaveStatus("error");
    } finally {
      setSpecialsSaving(false);
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
        <div className="mb-8">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block">
            ← Terug naar home
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Admin</h1>
        </div>

        <AdminNav active="Dashboard" />

        {/* Stats */}
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

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

        {/* Poule aanmaken */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Nieuwe poule aanmaken</p>
          <form onSubmit={handleCreatePoule} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Naam</label>
              <input
                type="text"
                value={poulenaam}
                onChange={(e) => { setPoulenaam(e.target.value); setCreateError(""); setCreateSuccess(""); }}
                placeholder="bijv. Vrienden WK 2026"
                maxLength={40}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Type</label>
              <select
                value={pouleSoort}
                onChange={(e) => { setPouleSoort(e.target.value as typeof pouleSoort); setWkWedstrijdId(""); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="wk">WK 2026 — alle wedstrijden</option>
                <option value="enkelvoudig">Enkelvoudig — één WK-wedstrijd</option>
                <option value="lms">Last Man Standing</option>
                <option value="cl_finale">CL Finale</option>
                <option value="oefenwedstrijd">Oefenwedstrijd (NED vs ALG)</option>
              </select>
            </div>

            {pouleSoort === "enkelvoudig" && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Wedstrijd</label>
                <select
                  value={wkWedstrijdId}
                  onChange={(e) => setWkWedstrijdId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">— Kies een wedstrijd —</option>
                  {wkGroepen.map((groep) => (
                    <optgroup key={groep} label={groep}>
                      {alleWkWedstrijden
                        .filter((w) => w.groep === groep)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.thuis.vlag} {w.thuis.naam} vs {w.uit.naam} {w.uit.vlag} · {w.datum}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                  {knockoutRondes.map((nr) => {
                    const rondeNaam = LMS_RONDES.find((r) => r.nr === nr)?.naam ?? `Ronde ${nr}`;
                    return (
                      <optgroup key={nr} label={rondeNaam}>
                        {toekomstigeKnockout
                          .filter((w) => w.rondeNr === nr)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.thuisVlag} {w.thuisNaam} vs {w.uitNaam} {w.uitVlag} · {w.datum}
                            </option>
                          ))}
                      </optgroup>
                    );
                  })}
                </select>
                {alleWkWedstrijden.length === 0 && toekomstigeKnockout.length === 0 && (
                  <p className="text-xs text-zinc-500 mt-1.5">Geen toekomstige wedstrijden gevonden. Voeg knockout wedstrijden toe via de LMS instellingen.</p>
                )}
              </div>
            )}
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            {createSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400 font-mono">
                {createSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={createLoading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {createLoading ? "Aanmaken..." : "Poule aanmaken →"}
            </button>
          </form>
        </div>

        {/* Specials uitslagen */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Specials uitslagen</p>
            {specialsSaveStatus === "saved" && <span className="text-xs text-green-400">✓ Opgeslagen</span>}
            {specialsSaveStatus === "error" && <span className="text-xs text-red-400">Fout bij opslaan</span>}
          </div>
          <div className="space-y-4">
            {SPECIALS_CATEGORIEEN.map((cat) => (
              <div key={cat.key}>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  {cat.label}
                  {cat.prijsNaam && <span className="text-purple-400 ml-2">· {cat.prijsNaam}</span>}
                </label>
                {cat.type === "speler" ? (
                  <LandSpelerPicker
                    value={specialsResultaten[cat.key] ?? ""}
                    onChange={(naam) => {
                      setSpecialsResultaten((prev) => ({ ...prev, [cat.key]: naam }));
                      setSpecialsSaveStatus("idle");
                    }}
                  />
                ) : (
                  <input
                    type={cat.type === "nummer" ? "number" : "text"}
                    min={cat.type === "nummer" ? 0 : undefined}
                    value={specialsResultaten[cat.key] ?? ""}
                    onChange={(e) => {
                      setSpecialsResultaten((prev) => ({ ...prev, [cat.key]: e.target.value }));
                      setSpecialsSaveStatus("idle");
                    }}
                    placeholder={cat.type === "nummer" ? "0" : "Vul winnaar in..."}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={saveSpecials}
            disabled={specialsSaving}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {specialsSaving ? "Opslaan..." : "Uitslagen opslaan"}
          </button>
        </div>

        {/* Data synchronisatie */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Data synchronisatie</p>
            <span className="text-xs text-zinc-600">automatisch elke 2u via cron</span>
          </div>
          <p className="text-xs text-zinc-600 mb-4">Uitslagen worden maximaal ~2 uur na een wedstrijd bijgewerkt.</p>
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
        </div>

        {/* Dry-run test */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Sync dry-run</p>
            <span className="text-xs text-zinc-600">schrijft niks — alleen lezen</span>
          </div>
          <p className="text-xs text-zinc-600 mb-4">Toont wat de API teruggeeft en wat er al in de database staat.</p>
          <button
            onClick={runSyncTest}
            disabled={testingSync}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            {testingSync ? "Ophalen…" : "API & DB controleren"}
          </button>

          {testRapport && (
            <div className="mt-4 space-y-4 text-xs">
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
              {testRapport.wk && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="font-semibold text-zinc-300 mb-2">WK 2026</p>
                  {testRapport.wk.fout ? (
                    <p className="text-red-400">{testRapport.wk.fout}</p>
                  ) : (
                    <div className="space-y-1 text-zinc-400">
                      <p>{testRapport.wk.aantalAfgelopen} afgeronde fixtures gevonden</p>
                      <p>Eerste verwachte wedstrijd: <span className="text-zinc-300">{testRapport.wk.eersteVerwachteWedstrijd ?? "–"}</span></p>
                      {testRapport.wk.fixtures.length === 0 && (
                        <p className="text-zinc-500 italic">Nog geen wedstrijden gespeeld</p>
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
