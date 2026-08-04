"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  BarChart3,
  Users,
  Sparkles,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Motivation Insights",
    description:
      "MotiScan turns everyday assessments into clear motivation signals, so teachers can see who's engaged and who needs a boost — instantly.",
  },
  {
    icon: Users,
    title: "Built for Teachers & Students",
    description:
      "Teachers get dashboards, live sessions, and detailed reports. Students get focused exercises that make progress feel rewarding.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Reports",
    description:
      "Automatically generated summaries highlight trends, strengths, and areas to support — no spreadsheets or guesswork required.",
  },
];

export default function HomePage() {
  const [accessOpen, setAccessOpen] = useState(false);

  const handleRequestAccess = () => setAccessOpen(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Moti<span className="text-[#6366f1]">Scan</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              asChild
              className="border-0 bg-gradient-to-r from-[#6366f1] to-[#7c3aed] text-white shadow hover:opacity-90"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-[#6366f1] shadow-sm">
            <Sparkles className="h-4 w-4" />
            Understand motivation, not just grades
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Track student motivation with{" "}
            <span className="bg-gradient-to-r from-[#6366f1] to-[#7c3aed] bg-clip-text text-transparent">
              clarity and confidence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            MotiScan helps teachers measure, understand, and nurture student
            motivation through smart assessments and AI-powered insights — so
            every learner stays engaged and supported.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              onClick={handleRequestAccess}
              className="border-indigo-200 px-8 text-[#6366f1] hover:bg-indigo-50 hover:text-[#6366f1]"
            >
              <Building2 className="h-5 w-5" />
              Request Institutional Access
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="px-8 text-slate-600 hover:bg-slate-100 hover:text-[#6366f1]"
            >
              <a href="#about">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7c3aed]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-10 -z-10 h-64 w-64 rounded-full bg-[#6366f1]/20 blur-3xl" />
      </section>

      {/* About System Section */}
      <section id="about" className="border-t border-slate-200/70 bg-white/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How MotiScan{" "}
              <span className="bg-gradient-to-r from-[#6366f1] to-[#7c3aed] bg-clip-text text-transparent">
                works for you
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A single platform that connects teachers and students around what
              really drives learning: motivation.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group border-slate-200 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              >
                <CardContent className="p-8">
                  <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] shadow-md transition-transform group-hover:scale-105">
                    <Icon className="h-7 w-7 text-white" />
                  </span>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-slate-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button
              size="lg"
              onClick={handleRequestAccess}
              className="border-0 bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-8 text-white shadow-lg hover:opacity-90"
            >
              <Building2 className="h-5 w-5" />
              Request Institutional Access
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/80 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#6366f1]" />
            <span className="font-semibold text-slate-700">MotiScan</span>
          </div>
          <p>&copy; {new Date().getFullYear()} MotiScan. All rights reserved.</p>
        </div>
      </footer>

      {/* Institutional access notice modal */}
      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center space-y-3 text-center sm:text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] shadow-md">
              <Building2 className="h-7 w-7 text-white" />
            </span>
            <DialogTitle>Institutional access only</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              MotiScan is managed directly through organizations and
              self-registration is disabled. You can test the system using our
              Demo credentials on the login page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setAccessOpen(false)}
              className="border-0 bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-8 text-white hover:opacity-90"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
