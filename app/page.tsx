"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPoule, joinPoule } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { getWedstrijdenVoorSoort } from "@/lib/matches";


interface UserPoule {
  id: string;
  naam: string;
  code: string;
  soort: string;
  deelnemerId: string;
  ingevuld: number;
  aangemaaktOp: string;
  afgerond: boolean;
  winnaarId?: string | null;
}

export default function Home() {
  const router = useRouter();
  const [ingelogd, setIngelogd] = useState<boolean | null>(null);
  const [gebruikersnaam, setGebruikersnaam] = useState<string | null>(null);
  const [mijnUserId, setMijnUserId] = useState<string | null>(null);
  const [aantalWinsten, setAantalWinsten] = useState<number>(0);
  const [mijnPoules, setMijnPoules] = useState<UserPoule[] | null>(null);
  const [poulenaam, setPoulenaam] = useState("");
  const [pouleSoort, setPouleSoort] = useState<"wk" | "cl_finale" | "lms">("wk");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIngelogd(false); return; }
      setIngelogd(true);
      setMijnUserId(user.id);

      const [userRes, poulesRes, adminRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/user/poules"),
        fetch("/api/admin/stats"),
      ]);
      if (userRes.ok) {
        const u = await userRes.json();
        setGebruikersnaam(u?.gebruikersnaam ?? null);
        setAantalWinsten(u?.aantalWinsten ?? 0);
      }
      if (poulesRes.ok) {
        setMijnPoules(await poulesRes.json());
      }
      if (adminRes.ok) {
        setIsAdmin(true);
      }
    }
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!poulenaam.trim()) return;
    setLoading("create");
    setCreateError("");
    try {
      const { code } = await createPoule(poulenaam.trim(), pouleSoort);
      router.push(`/poule/${code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Er ging iets mis.");
      setLoading(null);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading("join");
    const code = joinCode.trim().toUpperCase();
    try {
      const result = await joinPoule(code);
      if (!result) {
        setJoinError("Poule niet gevonden. Controleer de code.");
        setLoading(null);
        return;
      }
      router.push(`/poule/${code}`);
    } catch {
      setJoinError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }


  if (ingelogd === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ingelogd) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 flex flex-col items-center justify-center py-20 text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Stalenballen Cup" className="w-56 h-56 object-contain" />
          </div>
          <p className="text-xl font-semibold text-zinc-200 mb-2">Strijd met je vrienden.</p>
          <p className="text-base text-zinc-400 mb-8">Kom erachter wie de staalste ballen heeft.</p>

          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-zinc-400 mb-12">
            <span className="text-blue-400 font-medium">🏆 CL Finale</span>
            <span className="text-zinc-600">·</span>
            <span>PSG vs Arsenal</span>
            <span className="text-zinc-600">·</span>
            <span>2025/26</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-12">
            {[
              { nr: "01", titel: "Maak een poule", tekst: "Maak een poule aan en deel de uitnodigingslink met je vrienden." },
              { nr: "02", titel: "Voorspel de uitslagen", tekst: "Iedereen voorspelt de uitslag van elke WK wedstrijd vóór de aftrap." },
              { nr: "03", titel: "Wie heeft stalen ballen?", tekst: "Exacte score = 3 pt · Juiste uitslag = 1 pt · Wie wint de poule?" },
            ].map(({ nr, titel, tekst }) => (
              <div key={nr} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left">
                <div className="text-3xl font-black text-zinc-800 mb-2">{nr}</div>
                <div className="font-bold text-white mb-1 text-sm">{titel}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{tekst}</div>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-400 text-black font-black text-lg px-10 py-4 rounded-2xl transition-colors"
          >
            Inloggen / Meedoen →
          </Link>
        </main>
        <footer className="text-center text-xs text-zinc-700 py-6 border-t border-zinc-900">
          Stalenballen Cup · FIFA World Cup 2026 · USA · Canada · Mexico
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">

      {/* ── Header ── */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="flex justify-center mb-5">
            <img src="/logo.png" alt="Stalenballen Cup" className="w-56 h-56 object-contain" />
          </div>
          <p className="text-xl font-semibold text-zinc-200 mb-1">Strijd met je vrienden.</p>
          <p className="text-base text-zinc-400 mb-6">Kom erachter wie de staalste ballen heeft.</p>
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-zinc-400">
            <span className="text-blue-400 font-medium">🏆 CL Finale</span>
            <span className="text-zinc-600">·</span>
            <span>PSG vs Arsenal</span>
            <span className="text-zinc-600">·</span>
            <span>2025/26</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-12 space-y-8">

        {/* ── Topbar met gebruiker ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {mijnUserId ? (
              <p className="text-sm text-zinc-500">
                Ingelogd als{" "}
                <Link href={`/speler/${encodeURIComponent(mijnUserId)}`} className="text-white font-medium hover:text-zinc-300 transition-colors">
                  {gebruikersnaam ?? "jij"}
                </Link>
              </p>
            ) : (
              <div />
            )}
            {aantalWinsten > 0 && (
              <p className="text-sm text-yellow-400 font-semibold mt-0.5">
                🏆 {aantalWinsten} toernooi{aantalWinsten !== 1 ? "en" : ""} gewonnen
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
              >
                ⚙ Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Uitloggen
            </button>
          </div>
        </div>

        {/* ── CL Finale banner ── */}
        <Link href="/join/SGPZ3B" className="block relative overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-950/80 via-zinc-900 to-zinc-950 hover:border-blue-400/60 transition-colors">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />
          <div className="relative px-6 pt-5 pb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
              🏆 Champions League Finale · Doe mee
            </div>
            {/* Teams */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="flex flex-col items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" alt="PSG" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-sm font-black text-white">PSG</span>
              </div>
              <span className="text-2xl font-black text-zinc-600">VS</span>
              <div className="flex flex-col items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" alt="Arsenal" className="w-16 h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-sm font-black text-white">Arsenal</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-sm">Voorspel de uitslag en bewijs wie de staalste ballen heeft.</p>
              <span className="shrink-0 ml-4 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-xl text-sm">
                Meedoen →
              </span>
            </div>
          </div>
        </Link>

        {/* ── Jouw poules ── */}
        {mijnPoules !== null && mijnPoules.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Jouw poules
            </p>
            <div className="space-y-3">
              {mijnPoules.map((p) => (
                <Link
                  key={p.id}
                  href={`/poule/${p.code}`}
                  className={`block bg-zinc-900 rounded-2xl px-5 py-4 hover:border-zinc-600 transition-colors border ${p.afgerond ? "border-yellow-500/30" : "border-zinc-800"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {p.afgerond && <span className="text-base">🏆</span>}
                      <p className="font-bold text-white">{p.naam}</p>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">{p.code}</span>
                  </div>
                  {p.afgerond ? (
                    <p className="text-xs text-yellow-400/80">Afgerond · tik voor eindstand</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                        <div
                          className="h-1.5 bg-green-500 rounded-full transition-all"
                          style={{ width: `${(p.ingevuld / getWedstrijdenVoorSoort(p.soort ?? "wk").length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{p.ingevuld}/{getWedstrijdenVoorSoort(p.soort ?? "wk").length} voorspeld</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Acties ── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Poule joinen */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-7 pt-6 pb-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1.5">
                Uitgenodigd?
              </div>
              <h2 className="text-xl font-bold text-white">Doe mee</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Voer de poule code in die je hebt ontvangen.
              </p>
            </div>
            <form onSubmit={handleJoin} className="px-7 pb-7 pt-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Poule code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 uppercase tracking-[0.25em] font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                {joinError && <p className="text-red-400 text-xs mt-1">{joinError}</p>}
              </div>
              <button
                type="submit"
                disabled={loading === "join"}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading === "join" ? "Deelnemen..." : "Doe mee →"}
              </button>
            </form>
          </div>

          {/* Poule aanmaken */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-7 pt-6 pb-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-1.5">
                Nieuwe poule
              </div>
              <h2 className="text-xl font-bold text-white">Maak een poule</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Maak een nieuwe poule aan en nodig vrienden uit.
              </p>
            </div>
            <form onSubmit={handleCreate} className="px-7 pb-7 pt-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Naam
                </label>
                <input
                  type="text"
                  value={poulenaam}
                  onChange={(e) => { setPoulenaam(e.target.value); setCreateError(""); }}
                  placeholder="bijv. Vrienden 2026"
                  maxLength={40}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Type
                </label>
                <select
                  value={pouleSoort}
                  onChange={(e) => setPouleSoort(e.target.value as "wk" | "cl_finale" | "lms")}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="wk">WK 2026</option>
                  <option value="cl_finale">CL Finale</option>
                  <option value="lms">Last Man Standing</option>
                </select>
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <button
                type="submit"
                disabled={loading === "create"}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {loading === "create" ? "Aanmaken..." : "Poule aanmaken →"}
              </button>
            </form>
          </div>
        </div>

        {/* Hoe werkt het */}
        <div>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-700 mb-6">
            Hoe werkt het?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { nr: "01", titel: "Maak een poule", tekst: "Maak een poule aan en deel de uitnodigingslink met je vrienden." },
              { nr: "02", titel: "Voorspel de uitslagen", tekst: "Iedereen voorspelt de uitslag van elke WK wedstrijd vóór de aftrap." },
              { nr: "03", titel: "Wie heeft stalen ballen?", tekst: "Exacte score = 3 pt · Juiste uitslag = 1 pt · Wie wint de poule?" },
            ].map(({ nr, titel, tekst }) => (
              <div key={nr} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="text-3xl font-black text-zinc-800 mb-2">{nr}</div>
                <div className="font-bold text-white mb-1 text-sm">{titel}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{tekst}</div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="text-center text-xs text-zinc-700 py-6 border-t border-zinc-900">
        Stalenballen Cup · FIFA World Cup 2026 · USA · Canada · Mexico
      </footer>
    </div>
  );
}
