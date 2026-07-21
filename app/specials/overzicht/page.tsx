import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/supabase/server";
import { SPECIALS_CATEGORIEEN } from "@/lib/specials";

const SLUITINGSTIJD = new Date("2026-06-11T19:00:00Z");

const GECOMBINEERDE_PAREN: { spelerKey: string; aantalKey: string; label: string; prijsNaam?: string; eenheid: string }[] = [
  { spelerKey: "topscorer", aantalKey: "topscorer_doelpunten", label: "Topscorer", eenheid: "doelpunten" },
  { spelerKey: "meeste_gele_kaarten", aantalKey: "gele_kaarten_aantal", label: "Meeste gele kaarten", prijsNaam: "Tommy Beugelsdijk prijs", eenheid: "gele kaarten" },
];
const GECOMBINEERDE_KEYS = new Set(GECOMBINEERDE_PAREN.flatMap((p) => [p.spelerKey, p.aantalKey]));

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

  // Officiële uitslagen ophalen
  const resultaatRows = await prisma.tournamentStat.findMany({
    where: { type: { in: SPECIALS_CATEGORIEEN.map((c) => `special_${c.key}`) } },
  });
  const uitslagPerCat: Record<string, string> = {};
  for (const row of resultaatRows) {
    uitslagPerCat[row.type.replace("special_", "")] = row.waarde;
  }

  // Spelerslijst ophalen zodat we van elke gekozen speler het team kennen
  const alleSpelers = await prisma.speler.findMany({ where: { soort: "wk" }, select: { naam: true, team: true } });
  const teamPerSpelerNaam = new Map(alleSpelers.map((s) => [s.naam.toLowerCase(), s.team]));

  // Winnaars per categorie bepalen: exacte match voor speler/tekst, dichtstbij voor nummer
  interface Winnaar { id: string; naam: string; antwoord: string }
  const winnaarsPerCat: Record<string, Winnaar[]> = {};
  for (const cat of SPECIALS_CATEGORIEEN) {
    if (GECOMBINEERDE_KEYS.has(cat.key)) {
      winnaarsPerCat[cat.key] = [];
      continue;
    }

    const uitslag = uitslagPerCat[cat.key]?.trim();
    if (!uitslag) {
      winnaarsPerCat[cat.key] = [];
      continue;
    }

    if (cat.type === "nummer") {
      const uitslagNum = parseFloat(uitslag);
      let minAfstand = Infinity;
      const kandidaten: { v: (typeof voorspellingen)[number]; afstand: number; antwoord: string }[] = [];
      for (const v of voorspellingen) {
        const antwoord = (v.antwoorden as Record<string, string>)[cat.key]?.trim();
        if (!antwoord) continue;
        const num = parseFloat(antwoord);
        if (Number.isNaN(num)) continue;
        const afstand = Math.abs(num - uitslagNum);
        kandidaten.push({ v, afstand, antwoord });
        if (afstand < minAfstand) minAfstand = afstand;
      }
      winnaarsPerCat[cat.key] = kandidaten
        .filter((k) => k.afstand === minAfstand)
        .map((k) => ({ id: k.v.id, naam: k.v.user.gebruikersnaam ?? k.v.user.naam ?? "Onbekend", antwoord: k.antwoord }));
    } else {
      winnaarsPerCat[cat.key] = voorspellingen
        .filter((v) => {
          const antwoord = (v.antwoorden as Record<string, string>)[cat.key]?.trim();
          return antwoord && antwoord.toLowerCase() === uitslag.toLowerCase();
        })
        .map((v) => ({
          id: v.id,
          naam: v.user.gebruikersnaam ?? v.user.naam ?? "Onbekend",
          antwoord: (v.antwoorden as Record<string, string>)[cat.key],
        }));
    }
  }
  // Gecombineerde paren: speler moet exact goed zijn, anders val terug op juiste team; daarbinnen dichtstbij op aantal
  interface GecombineerdWinnaar { id: string; naam: string; antwoordSpeler: string; antwoordAantal: string }
  interface GecombineerdResultaat {
    uitslagSpeler: string | null;
    uitslagAantal: string | null;
    winnaars: GecombineerdWinnaar[];
    viaTeam: boolean;
  }
  const gecombineerdPerPaar: Record<string, GecombineerdResultaat> = {};

  for (const paar of GECOMBINEERDE_PAREN) {
    const uitslagSpeler = uitslagPerCat[paar.spelerKey]?.trim() || null;
    const uitslagAantalRaw = uitslagPerCat[paar.aantalKey]?.trim() || null;
    const uitslagAantal = uitslagAantalRaw ? parseFloat(uitslagAantalRaw) : NaN;

    if (!uitslagSpeler || Number.isNaN(uitslagAantal)) {
      gecombineerdPerPaar[paar.spelerKey] = { uitslagSpeler, uitslagAantal: uitslagAantalRaw, winnaars: [], viaTeam: false };
      continue;
    }

    const uitslagTeam = teamPerSpelerNaam.get(uitslagSpeler.toLowerCase()) ?? null;

    let kandidaten = voorspellingen.filter((v) => {
      const antwoordSpeler = (v.antwoorden as Record<string, string>)[paar.spelerKey]?.trim();
      return antwoordSpeler && antwoordSpeler.toLowerCase() === uitslagSpeler.toLowerCase();
    });
    let viaTeam = false;

    if (kandidaten.length === 0 && uitslagTeam) {
      kandidaten = voorspellingen.filter((v) => {
        const antwoordSpeler = (v.antwoorden as Record<string, string>)[paar.spelerKey]?.trim();
        if (!antwoordSpeler) return false;
        return teamPerSpelerNaam.get(antwoordSpeler.toLowerCase()) === uitslagTeam;
      });
      viaTeam = kandidaten.length > 0;
    }

    let minAfstand = Infinity;
    const metAfstand: { v: (typeof voorspellingen)[number]; afstand: number; antwoordAantal: string }[] = [];
    for (const v of kandidaten) {
      const antwoordAantalRaw = (v.antwoorden as Record<string, string>)[paar.aantalKey]?.trim();
      if (!antwoordAantalRaw) continue;
      const num = parseFloat(antwoordAantalRaw);
      if (Number.isNaN(num)) continue;
      const afstand = Math.abs(num - uitslagAantal);
      metAfstand.push({ v, afstand, antwoordAantal: antwoordAantalRaw });
      if (afstand < minAfstand) minAfstand = afstand;
    }

    const winnaars = metAfstand
      .filter((k) => k.afstand === minAfstand)
      .map((k) => ({
        id: k.v.id,
        naam: k.v.user.gebruikersnaam ?? k.v.user.naam ?? "Onbekend",
        antwoordSpeler: (k.v.antwoorden as Record<string, string>)[paar.spelerKey],
        antwoordAantal: k.antwoordAantal,
      }));

    gecombineerdPerPaar[paar.spelerKey] = { uitslagSpeler, uitslagAantal: uitslagAantalRaw, winnaars, viaTeam: winnaars.length > 0 && viaTeam };
  }

  const winnaarIdsPerCat: Record<string, Set<string>> = {};
  for (const cat of SPECIALS_CATEGORIEEN) {
    if (GECOMBINEERDE_KEYS.has(cat.key)) continue;
    winnaarIdsPerCat[cat.key] = new Set(winnaarsPerCat[cat.key].map((w) => w.id));
  }
  for (const paar of GECOMBINEERDE_PAREN) {
    const ids = new Set(gecombineerdPerPaar[paar.spelerKey].winnaars.map((w) => w.id));
    winnaarIdsPerCat[paar.spelerKey] = ids;
    winnaarIdsPerCat[paar.aantalKey] = ids;
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

        {/* Uitslagen & winnaars */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Uitslagen & winnaars</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECIALS_CATEGORIEEN.map((cat) => {
              const paar = GECOMBINEERDE_PAREN.find((p) => p.spelerKey === cat.key);
              if (paar) {
                const info = gecombineerdPerPaar[paar.spelerKey];
                return (
                  <div key={paar.spelerKey} className="bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-0.5">
                      {paar.prijsNaam ?? paar.label}
                    </div>
                    <div className="text-sm font-bold text-white mb-2">{paar.label}</div>
                    {!info.uitslagSpeler || !info.uitslagAantal ? (
                      <p className="text-xs text-zinc-600">Nog geen uitslag bekend</p>
                    ) : (
                      <>
                        <div className="text-sm text-white mb-2">
                          Uitslag: <span className="font-semibold text-green-400">{info.uitslagSpeler}</span>
                          <span className="text-zinc-500"> · {info.uitslagAantal} {paar.eenheid}</span>
                        </div>
                        {info.winnaars.length === 0 ? (
                          <p className="text-xs text-zinc-600">Niemand had dit goed</p>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-1.5">
                              {info.winnaars.map((w) => (
                                <span key={w.id} className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-2.5 py-1">
                                  {w.naam}
                                </span>
                              ))}
                            </div>
                            {info.viaTeam && (
                              <p className="text-xs text-zinc-500 mt-1.5">
                                Niemand had de juiste speler — winnaar(s) op basis van juiste team + aantal.
                              </p>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              }
              if (GECOMBINEERDE_KEYS.has(cat.key)) return null;

              const uitslag = uitslagPerCat[cat.key];
              const winnaars = winnaarsPerCat[cat.key];
              return (
                <div key={cat.key} className="bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-0.5">
                    {cat.prijsNaam ?? cat.label}
                  </div>
                  <div className="text-sm font-bold text-white mb-2">{cat.label}</div>
                  {!uitslag ? (
                    <p className="text-xs text-zinc-600">Nog geen uitslag bekend</p>
                  ) : (
                    <>
                      <div className="text-sm text-white mb-2">
                        Uitslag: <span className="font-semibold text-green-400">{uitslag}</span>
                      </div>
                      {winnaars.length === 0 ? (
                        <p className="text-xs text-zinc-600">Niemand had dit goed</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {winnaars.map((w) => (
                            <span key={w.id} className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-2.5 py-1">
                              {w.naam}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
                      {SPECIALS_CATEGORIEEN.map((cat) => {
                        const isWinnaar = winnaarIdsPerCat[cat.key].has(v.id);
                        return (
                          <td key={cat.key} className={`py-3 px-3 ${isWinnaar ? "text-green-400 font-semibold" : "text-zinc-300"}`}>
                            {antwoorden[cat.key] || <span className="text-zinc-700">—</span>}
                          </td>
                        );
                      })}
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
