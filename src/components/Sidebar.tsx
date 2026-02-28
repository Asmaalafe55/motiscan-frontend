"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Menu,
  X,
  History,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: "teacher" | "student";
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}

const teacherLinks = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/exams", label: "Exams", icon: FileText },
  { href: "/teacher/exercises", label: "Exercise Library", icon: Library },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/reports", label: "Reports", icon: BarChart3 },
];

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/history", label: "History", icon: History },
];

export function Sidebar({ role, collapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-blue-900 to-purple-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand + toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-white">
            MotiScan
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="text-white hover:bg-white/10 ml-auto"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
