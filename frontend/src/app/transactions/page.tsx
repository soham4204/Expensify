"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentTransactions, Transaction } from "@/components/dashboard/RecentTransactions";
import { ImportStatementModal } from "@/components/dashboard/ImportStatementModal";
import { RecurringModal } from "@/components/dashboard/RecurringModal";
import { FileText, Plus } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "Income" | "Expense">("All");
  const { token } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [expensesRes, incomesRes, recurringRes] = await Promise.all([
        fetch(`${API_URL}/expenses/?limit=100`, { headers }),
        fetch(`${API_URL}/incomes/?limit=100`, { headers }),
        fetch(`${API_URL}/recurring/`, { headers })
      ]);

      const merged: Transaction[] = [];

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        expensesData.forEach((e: any) => merged.push({
          id: e.id,
          title: e.merchant,
          date: e.date,
          amount: e.amount,
          type: "expense",
          category: "General"
        }));
      }

      if (incomesRes.ok) {
        const incomesData = await incomesRes.json();
        incomesData.forEach((e: any) => merged.push({
          id: e.id + 100000,
          title: e.source,
          date: e.date,
          amount: e.amount,
          type: "income",
          category: "Income"
        }));
      }

      // Sort by date descending
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(merged);

      if (recurringRes.ok) {
        setRecurring(await recurringRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredTransactions = filter === "All"
    ? transactions
    : transactions.filter(tx => tx.type === filter.toLowerCase());

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your expenses, income, and recurring bills.</p>
        </div>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <FileText size={18} />
          Import Statement
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(["All", "Income", "Expense"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
          ) : (
            <RecentTransactions transactions={filteredTransactions} />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6 mt-0 lg:mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recurring</h2>
            </div>
            
            <div className="space-y-4">
              {recurring.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recurring transactions.</p>
              ) : (
                recurring.map((r: any) => (
                  <div key={r.id} className="p-3 border border-border rounded-xl">
                    <p className="font-medium text-sm">{r.merchant_or_source}</p>
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="text-muted-foreground capitalize">{r.frequency} • {r.type}</span>
                      <span className="font-semibold text-foreground">₹{r.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="w-full mt-6 py-2 bg-secondary text-secondary-foreground font-medium rounded-xl text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Recurring
            </button>
          </div>
        </div>
      </div>
      
      <ImportStatementModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => fetchData()}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSuccess={() => fetchData()}
      />
    </DashboardLayout>
  );
}
