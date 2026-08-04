"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, PieChart, Sparkles, LineChart, Download, Menu, X, TrendingUp, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[280px] bg-card border-r border-border min-h-screen p-6 flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-bold text-foreground">Expensify</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} />
          <NavItem href="/transactions" icon={<Receipt size={20} />} label="Transactions" active={pathname === "/transactions"} />
          <NavItem href="/accounts" icon={<Wallet size={20} />} label="Accounts" active={pathname === "/accounts"} />
          <NavItem href="/investments" icon={<TrendingUp size={20} />} label="Investments" active={pathname === "/investments"} />
          <NavItem href="/budgets" icon={<PieChart size={20} />} label="Budgets" active={pathname === "/budgets"} />
          <NavItem href="/analytics" icon={<LineChart size={20} />} label="Analytics" active={pathname === "/analytics"} />
          <NavItem href="http://localhost:8001/export/csv" icon={<Download size={20} />} label="Export Data" />
        </nav>

        <div className="mt-auto p-4 rounded-xl bg-secondary/50 border border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">AI Assistant</h3>
          <p className="text-xs text-muted-foreground mb-3">Your financial insights are ready.</p>
          <Link href="/chat" className="block w-full py-2 bg-primary text-primary-foreground text-center rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Open Chat
          </Link>
        </div>

        <div className="mt-4">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium text-sm"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        <MobileNavItem href="/" icon={<LayoutDashboard size={20} />} label="Home" active={pathname === "/"} />
        <MobileNavItem href="/transactions" icon={<Receipt size={20} />} label="Txns" active={pathname === "/transactions"} />
        <MobileNavItem href="/budgets" icon={<PieChart size={20} />} label="Budgets" active={pathname === "/budgets"} />
        <MobileNavItem href="/analytics" icon={<LineChart size={20} />} label="Analytics" active={pathname === "/analytics"} />
        <MobileNavItem href="/chat" icon={<Sparkles size={20} />} label="AI Chat" active={pathname === "/chat"} />
      </nav>
    </>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active 
          ? "bg-secondary text-foreground font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
