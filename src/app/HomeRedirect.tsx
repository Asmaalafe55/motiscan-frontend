"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HomePage from "@/components/HomePage";

/** Sends logged-in users to their dashboard; others see the landing page. */
export default function HomeRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6366f1] border-t-transparent" />
      </div>
    );
  }

  return <HomePage />;
}
