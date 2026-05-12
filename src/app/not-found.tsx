"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoveLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--editor-bg)] text-[var(--editor-text)] p-6 transition-colors duration-300">

      <div className="flex flex-col items-center max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 opacity-20">
          <FileQuestion size={80} strokeWidth={1} />
        </div>

        <h1 className="text-[14px] font-bold tracking-[0.3em] uppercase opacity-40 mb-4">
          404 - Not Found
        </h1>

        <h2 className="text-[24px] md:text-[32px] font-serif italic mb-6 leading-tight">
          This page is a blank canvas that shouldn&apos;t be here.
        </h2>

        <p className="text-[15px] opacity-50 mb-10 leading-relaxed font-light">
          The link you followed might be broken, or the page has been moved.
          <br />
          <span className="text-[13px] font-medium mt-2 block italic">
            Redirecting to home in {countdown}s...
          </span>
        </p>

        <Link
          href="/"
          className="flex items-center gap-3 px-8 py-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.03] dark:bg-white/[0.03] text-[14px] font-semibold transition-all hover:bg-black/[0.08] dark:hover:bg-white/[0.08] active:scale-[0.98] group"
        >
          <MoveLeft size={18} className="opacity-60 group-hover:-translate-x-1 transition-transform" />
          Back to Writing
        </Link>
      </div>

      {/* Decorative background element */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/[0.02] dark:bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
