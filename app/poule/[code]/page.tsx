"use client";

import { Component, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPoule } from "@/lib/api";
import { berekenPunten, berekenMinuutAfstand, heeftCorrectEersteDoelpuntenmaker, TOPSCORER_PUNTEN, GELE_KAARTEN_PUNTEN, TOERNOOIWINNAAR_PUNTEN, EERSTE_DOELPUNTENMAKER_PUNTEN, CL_SCORE_PUNTEN, CL_DOELPUNTENMAKER_PUNTEN, ENKELVOUDIG_CORNERS_PUNTEN, ENKELVOUDIG_SCHOTEN_PUNTEN, ENKELVOUDIG_EERSTE_KAART_PUNTEN, ENKELVOUDIG_EERSTE_KAART_MINUUT_PUNTEN } from "@/lib/storage";
import { getWedstrijdenVoorSoort, CL_FINALE, OEF_NED_ALG } from "@/lib/matches";
import { createClient } from "@/lib/supabase/client";
import { Poule, Deelnemer, LmsPick } from "@/lib/types";
import { getWedstrijdenVoorRonde, LMS_RONDES, isRondeGesloten } from "@/lib/lms";
import { TeamLogo } from "@/components/TeamLogo";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
          <p className="text-red-400 text-sm break-all">Render fout: {this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const MEDAILLES = ["🥇", "🥈", "🥉"];

function Initialen({ naam }: { naam: string }) {
  const parts = naam.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : naam.slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase flex-shrink-0">
      {letters}
    </div>
  );
}

