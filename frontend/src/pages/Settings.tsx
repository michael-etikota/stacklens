import { AppLayout } from "@/components/AppLayout";
import { PageHeading } from "@/components/PageHeading";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Palette, Globe, Wallet, Sun, Moon, Monitor, RotateCcw } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useTour } from "@/contexts/TourContext";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function usePersistedState<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  const set = useCallback((v: T) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [value, set];
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { network, setNetwork } = useNetwork();
  const { isConnected, truncatedAddress, address, disconnect } = useWallet();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [currency, setCurrency] = usePersistedState("stacklens-currency", "usd");
  const [rpcEndpoint, setRpcEndpoint] = usePersistedState("stacklens-rpc", "");
  const [refreshInterval, setRefreshInterval] = usePersistedState("stacklens-refresh", "30");

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <AppLayout>
      <PageTransition>
        <div className="container py-8 max-w-2xl space-y-6">
         <PageHeading
            title="Settings"
            description="Manage your preferences and configuration"
            icon={<SettingsIcon className="h-6 w-6 text-primary" />}
          />

          {/* Appearance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Appearance
              </CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((opt) => (
                    <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      theme === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <motion.div key={`${opt.value}-${theme === opt.value}`} initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                      <opt.icon className="h-5 w-5" />
                    </motion.div>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Display */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Display
              </CardTitle>
              <CardDescription>Currency and data preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-32 bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="btc">BTC (₿)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Data Refresh Interval</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="w-32 bg-muted/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Network */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Network
              </CardTitle>
              <CardDescription>Switch between Mainnet and Testnet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${network === "mainnet" ? "bg-success" : "bg-warning"} animate-pulse`} />
                  <span className="text-sm font-medium capitalize">{network}</span>
                </div>
                <Switch
                  checked={network === "testnet"}
                  onCheckedChange={(checked) => setNetwork(checked ? "testnet" : "mainnet")}
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Custom RPC Endpoint</Label>
                <Input
                  placeholder="https://stacks-node-api.mainnet.stacks.co"
                  value={rpcEndpoint}
                  onChange={(e) => setRpcEndpoint(e.target.value)}
                  className="bg-muted/30 border-border/50 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to use the default endpoint</p>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Tour */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" /> Onboarding Tour
              </CardTitle>
              <CardDescription>Restart the guided tour of StackLens features</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  localStorage.removeItem("stacklens-tour-completed");
                  navigate("/dashboard");
                  setTimeout(startTour, 400);
                  toast.success("Tour restarted!");
                }}
              >
                <RotateCcw className="h-4 w-4" /> Restart Tour
              </Button>
            </CardContent>
          </Card>

          {/* Wallet */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Connected Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">{truncatedAddress}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{address}</div>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the wallet menu in the header to disconnect.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No wallet connected. Connect via the header button.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
