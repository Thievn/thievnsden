import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thievn's Den",
    short_name: "The Den",
    description:
      "Dark humor, Face The Den, thoughts, loot, and gaming. Install for the full Den experience.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#070707",
    theme_color: "#070707",
    categories: ["entertainment", "lifestyle"],
    icons: [
      {
        src: "/mark/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/mark/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/mark/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
