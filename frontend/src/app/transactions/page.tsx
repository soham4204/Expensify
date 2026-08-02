"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentTransactions, Transaction } from "@/components/dashboard/RecentTransactions";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchData() {
      try {
        const [expensesRes, recurringRes] = await Promise.all([
          fetch(`${API_URL}/expenses/?limit=50`),
          fetch(`${API_URL}/recurring/`)
        ]);

        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          setTransactions(expensesData.map((e: any) => ({
            id: e.id,
            title: e.merchant,
            date: e.date,
            amount: e.amount,
            type: "expense",
            category: "General"
          })));
        }

        if (recurringRes.ok) {
          setRecurring(await recurringRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your expenses, income, and recurring bills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
          ) : (
            <RecentTransactions transactions={transactions} />
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6 mt-0 lg:mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recurring</h2>
              <button className="text-sm text-primary font-medium hover:underline">Manage</button>
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
            
            <button className="w-full mt-6 py-2 bg-secondary text-secondary-foreground font-medium rounded-xl text-sm hover:bg-secondary/80 transition-colors">
              Add Recurring
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
