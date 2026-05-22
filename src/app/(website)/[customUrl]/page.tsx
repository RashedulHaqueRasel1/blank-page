import React from "react";
import ClientPublishedPage from "@/components/website/PageSections/ClientPublishedPage/ClientPublishedPage";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ customUrl: string }>;
}

export default async function PublishedPage({ params }: PageProps) {
  const { customUrl } = await params;
  
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl) {
    throw new Error("NEXT_PUBLIC_SERVER_URL is not defined in environment variables");
  }
  let initialData = null;

  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : (realIp || '127.0.0.1');

    const res = await fetch(`${serverUrl}/api/v1/pages/${customUrl}/view`, { 
      cache: 'no-store',
      headers: {
        'x-forwarded-for': clientIp
      }
    });
    
    if (res.ok) {
      const json = await res.json();
      initialData = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch initial page data:", err);
  }

  return <ClientPublishedPage customUrl={customUrl} initialData={initialData} />;
}
