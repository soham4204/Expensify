import Link from "next/link";
import { LayoutDashboard, Receipt, Wallet, PieChart, Sparkles, LineChart, Download } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-[280px] bg-card border-r border-border min-h-screen p-6 flex flex-col hidden md:flex">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Sparkles size={20} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Expensify</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavItem href="/transactions" icon={<Receipt size={20} />} label="Transactions" />
        <NavItem href="/accounts" icon={<Wallet size={20} />} label="Accounts" />
        <NavItem href="/budgets" icon={<PieChart size={20} />} label="Budgets" />
        <NavItem href="/analytics" icon={<LineChart size={20} />} label="Analytics" />
        <NavItem href="http://localhost:8000/export/csv" icon={<Download size={20} />} label="Export Data" />
      </nav>

      <div className="mt-auto p-4 rounded-xl bg-secondary/50 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">AI Assistant</h3>
        <p className="text-xs text-muted-foreground mb-3">Your financial insights are ready.</p>
        <Link href="/chat" className="block w-full py-2 bg-primary text-primary-foreground text-center rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Open Chat
        </Link>
      </div>
    </aside>
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
