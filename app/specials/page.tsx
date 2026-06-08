"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";
import { LandSpelerPicker } from "@/components/LandSpelerPicker";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export default function SpecialsPagina() {
  const router = useRouter();
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({});
  const antwoordenRef = useRef<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const res = await fetch("/api/specials");
      if (res.ok) {
        const data: Record<string, string> = await res.json();
        setAntwoorden(data);
        antwoordenRef.current = data;
      }
      setGeladen(true);
    }
    load();
  }, [router]);

  const doSave = useCallback(async (latest: Record<string, string>) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  function scheduleSave(latest: Record<string, string>) {
    setSaveStatus("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(latest), 700);
  }

  function updateAntwoord(key: string, waarde: string) {
    const updated = { ...antwoordenRef.current, [key]: waarde };
    antwoordenRef.current = updated;
    setAntwoorden(updated);
    scheduleSave(updated);
  }

  const ingevuld = SPECIALS_CATEGORIEEN.filter((c) => antwoorden[c.key]?.trim()).length;

  if (!geladen) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors font-medium">
            ← Terug
          </Link>
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {ingevuld}
              <span className="text-zinc-500">/{SPECIALS_CATEGORIEEN.length}</span>
            </div>
            <div className="text-xs text-zinc-500">ingevuld</div>
          </div>
          <div className="text-xs text-right w-24">
            {saveStatus === "pending" && <span className="text-amber-400">● Niet opgeslagen</span>}
            {saveStatus === "saving" && <span className="text-zinc-400">Opslaan...</span>}
            {saveStatus === "saved" && <span className="text-green-400 font-medium">✓ Opgeslagen</span>}
            {saveStatus === "error" && <span className="text-red-400 font-medium">Fout</span>}
          </div>
        </div>
        <div className="h-0.5 bg-zinc-800">
          <div
            className="h-0.5 bg-purple-500 transition-all duration-500"
            style={{ width: `${(ingevuld / SPECIALS_CATEGORIEEN.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center pb-2">
          <h1 className="text-2xl font-black text-white mb-1">Specials</h1>
          <p className="text-sm text-zinc-500">Persoonlijke voorspellingen los van een poule · voor het hele WK 2026</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden divide-y divide-zinc-800">
          {SPECIALS_CATEGORIEEN.map((cat) => (
            <div key={cat.key} className="px-5 py-5">
              <div className="mb-3">
                <div className="text-sm font-bold text-white mb-0.5">{cat.label}</div>
                <div className="text-xs text-zinc-500">{cat.beschrijving}</div>
              </div>
              <LandSpelerPicker
                value={antwoorden[cat.key] ?? ""}
                onChange={(naam) => updateAntwoord(cat.key, naam)}
              />
            </div>
          ))}
        </div>

        <div className="pb-8 text-center text-xs text-zinc-700">
          Voorspellingen worden automatisch opgeslagen
        </div>
      </main>
    </div>
  );
}
