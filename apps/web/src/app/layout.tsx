import type { Metadata, Viewport } from "next";
import { generalSans } from "@/lib/fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accès au dossier de sourcing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${generalSans.variable} ${generalSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
