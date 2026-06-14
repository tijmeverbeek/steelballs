"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getWedstrijdenVoorSoort, getTeamByCode } from "@/lib/matches";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";

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
  featured?: boolean;
  lmsActief?: boolean;
  lmsHuidigeRonde?: number | null;
  lmsHuidigeRondePick?: { teamCode: string; uitkomst: string | null } | null;
}

export default function Home() {
  const router = useRouter();
  const [ingelogd, setIngelogd] = useState<boolean | null>(null);
  const [gebruikersnaam, setGebruikersnaam] = useState<string | null>(null);
  const [mijnUserId, setMijnUserId] = useState<string | null>(null);
  const [aantalWinsten, setAantalWinsten] = useState<number>(0);
  const [mijnPoules, setMijnPoules] = useState<UserPoule[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [specialsCompleet, setSpecialsCompleet] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIngelogd(false); return; }
      setIngelogd(true);
      setMijnUserId(user.id);

      const [userRes, poulesRes, adminRes, specialsRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/user/poules"),
        fetch("/api/admin/stats"),
        fetch("/api/specials"),
      ]);
      if (userRes.ok) {
        const u = await userRes.json();
        setGebruikersnaam(u?.gebruikersnaam ?? null);
        setAantalWinsten(u?.aantalWinsten ?? 0);
      }
      if (poulesRes.ok) setMijnPoules(await poulesRes.json());
      if (adminRes.ok) setIsAdmin(true);
      if (specialsRes.ok) {
        const antwoorden = await specialsRes.json();
        const compleet = SPECIALS_CATEGORIEEN.every((c) => antwoorden[c.key]?.trim());
        setSpecialsCompleet(compleet);
      }
    }
    load();
  }, []);

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
            <span className="text-blue-400 font-medium">⚽ WK 2026</span>
            <span className="text-zinc-600">·</span>
            <span>11 juni – 19 juli</span>
            <span className="text-zinc-600">·</span>
            <span>VS · Canada · Mexico</span>
          </div>
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-400 text-black font-black text-lg px-10 py-4 rounded-2xl transition-colors"
          >
            Inloggen →
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

      {/* Header */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="flex justify-center mb-5">
            <img src="/logo.png" alt="Stalenballen Cup" className="w-56 h-56 object-contain" />
          </div>
          <p className="text-xl font-semibold text-zinc-200 mb-1">Strijd met je vrienden.</p>
          <p className="text-base text-zinc-400 mb-6">Kom erachter wie de staalste ballen heeft.</p>
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-zinc-400">
            <span className="text-blue-400 font-medium">⚽ WK 2026</span>
            <span className="text-zinc-600">·</span>
            <span>11 juni – 19 juli</span>
            <span className="text-zinc-600">·</span>
            <span>VS · Canada · Mexico</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-12 space-y-8">

        {/* Topbar */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {mijnUserId && (
              <p className="text-sm text-zinc-500">
                Ingelogd als{" "}
                <Link href={`/speler/${encodeURIComponent(mijnUserId)}`} className="text-white font-medium hover:text-zinc-300 transition-colors">
                  {gebruikersnaam ?? "jij"}
                </Link>
              </p>
            )}
            {aantalWinsten > 0 && (
              <p className="text-sm text-yellow-400 font-semibold mt-0.5">
                🏆 {aantalWinsten} toernooi{aantalWinsten !== 1 ? "en" : ""} gewonnen
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-xs text-zinc-400 hover:text-white transition-colors font-medium">
                ⚙ Admin
              </Link>
            )}
            <button onClick={handleLogout} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Uitloggen
            </button>
          </div>
        </div>

        {/* Specials */}
        <Link
          href="/specials"
          className={`flex items-center justify-between bg-zinc-900 rounded-2xl border px-5 py-4 hover:border-purple-400/50 transition-colors ${specialsCompleet ? "border-green-500/40" : "border-purple-500/30"}`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-0.5">Bonusvragen</div>
            <div className="font-bold text-white">Specials — heel het toernooi</div>
            <div className="text-xs text-zinc-500 mt-0.5">Topscorer · Meeste gele kaarten · Mooiste doelpunt</div>
          </div>
          {specialsCompleet
            ? <span className="text-green-400 ml-4 text-lg">✓</span>
            : <span className="text-zinc-400 ml-4">→</span>}
        </Link>

        {/* Jouw poules */}
        {mijnPoules !== null && mijnPoules.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Jouw poules</p>
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
                  ) : p.soort === "enkelvoudig" ? (
                    <p className="text-xs text-zinc-500">
                      {p.ingevuld > 0
                        ? <span className="text-green-400">✓ Uitslag ingevuld</span>
                        : "Nog niet ingevuld"}
                    </p>
                  ) : p.soort === "lms" ? (() => {
                    if (p.lmsActief === false) {
                      return <p className="text-xs text-red-400/80">💀 Uitgeschakeld</p>;
                    }
                    const pick = p.lmsHuidigeRondePick;
                    if (pick) {
                      const team = getTeamByCode(pick.teamCode);
                      return (
                        <p className="text-xs text-zinc-400">
                          Ronde {p.lmsHuidigeRonde} · {team?.vlag ?? ""} {team?.naam ?? pick.teamCode}
                          {pick.uitkomst === "win" && <span className="text-green-400 ml-1">✓</span>}
                          {(pick.uitkomst === "verlies" || pick.uitkomst === "gelijk") && <span className="text-red-400 ml-1">✗</span>}
                        </p>
                      );
                    }
                    return <p className="text-xs text-zinc-600">Ronde {p.lmsHuidigeRonde ?? 1} · nog geen pick</p>;
                  })() : (
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

        {mijnPoules !== null && mijnPoules.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm">
            Je bent nog niet in een poule. Vraag een uitnodigingslink aan de organisator.
          </div>
        )}

      </main>

      <footer className="text-center text-xs text-zinc-700 py-6 border-t border-zinc-900">
        Stalenballen Cup · FIFA World Cup 2026 · USA · Canada · Mexico
      </footer>
    </div>
  );
}
