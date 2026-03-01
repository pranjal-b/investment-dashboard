"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BarChart3, ChevronLeft } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/investment-dashboard", label: "Analytics", icon: BarChart3 },
  { href: "/investment-dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function SidebarNavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/investment-dashboard" &&
            pathname?.startsWith("/investment-dashboard"));
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="font-semibold truncate">Investment Dashboard</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>
      <div className={cn("overflow-hidden", collapsed && "flex flex-col items-center")}>
        <SidebarNavContent />
      </div>
    </aside>
  );
}
