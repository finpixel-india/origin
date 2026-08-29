"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Logo, LogoMark } from "./Logo";
import { useLocalStorage } from "@/lib/store/useLocalStorage";

export type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
};

const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  ),
  diary: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
      <path d="M9 8h6M9 11h4" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <path d="M3 20h18" />
      <path d="M4 20V9M9 20V5M14 20v-9M19 20V3" />
    </svg>
  ),
  bucket: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.5 9.5-3.5 2-2 3.5 3.5-2 2-3.5Z" />
    </svg>
  ),
  work: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <path d="M12 3v18M7 21h10" />
      <path d="M12 6 4 9l-1.5 5a3 3 0 0 0 5 0L6 9l6-3 6 3-1.5 5a3 3 0 0 0 5 0L20 9l-8-3Z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="19" height="19" {...s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  ),
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: ICONS.home },
  { href: "/diary", label: "Daily Habit", short: "Diary", icon: ICONS.diary },
  { href: "/report", label: "Report", short: "Report", icon: ICONS.report },
  { href: "/bucket", label: "Bucket List", short: "Bucket", icon: ICONS.bucket },
  { href: "/work", label: "Work", short: "Work", icon: ICONS.work },
  { href: "/balance", label: "Asset", short: "Asset", icon: ICONS.balance },
  { href: "/settings", label: "Settings", short: "Settings", icon: ICONS.settings },
];

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      prefetch={true}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={`group relative flex items-center rounded-lg text-sm transition-colors duration-200 ${
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
      } ${
        active
          ? "bg-white/[0.06] text-silver-100"
          : "text-silver-500 hover:bg-white/[0.04] hover:text-silver-200"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-amethyst-400" />
      )}
      <span
        className={`${collapsed ? "" : "nav-slide"} ${
          active ? "text-amethyst-300" : "text-silver-500 group-hover:text-silver-300"
        }`}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span className="nav-slide flex-1 truncate font-medium tracking-wide">{item.label}</span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    "origin.sidebar.collapsed.v1",
    false
  );

  const activeIndex = NAV_ITEMS.findIndex((n) =>
    n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)
  );
  // The diary needs every vertical pixel it can get, so its page runs tighter.
  const isDiary = pathname.startsWith("/diary");

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside
        className={`sidebar-glass sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.06] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
          collapsed ? "w-[78px]" : "w-[254px]"
        }`}
      >
        {/* Fixed brand header — never scrolls */}
        <div
          className={`flex h-[74px] shrink-0 items-center border-b border-white/[0.06] ${
            collapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          {collapsed ? (
            <LogoMark size={28} />
          ) : (
            <Logo tagline />
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-silver-500 transition hover:border-white/20 hover:text-silver-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" {...s}>
                <path d="m14 7-5 5 5 5" />
              </svg>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex shrink-0 justify-center border-b border-white/[0.06] py-2.5">
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="press grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-silver-500 transition hover:border-white/20 hover:text-silver-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" {...s}>
                <path d="m10 7 5 5-5 5" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable nav region */}
        <nav
          className={`flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain py-5 ${
            collapsed ? "px-3" : "px-5"
          }`}
        >
          {NAV_ITEMS.map((item, i) => (
            <NavRow
              key={item.href}
              item={item}
              active={activeIndex === i}
              collapsed={collapsed}
            />
          ))}
        </nav>

      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Mobile top — fixed so it never scrolls, with padding so content isn't hidden */}
        <header className="sidebar-glass fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.06] px-5 py-3 lg:hidden">
          <Logo size={26} />
          <span className="text-[0.6rem] uppercase tracking-[0.28em] text-silver-600">
            {activeIndex >= 0 ? NAV_ITEMS[activeIndex].label : "Origin"}
          </span>
        </header>

        <main
          className={`min-w-0 flex-1 overflow-x-hidden px-4 pb-28 pt-14 sm:px-6 lg:px-6 lg:pt-5 ${
            isDiary ? "lg:pb-4" : "lg:pb-12"
          }`}
        >
          {/* keyed by pathname → every route change plays a smooth enter animation */}
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="sidebar-glass fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="flex items-stretch justify-between">
            {NAV_ITEMS.map((item, i) => {
              const active = activeIndex === i;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`group flex flex-1 flex-col items-center gap-1 py-2.5 transition-all duration-150 active:scale-90 ${
                    active ? "text-amethyst-300" : "text-silver-600"
                  }`}
                >
                  <span className="icon-pop">{item.icon}</span>
                  <span className="text-[0.55rem] font-medium tracking-wide">{item.short}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export { LogoMark };
