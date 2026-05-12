import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/website/Common/Navbar";

export const metadata: Metadata = {
  title: "Blank Page",
  description:
    "Blank page for writing",
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
