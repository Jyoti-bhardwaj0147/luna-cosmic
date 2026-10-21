import type { MetadataRoute } from "next";

export const dynamic = "force-static";

import { siteUrl } from "./site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  return ["", "/calendar", "/phases", "/about"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
