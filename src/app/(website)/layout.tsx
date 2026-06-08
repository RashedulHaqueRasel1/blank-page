import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "My Blank Page",
  description:
    "My Blank page for writing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
