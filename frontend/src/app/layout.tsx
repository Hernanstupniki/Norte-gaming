import type { Metadata } from "next";
import { Rajdhani, Space_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { Topbar } from "@/components/layout/topbar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { FavoriteToast } from "@/components/common/favorite-toast";
import "./globals.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Norte Gaming | Periféricos gamer premium",
  description:
    "Tienda online de periféricos gamer en Argentina. Mejor precio, productos originales y atención personalizada.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className={`${rajdhani.variable} ${spaceMono.variable} antialiased`}>
        <AppProviders>
          <Topbar />
          <Navbar />
          {children}
          <Footer />
          <CartDrawer />
          <WhatsAppFab />
          <FavoriteToast />
        </AppProviders>
      </body>
    </html>
  );
}
