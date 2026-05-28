"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NieuwWachtwoordPagina() {
  const router = useRouter();
  const [wachtwoord, setWachtwoord] = useState("");
  const [bevestig, setBevestig] = useState("");
  const [loading, setLoading] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [error, setError] = useState("");
  const [sessieGeldig, setSessieGeldig] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessieGeldig(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (wachtwoord !== bevestig) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    if (wachtwoord.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: wachtwoord });

    if (error) {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
      return;
    }

    setKlaar(true);
    setTimeout(() => router.push("/"), 2000);
  }

  if (klaar) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Wachtwoord gewijzigd!</h1>
          <p className="text-zinc-400 text-sm">Je wordt doorgestuurd...</p>
        </div>
      </div>
    );
  }

  if (!sessieGeldig) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-3xl mb-6">⏳</div>
          <h1 className="text-xl font-bold text-white mb-2">Link wordt geverifieerd...</h1>
          <p className="text-zinc-500 text-sm mb-6">
            Kom je hier niet via een resetlink? Ga terug naar inloggen.
          </p>
          <a
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Terug naar inloggen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">STEELBALLS</h1>
          <p className="text-zinc-500 text-sm mt-1">Nieuw wachtwoord</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-7">
          <h2 className="text-xl font-bold text-white mb-6">Kies een nieuw wachtwoord</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Nieuw wachtwoord
              </label>
              <input
                type="password"
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Bevestig wachtwoord
              </label>
              <input
                type="password"
                value={bevestig}
                onChange={(e) => setBevestig(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Opslaan..." : "Wachtwoord opslaan →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
