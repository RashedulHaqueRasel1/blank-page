import type { Metadata } from "next";
import StaticInfoPage from "@/components/website/Common/StaticInfoPage";

export const metadata: Metadata = {
  title: "About | Blank Notes",
  description: "Explore Blank Notes features, who it is for, and how to use the editor, publishing, backup, and sharing tools effectively.",
};

const sections = [
  {
    title: "What Blank Notes offers",
    body: "Blank Notes is a focused writing and publishing platform designed for people who want a calm editor with practical delivery tools. It combines local-first drafting, instant publishing, optional protection, translation support, and live updating inside a lightweight interface that stays centered on the writing itself.",
  },
  {
    title: "Core writing experience",
    body: "The editor is built for uninterrupted work. Drafts are saved locally as you type, so your writing remains available without depending on a constant cloud session. You can create multiple drafts, switch between them from the sidebar, pin important notes, rename documents, and keep your workspace organized while staying inside a very simple interface.",
  },
  {
    title: "Publishing and sharing tools",
    body: "When a draft is ready, you can publish it instantly and generate a shareable page. Each page can be set as view-only or editable, given an expiration window, or protected with a secret key. If a draft is already connected to a live page, Blank Notes lets you update that page directly from the editor, which makes it useful for fast revisions and ongoing publishing workflows.",
  },
  {
    title: "Backup, recovery, and continuity",
    body: "Blank Notes supports optional email-based backup for people who want more than browser-local storage. After verification, you can sync drafts and published references so your writing is easier to recover across sessions and devices. This keeps the product flexible: simple enough for local-only use, but capable of supporting longer-term writing workflows when backup matters.",
  },
  {
    title: "Built-in smart features",
    body: "Beyond writing and publishing, Blank Notes includes practical helper tools. Selected text can be translated using the built-in translation flow, editable live pages can sync changes in real time, and published page management is available from the same workspace. These features are intentionally integrated in a way that supports writing instead of overwhelming it.",
  },
  {
    title: "Who Blank Notes is for",
    body: "Blank Notes is well suited for writers, students, marketers, researchers, teachers, freelancers, founders, and anyone who needs to move quickly from idea to shareable page. It works especially well for users who want less dashboard complexity and more direct control over drafting, updating, and distributing text content.",
  },
  {
    title: "How to use it effectively",
    body: "A practical workflow is simple: start with a local draft, shape the content, adjust the theme or font for comfort, and publish only when the page is ready to share. If the page needs ongoing edits, keep it linked and use Update Live. If the content is sensitive, add a secret key. If the content is temporary, use an expiry setting or one-time view mode. If continuity matters, enable backup after verifying your email.",
  },
  {
    title: "Why the product is structured this way",
    body: "Blank Notes is designed around clarity, speed, and control. The goal is to remove unnecessary friction from writing while still giving users professional tools for publishing, protecting, translating, and maintaining their content. It is intentionally minimal in appearance, but operationally strong where real writing and sharing work usually needs support.",
  },
];

export default function AboutPage() {
  return (
    <StaticInfoPage
      eyebrow="About"
      title="A professional writing space for drafting, publishing, and sharing"
      intro="Blank Notes is built for people who want a clean writing environment without giving up useful delivery features. It brings together local-first drafting, simple document management, instant publishing, optional protection, live updates, translation support, and backup tools in one focused experience."
      sections={sections}
    />
  );
}
