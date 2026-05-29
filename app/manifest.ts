import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stalenballen Cup",
    short_name: "Stalenballen",
    description: "Voorspel alle WK wedstrijden en bewijs wie de staalste ballen heeft",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/logo.png", sizes: "1024x1024", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
