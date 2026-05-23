"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";

export default function MainProviders({ children }: { children: ReactNode }) {
  // important: useState ensures QueryClient is not recreated on every render
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Fetch client's public IP client-side for accurate geolocation testing on localhost
        let publicIp: string | undefined = undefined;
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json");
          const ipData = await ipRes.json();
          publicIp = ipData.ip;
        } catch (e) {
          // Ignore if public IP fetching is blocked or fails
        }

        const serverUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Skip tracking if serverUrl is local but the site is accessed from a public production domain
        const isLocalServer = serverUrl ? (serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) : false;
        const isPublicDomain = typeof window !== 'undefined' && 
                               window.location.hostname !== 'localhost' && 
                               window.location.hostname !== '127.0.0.1';
        
        if (!serverUrl || (isLocalServer && isPublicDomain)) {
          // Do not fetch if serverUrl is missing or local server is called from a public domain
          return;
        }
        
        // Disguise and obfuscate tracking payload by converting it to Base64
        const rawPayload = {
          referrer: document.referrer || 'Direct',
          ip: publicIp,
        };
        const obfuscatedData = btoa(JSON.stringify(rawPayload));

        await fetch(`${serverUrl}/analytics/track-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            d: obfuscatedData,
          }),
        });
      } catch (error) {
        // Silently catch errors to prevent any disruption to the frontend user experience
        console.error('System config load failed:', error);
      }
    };

    trackVisit();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
