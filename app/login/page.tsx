"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [verzonden, setVerzonden] = useState(false);
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading("google");
    setError("");
    const supabase = createClient();
    const redirect = searchParams.get("redirect") ?? "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    setError("");

    const supabase = createClient();
    const redirect = searchParams.get("redirect") ?? "/";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
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
            We hebben een link gestuurd naar <span className="text-white font-medium">{email}</span>.
            Klik op de link in de mail om in te loggen.
          </p>
          <p className="text-zinc-600 text-xs mt-4">
            Geen mail ontvangen? Check je spam of probeer opnieuw.
          </p>
          <button
            onClick={() => setVerzonden(false)}
            className="mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Ander e-mailadres proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">STEELBALLS</h1>
          <p className="text-zinc-500 text-sm mt-1">WK Poule 2026</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-7 pt-7 pb-5">
            <h2 className="text-xl font-bold text-white mb-4">Inloggen</h2>

            {/* Google knop */}
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
              </svg>
              {loading === "google" ? "Doorsturen..." : "Inloggen met Google"}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">of</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <p className="text-zinc-400 text-sm mb-4">
              Geen Google? Ontvang een inloglink per mail.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-4">
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
              disabled={loading !== null}
              className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading === "email" ? "Versturen..." : "Stuur magic link →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPagina() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
