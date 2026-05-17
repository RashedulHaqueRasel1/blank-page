import { NextResponse } from 'next/server';

// Disguised as a session/sync check — actually returns the client IP
export async function GET(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '';

  if (!ip) {
    // Fallback: call ipify server-side (hidden from browser)
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const encoded = Buffer.from(data.ip).toString('base64');
      return NextResponse.json({ status: 'ready', session: encoded });
    } catch {
      return NextResponse.json({ status: 'ready', session: '' });
    }
  }

  // Encode IP as base64 so response looks like a session token
  const encoded = Buffer.from(ip).toString('base64');
  return NextResponse.json({ status: 'ready', session: encoded });
}
