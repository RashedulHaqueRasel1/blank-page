import type { Metadata } from "next";
import StaticInfoPage from "@/components/website/Common/StaticInfoPage";

export const metadata: Metadata = {
  title: "Terms | Blank Notes",
  description: "Read the terms, content responsibilities, privacy approach, and data handling practices for using Blank Notes.",
};

const sections = [
  {
    title: "Using Blank Notes",
    body: "Blank Notes is provided as a writing, publishing, and sharing platform. You may use it to create drafts, publish pages, manage live updates, and share written material with others. By using the service, you agree not to upload unlawful, abusive, harmful, deceptive, or unauthorized content.",
  },
  {
    title: "Your ownership and responsibility",
    body: "You remain responsible for the content you write, store, publish, or share through Blank Notes. This includes making sure that you have the legal and ethical right to publish any text, media, or information you place on a page, especially when that page is public or collaborative.",
  },
  {
    title: "How your data is handled",
    body: "Blank Notes uses a local-first approach for drafting, which means your active writing can remain stored in your browser. If you choose to publish pages, enable backup, or subscribe with your email, the information required for those features may be securely transmitted and processed by the service. Public pages are only shared according to the settings you choose, such as view-only, editable, password-protected, expiry-based, or one-time-view access.",
  },
  {
    title: "Security and protection",
    body: "Blank Notes is designed with privacy-conscious handling in mind. Requests are routed through controlled application endpoints, sensitive responses are limited where possible, and protected pages require verification before content is shown. Password-protected pages are handled with additional access checks. Based on the current application structure, we can state that data is protected in transit and access is controlled by application rules, but this page does not claim end-to-end encryption for all content unless that is explicitly stated in a future security update.",
  },
  {
    title: "Backups, subscribers, and account-related actions",
    body: "If you enable email backup or join the subscriber list, you agree to provide a valid email address for those features. Backup and subscriber-related actions may require storing and processing limited account information so the service can deliver recovery, update, verification, or communication features properly.",
  },
  {
    title: "Published pages and public sharing",
    body: "When you publish a page, you are choosing to make that content available according to the sharing mode you selected. Editable pages may allow live collaboration. View-only pages restrict direct editing. One-time-view pages are designed for temporary access and may become unavailable after the first successful visit. You should publish responsibly and review your page settings before sharing links publicly.",
  },
  {
    title: "Service changes and availability",
    body: "Blank Notes may update, improve, limit, or replace features over time in order to improve reliability, design, security, or usability. While the goal is to keep the service stable and dependable, uninterrupted availability cannot be guaranteed in every case.",
  },
  {
    title: "Acceptance of these terms",
    body: "By continuing to use Blank Notes, you acknowledge that you understand these terms and agree to use the platform responsibly. These terms are intended to be readable and practical so that any user can quickly understand how the service works and what responsibilities come with using it.",
  },
];

export default function TermsPage() {
  return (
    <StaticInfoPage
      eyebrow="Terms"
      title="Clear terms and privacy expectations for using Blank Notes"
      intro="These terms are written in a simple, professional format so that anyone can understand how Blank Notes works, what responsibilities users have, and how publishing, backup, privacy, and content access are handled across the platform."
      sections={sections}
    />
  );
}
