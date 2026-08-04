import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LiveSessionProvider } from "@/contexts/LiveSessionContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { Toaster } from "@/components/ui/toaster";
import BackButton from "@/components/BackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MotiScan - Student Motivation Tracking System",
  description: "Track and analyze student motivation through AI-powered assessments",
  icons: {
    icon: "/motiscan-logo.svg",
    shortcut: "/motiscan-logo.svg",
    apple: "/motiscan-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LiveSessionProvider>
            <WebSocketProvider>
              <BackButton />
              {children}
              <Toaster />
            </WebSocketProvider>
          </LiveSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
