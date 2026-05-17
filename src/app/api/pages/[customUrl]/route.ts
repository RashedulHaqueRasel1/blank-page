import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ customUrl: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { customUrl } = await params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/${customUrl}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { customUrl } = await params;
    const body = await request.json();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/${customUrl}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Prevent echoing back the full updated page data in the network tab
    if (response.ok) {
      return NextResponse.json({ success: true, message: "Saved successfully" }, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { customUrl } = await params;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/${customUrl}`, {
      method: "DELETE",
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { customUrl } = await params;
    const body = await request.json();
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
    }
    
    const response = await fetch(`${serverUrl}/api/v1/pages/author/update/${customUrl}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({ success: true, message: "Page updated successfully" }, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
