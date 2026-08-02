import { Bell, Search, User, Sparkles } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="h-16 md:h-20 bg-background flex items-center justify-between px-4 md:px-8 border-b border-border">
      {/* Mobile: Logo | Desktop: Search */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Sparkles size={16} />
        </div>
        <h1 className="text-lg font-bold text-foreground">Expensify</h1>
      </div>

      <div className="hidden md:flex items-center bg-card border border-border rounded-xl px-4 py-2 w-96 focus-within:border-primary transition-colors">
        <Search size={18} className="text-muted-foreground mr-2" />
        <input 
          type="text" 
          placeholder="Search transactions, accounts..." 
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-3 pl-3 md:pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Soham</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
