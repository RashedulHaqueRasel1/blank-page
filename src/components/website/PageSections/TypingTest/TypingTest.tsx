"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hash, Keyboard, Languages, RotateCcw, Timer, Trophy, X } from "lucide-react";
import type { TypingLanguageOption, TypingTestMode, TypingTestResult } from "@/lib/typing-test";

const DURATION_OPTIONS = [15, 30, 60, 120];
const DEFAULT_WORD_OPTIONS = [25, 50, 75, 100, 150, 200];

type TestStatus = "idle" | "running" | "finished";

interface TypingApiResponse {
  languages: TypingLanguageOption[];
  wordOptions?: number[];
  language: string;
  duration: number;
  text: string;
  wordCount: number;
  sessionId: string | null;
}

export default function TypingTest() {
  const [languages, setLanguages] = useState<TypingLanguageOption[]>([]);
  const [wordOptions, setWordOptions] = useState<number[]>(DEFAULT_WORD_OPTIONS);
  const [testMode, setTestMode] = useState<TypingTestMode>("time");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedWordTarget, setSelectedWordTarget] = useState(50);
  const [targetText, setTargetText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<TestStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(30);
  const [result, setResult] = useState<TypingTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("typewriter-sound") === "true";
  });
  const [showResultModal, setShowResultModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const deadlineRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);
  const audioPool = useRef<Record<string, HTMLAudioElement>>({});

  const completedChars = typedText.length;

  const decodePayload = <T,>(encodedPayload: string): T => {
    const binary = window.atob(encodedPayload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  };

  const getOrCreateWriterId = () => {
    if (typeof window === "undefined") return "";

    let id = localStorage.getItem("writer-id");
    if (!id) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let randomStr = "";
      for (let index = 0; index < 6; index += 1) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      id = `user-${randomStr}`;
      localStorage.setItem("writer-id", id);
    }

    return id;
  };

  const focusInput = () => {
    textareaRef.current?.focus();
  };

  const playKeySound = () => {
    if (!soundEnabled || typeof window === "undefined") return;

    const sounds = ["/sounds/kbs1.mp3", "/sounds/kbs2.mp3", "/sounds/kbs3.mp3", "/sounds/kbs4.mp3"];
    const selectedSound = sounds[Math.floor(Math.random() * sounds.length)];

    if (!audioPool.current[selectedSound]) {
      audioPool.current[selectedSound] = new Audio(selectedSound);
      audioPool.current[selectedSound].volume = 0.58;
    }

    const audio = audioPool.current[selectedSound];
    audio.volume = 0.58;
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  };

  const resetRunState = () => {
    deadlineRef.current = null;
    startTimeRef.current = null;
    hasFinishedRef.current = false;
    setStatus("idle");
    setTypedText("");
    setResult(null);
    setShowResultModal(false);
    setTimeLeft(selectedDuration);
  };

  const loadTest = async ({
    language,
    duration,
    mode,
    wordTarget,
  }: {
    language: string;
    duration: number;
    mode: TypingTestMode;
    wordTarget: number;
  }) => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        language,
        duration: String(duration),
        mode,
        authorId: getOrCreateWriterId(),
      });

      if (mode === "words") {
        params.set("wordTarget", String(wordTarget));
      }

      const response = await fetch(`/api/typing-test?${params.toString()}`, {
        cache: "no-store",
      });
      const rawData = (await response.json()) as { payload?: string; error?: string };

      if (!response.ok) {
        throw new Error(rawData.error || "Failed to load typing text");
      }

      if (!rawData.payload) {
        throw new Error("Typing payload is missing");
      }

      const data = decodePayload<TypingApiResponse>(rawData.payload);

      setLanguages(data.languages);
      if (data.wordOptions?.length) {
        setWordOptions(data.wordOptions);
      }
      setSelectedLanguage(data.language);
      setSelectedDuration(data.duration);
      setTargetText(data.text);
      setSessionId(data.sessionId);
      setTimeLeft(data.duration);
      setTypedText("");
      setResult(null);
      setShowResultModal(false);
      setStatus("idle");
      deadlineRef.current = null;
      startTimeRef.current = null;
      hasFinishedRef.current = false;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load typing text";
      setError(message);
    } finally {
      setIsLoading(false);
      setTimeout(() => focusInput(), 30);
    }
  };

  const submitResult = async (nextTypedText: string, elapsedSeconds: number) => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/typing-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          authorId: getOrCreateWriterId(),
          mode: testMode,
          language: selectedLanguage,
          duration: selectedDuration,
          targetText,
          typedText: nextTypedText,
          elapsedSeconds,
        }),
      });
      const rawData = (await response.json()) as { payload?: string; error?: string };

      if (!response.ok) {
        throw new Error(rawData.error || "Failed to check typing result");
      }

      if (!rawData.payload) {
        throw new Error("Typing result payload is missing");
      }

      const data = decodePayload<{ result?: TypingTestResult }>(rawData.payload);

      if (!data.result) {
        throw new Error("Failed to check typing result");
      }

      setResult(data.result);
      setShowResultModal(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to check typing result";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishTest = async (nextTypedText: string) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setStatus("finished");
    if (testMode === "time") {
      setTimeLeft(0);
    }

    const elapsedSeconds = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : selectedDuration;

    await submitResult(nextTypedText, elapsedSeconds);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTest({
        language: "English",
        duration: 30,
        mode: "time",
        wordTarget: 50,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSoundUpdate = (event: Event) => {
      setSoundEnabled(Boolean((event as CustomEvent<boolean>).detail));
    };

    window.addEventListener("editor-sound-update", handleSoundUpdate);
    return () => window.removeEventListener("editor-sound-update", handleSoundUpdate);
  }, []);

  useEffect(() => {
    if (testMode !== "time" || status !== "running") return;

    const interval = window.setInterval(() => {
      if (!deadlineRef.current) return;

      const remainingMs = deadlineRef.current - Date.now();
      const nextTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(nextTimeLeft);

      if (remainingMs <= 0) {
        window.clearInterval(interval);
        finishTest(typedText);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [status, testMode, typedText]);

  const renderedChars = useMemo(() => {
    return targetText.split("").map((char, index) => {
      const typedChar = typedText[index];
      let className = "opacity-35";

      if (typedChar != null) {
        className = typedChar === char
          ? "text-[var(--accent-color)] opacity-100"
          : "text-red-500 opacity-100";
      } else if (index === typedText.length && status !== "finished") {
        className = "opacity-100 bg-[var(--accent-color)]/15 rounded-sm";
      }

      return (
        <span key={`${char}-${index}`} className={className}>
          {char}
        </span>
      );
    });
  }, [status, targetText, typedText]);

  const handleType = async (value: string) => {
    if (status === "finished") return;

    const limitedValue = value.slice(0, targetText.length);

    if (limitedValue.length > typedText.length) {
      playKeySound();
    }

    if (status === "idle" && limitedValue.length > 0) {
      const startTime = Date.now();
      startTimeRef.current = startTime;
      deadlineRef.current = testMode === "time" ? startTime + selectedDuration * 1000 : null;
      setStatus("running");
    }

    setTypedText(limitedValue);

    if (limitedValue.length >= targetText.length) {
      await finishTest(limitedValue);
    }
  };

  const currentLanguageMeta = languages.find((language) => language.id === selectedLanguage);
  const targetWordCount = targetText ? targetText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <section className="relative min-h-screen bg-[var(--editor-bg)] text-[var(--editor-text)] px-4 pb-12 pt-24 transition-colors duration-500">
      <div className="mx-auto w-full max-w-6xl">
        <div
          onClick={focusInput}
          className="relative overflow-hidden rounded-[34px] border border-[var(--border-color)] bg-[var(--editor-bg)] shadow-[0_24px_80px_rgba(0,0,0,0.05)] transition-colors"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_38%)]" />
          <div className="relative px-6 py-6 md:px-10 md:py-8">
            <div className="mb-8 flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.24em] opacity-60">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-3 py-1">
                  <Keyboard size={13} />
                  Typing Lab
                </span>
                <span>{selectedLanguage}</span>
                <span>{currentLanguageMeta?.script || "Latin"}</span>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <label className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2.5 text-sm backdrop-blur-xl">
                    <span className="opacity-55">Mode</span>
                    <select
                      value={testMode}
                      onChange={(event) => {
                        const mode = event.target.value as TypingTestMode;
                        setTestMode(mode);
                        resetRunState();
                        void loadTest({
                          language: selectedLanguage,
                          duration: selectedDuration,
                          mode,
                          wordTarget: selectedWordTarget,
                        });
                      }}
                      className="bg-transparent font-medium outline-none"
                    >
                      <option value="time">Time</option>
                      <option value="words">Words</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2.5 text-sm backdrop-blur-xl">
                    <span className="opacity-55">Language</span>
                    <select
                      value={selectedLanguage}
                      onChange={(event) => {
                        const language = event.target.value;
                        setSelectedLanguage(language);
                        void loadTest({
                          language,
                          duration: selectedDuration,
                          mode: testMode,
                          wordTarget: selectedWordTarget,
                        });
                      }}
                      className="bg-transparent font-medium outline-none"
                    >
                      {languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {testMode === "time" ? (
                    <label className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2.5 text-sm backdrop-blur-xl">
                      <span className="opacity-55">Time</span>
                      <select
                        value={selectedDuration}
                        onChange={(event) => {
                          const duration = Number(event.target.value);
                          setSelectedDuration(duration);
                          void loadTest({
                            language: selectedLanguage,
                            duration,
                            mode: testMode,
                            wordTarget: selectedWordTarget,
                          });
                        }}
                        className="bg-transparent font-medium outline-none"
                      >
                        {DURATION_OPTIONS.map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}s
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2.5 text-sm backdrop-blur-xl">
                      <Hash size={15} className="opacity-55" />
                      <span className="opacity-55">Words</span>
                      <select
                        value={selectedWordTarget}
                        onChange={(event) => {
                          const wordTarget = Number(event.target.value);
                          setSelectedWordTarget(wordTarget);
                          void loadTest({
                            language: selectedLanguage,
                            duration: selectedDuration,
                            mode: testMode,
                            wordTarget,
                          });
                        }}
                        className="bg-transparent font-medium outline-none"
                      >
                        {wordOptions.map((wordTarget) => (
                          <option key={wordTarget} value={wordTarget}>
                            {wordTarget} words
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <button
                    onClick={() => {
                      resetRunState();
                      void loadTest({
                        language: selectedLanguage,
                        duration: selectedDuration,
                        mode: testMode,
                        wordTarget: selectedWordTarget,
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2.5 text-sm font-medium backdrop-blur-xl transition-transform hover:scale-[1.01] cursor-pointer"
                  >
                    <RotateCcw size={15} />
                    New text
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {testMode === "time" ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2.5">
                      <Timer size={15} className="opacity-55" />
                      <span className="opacity-55">Time</span>
                      <span className="font-semibold">{timeLeft}s</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2.5">
                      <Hash size={15} className="opacity-55" />
                      <span className="opacity-55">Target</span>
                      <span className="font-semibold">{selectedWordTarget} words</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2.5">
                    <Languages size={15} className="opacity-55" />
                    <span className="opacity-55">Status</span>
                    <span className="font-semibold">{status === "running" ? "Live" : status === "finished" ? "Done" : "Ready"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] opacity-45">
              <span>{completedChars}/{targetText.length} chars</span>
              <span>{targetWordCount} words</span>
              {result && <span>{result.accuracy}% accuracy</span>}
              {result && <span>{result.netWpm} net wpm</span>}
            </div>

            <div className="relative min-h-[62vh] md:min-h-[68vh]">
              <textarea
                ref={textareaRef}
                value={typedText}
                onChange={(event) => {
                  void handleType(event.target.value);
                }}
                onPaste={(event) => event.preventDefault()}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                className="absolute inset-0 h-full w-full resize-none opacity-0"
                aria-label="Typing test input"
              />

              <div className="whitespace-pre-wrap break-words text-[20px] leading-[1.9] tracking-[0.01em] text-[var(--editor-text)] md:text-[24px]">
                {isLoading ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 text-center md:min-h-[340px]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] opacity-80 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-color)] [animation-delay:-0.2s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-color)]/80 [animation-delay:-0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-color)]/60" />
                      </span>
                      Thinking
                    </div>
                  </div>
                ) : (
                  renderedChars
                )}
              </div>
            </div>

            {!isLoading && (
              <div className="mt-6 text-sm opacity-45">
                {testMode === "time"
                  ? "Click here and start typing. Timer starts on the first key press."
                  : "Click here and start typing. The test ends when you finish the selected word goal."}
              </div>
            )}

            {result && (
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <div className="rounded-full border border-[var(--border-color)] px-4 py-2.5">
                  <span className="opacity-55">Net WPM </span>
                  <span className="font-semibold">{result.netWpm}</span>
                </div>
                <div className="rounded-full border border-[var(--border-color)] px-4 py-2.5">
                  <span className="opacity-55">Gross </span>
                  <span className="font-semibold">{result.grossWpm}</span>
                </div>
                <div className="rounded-full border border-[var(--border-color)] px-4 py-2.5">
                  <span className="opacity-55">Correct / Wrong </span>
                  <span className="font-semibold">{result.correctChars} / {result.incorrectChars}</span>
                </div>
                <div className="rounded-full border border-[var(--border-color)] px-4 py-2.5">
                  <span className="opacity-55">Completion </span>
                  <span className="font-semibold">{result.completion}%</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {showResultModal && result && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-[var(--border-color)] bg-[var(--editor-bg)] shadow-[0_32px_120px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_36%)]" />
            <div className="relative px-6 py-6 md:px-8 md:py-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] opacity-65">
                    <Trophy size={13} />
                    Test Complete
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Your typing result</h2>
                  <p className="mt-2 text-sm opacity-60">
                    {selectedLanguage} story mode • {testMode === "time" ? `${selectedDuration}s session` : `${selectedWordTarget} word goal`}
                  </p>
                </div>

                <button
                  onClick={() => setShowResultModal(false)}
                  className="rounded-full border border-[var(--border-color)] p-2 opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
                  aria-label="Close result modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--navbar-bg)] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] opacity-50">Net WPM</div>
                  <div className="mt-2 text-3xl font-semibold">{result.netWpm}</div>
                </div>
                <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--navbar-bg)] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] opacity-50">Gross</div>
                  <div className="mt-2 text-3xl font-semibold">{result.grossWpm}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">Correct / Wrong</div>
                  <div className="mt-2 text-xl font-semibold">
                    {result.correctChars} <span className="opacity-40">/</span> {result.incorrectChars}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">Completion</div>
                  <div className="mt-2 text-xl font-semibold">{result.completion}%</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">Accuracy</div>
                  <div className="mt-2 text-2xl font-semibold">{result.accuracy}%</div>
                </div>
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">Typing Speed</div>
                  <div className="mt-2 text-2xl font-semibold">{result.insight.typingSpeed} WPM</div>
                </div>
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">It is better than</div>
                  <div className="mt-2 text-2xl font-semibold">{result.insight.betterThanPercent}%</div>
                </div>
                <div className="rounded-[24px] border border-[var(--border-color)] p-5">
                  <div className="text-sm opacity-55">Ranking in last 24hrs</div>
                  <div className="mt-2 text-2xl font-semibold">{result.insight.rankingLast24Hours}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    resetRunState();
                    void loadTest({
                      language: selectedLanguage,
                      duration: selectedDuration,
                      mode: testMode,
                      wordTarget: selectedWordTarget,
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--navbar-bg)] px-5 py-3 text-sm font-medium backdrop-blur-xl transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  <RotateCcw size={15} />
                  Try new story
                </button>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-5 py-3 text-sm font-medium opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
                >
                  Keep reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
