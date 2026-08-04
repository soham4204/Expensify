"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecurringModal({ isOpen, onClose, onSuccess }: RecurringModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    merchant_or_source: "",
    amount: "",
    type: "expense",
    frequency: "monthly",
    next_run_date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${API_URL}/recurring/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setForm({
          merchant_or_source: "",
          amount: "",
          type: "expense",
          frequency: "monthly",
          next_run_date: new Date().toISOString().split("T")[0],
        });
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create recurring transaction.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold mb-6 text-foreground">Add Recurring Transaction</h2>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Merchant / Source</label>
            <input
              required
              type="text"
              value={form.merchant_or_source}
              onChange={e => setForm({ ...form, merchant_or_source: e.target.value })}
              placeholder="e.g. Netflix, Salary"
              className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
                className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Next Run Date</label>
              <input
                required
                type="date"
                value={form.next_run_date}
                onChange={e => setForm({ ...form, next_run_date: e.target.value })}
                className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
