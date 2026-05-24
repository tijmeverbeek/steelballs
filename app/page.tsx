"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPoule, joinPoule } from "@/lib/api";
import { saveSessie } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [createForm, setCreateForm] = useState({ naam: "", poulenaam: "" });
  const [joinForm, setJoinForm] = useState({ naam: "", code: "" });
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.naam.trim() || !createForm.poulenaam.trim()) return;
    setLoading("create");
    try {
      const { code, deelnemerId } = await createPoule(createForm.poulenaam.trim(), createForm.naam.trim());
      saveSessie({ code, deelnemerId });
      router.push(`/poule/${code}`);
    } catch {
      setLoading(null);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinForm.naam.trim() || !joinForm.code.trim()) return;
    setLoading("join");
    const code = joinForm.code.trim().toUpperCase();
    try {
      const result = await joinPoule(code, joinForm.naam.trim());
      if (!result) {
        setJoinError("Poule niet gevonden. Controleer de code en probeer opnieuw.");
        setLoading(null);
        return;
      }
      saveSessie({ code, deelnemerId: result.deelnemerId });
      router.push(`/poule/${code}`);
    } catch {
      setJoinError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 text-4xl">
            ⚽
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-3">Steelballs</h1>
          <p className="text-green-200 text-xl max-w-md mx-auto">
            Voorspel alle wedstrijden, speel met vrienden en familie, en zie wie het beste kan voorspellen.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-green-300">
            <span>🗓 11 juni – 19 juli 2026</span>
            <span>·</span>
            <span>🌎 VS · Canada · Mexico</span>
          </div>
        </div>
      </header>

      {/* Actiekaarten */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Poule aanmaken */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 px-8 py-5">
              <h2 className="text-xl font-bold text-gray-900">Maak een poule</h2>
              <p className="text-sm text-gray-500 mt-1">
                Maak een nieuwe poule aan en deel de code met je vrienden.
              </p>
            </div>
            <form onSubmit={handleCreate} className="px-8 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jouw naam</label>
                <input
                  type="text"
                  value={createForm.naam}
                  onChange={(e) => setCreateForm((f) => ({ ...f, naam: e.target.value }))}
                  placeholder="Bijv. Sander"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Naam van de poule</label>
                <input
                  type="text"
                  value={createForm.poulenaam}
                  onChange={(e) => setCreateForm((f) => ({ ...f, poulenaam: e.target.value }))}
                  placeholder="Bijv. Familie WK Poule 2026"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading === "create"}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading === "create" ? "Aanmaken..." : "Maak poule aan →"}
              </button>
            </form>
          </div>

          {/* Poule joinen */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-100 px-8 py-5">
              <h2 className="text-xl font-bold text-gray-900">Doe mee met een poule</h2>
              <p className="text-sm text-gray-500 mt-1">
                Heb je een uitnodigingscode ontvangen? Vul hem hier in.
              </p>
            </div>
            <form onSubmit={handleJoin} className="px-8 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jouw naam</label>
                <input
                  type="text"
                  value={joinForm.naam}
                  onChange={(e) => setJoinForm((f) => ({ ...f, naam: e.target.value }))}
                  placeholder="Bijv. Emma"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Poule code</label>
                <input
                  type="text"
                  value={joinForm.code}
                  onChange={(e) => {
                    setJoinForm((f) => ({ ...f, code: e.target.value }));
                    setJoinError("");
                  }}
                  placeholder="Bijv. ABC123"
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm uppercase tracking-[0.2em] font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                {joinError && <p className="text-red-500 text-xs mt-1.5">{joinError}</p>}
              </div>
              <button
                type="submit"
                disabled={loading === "join"}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading === "join" ? "Deelnemen..." : "Doe mee →"}
              </button>
            </form>
          </div>
        </div>

        {/* Hoe werkt het */}
        <div className="mt-12">
          <h3 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Hoe werkt het?
          </h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { emoji: "🏗", titel: "Maak een poule", tekst: "Maak een poule aan en deel de code met deelnemers." },
              { emoji: "📝", titel: "Vul voorspellingen in", tekst: "Iedereen voorspelt de uitslag van elke wedstrijd." },
              { emoji: "🏆", titel: "Win de poule", tekst: "Exacte score = 3 pt · Juiste uitslag = 1 pt" },
            ].map(({ emoji, titel, tekst }) => (
              <div key={titel} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-3xl mb-3">{emoji}</div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{titel}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{tekst}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Steelballs — FIFA World Cup 2026 USA · Canada · Mexico
      </footer>
    </div>
  );
}
