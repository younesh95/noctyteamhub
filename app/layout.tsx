import type { Metadata } from "next";
import "./globals.css";
import ConnectionGate from "../features/team/ConnectionGate";

export const metadata: Metadata = {
  title: "NOCTYS • Team Headquarters",
  description: "Espace tactique et entraînement NOCTYS E-sports.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <ConnectionGate>{children}</ConnectionGate>
      </body>
    </html>
  );
}
