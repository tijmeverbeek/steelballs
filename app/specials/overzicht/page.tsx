import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";

const SLUITINGSTIJD = new Date("2026-06-11T19:00:00Z");

export default async function SpecialsOverzicht() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } });
  const gesloten = new Date() >= SLUITINGSTIJD;

  if (!gesloten && !dbUser?.isAdmin) redirect("/specials");

  const voorspellingen = await prisma.specialVoorspelling.findMany({
    include: { user: { select: { gebruikersnaam: true, naam: true } } },
    orderBy: { bijgewerktOp: "asc" },
  });

  // Bereken totalen per categorie
  const totalen: Record<string, Map<string, number>> = {};
  for (const cat of SPECIALS_CATEGORIEEN) {
    const teller = new Map<string, number>();
    for (const v of voorspellingen) {
      const antwoord = (v.antwoorden as Record<string, string>)[cat.key]?.trim();
      if (antwoord) teller.set(antwoord, (teller.get(antwoord) ?? 0) + 1);
    }
    totalen[cat.key] = teller;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/specials" className="text-zinc-400 hover:text-white text-sm transition-colors font-medium">
            ← Terug
          </Link>
          <span className="text-sm font-bold text-white">Overzicht specials</span>
          <span className="text-xs text-zinc-500">{voorspellingen.length} deelnemers</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* Totalen */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Populairste keuzes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECIALS_CATEGORIEEN.map((cat) => {
              const teller = totalen[cat.key];
              const gesorteerd = [...teller.entries()].sort((a, b) => b[1] - a[1]);
              const totaalIngevuld = gesorteerd.reduce((s, [, n]) => s + n, 0);

              let gemiddelde: string | null = null;
              if (cat.type === "nummer" && totaalIngevuld > 0) {
                const som = gesorteerd.reduce((s, [v, n]) => s + parseFloat(v) * n, 0);
                gemiddelde = (som / totaalIngevuld).toFixed(1);
              }

              return (
                <div key={cat.key} className="bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-0.5">
                    {cat.prijsNaam ?? cat.label}
                  </div>
                  <div className="text-sm font-bold text-white mb-3">{cat.label}</div>
                  {totaalIngevuld === 0 ? (
                    <p className="text-xs text-zinc-600">Nog geen antwoorden</p>
                  ) : cat.type === "nummer" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-white">{gemiddelde}</span>
                        <span className="text-xs text-zinc-500">gemiddelde</span>
                      </div>
                      <div className="space-y-1">
                        {gesorteerd.slice(0, 5).map(([waarde, aantal]) => (
                          <div key={waarde} className="flex items-center gap-2">
                            <div
                              className="h-1.5 bg-purple-500 rounded-full"
                              style={{ width: `${(aantal / voorspellingen.length) * 100}%`, minWidth: 4 }}
                            />
                            <span className="text-xs text-zinc-300 tabular-nums">{waarde}</span>
                            <span className="text-xs text-zinc-600 tabular-nums">×{aantal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {gesorteerd.slice(0, 5).map(([waarde, aantal], i) => (
                        <div key={waarde} className="flex items-center gap-2">
                          <span className="text-xs text-zinc-600 w-4 tabular-nums">{i + 1}.</span>
                          <div
                            className="h-1.5 bg-purple-500 rounded-full flex-shrink-0"
                            style={{ width: `${(aantal / voorspellingen.length) * 100 * 0.6}%`, minWidth: 4 }}
                          />
                          <span className="text-xs text-zinc-300 truncate flex-1">{waarde}</span>
                          <span className="text-xs text-zinc-600 tabular-nums flex-shrink-0">×{aantal}</span>
                        </div>
                      ))}
                      {gesorteerd.length > 5 && (
                        <p className="text-xs text-zinc-600 pl-5">+{gesorteerd.length - 5} andere</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailtabel */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Per deelnemer</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-3 text-zinc-400 font-medium sticky left-0 bg-zinc-950 min-w-32">Deelnemer</th>
                  {SPECIALS_CATEGORIEEN.map((cat) => (
                    <th key={cat.key} className="text-left py-3 px-3 text-zinc-400 font-medium min-w-36 whitespace-nowrap">
                      {cat.prijsNaam ?? cat.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {voorspellingen.map((v) => {
                  const antwoorden = v.antwoorden as Record<string, string>;
                  const naam = v.user.gebruikersnaam ?? v.user.naam ?? "Onbekend";
                  return (
                    <tr key={v.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-white sticky left-0 bg-zinc-950">{naam}</td>
                      {SPECIALS_CATEGORIEEN.map((cat) => (
                        <td key={cat.key} className="py-3 px-3 text-zinc-300">
                          {antwoorden[cat.key] || <span className="text-zinc-700">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {voorspellingen.length === 0 && (
                  <tr>
                    <td colSpan={SPECIALS_CATEGORIEEN.length + 1} className="py-12 text-center text-zinc-600">
                      Nog geen voorspellingen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
