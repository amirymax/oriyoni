import type { Metadata } from "next";
import { Cinzel, Manrope, Syne } from "next/font/google";
import Script from "next/script";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { WishlistProvider } from "@/context/WishlistContext";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "ORIYONI — Wear the Crown",
    template: "%s — ORIYONI",
  },
  description:
    "ORIYONI is a streetwear house built on heavyweight tees and hoodies, cut clean and made to last. Wear the crown.",
  icons: {
    icon: "/brand/favicon-32.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${manrope.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AnnouncementBar />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <CartDrawer />
                <BottomTabBar />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>

        {/* Yandex.Metrika counter.

            The tag is Metrika's own, pasted as given. It is wrapped in a
            hostname check so a local dev server never reports visits: without
            it, every page we open while working shows up in the shop's
            reports as a customer. */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
              (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112249278', 'ym');

              ym(112249278, 'init', {ssr:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
            }
          `}
        </Script>
        <noscript>
          <div>
            {/* next/image is a React component and needs JavaScript, which is
                the one thing this fallback cannot assume. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mc.yandex.ru/watch/112249278"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
