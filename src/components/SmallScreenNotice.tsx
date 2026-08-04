import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  GraduationCap,
  Laptop,
  Maximize2,
  TabletSmartphone,
} from "lucide-react";

/**
 * Smallest viewport width MotiScan supports, in pixels.
 * Kept in sync with the Tailwind `lg` breakpoint that drives the gate in
 * `app/layout.tsx`: change one and you must change the other.
 */
export const MIN_SUPPORTED_WIDTH = 1024;

/**
 * Full-screen notice shown instead of the app on viewports narrower than
 * `MIN_SUPPORTED_WIDTH`. Visibility is decided purely by the `lg:hidden`
 * media query, so it renders correctly on the server and never flashes.
 */
export default function SmallScreenNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-5 py-12 text-slate-900 lg:hidden">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] shadow-md">
          <GraduationCap className="h-6 w-6 text-white" />
        </span>
        <span className="text-xl font-bold tracking-tight">
          Moti<span className="text-[#6366f1]">Scan</span>
        </span>
      </div>

      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardContent className="p-8 pt-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <TabletSmartphone className="h-6 w-6 text-slate-400" />
            </span>
            <ArrowRight className="h-5 w-5 text-slate-300" />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] shadow-md">
              <Laptop className="h-7 w-7 text-white" />
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">
            This screen is too small
          </h1>

          <p className="mt-3 text-slate-600">
            MotiScan is built for laptops and desktops. Please open it on a
            device with a screen at least{" "}
            <span className="font-semibold text-slate-900">
              {MIN_SUPPORTED_WIDTH}px
            </span>{" "}
            wide.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-left">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-[#6366f1]" />
            <p className="text-sm leading-relaxed text-slate-600">
              Dashboards, live sessions, and motivation reports rely on wide
              charts and tables that stay readable only on a large screen.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-sm text-slate-500">
            <Maximize2 className="h-4 w-4 shrink-0" />
            <span>Already on a laptop? Try widening your browser window.</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        &copy; {new Date().getFullYear()} MotiScan
      </p>
    </div>
  );
}
