import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Wallet, ChevronDown, Sun, Moon, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNetwork } from "@/contexts/NetworkContext";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Simulator", path: "/simulator" },
  { label: "Pools", path: "/pools" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

export function Header({ hideDeskNav = false }: { hideDeskNav?: boolean }) {
  const { isConnected, truncatedAddress, disconnect, connect } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const { network } = useNetwork();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size={32} className="transition-transform duration-200 group-hover:scale-105" />
            <span className="font-bold text-lg tracking-tight hidden sm:inline font-display">StackLens</span>
          </Link>

          {/* Desktop nav */}
          {!hideDeskNav && (
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 relative">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Network badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              network === "mainnet" ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${network === "mainnet" ? "bg-success" : "bg-warning"}`} />
              <span className={`text-xs font-medium capitalize ${network === "mainnet" ? "text-success" : "text-warning"}`}>{network}</span>
            </div>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <motion.div key={theme} initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.div>
            </Button>

            {/* Wallet */}
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                    <Wallet className="h-3.5 w-3.5" />
                    {truncatedAddress}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDisconnectOpen(true)} className="gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => connect()} className="gap-2 glow-primary">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </Button>
            )}

            {/* Mobile menu toggle */}
            {!hideDeskNav && (
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Gradient bottom border */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <nav aria-label="Mobile navigation" className="container py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Disconnect confirmation */}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your wallet? You'll need to reconnect to view your stacking data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={disconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
