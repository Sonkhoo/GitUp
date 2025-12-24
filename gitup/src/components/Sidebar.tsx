"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Home, ListTodo, Leaf, Users, Bell, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { ModeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Todo", href: "/todos", icon: ListTodo },
  { label: "Habits", href: "/habits", icon: Leaf },
  { label: "Friends", href: "/social", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(false);

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={() => setDesktopOpen(!desktopOpen)}
        className={`hidden md:flex fixed top-4 z-50 w-8 h-8 bg-background border border-border rounded-full items-center justify-center shadow-card hover:bg-muted transition-all duration-300 ${desktopOpen ? "left-[244px]" : "left-2"
          }`}
      >
        {desktopOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex fixed top-0 z-40 h-screen
          bg-background border-r border-border shadow-card
          flex-col transition-all duration-300 w-64
          ${desktopOpen ? "left-0" : "-left-64"}
        `}
      >

        {/* Top-aligned nav items */}
        <nav className="flex flex-col mt-6 gap-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 transition-colors
                  ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}
                  ${desktopOpen ? "justify-start" : "justify-center"}
                `}
              >
                <Icon size={18} strokeWidth={2} />
                {desktopOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle and Sign-out at bottom */}
        <div className="mt-auto px-2 mb-4 space-y-2">
          <div className={`flex items-center ${desktopOpen ? "justify-start px-3" : "justify-center"}`}>
            <ModeToggle />
          </div>
          <button
            onClick={() =>
              authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })
            }
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 w-full
              text-destructive/70 hover:text-destructive hover:bg-muted transition
              ${desktopOpen ? "justify-start" : "justify-center"}
            `}
          >
            <LogOut size={18} strokeWidth={2} />
            {desktopOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile floating navbar */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background border border-border rounded-xl shadow-card flex items-center justify-center px-2 py-1 gap-2 md:hidden"
        style={{ maxWidth: "80vw" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-8 h-6 rounded-lg transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              title={item.label}
            >
              <Icon size={12} strokeWidth={2} />
            </Link>
          );
        })}
        <div className="w-px h-6 bg-border" />
        <ModeToggle />
        <button
          onClick={() =>
            authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })
          }
          className="flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors text-destructive/70 hover:text-destructive"
          title="Sign out"
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </div>
    </>
  );
}
