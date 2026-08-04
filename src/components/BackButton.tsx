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

/** Explicit parent for each public page — avoids unreliable history.back(). */
function getBackHref(pathname: string): string {
  if (pathname === "/login" || pathname.startsWith("/login/")) return "/";
  if (
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/")
  ) {
    return "/login";
  }
  return "/";
}

/**
 * Global floating back button, fixed to the top-left corner.
 * Only rendered on public pre-login pages (see PUBLIC_ROUTES).
 * Navigates to a known parent route (login → home, password flows → login)
 * instead of window.history.back(), which often fails or leaves the site.
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
    router.push(getBackHref(pathname));
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
