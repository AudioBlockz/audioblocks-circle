import type { Metadata } from "next";
import React, { Suspense } from 'react';
import localFont from "next/font/local";
import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-toastify/dist/ReactToastify.css";
import Providers from "@/context/providers";
import { ToastContainer } from "react-toastify";
import { headers } from "next/headers";
import { WIPBanner } from "@/components/Wim";
import GoogleAnalytics from "../components/Google-Analytics";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AudioBlocks - Decentralized Music",
  description: "Own the music, support the artist, revolutionize the industry",
 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = headers().get('cookie')
  return (
    <html lang="en">

      <head>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap" rel="stylesheet"/>
      <Suspense fallback={null}>
        <GoogleAnalytics GA_MEASUREMENT_ID='G-7Q75HNHMKY' />
      </Suspense>

      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          
          <Providers cookies={cookies}>
            <WIPBanner/>
            {children}
            <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
