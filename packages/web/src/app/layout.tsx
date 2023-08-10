import { SessionProvider } from "@components/SessionProvider";
import { Metadata } from "next";
import { Catamaran, Kanit } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";

const kanit = Kanit({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kanit",
});

const catamaran = Catamaran({
  weight: "200",
  subsets: ["latin"],
  variable: "--font-catamaran",
});

export const metadata: Metadata = {
  title: "revelationsAI",
  description: "Discover Jesus like never before",
  viewport: "width=device-width, initial-scale=1",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionToken = cookies().get("session");

  return (
    <SessionProvider sessionToken={sessionToken?.value}>
      <html lang="en">
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7748872527931209"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <body className={`${catamaran.variable} ${kanit.variable}`}>
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
