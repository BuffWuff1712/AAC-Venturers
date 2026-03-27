"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { to: "/caregiver/login", label: "Caregiver" },
  { to: "/child/select", label: "Child Practice" },
  { to: "/caregiver/history", label: "Analytics" },
];

export function AppShell({ children }) {
  const pathname = usePathname();

  function isActiveRoute(target) {
    if (target === "/caregiver/history") {
      return pathname.startsWith("/caregiver/history");
    }

    if (target === "/caregiver/login") {
      return pathname.startsWith("/caregiver");
    }

    if (target === "/child/select") {
      return pathname.startsWith("/child");
    }

    return pathname === target;
  }

  return (
    <div className="min-h-screen bg-mesh text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-8 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-mint">AAC-Venturers</p>
              <h1 className="text-2xl font-semibold text-white">Practice confident canteen ordering</h1>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={
                    `rounded-full px-4 py-2 text-sm transition ${
                      isActiveRoute(item.to)
                        ? "bg-coral text-white"
                        : "bg-white/10 text-slate-200 hover:bg-white/15"
                    }`
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
