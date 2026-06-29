import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serverUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
    }

    const response = await fetch(`${serverUrl}/subscribers/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "Unknown",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
