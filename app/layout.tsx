import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export const metadata: Metadata = {
  title: "Micro Vision — Microbe Segmentation & 3D Educational Viewer",
  description:
    "Upload a Gram-stained bacterial microscope image to explore segmentation, morphology, arrangement, Gram appearance, and a rotatable 3D reference model. Educational use only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <DisclaimerFooter />
      </body>
    </html>
  );
}
