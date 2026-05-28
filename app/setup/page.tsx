"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gebruikersnaam, setGebruikersnaam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = gebruikersnaam.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gebruikersnaam: trimmed }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis, probeer opnieuw.");
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/";
    router.push(redirect);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-white tracking-tight">STALENBALLEN</h1>
          <p className="text-zinc-500 text-sm mt-1">WK Poule 2026</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-7 pt-7 pb-4">
            <h2 className="text-xl font-bold text-white">Kies een gebruikersnaam</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Zo zien andere deelnemers jou in de poule.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="px-7 pb-7 pt-3 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={gebruikersnaam}
                onChange={(e) => setGebruikersnaam(e.target.value)}
                placeholder="bijv. tijme26"
                autoFocus
                maxLength={30}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || !gebruikersnaam.trim()}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Opslaan..." : "Doorgaan →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SetupPagina() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  );
}
