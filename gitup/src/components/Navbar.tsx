import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModeToggle } from "./ui/theme-toggle";

const navItems = [
  { label: "Todo", href: "/dashboard/todos" },
  { label: "Habits", href: "/dashboard/habits" },
  { label: "Friends", href: "/dashboard/social" },
];

export default function Navbar({ onSignOut }: { onSignOut: () => void }) {
  const router = useRouter();
  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium hover:underline"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onSignOut}
          className="text-sm font-medium hover:underline"
          style={{ color: 'hsl(var(--destructive))' }}
        >
          Sign out
        </button>
        <ModeToggle />
      </div>
    </nav>
  );
}
