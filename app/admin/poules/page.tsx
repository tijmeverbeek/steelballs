"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminPoule {
  id: string;
  naam: string;
  code: string;
  soort: string;
  aangemaaktOp: string;
  afgerond: boolean;
  organisatorEmail: string | null;
  _count: { deelnemers: number };
}

type Filter = "alle" | "wk" | "cl_finale" | "lms";

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

function SoortBadge({ soort }: { soort: string }) {
  if (soort === "wk") {
    return <span className="bg-zinc-800 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">WK</span>;
  }
  if (soort === "cl_finale") {
    return <span className="bg-zinc-800 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">CL Finale</span>;
  }
  if (soort === "lms") {
    return <span className="bg-zinc-800 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">LMS</span>;
  }
  return <span className="bg-zinc-800 text-zinc-400 text-xs font-semibold px-2 py-0.5 rounded-full">{soort}</span>;
}

export default function PoulesPagina() {
  const router = useRouter();
  const [poules, setPoules] = useState<AdminPoule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("alle");

  useEffect(() => {
    fetch("/api/admin/poules")
      .then((res) => {
        if (res.status === 403) { router.replace("/"); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) setPoules(data);
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

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "wk", label: "WK" },
    { key: "cl_finale", label: "CL Finale" },
    { key: "lms", label: "LMS" },
  ];

  const gefilterd = poules?.filter((p) => filter === "alle" || p.soort === filter) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block">
              ← Terug naar home
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Admin</h1>
          </div>
        </div>

        <AdminNav active="Poules" />

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors border ${
                filter === tab.key
                  ? "bg-zinc-700 border-zinc-600 text-white"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Alle poules</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{gefilterd.length} poule{gefilterd.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="divide-y divide-zinc-800">
            {gefilterd.length === 0 && (
              <p className="text-sm text-zinc-600 px-5 py-6 text-center">Geen poules gevonden.</p>
            )}
            {gefilterd.map((p) => (
              <Link
                key={p.id}
                href={`/poule/${p.code}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white truncate">{p.naam}</span>
                    <SoortBadge soort={p.soort} />
                    {p.afgerond && (
                      <span className="bg-zinc-800 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">Afgerond</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-500">{p.code}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{p._count.deelnemers} deelnemer{p._count.deelnemers !== 1 ? "s" : ""}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{new Date(p.aangemaaktOp).toLocaleDateString("nl-NL")}</span>
                    {p.organisatorEmail && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600 truncate">{p.organisatorEmail}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-zinc-600 text-sm flex-shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
