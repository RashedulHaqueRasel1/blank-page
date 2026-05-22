import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Only return the necessary public fields to the frontend
    // to prevent sensitive info (ip, userId) from appearing in the network tab.
    if (response.ok && data.data) {
      return NextResponse.json({
        success: true,
        data: {
          customUrl: data.data.customUrl,
          isEditable: data.data.isEditable,
          expiresAt: data.data.expiresAt,
        }
      }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
