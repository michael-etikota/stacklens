import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useTour } from "@/contexts/TourContext";
import { useWallet } from "@/contexts/WalletContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { startTour } = useTour();
  const { isConnected, connect } = useWallet();

  const handleStartTour = async () => {
    localStorage.removeItem("stacklens-tour-completed");
    if (!isConnected) {
      await connect("hiro");
    }
    navigate("/dashboard");
    setTimeout(() => startTour(), 800);
  };
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed!", { description: `We'll send updates to ${email}` });
    setEmail("");
  };

  return (
    <footer className="relative border-t border-border/50 bg-background/50 backdrop-blur-sm">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-bold text-lg font-display">StackLens</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              The most advanced stacking analytics platform for the Stacks ecosystem.
            </p>
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-xs">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/simulator" className="hover:text-foreground transition-colors">Simulator</Link>
              <Link to="/pools" className="hover:text-foreground transition-colors">Pools</Link>
              <Link to="/history" className="hover:text-foreground transition-colors">History</Link>
              <button onClick={handleStartTour} className="text-left hover:text-foreground transition-colors">Take a Tour</button>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Resources</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="https://docs.stacks.co/stacks-101/stacking" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Stacking Guide</a>
              <a href="https://docs.stacks.co/stacks-101/api" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">API Reference</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Community</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="https://twitter.com/StackLens" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="https://discord.gg/stacks" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a>
              <a href="https://github.com/stacklens" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          © 2026 StackLens. Built on Stacks.
        </div>
      </div>
    </footer>
  );
}
