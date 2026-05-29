"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule, joinPoule } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function JoinPagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poulenaam, setPoulenaam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const p = await getPoule(code);
      if (!p) { setNotFound(true); return; }
      if (user && p.deelnemers.some((d) => d.userId === user.id)) {
        router.replace(`/poule/${code}`);
        return;
      }
      setPoulenaam(p.naam);
    }
    load();
  }, [code, router]);

  async function handleJoin() {
    setLoading(true);
    try {
      const result = await joinPoule(code);
      if (!result) { setNotFound(true); return; }
      router.push(`/poule/${code}`);
    } catch {
      setLoading(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🤔</div>
          <h1 className="text-xl font-bold text-white mb-2">Poule niet gevonden</h1>
          <p className="text-zinc-500 mb-6">Controleer of de link correct is.</p>
          <Link href="/" className="text-green-400 hover:text-green-300 text-sm font-medium">
            ← Naar home
          </Link>
        </div>
      </div>
    );
  }

  if (!poulenaam) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-white tracking-tight">
            STALENBALLEN
          </Link>
          <p className="text-zinc-500 text-sm mt-1">WK Poule 2026</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-7 pt-7 pb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-1">
              Je bent uitgenodigd
            </p>
            <h1 className="text-2xl font-bold text-white">{poulenaam}</h1>
            <p className="text-zinc-400 text-sm mt-1 mb-6">
              Doe mee en voorspel alle WK wedstrijden.
            </p>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Deelnemen..." : "Doe mee aan de poule →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
