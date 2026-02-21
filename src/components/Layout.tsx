"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  role: "teacher" | "student";
}

export function Layout({ children, role }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    if (!user || user.role !== role) {
      router.push("/login");
    }
  }, [user, role, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user || user.role !== role) {
    return null;
  }

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar role={role} />
      <div className="flex-1 ml-64 rtl:ml-0 rtl:mr-64">
        <header className="sticky top-0 z-30 w-full border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome, {user.name}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRTL(!isRTL)}
              >
                {isRTL ? "LTR" : "RTL"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