function deelnemerNaam(d: { user: { gebruikersnaam: string | null; email: string } }) {
  return d.user.gebruikersnaam ?? d.user.email.split("@")[0];
}

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${aan ? "bg-green-500" : "bg-zinc-700"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aan ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

type StandItem = {
  id: string;
  userId: string;
  gebruikersnaam: string | null;
  displayNaam: string;
  isAdmin: boolean;
  punten: number;
  ingevuld: number;
  correctDoelpuntenmaker: boolean;
  minuutAfstand: number;
  eersteDoelpuntenmakerVoorspelling?: string | null;
  eersteDoelpuntenminuutVoorspelling?: number | null;
  cornersVoorspelling?: number | null;
  schotenOpDoelVoorspelling?: number | null;
  eersteKaartSpelerVoorspelling?: string | null;
  eersteKaartMinuutVoorspelling?: number | null;
  topscorerVoorspelling?: string | null;
  geleKaartenVoorspelling?: string | null;
  toernooiwinaarVoorspelling?: string | null;
  voorspellingen: Deelnemer["voorspellingen"];
};

function EindstandModal({
  poule,
  stand,
  mijnUserId,
  onSluit,
  enkelvoudigThuisNaam,
  enkelvoudigUitNaam,
}: {
  poule: Poule;
  stand: StandItem[];
  mijnUserId: string | null;
  onSluit: () => void;
  enkelvoudigThuisNaam?: string | null;
  enkelvoudigUitNaam?: string | null;
}) {
  const isWinnaar = mijnUserId !== null && poule.winnaarId === mijnUserId;
  const winnaar = stand[0];
  const isEnkelvoudig = poule.soort === "enkelvoudig";
  const isClFinale = poule.soort === "cl_finale";
  const matchId = isEnkelvoudig
    ? (poule.wkWedstrijdId ?? null)
    : isClFinale
    ? "CL1"
    : null;
  const matchResultaat = matchId ? poule.resultaten[matchId] : null;

  function keuzeRegel(deelnemer: StandItem) {
    const vp = matchId ? deelnemer.voorspellingen.find((v) => v.wedstrijdId === matchId) : null;
    const punten = deelnemer.punten;
    const uitslagTelt = !isEnkelvoudig || poule.uitslagActief !== false;
    return (
      <div className="space-y-1.5">
        {matchResultaat && vp?.thuis != null && vp?.uit != null && uitslagTelt && (
          <div className="flex items-center gap-2 text-sm">
            <span className={vp.thuis === matchResultaat.thuis && vp.uit === matchResultaat.uit ? "text-green-400" : "text-zinc-400"}>
              {vp.thuis === matchResultaat.thuis && vp.uit === matchResultaat.uit ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              {isEnkelvoudig
                ? `${enkelvoudigThuisNaam ?? "Thuis"} ${vp.thuis}–${vp.uit} ${enkelvoudigUitNaam ?? "Uit"}`
                : `PSG ${vp.thuis}–${vp.uit} Arsenal`}
              {matchResultaat && (
                <span className="text-zinc-600 ml-1">(werkelijk: {matchResultaat.thuis}–{matchResultaat.uit})</span>
              )}
            </span>
          </div>
        )}
        {isEnkelvoudig && poule.cornersActief && deelnemer.cornersVoorspelling != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.cornersVoorspelling === poule.cornersResultaat ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.cornersVoorspelling === poule.cornersResultaat ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              {deelnemer.cornersVoorspelling} corners
              {poule.cornersResultaat != null && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.cornersResultaat})</span>
              )}
            </span>
          </div>
        )}
        {isEnkelvoudig && poule.schotenOpDoelActief && deelnemer.schotenOpDoelVoorspelling != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.schotenOpDoelVoorspelling === poule.schotenOpDoelResultaat ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.schotenOpDoelVoorspelling === poule.schotenOpDoelResultaat ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              {deelnemer.schotenOpDoelVoorspelling} schoten op doel
              {poule.schotenOpDoelResultaat != null && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.schotenOpDoelResultaat})</span>
              )}
            </span>
          </div>
        )}
        {isEnkelvoudig && poule.eersteKaartActief && deelnemer.eersteKaartSpelerVoorspelling && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.eersteKaartSpelerVoorspelling === poule.eersteKaartSpelerResultaat ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.eersteKaartSpelerVoorspelling === poule.eersteKaartSpelerResultaat ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              🟨 {deelnemer.eersteKaartSpelerVoorspelling}
              {poule.eersteKaartSpelerResultaat && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteKaartSpelerResultaat})</span>
              )}
            </span>
          </div>
        )}
        {isEnkelvoudig && poule.eersteKaartMinuutActief && deelnemer.eersteKaartMinuutVoorspelling != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.eersteKaartMinuutVoorspelling === poule.eersteKaartMinuutResultaat ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.eersteKaartMinuutVoorspelling === poule.eersteKaartMinuutResultaat ? "✓" : "○"}
            </span>
            <span className="text-zinc-300">
              🟨 minuut {deelnemer.eersteKaartMinuutVoorspelling}
              {poule.eersteKaartMinuutResultaat != null && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteKaartMinuutResultaat})</span>
              )}
            </span>
          </div>
        )}
        {poule.eersteDoelpuntenmakerActief && deelnemer.eersteDoelpuntenmakerVoorspelling && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.correctDoelpuntenmaker ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.correctDoelpuntenmaker ? "✓" : "✗"}
            </span>
            <span className="text-zinc-300">
              {deelnemer.eersteDoelpuntenmakerVoorspelling}
              {poule.eersteDoelpuntenmakerResultaat && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteDoelpuntenmakerResultaat})</span>
              )}
            </span>
          </div>
        )}
        {poule.eersteDoelpuntenminuutActief && deelnemer.eersteDoelpuntenminuutVoorspelling != null && (
          <div className="flex items-center gap-2 text-sm">
            <span className={deelnemer.minuutAfstand === 0 ? "text-green-400" : "text-zinc-400"}>
              {deelnemer.minuutAfstand === 0 ? "✓" : "⏱"}
            </span>
            <span className="text-zinc-300">
              minuut {deelnemer.eersteDoelpuntenminuutVoorspelling}
              {poule.eersteDoelpuntenminuutResultaat != null && (
                <span className="text-zinc-600 ml-1">(werkelijk: {poule.eersteDoelpuntenminuutResultaat})</span>
              )}
            </span>
          </div>
        )}
        <div className="text-xs text-zinc-500 pt-0.5">{punten} punten totaal</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onSluit} />

      <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        {isWinnaar ? (
          <div
            className="px-6 pt-8 pb-6 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #78350f 0%, #92400e 40%, #78350f 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(253,224,71,0.6) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <div className="text-6xl mb-3 animate-bounce">🏆</div>
              <h2 className="text-3xl font-black text-yellow-300 tracking-tight">Gewonnen!</h2>
              <p className="text-yellow-100/80 text-sm mt-1">Jij hebt de staalste ballen</p>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-7 pb-5 text-center bg-zinc-800">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-black text-white">Toernooi afgerond</h2>
            {winnaar && (
              <p className="text-zinc-400 text-sm mt-1">
                <Link
                  href={`/speler/${encodeURIComponent(winnaar.userId)}`}
                  className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
                  onClick={onSluit}
                >
                  {winnaar.displayNaam}
                </Link>{" "}heeft gewonnen
              </p>
            )}
          </div>
        )}

        {/* Scroll content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Winnaar's keuzes */}
          {winnaar && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {isWinnaar ? "Jouw winnende keuzes" : `Keuzes van ${winnaar.displayNaam}`}
              </p>
              <div className="bg-zinc-800/60 rounded-xl p-4">
                {keuzeRegel(winnaar)}
              </div>
            </div>
          )}

          {/* Eindstand */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Eindstand</p>
            <div className="bg-zinc-800/60 rounded-xl overflow-hidden divide-y divide-zinc-700/50">
              {stand.map((d, i) => (
                <div
                  key={d.id}
                  className={`px-4 py-3 flex items-center gap-3 ${d.userId === mijnUserId ? "bg-zinc-700/40" : ""}`}
                >
                  <span className="text-base w-6 text-center flex-shrink-0">
                    {i === 0 ? "🏆" : i < 3 ? ["🥈", "🥉"][i - 1] : <span className="text-xs text-zinc-600 font-bold">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      <Link
                        href={`/speler/${encodeURIComponent(d.userId)}`}
                        className="hover:text-zinc-300 transition-colors"
                        onClick={onSluit}
                      >
                        {d.displayNaam}
                      </Link>
                      {d.userId === mijnUserId && <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>}
                    </p>
                    {poule.eersteDoelpuntenminuutActief && d.eersteDoelpuntenminuutVoorspelling != null && poule.eersteDoelpuntenminuutResultaat != null && (
                      <p className="text-xs text-zinc-600">
                        minuut {d.eersteDoelpuntenminuutVoorspelling}
                        {d.minuutAfstand < Infinity && ` (±${d.minuutAfstand})`}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-white">{d.punten}</span>
                    <span className="text-xs text-zinc-600 ml-1">pt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-zinc-800">
          <button
            onClick={onSluit}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

function LmsStand({
  deelnemers,
  mijnUserId,
}: {
  deelnemers: Deelnemer[];
  mijnUserId: string | null;
}) {
  const actief = deelnemers.filter((d) => d.lmsActief !== false);
  const uitgeschakeld = deelnemers
    .filter((d) => d.lmsActief === false)
    .sort((a, b) => (b.lmsUitgeschakeldRonde ?? 0) - (a.lmsUitgeschakeldRonde ?? 0));

  function PickBadges({ picks }: { picks: LmsPick[] }) {
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {picks
          .filter((p) => isRondeGesloten(p.rondeNr))
          .sort((a, b) => a.rondeNr - b.rondeNr)
          .map((p) => {
            const wedstrijden = getWedstrijdenVoorRonde(p.rondeNr);
            const w = wedstrijden.find((x) => x.id === p.wedstrijdId);
            const team = w ? (w.thuis.code === p.teamCode ? w.thuis : w.uit) : null;
            return (
              <span
                key={p.rondeNr}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${
                  p.uitkomst === "win"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : p.uitkomst === "verlies" || p.uitkomst === "gelijk"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500"
                }`}
              >
                {team?.vlag && <span>{team.vlag}</span>}
                <span>{team?.naam ?? p.teamCode}</span>
                {p.uitkomst === "win" && <span>✓</span>}
                {(p.uitkomst === "verlies" || p.uitkomst === "gelijk") && <span>✗</span>}
              </span>
            );
          })}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="font-bold text-white">Stand</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {actief.length} speler{actief.length !== 1 ? "s" : ""} nog actief · {uitgeschakeld.length} uitgeschakeld
        </p>
      </div>

      {actief.length > 0 && (
        <div className="divide-y divide-zinc-800">
          {actief.map((d) => {
            const naam = d.user.gebruikersnaam ?? d.user.email.split("@")[0];
            const picks = d.lmsPicks ?? [];
            const winStreak = picks.filter((p) => p.uitkomst === "win").length;
            return (
              <div
                key={d.id}
                className={`px-5 py-3 ${d.userId === mijnUserId ? "bg-zinc-800/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-7 text-center flex-shrink-0">🟢</span>
                  <Initialen naam={naam} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {naam}
                      {d.userId === mijnUserId && <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>}
                      {d.user.isAdmin && <span className="ml-1.5 text-xs text-zinc-500 font-normal">beheerder</span>}
                    </p>
                    {picks.length > 0 && <PickBadges picks={picks} />}
                  </div>
                  {winStreak > 0 && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-green-400">{winStreak}</span>
                      <span className="text-xs text-zinc-600 ml-1">wins</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uitgeschakeld.length > 0 && (
        <>
          <div className="px-5 py-2 bg-zinc-900/50 border-t border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Uitgeschakeld</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {uitgeschakeld.map((d) => {
              const naam = d.user.gebruikersnaam ?? d.user.email.split("@")[0];
              const picks = d.lmsPicks ?? [];
              const ronde = LMS_RONDES.find((r) => r.nr === d.lmsUitgeschakeldRonde);
              return (
                <div key={d.id} className="px-5 py-3 opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="text-base w-7 text-center flex-shrink-0">💀</span>
                    <Initialen naam={naam} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-400 text-sm truncate">
                        {naam}
                        {d.userId === mijnUserId && <span className="ml-1.5 text-xs text-zinc-500 font-normal">jij</span>}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Uitgeschakeld {ronde ? `in ${ronde.naam}` : `ronde ${d.lmsUitgeschakeldRonde}`}
                      </p>
                      {picks.length > 0 && <PickBadges picks={picks} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {deelnemers.length === 0 && (
        <p className="px-5 py-4 text-sm text-zinc-600">Nog geen deelnemers.</p>
      )}
    </div>
  );
}

function PoulePagina() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [enkelvoudigWedstrijdDb, setEnkelvoudigWedstrijdDb] = useState<{ datum: string; tijd: string; thuisNaam?: string; uitNaam?: string } | null>(null);
  const [mijnUserId, setMijnUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [gedeeld, setGedeeld] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [toonEindstand, setToonEindstand] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMijnUserId(user.id);
        fetch("/api/user").then((r) => r.json()).then((u) => {
          if (u?.isAdmin) setIsAdmin(true);
        }).catch(() => {});
      }
    });
    getPoule(code).then(async (p) => {
      if (!p) { router.push("/"); return; }
      setPoule(p);
      // Als enkelvoudig en de wedstrijd niet in de hardcoded lijst staat, haal hem op uit de DB
      if (p.soort === "enkelvoudig" && p.wkWedstrijdId) {
        const inHardcoded = getWedstrijdenVoorSoort("wk").some((w) => w.id === p.wkWedstrijdId);
        if (!inHardcoded) {
          fetch("/api/lms/wedstrijden").then((r) => r.json()).then((data) => {
            const kw = (data.wedstrijden ?? []).find((w: { id: string }) => w.id === p.wkWedstrijdId);
            if (kw) setEnkelvoudigWedstrijdDb({ datum: kw.datum ?? "", tijd: kw.tijd ?? "", thuisNaam: kw.thuisNaam, uitNaam: kw.uitNaam });
          }).catch(() => {});
        }
      }
      if (p.afgerond) {
        const gezienKey = `eindstand-gezien-${p.code}`;
        if (!localStorage.getItem(gezienKey)) {
          setToonEindstand(true);
        }
      }
    }).catch((err) => {
      setFout(String(err));
    });
  }, [code, router]);

  async function deelUitnodiging() {
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${poule?.naam} — Stalenballen`,
          text: poule?.soort === "cl_finale"
            ? `Doe mee aan de CL Finale poule "${poule?.naam}"! Voorspel de uitslag en bewijs wie de staalste ballen heeft.`
            : `Doe mee aan de WK poule "${poule?.naam}"! Voorspel alle wedstrijden en bewijs wie de staalste ballen heeft.`,
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setGedeeld(true);
      setTimeout(() => setGedeeld(false), 2500);
    }
  }

  function sluitEindstand() {
    localStorage.setItem(`eindstand-gezien-${code}`, "1");
    setToonEindstand(false);
  }

  if (fout) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">Fout bij laden</p>
          <p className="text-zinc-500 text-sm break-all">{fout}</p>
        </div>
      </div>
    );
  }

  if (!poule) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isOrganisator = mijnUserId !== null && (poule.organisatorId === mijnUserId || isAdmin);
  const huidigDeelnemer = poule.deelnemers.find((d) => d.userId === mijnUserId);
  const organisatorDeelnemer = poule.deelnemers.find((d) => d.userId === poule.organisatorId);
  const organisatorIsBeheerder = organisatorDeelnemer?.user.isAdmin === true;
  const organisatorNaam = organisatorDeelnemer ? deelnemerNaam(organisatorDeelnemer) : null;
  const isEnkelvoudig = poule.soort === "enkelvoudig";
  const enkelvoudigWedstrijd = isEnkelvoudig && poule.wkWedstrijdId
    ? getWedstrijdenVoorSoort("wk").find((w) => w.id === poule.wkWedstrijdId) ?? null
    : null;
  // Gebruik DB-wedstrijd als fallback voor knockout matches
  const enkelvoudigWedstrijdInfo = enkelvoudigWedstrijd ?? enkelvoudigWedstrijdDb;
  const enkelvoudigThuisNaam = enkelvoudigWedstrijd?.thuis.naam ?? enkelvoudigWedstrijdDb?.thuisNaam ?? null;
  const enkelvoudigUitNaam = enkelvoudigWedstrijd?.uit.naam ?? enkelvoudigWedstrijdDb?.uitNaam ?? null;
  const pouleWedstrijden = isEnkelvoudig
    ? (enkelvoudigWedstrijd ? [enkelvoudigWedstrijd] : [])
    : getWedstrijdenVoorSoort(poule.soort ?? "wk");
  const aantalWedstrijden = isEnkelvoudig ? 1 : pouleWedstrijden.length;
  const jouwIngevuld = huidigDeelnemer?.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length ?? 0;

  function isGestart(w: { datum: string; tijd: string }): boolean {
    if (!w.datum || !w.tijd) return false;
    return new Date() >= new Date(`${w.datum}T${w.tijd}:00+02:00`);
  }
  const oefGestart = poule.soort === "oefenwedstrijd" && isGestart(OEF_NED_ALG);
  const enkelvoudigGestart = isEnkelvoudig && enkelvoudigWedstrijdInfo ? isGestart(enkelvoudigWedstrijdInfo) : false;
  const toonVoorspellingen = poule.afgerond || oefGestart || enkelvoudigGestart;

  const heeftBonusCategorieen = poule.topscorerActief || poule.geleKaartenActief || poule.toernooiwinaarActief || poule.eersteDoelpuntenmakerActief || poule.eersteDoelpuntenminuutActief || poule.cornersActief || poule.schotenOpDoelActief || poule.eersteKaartActief || poule.eersteKaartMinuutActief;

  const stand: StandItem[] = poule.deelnemers
    .map((d) => ({
      id: d.id,
      userId: d.userId,
      gebruikersnaam: d.user.gebruikersnaam,
      displayNaam: deelnemerNaam(d),
      isAdmin: d.user.isAdmin === true,
      punten: poule.afgerond ? berekenPunten(d.voorspellingen, poule.resultaten, d, poule) : 0,
      ingevuld: d.voorspellingen.filter((v) => v.thuis !== null && v.uit !== null).length,
      correctDoelpuntenmaker: heeftCorrectEersteDoelpuntenmaker(d, poule),
      minuutAfstand: berekenMinuutAfstand(d.eersteDoelpuntenminuutVoorspelling, poule.eersteDoelpuntenminuutResultaat),
      eersteDoelpuntenmakerVoorspelling: d.eersteDoelpuntenmakerVoorspelling,
      eersteDoelpuntenminuutVoorspelling: d.eersteDoelpuntenminuutVoorspelling,
      cornersVoorspelling: d.cornersVoorspelling,
      schotenOpDoelVoorspelling: d.schotenOpDoelVoorspelling,
      eersteKaartSpelerVoorspelling: d.eersteKaartSpelerVoorspelling,
      eersteKaartMinuutVoorspelling: d.eersteKaartMinuutVoorspelling,
      topscorerVoorspelling: d.topscorerVoorspelling,
      geleKaartenVoorspelling: d.geleKaartenVoorspelling,
      toernooiwinaarVoorspelling: d.toernooiwinaarVoorspelling,
      voorspellingen: d.voorspellingen,
    }))
    .sort((a, b) => {
      if (poule.afgerond) {
        if (b.punten !== a.punten) return b.punten - a.punten;
        if (a.correctDoelpuntenmaker !== b.correctDoelpuntenmaker) return a.correctDoelpuntenmaker ? -1 : 1;
        return a.minuutAfstand - b.minuutAfstand;
      }
      return b.ingevuld - a.ingevuld;
    });

  const eersteWedstrijden = pouleWedstrijden.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {toonEindstand && (
        <EindstandModal
          poule={poule}
          stand={stand}
          mijnUserId={mijnUserId}
          onSluit={sluitEindstand}
          enkelvoudigThuisNaam={enkelvoudigThuisNaam}
          enkelvoudigUitNaam={enkelvoudigUitNaam}
        />
      )}

      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors">
            ← STALENBALLEN
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">{poule.naam}</h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {poule.deelnemers.length} deelnemer{poule.deelnemers.length !== 1 ? "s" : ""}
                {organisatorIsBeheerder
                  ? " · Georganiseerd door de beheerders"
                  : organisatorNaam && <> · Georganiseerd door {organisatorNaam}</>}
              </p>
            </div>
            <button
              onClick={deelUitnodiging}
              className="flex-shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {gedeeld ? "✓ Gekopieerd!" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Nodig uit
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* ── Afgerond banner ── */}
        {poule.afgerond && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-yellow-300 text-sm">Toernooi afgerond</p>
                <p className="text-xs text-zinc-500">
                  {stand[0] ? `${stand[0].displayNaam} heeft gewonnen met ${stand[0].punten} punten` : "Eindstand bekend"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToonEindstand(true)}
              className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Bekijk →
            </button>
          </div>
        )}

        {/* ── Wedstrijden — verborgen voor LMS ── */}
        {(poule.soort ?? "wk") !== "lms" && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-white">{(isEnkelvoudig || (poule.soort ?? "wk") === "cl_finale") ? "Wedstrijd" : "Eerste wedstrijden"}</h2>
            <Link href={isEnkelvoudig ? `/poule/${code}/enkelvoudig` : `/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
              {isEnkelvoudig || (poule.soort ?? "wk") === "cl_finale" ? "Voorspelling →" : `Alle ${aantalWedstrijden} →`}
            </Link>
          </div>
          <div className="divide-y divide-zinc-800">
            {eersteWedstrijden.map((w) => {
              const vpThuis = huidigDeelnemer?.voorspellingen.find((v) => v.wedstrijdId === w.id);
              const heeftVp = vpThuis?.thuis != null && vpThuis?.uit != null;
              const voorspelLink = isEnkelvoudig ? `/poule/${code}/enkelvoudig` : `/poule/${code}/voorspellingen`;
              return (
                <div key={w.id} className="px-5 py-3.5 flex items-center gap-3">
                  <Link href={`/wedstrijd/${w.id}`} className="flex-1 group">
                    <p className="text-xs text-zinc-600 mb-1">
                      {w.groep} · {new Date(w.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} {w.tijd}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-zinc-300 transition-colors">
                      <TeamLogo team={w.thuis} size="xs" />
                      <span>{w.thuis.naam}</span>
                      <span className="text-zinc-600 font-normal mx-1">vs</span>
                      <span>{w.uit.naam}</span>
                      <TeamLogo team={w.uit} size="xs" />
                    </div>
                  </Link>
                  {heeftVp ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-zinc-500">Jouw voorspelling</span>
                      <div className="bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-bold text-white whitespace-nowrap">
                        {vpThuis!.thuis} – {vpThuis!.uit}
                      </div>
                    </div>
                  ) : (
                    <Link href={voorspelLink} className="text-xs text-zinc-600 hover:text-zinc-400 whitespace-nowrap">
                      Voorspel →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>}

        {/* ── LMS: mijn pick CTA ── */}
        {(poule.soort ?? "wk") === "lms" && huidigDeelnemer && (() => {
          const picks = huidigDeelnemer.lmsPicks ?? [];
          const actief = huidigDeelnemer.lmsActief !== false;
          const wins = picks.filter((p) => p.uitkomst === "win").length;

          const volgendeRonde = actief
            ? LMS_RONDES.find((r) => !isRondeGesloten(r.nr) && !picks.find((p) => p.rondeNr === r.nr))
            : null;
          const huidigePick = actief
            ? picks.find((p) => !isRondeGesloten(p.rondeNr))
            : null;

          const label = !actief
            ? "Uitgeschakeld 💀"
            : volgendeRonde
            ? `Voorspel ronde ${volgendeRonde.nr} →`
            : huidigePick
            ? `Ronde ${huidigePick.rondeNr} · pick opgeslagen ✓`
            : wins > 0
            ? `${wins} win${wins !== 1 ? "s" : ""} — wacht op volgende ronde`
            : "Voorspel ronde 1 →";

          return (
            <Link
              href={`/poule/${code}/picks`}
              className={`bg-zinc-900 rounded-2xl p-5 flex items-center justify-between transition-colors group border ${
                !actief ? "border-red-900/40 hover:border-red-800/60" : "border-green-500/40 hover:border-green-500"
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Last Man Standing</p>
                <p className={`font-bold ${!actief ? "text-red-400" : "text-white"}`}>{label}</p>
                {actief && wins > 0 && (
                  <p className="text-xs text-zinc-600 mt-0.5">{wins} ronde{wins !== 1 ? "s" : ""} overleefd</p>
                )}
              </div>
              <span className={`text-lg group-hover:translate-x-1 transition-transform ${!actief ? "text-red-700" : "text-green-400"}`}>→</span>
            </Link>
          );
        })()}

        {/* ── Jouw voorspellingen CTA ── */}
        {huidigDeelnemer && (poule.soort ?? "wk") !== "lms" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Jouw voorspellingen</p>
                <p className="text-white font-bold">
                  {isEnkelvoudig
                    ? (jouwIngevuld > 0 ? "Uitslag ingevuld" : "Nog niet ingevuld")
                    : <>{jouwIngevuld}<span className="text-zinc-500 font-normal"> van {aantalWedstrijden} ingevuld</span></>}
                </p>
              </div>
              <Link
                href={isEnkelvoudig ? `/poule/${code}/enkelvoudig` : `/poule/${code}/voorspellingen`}
                className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {jouwIngevuld === 0 ? "Beginnen →" : "Verder →"}
              </Link>
            </div>
            {!isEnkelvoudig && (
              <div className="h-1.5 bg-zinc-800 rounded-full">
                <div
                  className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(jouwIngevuld / aantalWedstrijden) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Bonus categorieën overzicht (voor deelnemers) ── */}
        {heeftBonusCategorieen && huidigDeelnemer && (poule.soort ?? "wk") !== "lms" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500 mb-3">Bonus voorspellingen</p>
            <div className="space-y-3">
              {poule.topscorerActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Topscorer</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.topscorerVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.topscorerVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{TOPSCORER_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.topscorerVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.geleKaartenActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Meeste gele kaarten</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.geleKaartenVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.geleKaartenVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{GELE_KAARTEN_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.geleKaartenVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.toernooiwinaarActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Winnaar van het toernooi</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.toernooiwinaarVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.toernooiwinaarVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{TOERNOOIWINNAAR_PUNTEN} pt
                    </p>
                  </div>
                  <Link
                    href={`/poule/${code}/voorspellingen`}
                    className="text-xs text-green-400 hover:text-green-300 font-medium"
                  >
                    {huidigDeelnemer.toernooiwinaarVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteDoelpuntenmakerActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Eerste doelpuntenmaker</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteDoelpuntenmakerVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.eersteDoelpuntenmakerVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{isEnkelvoudig ? CL_DOELPUNTENMAKER_PUNTEN : EERSTE_DOELPUNTENMAKER_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={isEnkelvoudig ? `/poule/${code}/enkelvoudig` : `/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteDoelpuntenmakerVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteDoelpuntenminuutActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Minuut eerste doelpunt</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling != null
                        ? <span className="text-zinc-300">minuut {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}tiebreaker
                    </p>
                  </div>
                  <Link href={isEnkelvoudig ? `/poule/${code}/enkelvoudig` : `/poule/${code}/voorspellingen`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteDoelpuntenminuutVoorspelling != null ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.cornersActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Totaal aantal corners</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.cornersVoorspelling != null
                        ? <span className="text-zinc-300">{huidigDeelnemer.cornersVoorspelling} corners</span>
                        : "Nog niet ingevuld"}
                      {" · "}{ENKELVOUDIG_CORNERS_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={`/poule/${code}/enkelvoudig`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.cornersVoorspelling != null ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.schotenOpDoelActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Totaal schoten op doel</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.schotenOpDoelVoorspelling != null
                        ? <span className="text-zinc-300">{huidigDeelnemer.schotenOpDoelVoorspelling} schoten</span>
                        : "Nog niet ingevuld"}
                      {" · "}{ENKELVOUDIG_SCHOTEN_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={`/poule/${code}/enkelvoudig`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.schotenOpDoelVoorspelling != null ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteKaartActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Eerste kaart speler</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteKaartSpelerVoorspelling
                        ? <span className="text-zinc-300">{huidigDeelnemer.eersteKaartSpelerVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{ENKELVOUDIG_EERSTE_KAART_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={`/poule/${code}/enkelvoudig`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteKaartSpelerVoorspelling ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
              {poule.eersteKaartMinuutActief && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Minuut eerste kaart</p>
                    <p className="text-xs text-zinc-500">
                      {huidigDeelnemer.eersteKaartMinuutVoorspelling != null
                        ? <span className="text-zinc-300">minuut {huidigDeelnemer.eersteKaartMinuutVoorspelling}</span>
                        : "Nog niet ingevuld"}
                      {" · "}{ENKELVOUDIG_EERSTE_KAART_MINUUT_PUNTEN} pt
                    </p>
                  </div>
                  <Link href={`/poule/${code}/enkelvoudig`} className="text-xs text-green-400 hover:text-green-300 font-medium">
                    {huidigDeelnemer.eersteKaartMinuutVoorspelling != null ? "Wijzig →" : "Invullen →"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stand ── */}
        {(poule.soort ?? "wk") === "lms" ? (
          <LmsStand deelnemers={poule.deelnemers} mijnUserId={mijnUserId} />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="font-bold text-white">Stand</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Punten worden bijgewerkt zodra uitslagen bekend zijn</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {stand.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => router.push(`/speler/${encodeURIComponent(d.userId)}`)}
                  className={`px-5 py-4 flex items-center gap-3 active:bg-zinc-800 transition-colors cursor-pointer ${d.userId === mijnUserId ? "bg-zinc-800/50" : ""}`}
                >
                  <span className="text-lg w-7 text-center flex-shrink-0">
                    {poule.afgerond && i === 0 ? "🏆" : i < 3 ? MEDAILLES[i] : <span className="text-sm text-zinc-600 font-bold">{i + 1}</span>}
                  </span>
                  <Initialen naam={d.displayNaam} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {d.displayNaam}
                      {d.userId === mijnUserId && (
                        <span className="ml-1.5 text-xs text-green-400 font-normal">jij</span>
                      )}
                      {d.isAdmin && (
                        <span className="ml-1.5 text-xs text-zinc-500 font-normal">beheerder</span>
                      )}
                      {poule.afgerond && i === 0 && d.userId !== mijnUserId && (
                        <span className="ml-1.5 text-xs text-yellow-400 font-normal">winnaar</span>
                      )}
                      {poule.afgerond && i === 0 && d.userId === mijnUserId && (
                        <span className="ml-1.5 text-xs text-yellow-400 font-normal">jij gewonnen!</span>
                      )}
                    </p>
                    {!poule.afgerond && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-24 bg-zinc-700 rounded-full">
                          <div
                            className="h-1 bg-zinc-400 rounded-full"
                            style={{ width: `${(d.ingevuld / aantalWedstrijden) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-600">{d.ingevuld}/{aantalWedstrijden}</span>
                      </div>
                    )}
                    {toonVoorspellingen && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {(poule.soort ?? "wk") === "cl_finale" && (() => {
                          const vp = d.voorspellingen.find((v) => v.wedstrijdId === "CL1");
                          return vp?.thuis != null && vp?.uit != null ? (
                            <span className="text-xs text-zinc-400">⚽ {vp.thuis}–{vp.uit}</span>
                          ) : null;
                        })()}
                        {poule.soort === "oefenwedstrijd" && (() => {
                          const vp = d.voorspellingen.find((v) => v.wedstrijdId === "OEF1");
                          return vp?.thuis != null && vp?.uit != null ? (
                            <span className="text-xs text-zinc-400">🔄 {vp.thuis}–{vp.uit} corners</span>
                          ) : null;
                        })()}
                        {isEnkelvoudig && poule.wkWedstrijdId && (() => {
                          const vp = d.voorspellingen.find((v) => v.wedstrijdId === poule.wkWedstrijdId);
                          return vp?.thuis != null && vp?.uit != null ? (
                            <span className="text-xs text-zinc-400">⚽ {vp.thuis}–{vp.uit}</span>
                          ) : null;
                        })()}
                        {isEnkelvoudig && poule.cornersActief && d.cornersVoorspelling != null && (
                          <span className="text-xs text-zinc-400">🔄 {d.cornersVoorspelling} corners</span>
                        )}
                        {isEnkelvoudig && poule.schotenOpDoelActief && d.schotenOpDoelVoorspelling != null && (
                          <span className="text-xs text-zinc-400">🎯 {d.schotenOpDoelVoorspelling} schoten</span>
                        )}
                        {isEnkelvoudig && poule.eersteKaartActief && d.eersteKaartSpelerVoorspelling && (
                          <span className="text-xs text-zinc-400">🟨 {d.eersteKaartSpelerVoorspelling}{d.eersteKaartMinuutVoorspelling != null ? ` (${d.eersteKaartMinuutVoorspelling}')` : ""}</span>
                        )}
                        {poule.eersteDoelpuntenmakerActief && d.eersteDoelpuntenmakerVoorspelling && (
                          <span className="text-xs text-zinc-400">🥅 {d.eersteDoelpuntenmakerVoorspelling}{d.eersteDoelpuntenminuutVoorspelling != null ? ` (${d.eersteDoelpuntenminuutVoorspelling}')` : ""}</span>
                        )}
                        {poule.topscorerActief && d.topscorerVoorspelling && (
                          <span className="text-xs text-zinc-400">👟 {d.topscorerVoorspelling}</span>
                        )}
                        {poule.toernooiwinaarActief && d.toernooiwinaarVoorspelling && (
                          <span className="text-xs text-zinc-400">🏆 {d.toernooiwinaarVoorspelling}</span>
                        )}
                        {poule.geleKaartenActief && d.geleKaartenVoorspelling && (
                          <span className="text-xs text-zinc-400">🟨 {d.geleKaartenVoorspelling}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {poule.afgerond ? (
                      <>
                        <span className="text-xl font-black text-white">{d.punten}</span>
                        <span className="text-xs text-zinc-600 ml-1">pt</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-zinc-400">{d.ingevuld}/{aantalWedstrijden}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {stand.length === 0 && (
                <p className="px-5 py-4 text-sm text-zinc-600">Nog geen deelnemers.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Poule-instellingen knop (alleen organisator) ── */}
        {isOrganisator && (
          <Link
            href={`/poule/${code}/instellingen`}
            className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-2xl p-5 flex items-center justify-between transition-colors"
          >
            <div>
              <h2 className="font-bold text-white">Poule-instellingen</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Bonussen, resultaten en poule beheer</p>
            </div>
            <span className="text-zinc-400 text-lg">→</span>
          </Link>
        )}

        {/* ── Uitnodigen ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-1">Vrienden uitnodigen</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Deel de link — iedereen kan meedoen via de uitnodiging.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 tracking-widest truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`}
            </div>
            <button
              onClick={deelUitnodiging}
              className="bg-green-500 hover:bg-green-400 text-black font-bold text-sm px-5 rounded-xl transition-colors whitespace-nowrap"
            >
              {gedeeld ? "✓ Gekopieerd" : "Deel link"}
            </button>
          </div>
        </div>


      </main>
    </div>
  );
}

export default function PoulePaginaWrapper() {
  return (
    <ErrorBoundary>
      <PoulePagina />
    </ErrorBoundary>
  );
}
