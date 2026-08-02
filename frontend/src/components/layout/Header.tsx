import { Bell, Search, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-20 bg-background flex items-center justify-between px-8 border-b border-border">
      <div className="flex items-center bg-card border border-border rounded-xl px-4 py-2 w-96 focus-within:border-primary transition-colors">
        <Search size={18} className="text-muted-foreground mr-2" />
        <input 
          type="text" 
          placeholder="Search transactions, accounts..." 
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Soham</p>
            <p className="text-xs text-muted-foreground">Free Plan</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
