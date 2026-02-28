"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Blocks, BrainCircuit, ChartNoAxesCombined, DatabaseZap, LayoutDashboard, Menu, MonitorSmartphone, Moon, Radar, Sun, Workflow } from "lucide-react";
import { useMemo } from "react";
import { useTheme } from "next-themes";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "analytics" | "platform";
};

const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "analytics" },
  { href: "/data-explorer", label: "Data Explorer", icon: DatabaseZap, group: "analytics" },
  { href: "/recommendation-demo", label: "Recommendation Demo", icon: Blocks, group: "analytics" },
  { href: "/model-lab", label: "Model Lab", icon: BrainCircuit, group: "platform" },
  { href: "/ab-testing", label: "A/B Testing", icon: ChartNoAxesCombined, group: "platform" },
  { href: "/monitoring", label: "Monitoring", icon: MonitorSmartphone, group: "platform" },
  { href: "/system-design", label: "System Design", icon: Radar, group: "platform" },
  { href: "/feature-pipeline", label: "Feature Pipeline", icon: Workflow, group: "platform" },
];

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ");
}

function SideNavigation({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  const analytics = navItems.filter((item) => item.group === "analytics");
  const platform = navItems.filter((item) => item.group === "platform");
  const wrapperClass = mobile
    ? "w-full bg-[#0A0A0A]"
    : "hidden w-[240px] shrink-0 border-r border-[#1F1F1F] bg-[#0A0A0A] md:flex";

  return (
    <aside className={wrapperClass}>
      <div className="flex h-full w-full flex-col">
        <div className="h-16 border-b border-[#1F1F1F] px-4 pt-3">
          <p className="font-display text-[28px] font-extrabold leading-none tracking-tight bg-gradient-to-r from-[#E23744] to-[#F5A623] bg-clip-text text-transparent">
            CSAO
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#666666]">
            Intelligence Platform
          </p>
        </div>

        <div className="px-3 pb-4 pt-3">
          <div className="pb-2">
            <p className="px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#444444]">Analytics</p>
          </div>
          <nav className="space-y-1">
            {analytics.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </nav>
        </div>

        <div className="mx-3 border-t border-[#1F1F1F] pt-3">
          <div className="pb-2">
            <p className="px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#444444]">Platform</p>
          </div>
          <nav className="space-y-1">
            {platform.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-[#1F1F1F] px-4 py-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#121212] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: "pulse-dot 1.8s infinite" }} />
            <span className="font-mono text-[11px] text-[#8f8f8f]">API Live · 37ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-12 items-center gap-3 rounded-lg px-3 font-body text-[14px] transition-all duration-200",
        active ? "text-white" : "text-[#888888] hover:bg-[#1C1C1C] hover:text-white",
      )}
      style={
        active
          ? {
              background: "linear-gradient(135deg, rgba(226,55,68,0.2), rgba(226,55,68,0.02) 42%, transparent)",
            }
          : undefined
      }
    >
      {active && (
        <span
          className="absolute left-0 top-[7px] h-8 w-[3px] rounded-r bg-[#E23744]"
          style={{ transformOrigin: "left", animation: "slide-border-in 220ms ease-out" }}
        />
      )}
      <Icon className={cn("h-[18px] w-[18px]", active ? "text-[#E23744]" : "text-[#888888] group-hover:text-white")} />
      <span>{item.label}</span>
    </Link>
  );
}

function TopBar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const current = useMemo(() => {
    if (pathname === "/") return "Overview";
    return toTitleCase(pathname.replace("/", ""));
  }, [pathname]);

  return (
    <header className="glass-topbar sticky top-0 z-20 h-14 px-4 md:px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3 md:gap-5">
          <MobileMenu />
          <div className="font-mono text-[12px] text-[#666666]">
            <span>App</span>
            <span className="mx-2 text-[#444444]">/</span>
            <span>{current}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex items-center gap-1 rounded-full border border-white/15 bg-[#171717] p-1 text-xs text-[#d7d7d7]"
          >
            <span
              className={cn(
                "rounded-full px-2 py-1 font-mono text-[10px] transition-colors",
                resolvedTheme === "dark" ? "bg-[#E23744] text-white" : "text-[#9b9b9b]",
              )}
            >
              <Moon className="h-3 w-3" />
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-1 font-mono text-[10px] transition-colors",
                resolvedTheme === "light" ? "bg-[#F5A623] text-black" : "text-[#9b9b9b]",
              )}
            >
              <Sun className="h-3 w-3" />
            </span>
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-white/10 bg-[#181818] p-2 text-[#d5d5d5] transition-colors hover:bg-[#222222]"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E23744]" />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E23744] to-[#F5A623] font-mono text-xs font-semibold text-white">
            CI
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E23744] to-transparent" />
    </header>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="rounded-lg border border-white/10 bg-[#1A1A1A] p-2 text-white md:hidden" aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] border-r-0 bg-[#0A0A0A] p-0">
        <SideNavigation mobile />
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#111111] text-[#E8E8E8]">
      <SideNavigation />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-6 pt-4 md:px-6 md:pt-5">{children}</main>
      </div>
    </div>
  );
}
