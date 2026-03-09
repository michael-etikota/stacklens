import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { TourProvider } from "@/contexts/TourContext";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { Skeleton } from "@/components/ui/skeleton";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Simulator = lazy(() => import("./pages/Simulator"));
const Pools = lazy(() => import("./pages/Pools"));
const PoolDetail = lazy(() => import("./pages/PoolDetail"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <NetworkProvider>
        <WalletProvider>
          <TourProvider>
          <TooltipProvider>
            <Sonner
              toastOptions={{
                classNames: {
                  success: "!bg-green-50 !border-green-200 !text-green-900 dark:!bg-green-950 dark:!border-green-800 dark:!text-green-100",
                  error: "!bg-red-50 !border-red-200 !text-red-900 dark:!bg-red-950 dark:!border-red-800 dark:!text-red-100",
                  warning: "!bg-yellow-50 !border-yellow-200 !text-yellow-900 dark:!bg-yellow-950 dark:!border-yellow-800 dark:!text-yellow-100",
                  info: "!bg-blue-50 !border-blue-200 !text-blue-900 dark:!bg-blue-950 dark:!border-blue-800 dark:!text-blue-100",
                },
              }}
            />
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/simulator" element={<Simulator />} />
                  <Route path="/pools" element={<Pools />} />
                  <Route path="/pools/:id" element={<PoolDetail />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <TourOverlay />
          </TooltipProvider>
          </TourProvider>
        </WalletProvider>
      </NetworkProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
