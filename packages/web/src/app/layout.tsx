import { AuthProvider } from "@components";
import { Metadata } from "next";
import { Catamaran, Maven_Pro } from "next/font/google";
import "./globals.css";

const maven = Maven_Pro({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-maven",
});

const catamaran = Catamaran({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-catamaran",
});

export const metadata: Metadata = {
  title: "ChatESV",
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
  return (
    <html lang="en">
      <body className={`${catamaran.variable} ${maven.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
