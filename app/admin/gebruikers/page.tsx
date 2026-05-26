"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Gebruiker {
  id: string;
  email: string;
  gebruikersnaam: string | null;
  isAdmin: boolean;
  aangemaaktOp: string;
  aantalWinsten: number;
  _count: { deelnemers: number };
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

export default function GebruikersPagina() {
  const router = useRouter();
  const [gebruikers, setGebruikers] = useState<Gebruiker[] | null>(null);
  const [mijnId, setMijnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleBezig, setToggleBezig] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMijnId(user.id);

      const res = await fetch("/api/admin/gebruikers");
      if (res.status === 403) { router.replace("/"); return; }
      if (res.ok) {
        setGebruikers(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleAdmin(gebruiker: Gebruiker) {
    if (gebruiker.id === mijnId) return;
    setToggleBezig(gebruiker.id);
    try {
      const res = await fetch(`/api/admin/gebruikers/${gebruiker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !gebruiker.isAdmin }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGebruikers((prev) =>
          prev ? prev.map((g) => (g.id === updated.id ? { ...g, isAdmin: updated.isAdmin } : g)) : prev
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block">
              ← Terug naar home
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Admin</h1>
          </div>
        </div>

        <AdminNav active="Gebruikers" />

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-bold text-white">Alle gebruikers</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{gebruikers?.length ?? 0} gebruikers geregistreerd</p>
          </div>

          <div className="divide-y divide-zinc-800">
            {gebruikers?.map((g) => {
              const isJijzelf = g.id === mijnId;
              return (
                <div
                  key={g.id}
                  className={`flex items-center gap-4 px-5 py-4 ${isJijzelf ? "bg-zinc-800/50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {g.gebruikersnaam ?? g.email.split("@")[0]}
                      </span>
                      {g.isAdmin && (
                        <span className="bg-zinc-800 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                      {isJijzelf && (
                        <span className="bg-zinc-800 text-zinc-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Jij
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{g.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-600">
                        {new Date(g.aangemaaktOp).toLocaleDateString("nl-NL")}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-600">{g._count.deelnemers} poule{g._count.deelnemers !== 1 ? "s" : ""}</span>
                      {g.aantalWinsten > 0 && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-yellow-400">{g.aantalWinsten} gewonnen</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isJijzelf && (
                    <button
                      onClick={() => toggleAdmin(g)}
                      disabled={toggleBezig === g.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 ${
                        g.isAdmin
                          ? "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50"
                          : "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900/50"
                      }`}
                    >
                      {toggleBezig === g.id
                        ? "..."
                        : g.isAdmin
                        ? "Admin intrekken"
                        : "Admin maken"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
