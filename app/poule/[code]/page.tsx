"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule } from "@/lib/api";
import { getSessie, berekenPunten } from "@/lib/storage";
import { wedstrijden } from "@/lib/matches";
import { Poule, Deelnemer } from "@/lib/types";

export default function PoulePagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [sessie, setSessie] = useState<{ code: string; deelnemerId: string } | null>(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => {
    const s = getSessie();
    setSessie(s);
    getPoule(code).then((p) => {
      if (!p) { router.push("/"); return; }
      setPoule(p);
    });
  }, [code, router]);

  function kopieerCode() {
    navigator.clipboard.writeText(code);
    setGekopieerd(true);
    setTimeout(() => setGekopieerd(false), 2000);
  }

  if (!poule) return null;

  const huidigDeelnemer = poule.deelnemers.find((d) => d.id === sessie?.deelnemerId);
  const aantalWedstrijden = wedstrijden.length;

  const stand = poule.deelnemers
    .map((d) => ({
      ...d,
      punten: berekenPunten(d.voorspellingen, poule.resultaten),
      ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
    }))
    .sort((a, b) => b.punten - a.punten || b.ingevuld - a.ingevuld);

  const eersteVijfWedstrijden = wedstrijden.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/" className="text-green-300 text-sm hover:text-white transition-colors mb-2 block">
                ← Terug naar home
              </Link>
              <h1 className="text-2xl font-bold">{poule.naam}</h1>
              <p className="text-green-300 text-sm mt-1">
                {poule.deelnemers.length} deelnemer{poule.deelnemers.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-300 text-xs mb-1">Poule code</p>
              <button
                onClick={kopieerCode}
                className="font-mono text-2xl font-bold tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                {code}
              </button>
              <p className="text-green-400 text-xs mt-1">
                {gekopieerd ? "✓ Gekopieerd!" : "Klik om te kopiëren"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Jouw voorspellingen CTA */}
        {huidigDeelnemer && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Jouw voorspellingen</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {huidigDeelnemer.voorspellingen.filter((v) => v.thuis !== null).length} van {aantalWedstrijden} wedstrijden ingevuld
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full w-48">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${(huidigDeelnemer.voorspellingen.filter((v) => v.thuis !== null).length / aantalWedstrijden) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Link
              href={`/poule/${code}/voorspellingen`}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
            >
              Vul voorspellingen in →
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Stand */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Stand</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {stand.map((d, i) => (
                <div
                  key={d.id}
                  className={`px-6 py-3.5 flex items-center gap-4 ${d.id === sessie?.deelnemerId ? "bg-green-50" : ""}`}
                >
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-500" : "text-gray-400"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {d.naam}
                      {d.id === sessie?.deelnemerId && (
                        <span className="ml-2 text-xs text-green-600 font-normal">(jij)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{d.ingevuld} voorspellingen</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{d.punten}</span>
                  <span className="text-xs text-gray-400">pt</span>
                </div>
              ))}
              {stand.length === 0 && (
                <p className="px-6 py-4 text-sm text-gray-400">Nog geen deelnemers.</p>
              )}
            </div>
          </div>

          {/* Eerstvolgende wedstrijden */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Eerste wedstrijden</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {eersteVijfWedstrijden.map((w) => (
                <div key={w.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{w.groep}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(w.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {w.tijd}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-base">{w.thuis.vlag}</span>
                    <span className="text-sm font-medium text-gray-900">{w.thuis.naam}</span>
                    <span className="text-xs text-gray-400 mx-1">vs</span>
                    <span className="text-sm font-medium text-gray-900">{w.uit.naam}</span>
                    <span className="text-base">{w.uit.vlag}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-100">
              <Link
                href={`/poule/${code}/voorspellingen`}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Alle {aantalWedstrijden} wedstrijden voorspellen →
              </Link>
            </div>
          </div>
        </div>

        {/* Deelnemers */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Deelnemers</h2>
            <button
              onClick={kopieerCode}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {gekopieerd ? "✓ Code gekopieerd!" : "Uitnodigen via code"}
            </button>
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-2">
            {poule.deelnemers.map((d: Deelnemer) => (
              <span
                key={d.id}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  d.id === sessie?.deelnemerId
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {d.naam}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
