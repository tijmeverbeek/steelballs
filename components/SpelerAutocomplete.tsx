"use client";

import { useEffect, useRef, useState } from "react";
import { Speler, getSpelers } from "@/lib/players"; // getSpelers used as initial fallback

const POSITIE_STIJL: Record<string, string> = {
  AAN: "text-red-400 bg-red-500/10",
  MID: "text-blue-400 bg-blue-500/10",
  VER: "text-green-400 bg-green-500/10",
  DOE: "text-yellow-400 bg-yellow-500/10",
};

const TEAM_VLAG: Record<string, string> = {
  PSG: "🇫🇷",
  Arsenal: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
};

export function SpelerAutocomplete({
  soort,
  value,
  onChange,
  placeholder,
  ringColor = "yellow",
  className,
}: {
  soort: string;
  value: string;
  onChange: (naam: string) => void;
  placeholder?: string;
  ringColor?: "yellow" | "green";
  className?: string;
}) {
  const [spelers, setSpelers] = useState<Speler[]>(() => getSpelers(soort));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync display value when parent resets it (e.g. on page load)
  useEffect(() => { setQuery(value); }, [value]);

  // Load squad from DB via API, fall back to static list on error
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/spelers?soort=${encodeURIComponent(soort)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Speler[] | null) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setSpelers(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [soort]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // No squad data available yet → plain text input
  if (spelers.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-${ringColor}-500 focus:border-transparent ${className ?? "w-full"}`}
      />
    );
  }

  const filtered = query.trim()
    ? spelers.filter((s) =>
        s.naam.toLowerCase().includes(query.toLowerCase().trim())
      )
    : spelers;

  function select(speler: Speler) {
    onChange(speler.naam);
    setQuery(speler.naam);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const ringClass = ringColor === "green" ? "focus:ring-green-500" : "focus:ring-yellow-500";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          onChange(val);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 ${ringClass} focus:border-transparent`}
      />

      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
        >
          {filtered.map((s, i) => (
            <button
              key={s.naam}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                i === highlighted ? "bg-zinc-700" : "hover:bg-zinc-800"
              }`}
            >
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${POSITIE_STIJL[s.positie]}`}>
                {s.positie}
              </span>
              <span className="text-sm text-white flex-1 truncate">{s.naam}</span>
              <span className="text-xs text-zinc-500 flex-shrink-0">
                {TEAM_VLAG[s.team] ?? ""} {s.team}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
