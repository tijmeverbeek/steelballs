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
      </div>
    </div>
  );
}
