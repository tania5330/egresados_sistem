import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Egresados y Oferta Laboral",
  description: "Plataforma de gestión de egresados y ofertas laborales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TRPCProvider>
      </body>
    </html>
  );
}
