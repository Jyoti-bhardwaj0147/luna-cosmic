import { HomeExperience } from "@/components/HomeExperience";
import type { Metadata } from "next";
import { siteUrl } from "./site-url";

export const metadata: Metadata = {
  title: "Moon Phase Today and Lunar Calendar",
  description: "Explore today's Moon phase, illumination, and age, then browse an interactive lunar calendar calculated for your local date.",
  ...(siteUrl ? { alternates: { canonical: "/" } } : {}),
};

export default function Home() {
  return <HomeExperience />;
}
