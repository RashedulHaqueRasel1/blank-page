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

        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
        
        // Disguise and obfuscate tracking payload by converting it to Base64
        const rawPayload = {
          referrer: document.referrer || 'Direct',
          ip: publicIp,
        };
        const obfuscatedData = btoa(JSON.stringify(rawPayload));

        await fetch(`${serverUrl}/api/v1/sys/init`, {
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
