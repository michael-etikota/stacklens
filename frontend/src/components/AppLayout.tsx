import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const appRoutes = ["/dashboard", "/simulator", "/pools", "/history", "/settings"];

export function AppLayout({ children, showFooter = false }: AppLayoutProps) {
  const location = useLocation();
  const isAppPage = appRoutes.some((r) => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Header hideDeskNav={isAppPage} />

      {isAppPage ? (
        <SidebarProvider>
          <div className="flex-1 flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="md:hidden hidden">
                {/* SidebarTrigger available if needed */}
                <SidebarTrigger className="ml-2" />
              </div>
              <main id="main-content" className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </div>
          <MobileBottomNav />
        </SidebarProvider>
      ) : (
        <>
          <main id="main-content" className="flex-1">{children}</main>
          {showFooter && <Footer />}
        </>
      )}
    </div>
  );
}
