import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const wallets = [
  { id: "hiro" as const, name: "Hiro Wallet", desc: "Browser extension" },
  { id: "xverse" as const, name: "Xverse", desc: "Mobile & browser" },
  { id: "leather" as const, name: "Leather", desc: "Multi-chain wallet" },
];

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connect, isConnecting } = useWallet();

  const handleConnect = async (walletType: "hiro" | "xverse" | "leather") => {
    await connect(walletType);
    onOpenChange(false);
    toast.success("Wallet connected successfully", {
      description: "Your stacking data is now loading.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect Wallet</DialogTitle>
          <DialogDescription>Select your preferred Stacks wallet to continue.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => handleConnect(w.id)}
              disabled={isConnecting}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all disabled:opacity-50 group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold font-mono text-sm group-hover:glow-primary transition-shadow">
                {w.id[0].toUpperCase()}
              </div>
              <div className="text-left flex-1">
                <div className="font-medium text-foreground">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.desc}</div>
              </div>
              {isConnecting && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
