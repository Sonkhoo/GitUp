"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
const navItems = [
  { label: "Home", href: "/" },
  { label: "Todo", href: "/todos" },
  { label: "Habits", href: "/habits" },
  { label: "Friends", href: "/social" },
  { label: "Notifications", href: "/notifications" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Sidebar */}
		<aside
		className={`fixed left-0 top-0 z-40 h-screen w-64 border-r transition-transform duration-200 ease-in-out ${
			open ? "translate-x-0" : "-translate-x-full"
		}`}
		style={{
			borderColor: "hsl(var(--border))",
			background: "hsl(var(--background))",
		}}
		>
        <div className="flex flex-col h-full px-4 py-6">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="self-end mb-6 p-2 rounded hover:bg-muted"
          >
            <FaChevronLeft size={12} />
          </button>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
				<Link
				key={item.href}
				href={item.href}
				className={`card-hover rounded px-3 py-2 text-sm font-medium transition-all hover:bg-muted `}
				>
				{item.label}
				</Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="mt-auto">
            <button
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/login"),
                  },
                });
              }}
              className="text-sm font-medium text-destructive/70 hover:text-destructive"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Floating open button (visible only when closed) */}
      {!open && (
			<button
			onClick={() => setOpen(true)}
			aria-label="Open sidebar"
			className="fixed left-4 top-4 z-50 rounded-r bg-background border border-border p-2 shadow-card hover:bg-muted"
			>
          <FaChevronRight size={12} />
        </button>
      )}
    </>
  );
}
