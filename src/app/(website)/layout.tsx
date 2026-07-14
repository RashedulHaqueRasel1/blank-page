import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Blank Notes",
  description:
    "Blank Notes for writing",
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
