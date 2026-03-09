import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PageHeading } from "@/components/PageHeading";
import { ErrorState } from "@/components/ErrorState";
import { format } from "date-fns";
import { Download, Search, CalendarIcon, ArrowUpDown, ExternalLink, Bitcoin, Coins, Hash } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTransactionHistory } from "@/hooks/use-stacking-data";
import { PageTransition } from "@/components/PageTransition";
import { useWallet } from "@/contexts/WalletContext";
import { WalletModal } from "@/components/WalletModal";
import { Wallet } from "lucide-react";
import { MobileTransactionCard } from "@/components/history/MobileTransactionCard";
import { NotConnectedIllustration } from "@/components/dashboard/EmptyStateIllustration";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import type { Transaction } from "@/data/mock-data";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

type SortKey = "date" | "amount" | "cycle";
type SortDir = "asc" | "desc";

const typeColors: Record<string, string> = {
  reward: "border-accent/30 text-accent",
  stack: "border-primary/30 text-primary",
  unstack: "border-destructive/30 text-destructive",
  delegate: "border-success/30 text-success",
};

function HistoryNotConnected() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <NotConnectedIllustration className="mb-6" />
        <h2 className="text-2xl font-bold mb-3 font-display">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Connect your Stacks wallet to view your stacking history and reward transactions.
        </p>
        <Button size="lg" onClick={() => setModalOpen(true)} className="gap-2 glow-primary">
          <Wallet className="h-4 w-4" /> Connect Wallet
        </Button>
      </div>
      <WalletModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}

export default function HistoryPage() {
  const { isConnected } = useWallet();
  const { data: transactions, isLoading, isError, refetch } = useTransactionHistory(isConnected);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (search && !t.txId.toLowerCase().includes(search.toLowerCase())) return false;
        if (dateFrom && new Date(t.date) < dateFrom) return false;
        if (dateTo && new Date(t.date) > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortKey === "cycle") return dir * (a.cycle - b.cycle);
        return dir * (parseFloat(a.amount.replace(/,/g, "")) - parseFloat(b.amount.replace(/,/g, "")));
      });
  }, [transactions, search, typeFilter, sortKey, sortDir, dateFrom, dateTo]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Summaries
  const totalBtcRewards = useMemo(() =>
    (transactions ?? []).filter((t) => t.type === "reward").reduce((sum, t) => sum + parseFloat(t.amount), 0),
    [transactions]
  );
  const totalStxStacked = useMemo(() =>
    (transactions ?? []).filter((t) => t.type === "stack").reduce((sum, t) => sum + parseFloat(t.amount.replace(/,/g, "")), 0),
    [transactions]
  );

  const isMobile = useIsMobile();

  const exportCSV = () => {
    const header = "Date,Type,Amount,Currency,Cycle,TxId,Status,USD Value";
    const rows = filtered.map((t) =>
      `${t.date},${t.type},${t.amount},${t.currency},${t.cycle},${t.txId},${t.status},${t.usdValue}`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "stacklens-history.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported", { description: `${filtered.length} transactions` });
  };

  if (!isConnected) {
    return <HistoryNotConnected />;
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="container py-8">
          <ErrorState message="Failed to load transaction history." onRetry={() => refetch()} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="container py-8 space-y-6">
          {/* Header */}
          <motion.div {...fadeUp}>
            <PageHeading
              title="Stacking History"
              description="Track all your stacking transactions and rewards"
              actions={
                <Button variant="outline" onClick={exportCSV} className="gap-2 shrink-0">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              }
            />
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="glass-card"><CardContent className="p-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))
            ) : (
              <>
                <Card className="glass-card hover:border-accent/20 transition-colors">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Bitcoin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total BTC Rewards</div>
                      <div className="text-lg font-bold font-mono">{totalBtcRewards.toFixed(4)} BTC</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total STX Stacked</div>
                      <div className="text-lg font-bold font-mono">{totalStxStacked.toLocaleString()} STX</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover:border-success/20 transition-colors">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Transactions</div>
                      <div className="text-lg font-bold font-mono">{transactions?.length ?? 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by tx hash..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reward">Reward</SelectItem>
                <SelectItem value="stack">Stack</SelectItem>
                <SelectItem value="unstack">Unstack</SelectItem>
                <SelectItem value="delegate">Delegate</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Table */}
          <Card className="glass-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  {isMobile ? (
                    <div>
                      {paged.map((t) => (
                        <MobileTransactionCard key={t.id} transaction={t} />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("date")}>
                            <span className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
                          </TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                            <span className="flex items-center gap-1">Amount <ArrowUpDown className="h-3 w-3" /></span>
                          </TableHead>
                          <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("cycle")}>
                            <span className="flex items-center gap-1">Cycle <ArrowUpDown className="h-3 w-3" /></span>
                          </TableHead>
                          <TableHead className="text-xs">Tx Hash</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">USD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map((t) => (
                          <TableRow key={t.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                            <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs capitalize ${typeColors[t.type] ?? ""}`}>
                                {t.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{t.amount} {t.currency}</TableCell>
                            <TableCell className="font-mono text-sm">#{t.cycle}</TableCell>
                            <TableCell>
                              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                                {t.txId.slice(0, 10)}…
                                <ExternalLink className="h-3 w-3 opacity-50" />
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${t.status === "confirmed" ? "border-success/30 text-success" : "border-warning/30 text-warning"}`}
                              >
                                {t.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">${t.usdValue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Rows:</span>
                      <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(0); }}>
                        <SelectTrigger className="h-7 w-16 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{page + 1} of {totalPages || 1}</span>
                      <Button variant="outline" size="sm" className="h-7" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
                      <Button variant="outline" size="sm" className="h-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
