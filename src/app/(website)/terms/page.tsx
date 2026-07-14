import type { Metadata } from "next";
import StaticInfoPage from "@/components/website/Common/StaticInfoPage";

export const metadata: Metadata = {
  title: "Terms | Blank Notes",
  description: "Read the basic terms for using Blank Notes and publishing content through the site.",
};

const sections = [
  {
    title: "Use of the editor",
    body: "You may use Blank Notes to write, save, and publish your own content. Please avoid uploading unlawful, harmful, or misleading material through the service.",
  },
  {
    title: "Your content",
    body: "You remain responsible for the drafts and published pages you create. Make sure you have the right to share any text, media, or information you place on a public page.",
  },
  {
    title: "Privacy and access",
    body: "Some features rely on local browser storage and optional email-based backup. If you enable backup or sharing, the information needed to provide those features may be stored and processed.",
  },
  {
    title: "Service updates",
    body: "Blank Notes may change or improve features over time. Continued use of the site means you accept reasonable updates to the product and these terms.",
  },
];

export default function TermsPage() {
  return (
    <StaticInfoPage
      eyebrow="Terms"
      title="Simple terms for using Blank Notes"
      intro="These terms are written to be lightweight and readable. They explain the basic rules around writing, publishing, and using optional backup features on the site."
      sections={sections}
    />
  );
}
