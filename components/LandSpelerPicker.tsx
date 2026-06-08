"use client";

import { useEffect, useState } from "react";
import { getWkTeams } from "@/lib/matches";
import { Speler } from "@/lib/players";

const POSITIE_STIJL: Record<string, string> = {
  AAN: "text-red-400 bg-red-500/10",
  MID: "text-blue-400 bg-blue-500/10",
  VER: "text-green-400 bg-green-500/10",
  DOE: "text-yellow-400 bg-yellow-500/10",
};

export function LandSpelerPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (naam: string) => void;
  disabled?: boolean;
}) {
  const [spelers, setSpelers] = useState<Speler[]>([]);
  const [geselecteerdLand, setGeselecteerdLand] = useState<string | null>(null);
  const wkTeams = getWkTeams();

  useEffect(() => {
    fetch("/api/spelers?soort=wk")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Speler[]) => { if (Array.isArray(data)) setSpelers(data); })
      .catch(() => {});
  }, []);

  // Find team code of currently selected player for display
  const geselecteerdeSpeler = spelers.find((s) => s.naam === value) ?? null;

  function selectSpeler(s: Speler) {
    onChange(s.naam);
    setGeselecteerdLand(null);
  }

  function deselecteer() {
    onChange("");
    setGeselecteerdLand(null);
  }

  const spelersVanLand = geselecteerdLand
    ? spelers.filter((s) => s.team === geselecteerdLand)
    : [];

  // If a player is selected, show summary
  if (value && !geselecteerdLand) {
    const team = wkTeams.find((t) => t.code === geselecteerdeSpeler?.team);
    return (
      <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          {team && <span className="text-2xl">{team.vlag}</span>}
          <div>
            <div className="text-sm font-semibold text-white">{value}</div>
            {geselecteerdeSpeler && (
              <div className="text-xs text-zinc-500">{geselecteerdeSpeler.team}</div>
            )}
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => setGeselecteerdLand(geselecteerdeSpeler?.team ?? null)}
            className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-700"
          >
            Wijzigen
          </button>
        )}
      </div>
    );
  }

  // Player list for selected country
  if (geselecteerdLand && !disabled) {
    const team = wkTeams.find((t) => t.code === geselecteerdLand);
    return (
      <div className="border border-zinc-700 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
          <button
            type="button"
            onClick={() => setGeselecteerdLand(null)}
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ←
          </button>
          <span className="text-lg">{team?.vlag}</span>
          <span className="text-sm font-semibold text-white">{team?.naam ?? geselecteerdLand}</span>
        </div>
        {spelersVanLand.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-zinc-500 bg-zinc-900">
            Nog geen spelers beschikbaar voor dit land.
          </div>
        ) : (
          <div className="bg-zinc-900 max-h-60 overflow-y-auto divide-y divide-zinc-800">
            {spelersVanLand.map((s) => (
              <button
                key={s.naam}
                type="button"
                onClick={() => selectSpeler(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition-colors"
              >
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${POSITIE_STIJL[s.positie]}`}>
                  {s.positie}
                </span>
                <span className="text-sm text-white">{s.naam}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Country grid
  return (
    <div className={disabled ? "pointer-events-none" : ""}>
      {value && !disabled && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Geselecteerd: <span className="text-white">{value}</span></span>
          <button type="button" onClick={deselecteer} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Wissen
          </button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {wkTeams.map((team) => (
          <button
            key={team.code}
            type="button"
            onClick={() => !disabled && setGeselecteerdLand(team.code)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-zinc-500"
          >
            <span className="text-2xl">{team.vlag}</span>
            <span className="text-xs text-zinc-400 truncate w-full text-center">{team.naam}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
