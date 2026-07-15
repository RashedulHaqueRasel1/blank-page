import type { Metadata } from "next";
import StaticInfoPage from "@/components/website/Common/StaticInfoPage";

export const metadata: Metadata = {
  title: "Updates | Blank Notes",
  description: "Browse the latest product improvements, feature releases, and design updates across Blank Notes.",
};

const sections = [
  {
    title: "July 15, 2026 · Published page refresh",
    body: "The shared published page experience was simplified with cleaner structure, better mobile behavior, a more focused top action area, and faster access to creating a new draft from a live page.",
  },
  {
    title: "July 14, 2026 · Publishing workflow improvements",
    body: "Live publishing actions were refined so writers can update connected public pages more smoothly from the editor without breaking flow between drafting and sharing.",
  },
  {
    title: "July 13, 2026 · Protected page polish",
    body: "Password-protected pages received a cleaner unlock experience with better visual hierarchy and more understandable verification feedback for visitors.",
  },
  {
    title: "July 12, 2026 · Translation and collaboration updates",
    body: "Selected-text translation tools and shared-page collaboration behaviors were improved to make editing, syncing, and quick language workflows feel more reliable.",
  },
  {
    title: "July 11, 2026 · Static pages and information design",
    body: "The About and Terms pages were refined to be easier to read on mobile, more structured visually, and more consistent with the overall Blank Notes design language.",
  },
  {
    title: "What this page is for",
    body: "This updates page works like a lightweight changelog. It helps visitors understand what was improved, when changes happened, and which parts of the product are actively evolving.",
  },
];

export default function UpdatesPage() {
  return (
    <StaticInfoPage
      eyebrow="Updates"
      title="Product updates, improvements, and release notes"
      intro="Blank Notes keeps evolving in small, practical steps. This page highlights recent improvements across publishing, editing, protection, design, and overall usability so visitors can quickly see what changed."
      sections={sections}
    />
  );
}
