"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<"inloggen" | "registreren">("inloggen");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading("google");
    setError("");
    const supabase = createClient();
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

  async function ensureUserAndRedirect() {
    const res = await fetch("/api/auth/ensure-user", { method: "POST" });
    const data = await res.json();
    router.push(data.needsSetup ? `/setup?redirect=${redirect}` : redirect);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !wachtwoord) return;
    setLoading("email");
    setError("");

    const supabase = createClient();

    if (mode === "inloggen") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: wachtwoord,
      });
      if (error) {
        setError("E-mailadres of wachtwoord klopt niet.");
        setLoading(null);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: wachtwoord,
      });
      if (error) {
        const msg = error.message ?? "";
        if (msg === "User already registered") {
          setError("Dit e-mailadres is al in gebruik.");
        } else if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("disabled")) {
          setError("E-mail registratie is uitgeschakeld. Gebruik Google om in te loggen.");
        } else if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email")) {
          setError("Te veel pogingen. Wacht even en probeer het opnieuw.");
        } else if (msg.toLowerCase().includes("password")) {
          setError("Wachtwoord moet minimaal 6 tekens zijn.");
        } else {
          setError(`Er ging iets mis: ${msg}`);
        }
        setLoading(null);
        return;
      }
    }

    await ensureUserAndRedirect();
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">STEELBALLS</h1>
          <p className="text-zinc-500 text-sm mt-1">WK Poule 2026</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => { setMode("inloggen"); setError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "inloggen"
                  ? "text-white border-b-2 border-green-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => { setMode("registreren"); setError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "registreren"
                  ? "text-white border-b-2 border-green-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Registreren
            </button>
          </div>

          <div className="px-7 pt-6 pb-2">
            {/* Google */}
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
              {loading === "google"
                ? "Doorsturen..."
                : mode === "inloggen"
                ? "Inloggen met Google"
                : "Registreren met Google"}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600">of</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
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
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Wachtwoord
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
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {mode === "inloggen" && (
              <div className="text-right -mt-1">
                <a
                  href="/wachtwoord-vergeten"
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Wachtwoord vergeten?
                </a>
              </div>
            )}
            <button
              type="submit"
              disabled={loading !== null}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading === "email"
                ? "Even geduld..."
                : mode === "inloggen"
                ? "Inloggen →"
                : "Account aanmaken →"}
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
