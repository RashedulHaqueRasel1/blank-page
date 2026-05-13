import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang, customInstruction } = await req.json();
    const mId = req.headers.get("x-m-id");
    const clientSecret = req.headers.get("x-api-secret");

    // Security Handshake
    const serverSecret = process.env.INTERNAL_API_SECRET;
    if (!clientSecret || clientSecret !== serverSecret) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map obfuscated IDs to OpenRouter models from environment variables
    const modelMap: Record<string, string | undefined> = {
      "m1": process.env.MODEL_M1,
      "m2": process.env.MODEL_M2
    };
    const model = modelMap[mId as string] || process.env.MODEL_M1 || "openai/gpt-4o-mini";

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error: API Key missing" }, { status: 500 });
    }

    const url = "https://openrouter.ai/api/v1/chat/completions";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://blank-page-v1.vercel.app/", // Optional: your site URL
        "X-Title": "Blank Page Editor" // Optional: your site name
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: `You are a professional translator.

TASK:
- Detect language automatically (Banglish, Bangla, English etc.)
- Convert into: ${targetLang}
${customInstruction ? `- ADDITIONAL STYLE/INSTRUCTION: ${customInstruction}` : ""}
- If Banglish, understand meaning first then translate
- Return ONLY final translated text
- No explanation, no quotes, no extra words

TEXT:
"${text}"`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "OpenRouter API Error" }, { status: response.status });
    }

    const result = data.choices?.[0]?.message?.content || "Translation failed";

    // Sanitize result: strip leading/trailing quotes and extra whitespace
    const cleanResult = result.trim().replace(/^["']|["']$/g, '');

    return NextResponse.json({ result: cleanResult });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("OpenRouter Translation Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
