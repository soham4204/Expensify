"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus } from "lucide-react";

interface BudgetUsage {
  budget: { id: number; amount: number; period: string; category_id: number | null };
  spent: number;
  remaining: number;
  percentage_used: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchBudgets() {
      try {
        const res = await fetch(`${API_URL}/budgets/usage`);
        if (res.ok) {
          setBudgets(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch budgets", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgets();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Keep track of your spending limits.</p>
        </div>
        <button 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl border border-border text-center">
          <p className="text-muted-foreground">No budgets set up yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const isOver = b.percentage_used > 100;
            const isWarning = b.percentage_used > 85 && !isOver;
            
            let barColor = "bg-primary";
            if (isOver) barColor = "bg-destructive";
            else if (isWarning) barColor = "bg-orange-400";

            return (
              <div key={b.budget.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{b.budget.category_id ? `Category ${b.budget.category_id}` : "Overall"} Budget</h3>
                    <p className="text-xs text-muted-foreground capitalize">{b.budget.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{b.spent.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ ₹{b.budget.amount.toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full ${barColor} transition-all duration-500`} 
                    style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs font-medium">
                  <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
                    {isOver ? `Over by ₹${Math.abs(b.remaining).toLocaleString()}` : `${b.percentage_used}% used`}
                  </span>
                  <span className="text-muted-foreground">
                    {!isOver && `₹${b.remaining.toLocaleString()} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
