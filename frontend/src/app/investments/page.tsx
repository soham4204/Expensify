"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";

interface Investment {
  id: number;
  asset_name: string;
  ticker_symbol: string;
  quantity: number;
  avg_purchase_price: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
  profit_loss_pct: number;
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ asset_name: "", ticker_symbol: "", quantity: "", avg_purchase_price: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchInvestments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/investments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInvestments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        asset_name: form.asset_name,
        ticker_symbol: form.ticker_symbol,
        quantity: parseFloat(form.quantity),
        avg_purchase_price: parseFloat(form.avg_purchase_price)
      };
      const res = await fetch(`${API_URL}/investments/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ asset_name: "", ticker_symbol: "", quantity: "", avg_purchase_price: "" });
        await fetchInvestments();
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/investments/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchInvestments();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.avg_purchase_price * inv.quantity), 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalProfit = totalValue - totalInvested;
  const totalProfitPct = totalInvested > 0 ? (totalProfit / totalInvested * 100) : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Investments</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Track your portfolio performance with live prices.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Total Invested" 
          amount={`₹${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          icon={<Wallet size={20} />} 
        />
        <MetricCard 
          title="Current Value" 
          amount={`₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          icon={<TrendingUp size={20} />} 
        />
        <MetricCard 
          title="Total Return" 
          amount={`₹${Math.abs(totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          trend={`${Math.abs(totalProfitPct).toFixed(2)}%`}
          isPositive={totalProfit >= 0}
          icon={totalProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />} 
        />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground text-sm">
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium">Ticker</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Avg Price</th>
                <th className="p-4 font-medium">Current Price</th>
                <th className="p-4 font-medium">Return</th>
                <th className="p-4 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No investments found. Add one to get started!</td>
                </tr>
              ) : (
                investments.map(inv => (
                  <tr key={inv.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{inv.asset_name}</td>
                    <td className="p-4 text-muted-foreground">{inv.ticker_symbol}</td>
                    <td className="p-4">{inv.quantity}</td>
                    <td className="p-4">₹{inv.avg_purchase_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-4">₹{inv.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className={`p-4 font-medium ${inv.profit_loss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {inv.profit_loss >= 0 ? "+" : ""}₹{inv.profit_loss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      <span className="text-xs ml-2 opacity-75">({inv.profit_loss_pct.toFixed(2)}%)</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 relative">
            <h2 className="text-xl font-semibold mb-6">Add Investment</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Asset Name</label>
                <input required type="text" value={form.asset_name} onChange={e => setForm({...form, asset_name: e.target.value})} placeholder="e.g. Apple Inc." className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Yahoo Finance Ticker</label>
                <input required type="text" value={form.ticker_symbol} onChange={e => setForm({...form, ticker_symbol: e.target.value})} placeholder="e.g. AAPL or INFY.NS" className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                  <input required type="number" step="any" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Avg Price</label>
                  <input required type="number" step="any" value={form.avg_purchase_price} onChange={e => setForm({...form, avg_purchase_price: e.target.value})} className="w-full h-10 bg-background border border-border rounded-xl px-4 focus:border-primary outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg">{loading ? "Adding..." : "Add Asset"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
