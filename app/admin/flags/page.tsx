"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FeatureFlag {
  naam: string;
  aanGezet: boolean;
  beschrijving: string;
  bijgewerktOp: string;
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

function Toggle({ aan, onChange, disabled }: { aan: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${aan ? "bg-green-500" : "bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aan ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function FlagsPagina() {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleBezig, setToggleBezig] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/flags")
      .then((res) => {
        if (res.status === 403) { router.replace("/"); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) setFlags(data);
        setLoading(false);
      })
      .catch(() => { router.replace("/"); });
  }, [router]);

  async function toggleFlag(flag: FeatureFlag) {
    setToggleBezig(flag.naam);
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam: flag.naam, aanGezet: !flag.aanGezet }),
      });
      if (res.ok) {
        const updated: FeatureFlag = await res.json();
        setFlags((prev) =>
          prev ? prev.map((f) => (f.naam === updated.naam ? updated : f)) : prev
        );
      }
    } finally {
      setToggleBezig(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

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

        <AdminNav active="Flags" />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Feature flags</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Schakel functies in of uit zonder een deployment</p>
          </div>

          <div className="divide-y divide-zinc-800">
            {flags?.length === 0 && (
              <p className="text-sm text-zinc-600 px-5 py-6 text-center">Geen feature flags gevonden.</p>
            )}
            {flags?.map((flag) => (
              <div key={flag.naam} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white font-mono">{flag.naam}</span>
                    {flag.aanGezet && (
                      <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                        Aan
                      </span>
                    )}
                  </div>
                  {flag.beschrijving && (
                    <p className="text-xs text-zinc-500">{flag.beschrijving}</p>
                  )}
                  <p className="text-xs text-zinc-700 mt-1">
                    Bijgewerkt: {new Date(flag.bijgewerktOp).toLocaleString("nl-NL")}
                  </p>
                </div>
                <Toggle
                  aan={flag.aanGezet}
                  onChange={() => toggleFlag(flag)}
                  disabled={toggleBezig === flag.naam}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
