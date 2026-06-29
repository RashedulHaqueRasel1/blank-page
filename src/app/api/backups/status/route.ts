import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
    }

    const url = new URL(request.url);
    const email = url.searchParams.get("email") || "";
    const backupToken = url.searchParams.get("backupToken") || "";

    const response = await fetch(
      `${serverUrl}/backups/status?email=${encodeURIComponent(email)}&backupToken=${encodeURIComponent(backupToken)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
