import Link from "next/link";

interface StaticInfoSection {
  title: string;
  body: string;
}

interface StaticInfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: StaticInfoSection[];
}

export default function StaticInfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: StaticInfoPageProps) {
  return (
    <main className="min-h-screen bg-[var(--editor-bg)] text-[var(--editor-text)] transition-colors duration-300">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-[28px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--editor-bg)_84%,white_16%)] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] opacity-45">{eyebrow}</p>
            <h1 className="mt-1 text-[20px] font-semibold tracking-tight sm:text-[24px]">{title}</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[var(--border-color)] px-4 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80"
          >
            Back to editor
          </Link>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[32px] border border-[var(--border-color)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-color)_10%,transparent),transparent_48%,color-mix(in_srgb,var(--editor-text)_5%,transparent))] px-6 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)] sm:px-10 sm:py-14">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent-color)_18%,transparent)] blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--editor-text)_8%,transparent)] blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] opacity-45">Blank Notes</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 opacity-72 sm:text-[16px]">{intro}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 pb-10 sm:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--editor-bg)_88%,white_12%)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.05)]"
            >
              <h3 className="text-[18px] font-semibold tracking-tight">{section.title}</h3>
              <p className="mt-3 text-[14px] leading-7 opacity-70">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
