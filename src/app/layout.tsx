import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LiveSessionProvider } from "@/contexts/LiveSessionContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { Toaster } from "@/components/ui/toaster";
import BackButton from "@/components/BackButton";
import SmallScreenNotice from "@/components/SmallScreenNotice";

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

// Without `width=device-width`, mobile Safari reports a ~980px layout viewport
// and the small-screen gate below would never trigger on a phone.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        <SmallScreenNotice />

        <AuthProvider>
          <LiveSessionProvider>
            <WebSocketProvider>
              {/* Below `lg` the app is hidden in favour of SmallScreenNotice.
                  `lg:contents` drops this wrapper from the layout on supported
                  screens so page-level sizing keeps working unchanged. */}
              <div className="hidden lg:contents">
                <BackButton />
                {children}
                <Toaster />
              </div>
            </WebSocketProvider>
          </LiveSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
