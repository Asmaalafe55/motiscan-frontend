"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Public (pre-login) routes where the back button should appear.
 * Hidden on the home page ("/") and all protected dashboard routes.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/about",
];

/**
 * Global floating back button, fixed to the top-left corner.
 * Only rendered on public pre-login pages (see PUBLIC_ROUTES).
 * Returns to the previous page, falling back to the home page
 * when there's no history to go back to.
 */
export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Only shown on public pre-login pages.
  if (!isPublicRoute) return null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="fixed left-4 top-4 z-[9999] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-md transition-all hover:-translate-x-0.5 hover:border-indigo-200 hover:text-[#6366f1] hover:shadow-lg"
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
