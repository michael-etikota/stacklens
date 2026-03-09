import React from "react";
import { LayoutDashboard, Calculator, Users, Clock, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Simulator", path: "/simulator", icon: Calculator },
  { label: "Pools", path: "/pools", icon: Users },
  { label: "History", path: "/history", icon: Clock },
  { label: "Settings", path: "/settings", icon: Settings },
];

export const MobileBottomNav = React.forwardRef<HTMLElement>(
  function MobileBottomNav(_props, ref) {
    const location = useLocation();

    return (
      <nav ref={ref} aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                {...(item.path === "/simulator" ? { "data-tour": "nav-simulator" } : {})}
                {...(item.path === "/pools" ? { "data-tour": "nav-pools" } : {})}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }
);
