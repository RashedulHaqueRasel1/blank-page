import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ authorId: string }> }
) {
  try {
    const { authorId } = await params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }

    const response = await fetch(`${serverUrl}/api/v1/pages/author/${authorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
