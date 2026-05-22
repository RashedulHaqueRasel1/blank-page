import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ customUrl: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { customUrl } = await params;
    const body = await request.json();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/${customUrl}/secure-fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
