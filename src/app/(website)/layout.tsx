import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/website/Common/Navbar";

export const metadata: Metadata = {
  title: "Services Services",
  description:
    "Elite craftsmanship in custom stone, tile, and masonry for homes & businesses across the Valley.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}

    </>
  );
}
