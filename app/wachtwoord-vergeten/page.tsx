"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WachtwoordVergetenPagina() {
  const [email, setEmail] = useState("");
  const [verzonden, setVerzonden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nieuw-wachtwoord`,
    });

    if (error) {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
      return;
    }

    setVerzonden(true);
  }

  if (verzonden) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="text-2xl font-bold text-white mb-2">Check je mail!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Als er een account bestaat voor{" "}
            <span className="text-white font-medium">{email}</span>, ontvang je
            een link om je wachtwoord te resetten.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
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
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Stalenballen Cup" className="w-32 h-32 object-contain" />
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-7">
          <h2 className="text-xl font-bold text-white mb-2">Wachtwoord resetten</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Vul je e-mailadres in. Als er een account bestaat sturen we een resetlink.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@example.com"
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
              {loading ? "Versturen..." : "Reset link sturen →"}
            </button>
          </form>

          <a
            href="/login"
            className="mt-5 block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Terug naar inloggen
          </a>
        </div>
      </div>
    </div>
  );
}
