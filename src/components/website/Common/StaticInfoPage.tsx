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

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/updates", label: "Updates" },
];

export default function StaticInfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: StaticInfoPageProps) {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[var(--editor-bg)] text-[var(--editor-text)] transition-colors duration-300">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[24px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--editor-bg)_88%,white_12%)] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] opacity-45">{eyebrow}</p>
            <h1 className="mt-1 text-[20px] leading-tight font-semibold tracking-tight sm:text-[24px]">{title}</h1>
          </div>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border-color)] px-4 py-2 text-[12px] font-semibold transition-opacity hover:opacity-80 sm:w-auto"
          >
            Back to editor
          </Link>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-[28px] border border-[var(--border-color)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-color)_10%,transparent),transparent_48%,color-mix(in_srgb,var(--editor-text)_5%,transparent))] px-5 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:mt-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--accent-color)_18%,transparent)] blur-3xl sm:-right-16 sm:-top-16 sm:h-40 sm:w-40" />
          <div className="absolute -bottom-16 left-4 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--editor-text)_8%,transparent)] blur-3xl sm:-bottom-20 sm:left-8 sm:h-48 sm:w-48" />
          <div className="relative max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] opacity-45">Blank Notes</p>
            <h2 className="mt-3 text-[30px] leading-[1.05] font-semibold tracking-tight sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 opacity-72 sm:text-[16px]">{intro}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 pb-10 sm:mt-8 sm:gap-5 sm:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[24px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--editor-bg)_90%,white_10%)] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:rounded-[28px] sm:p-6"
            >
              <h3 className="text-[17px] leading-tight font-semibold tracking-tight sm:text-[18px]">{section.title}</h3>
              <p className="mt-3 text-[14px] leading-7 opacity-70">{section.body}</p>
            </article>
          ))}
        </section>

        <footer className="flex justify-between  mt-auto border-t border-[var(--border-color)] pb-6 pt-6">
          <div className="flex gap-4 text-[13px] opacity-72">
            {footerLinks.map((link, index) => (
              <div key={link.href} className="flex items-center gap-2">
                {index > 0 && <span className="opacity-35">·</span>}
                <Link href={link.href} className="transition-opacity hover:opacity-100">
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[13px] opacity-60">
            <Link href="/" className="transition-opacity hover:opacity-100">
              &copy; {currentYear} Blank notes
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
