import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export interface Transaction {
  id: number;
  title: string;
  date: string;
  amount: number;
  type: "expense" | "income";
  category?: string;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        <button className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent transactions found.</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "expense" ? "bg-red-100 text-red-600 dark:bg-red-900/20" : "bg-green-100 text-green-600 dark:bg-green-900/20"
                }`}>
                  {tx.type === "expense" ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} • {tx.category || "Uncategorized"}</p>
                </div>
              </div>
              <div className={`font-semibold ${tx.type === "expense" ? "text-foreground" : "text-green-600 dark:text-green-400"}`}>
                {tx.type === "expense" ? "-" : "+"}₹{tx.amount.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
