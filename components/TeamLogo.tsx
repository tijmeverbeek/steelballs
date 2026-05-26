"use client";

import { useState } from "react";

interface Props {
  team: { naam: string; vlag: string; logo?: string };
  size?: "xs" | "sm" | "md" | "lg";
}

const SIZES = {
  xs: { img: "w-5 h-5",   emoji: "text-base" },
  sm: { img: "w-8 h-8",   emoji: "text-2xl"  },
  md: { img: "w-12 h-12", emoji: "text-4xl"  },
  lg: { img: "w-20 h-20", emoji: "text-6xl"  },
};

export function TeamLogo({ team, size = "sm" }: Props) {
  const [fout, setFout] = useState(false);
  const { img, emoji } = SIZES[size];

  if (team.logo && !fout) {
    return (
      <img
        src={team.logo}
        alt={team.naam}
        className={`${img} object-contain flex-shrink-0`}
        onError={() => setFout(true)}
      />
    );
  }
  return <span className={`${emoji} leading-none flex-shrink-0`}>{team.vlag}</span>;
}
