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

      <main className="max-w-4xl mx-auto px-4 py-6">
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
      </main>
    </div>
  );
}
