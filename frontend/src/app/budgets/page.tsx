"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, X } from "lucide-react";

interface BudgetUsage {
  budget: { id: number; amount: number; period: string; category_id: number | null; category_name: string | null };
  spent: number;
  remaining: number;
  percentage_used: number;
}

interface CreateBudgetForm {
  amount: string;
  period: "monthly" | "weekly";
  category_id: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateBudgetForm>({ amount: "", period: "monthly", category_id: "" });
  const { token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchBudgets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/budgets/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBudgets(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch budgets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        amount: parseFloat(form.amount),
        period: form.period,
      };
      if (form.category_id) payload.category_id = parseInt(form.category_id);

      const res = await fetch(`${API_URL}/budgets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setForm({ amount: "", period: "monthly", category_id: "" });
        await fetchBudgets();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create budget.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Keep track of your spending limits.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
          <p className="text-muted-foreground mb-4">No budgets set up yet.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Create your first budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const isOver = b.percentage_used > 100;
            const isWarning = b.percentage_used > 85 && !isOver;
            
            let barColor = "bg-primary";
            if (isOver) barColor = "bg-destructive";
            else if (isWarning) barColor = "bg-orange-400";

            const budgetLabel = b.budget.category_name || "Overall";

            return (
              <div key={b.budget.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{budgetLabel} Budget</h3>
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

      {/* Create Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-foreground">Create Budget</h2>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Budget Amount (₹)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Period</label>
                <select
                  value={form.period}
                  onChange={e => setForm({ ...form, period: e.target.value as "monthly" | "weekly" })}
                  className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category ID (optional — leave blank for overall)</label>
                <input
                  type="number"
                  min="1"
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  placeholder="Leave blank for an overall budget"
                  className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
