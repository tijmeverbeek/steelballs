"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPoule, joinPoule } from "@/lib/api";
import { saveSessie } from "@/lib/storage";

function SteelBallsLogo({ size = 140 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 160 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="s1" cx="32%" cy="26%" r="72%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="12%" stopColor="#e4e4e4" />
          <stop offset="40%" stopColor="#8c8c8c" />
          <stop offset="75%" stopColor="#3e3e3e" />
          <stop offset="100%" stopColor="#141414" />
        </radialGradient>
        <radialGradient id="s2" cx="32%" cy="26%" r="72%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="12%" stopColor="#e4e4e4" />
          <stop offset="40%" stopColor="#8c8c8c" />
          <stop offset="75%" stopColor="#3e3e3e" />
          <stop offset="100%" stopColor="#141414" />
        </radialGradient>
        <radialGradient id="s3" cx="32%" cy="26%" r="72%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="12%" stopColor="#e4e4e4" />
          <stop offset="40%" stopColor="#8c8c8c" />
          <stop offset="75%" stopColor="#3e3e3e" />
          <stop offset="100%" stopColor="#141414" />
        </radialGradient>
        <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" />
          <feOffset dx="1" dy="5" result="blur" />
          <feFlood floodColor="#000" floodOpacity="0.55" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="80" cy="138" rx="58" ry="7" fill="rgba(0,0,0,0.35)" />

      {/* Bottom-left ball */}
      <circle cx="43" cy="100" r="33" fill="url(#s1)" filter="url(#sh)" />
      {/* Bottom-right ball */}
      <circle cx="117" cy="100" r="33" fill="url(#s2)" filter="url(#sh)" />
      {/* Top ball */}
      <circle cx="80" cy="44" r="33" fill="url(#s3)" filter="url(#sh)" />

      {/* Specular highlights */}
      <ellipse cx="67" cy="32" rx="11" ry="7" fill="rgba(255,255,255,0.72)" transform="rotate(-22 67 32)" />
      <ellipse cx="30" cy="89" rx="11" ry="7" fill="rgba(255,255,255,0.65)" transform="rotate(-22 30 89)" />
      <ellipse cx="104" cy="89" rx="11" ry="7" fill="rgba(255,255,255,0.65)" transform="rotate(-22 104 89)" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [createForm, setCreateForm] = useState({ naam: "", poulenaam: "" });
  const [joinForm, setJoinForm] = useState({ naam: "", code: "" });
  const [joinError, setJoinError] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [createError, setCreateError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.naam.trim() || !createForm.poulenaam.trim()) return;
    setLoading("create");
    setCreateError("");
    try {
      const { code, deelnemerId } = await createPoule(createForm.poulenaam.trim(), createForm.naam.trim());
      saveSessie({ code, deelnemerId });
      router.push(`/poule/${code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw.");
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">

      {/* ── Hero ── */}
      <header className="relative overflow-hidden">
        {/* Achtergrond radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="flex justify-center mb-6">
            <SteelBallsLogo size={148} />
          </div>

          <h1 className="text-6xl font-black tracking-tight mb-4 text-white">
            STEELBALLS
          </h1>

          <p className="text-2xl font-semibold text-zinc-200 mb-2">
            Strijd met je vrienden.
          </p>
          <p className="text-lg text-zinc-400 mb-8">
            Kom erachter wie de staalste ballen heeft.
          </p>

          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-zinc-400">
            <span className="text-green-400 font-medium">⚽ WK 2026</span>
            <span className="text-zinc-600">·</span>
            <span>11 juni – 19 juli</span>
            <span className="text-zinc-600">·</span>
            <span>VS · Canada · Mexico</span>
          </div>
        </div>
      </header>

      {/* ── Actiekaarten ── */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">

          <div className="grid md:grid-cols-2 gap-6">

            {/* Poule aanmaken */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-8 pt-7 pb-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-2">
                  Nieuwe poule
                </div>
                <h2 className="text-2xl font-bold text-white">Maak een poule</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Stel jouw poule in en deel de code met je vrienden.
                </p>
              </div>
              <form onSubmit={handleCreate} className="px-8 pb-8 pt-2 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Jouw naam
                  </label>
                  <input
                    type="text"
                    value={createForm.naam}
                    onChange={(e) => setCreateForm((f) => ({ ...f, naam: e.target.value }))}
                    placeholder="Bijv. Sander"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Naam van de poule
                  </label>
                  <input
                    type="text"
                    value={createForm.poulenaam}
                    onChange={(e) => setCreateForm((f) => ({ ...f, poulenaam: e.target.value }))}
                    placeholder="Bijv. De Harde Kern 2026"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading === "create"}
                  className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
                >
                  {loading === "create" ? "Aanmaken..." : "Maak poule aan →"}
                </button>
                {createError && <p className="text-red-400 text-xs mt-3">{createError}</p>}
              </form>
            </div>

            {/* Poule joinen */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-8 pt-7 pb-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">
                  Uitgenodigd?
                </div>
                <h2 className="text-2xl font-bold text-white">Doe mee</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Voer de poule code in die je hebt ontvangen.
                </p>
              </div>
              <form onSubmit={handleJoin} className="px-8 pb-8 pt-2 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Jouw naam
                  </label>
                  <input
                    type="text"
                    value={joinForm.naam}
                    onChange={(e) => setJoinForm((f) => ({ ...f, naam: e.target.value }))}
                    placeholder="Bijv. Emma"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Poule code
                  </label>
                  <input
                    type="text"
                    value={joinForm.code}
                    onChange={(e) => {
                      setJoinForm((f) => ({ ...f, code: e.target.value }));
                      setJoinError("");
                    }}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 uppercase tracking-[0.25em] font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  {joinError && <p className="text-red-400 text-xs mt-1.5">{joinError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading === "join"}
                  className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
                >
                  {loading === "join" ? "Deelnemen..." : "Doe mee →"}
                </button>
              </form>
            </div>
          </div>

          {/* Hoe werkt het */}
          <div className="mt-16">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-8">
              Hoe werkt het?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  nr: "01",
                  titel: "Maak een poule",
                  tekst: "Maak een poule aan, geef hem een naam en deel de code met je vrienden.",
                },
                {
                  nr: "02",
                  titel: "Vul je voorspellingen in",
                  tekst: "Iedereen voorspelt de uitslag van elke WK wedstrijd vóór de aftrap.",
                },
                {
                  nr: "03",
                  titel: "Bewijs je hebt stalen ballen",
                  tekst: "Exacte score = 3 pt · Juiste uitslag = 1 pt · Wie wint de poule?",
                },
              ].map(({ nr, titel, tekst }) => (
                <div key={nr} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="text-3xl font-black text-zinc-800 mb-3">{nr}</div>
                  <div className="font-bold text-white mb-1.5 text-sm">{titel}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{tekst}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-zinc-700 py-8 border-t border-zinc-900">
        Steelballs · FIFA World Cup 2026 · USA · Canada · Mexico
      </footer>
    </div>
  );
}
