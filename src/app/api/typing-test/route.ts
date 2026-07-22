import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  TYPING_LANGUAGES,
  TYPING_WORD_OPTIONS,
  evaluateTypingTest,
  generateTypingText,
  getTypingWordTarget,
  normalizeDuration,
  normalizeLanguage,
  normalizeWordTarget,
} from "@/lib/typing-test";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const serverUrl = process.env.NEXT_PUBLIC_API_URL;

const encodePayload = (payload: unknown) => Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

const resolveOwnerIdentity = async (
  request: NextRequest,
  authorId?: string | null,
) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accountUserId = typeof token?.id === "string" ? token.id : null;
  const guestAuthorId = authorId?.trim() || null;
  const ownerId = accountUserId || guestAuthorId || "anonymous-typing-user";

  return {
    ownerId,
    accountUserId,
    authorId: guestAuthorId,
  };
};

const persistGeneratedSession = async (payload: {
  ownerId: string;
  accountUserId?: string | null;
  authorId?: string | null;
  language: string;
  duration: number;
  mode: "time" | "words";
  wordTarget?: number;
  targetText: string;
  targetWordCount: number;
  source: "ai" | "database" | "fallback";
}) => {
  if (!serverUrl) return null;

  try {
    const response = await fetch(`${serverUrl}/typing-tests/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json();
    return response.ok ? (data.data?.id as string | undefined) || null : null;
  } catch (error) {
    console.error("Typing session save failed:", error);
    return null;
  }
};

const getRandomSavedTypingText = async ({
  language,
  duration,
  wordTarget,
}: {
  language: string;
  duration: number;
  wordTarget?: number;
}) => {
  if (!serverUrl) return null;

  try {
    const params = new URLSearchParams({
      language,
      duration: String(duration),
    });

    if (typeof wordTarget === "number") {
      params.set("wordTarget", String(wordTarget));
    }

    const response = await fetch(`${serverUrl}/typing-tests/library/random?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok || !data.data) {
      return null;
    }

    return {
      language: data.data.language as string,
      duration: data.data.duration as number,
      text: data.data.text as string,
      wordCount: data.data.wordCount as number,
    };
  } catch (error) {
    console.error("Typing DB fallback load failed:", error);
    return null;
  }
};

const persistCompletedSession = async ({
  sessionId,
  ownerId,
  typedText,
  elapsedSeconds,
  result,
}: {
  sessionId: string;
  ownerId: string;
  typedText: string;
  elapsedSeconds: number;
  result: ReturnType<typeof evaluateTypingTest>;
}) => {
  if (!serverUrl) return false;

  try {
    const response = await fetch(`${serverUrl}/typing-tests/sessions/${sessionId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId,
        typedText,
        elapsedSeconds,
        result,
      }),
      cache: "no-store",
    });

    return response.ok;
  } catch (error) {
    console.error("Typing result save failed:", error);
    return false;
  }
};

const extractJsonBlock = (rawText: string) => {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const startIndex = rawText.indexOf("{");
  const endIndex = rawText.lastIndexOf("}");
  if (startIndex >= 0 && endIndex > startIndex) {
    return rawText.slice(startIndex, endIndex + 1);
  }

  return rawText.trim();
};

const sanitizePassage = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const generateAiTypingText = async ({
  language,
  duration,
  wordTarget,
}: {
  language: string;
  duration: number;
  wordTarget?: number;
}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.MODEL_M1 || "openai/gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const targetWords = wordTarget ?? getTypingWordTarget(duration);
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://blank-page-v1.vercel.app/",
      "X-Title": "Blank Notes Typing Test",
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: "You create original typing test passages. Return strict JSON only.",
        },
        {
          role: "user",
          content: `Generate 3 original typing test passages in ${language}.

Requirements:
- Total words across all passages should be close to ${targetWords} words
- Each passage must be natural, easy to read, and good for typing practice
- Use only ${language}
- Avoid lists, emojis, markdown, quotes, numbering, profanity, and brand names
- Keep punctuation normal and readable
- Make each passage different from the others

Return ONLY JSON in this exact shape:
{"passages":["passage 1","passage 2","passage 3"]}`,
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenRouter API Error");
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI did not return any typing text");
  }

  const parsed = JSON.parse(extractJsonBlock(content)) as { passages?: unknown };
  const passages = Array.isArray(parsed.passages)
    ? parsed.passages.map(sanitizePassage).filter(Boolean)
    : [];

  if (passages.length === 0) {
    throw new Error("AI response did not include valid passages");
  }

  const text = passages.join(" ");
  return {
    language,
    duration,
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const language = normalizeLanguage(searchParams.get("language"));
  const duration = normalizeDuration(searchParams.get("duration"));
  const rawWordTarget = searchParams.get("wordTarget");
  const wordTarget = rawWordTarget ? normalizeWordTarget(rawWordTarget) : undefined;
  const mode = searchParams.get("mode") === "words" ? "words" : "time";
  const identity = await resolveOwnerIdentity(request, searchParams.get("authorId"));
  let payload;
  let source: "ai" | "database" | "fallback" = "ai";

  try {
    payload = await generateAiTypingText({ language, duration, wordTarget });
  } catch (error) {
    console.error("Typing text AI generation failed:", error);

    const savedPayload = await getRandomSavedTypingText({
      language,
      duration,
      wordTarget,
    });

    if (savedPayload) {
      source = "database";
      payload = savedPayload;
    } else {
      source = "fallback";
      payload = generateTypingText(language, duration, wordTarget);
    }
  }

  const sessionId = await persistGeneratedSession({
    ...identity,
    language: payload.language,
    duration: payload.duration,
    mode,
    wordTarget,
    targetText: payload.text,
    targetWordCount: payload.wordCount,
    source,
  });

  const publicPayload = encodePayload({
    languages: TYPING_LANGUAGES,
    wordOptions: TYPING_WORD_OPTIONS,
    ...payload,
    sessionId,
    source,
  });

  return NextResponse.json({
    payload: publicPayload,
    source,
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language = normalizeLanguage(body.language);
    const duration = normalizeDuration(body.duration);
    const mode = body.mode === "words" ? "words" : "time";
    const targetText = typeof body.targetText === "string" ? body.targetText : "";
    const typedText = typeof body.typedText === "string" ? body.typedText : "";
    const elapsedSeconds = typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : duration;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const identity = await resolveOwnerIdentity(request, typeof body.authorId === "string" ? body.authorId : null);

    if (!targetText) {
      return NextResponse.json({ error: "Target text is required" }, { status: 400 });
    }

    const result = evaluateTypingTest({
      targetText,
      typedText,
      durationSeconds: mode === "words" ? elapsedSeconds : duration,
      elapsedSeconds,
    });

    if (sessionId) {
      await persistCompletedSession({
        sessionId,
        ownerId: identity.ownerId,
        typedText,
        elapsedSeconds,
        result,
      });
    }

    return NextResponse.json({
      payload: encodePayload({
        language,
        duration,
        mode,
        result,
        sessionId,
      }),
      source: "result-saved",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to evaluate typing test";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
