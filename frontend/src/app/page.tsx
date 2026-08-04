"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions, Transaction } from "@/components/dashboard/RecentTransactions";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { Wallet, TrendingUp, CreditCard, Plus } from "lucide-react";

export default function Home() {
  const [summary, setSummary] = useState({ current_balance: 0, today_spending: 0, month_spending: 0 });
  const [health, setHealth] = useState<{ score: number | null; summary: string }>({ score: null, summary: "Loading..." });
  const [prediction, setPrediction] = useState({ predicted_spend: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, userEmail } = useAuth();

  const displayName = userEmail ? userEmail.split("@")[0] : "there";

  const fetchData = async () => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, expensesRes, incomesRes, healthRes, predRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/summary`, { headers }),
        fetch(`${API_URL}/expenses/?limit=5`, { headers }),
        fetch(`${API_URL}/incomes/?limit=5`, { headers }),
        fetch(`${API_URL}/ai/health`, { headers }),
        fetch(`${API_URL}/ai/predictions`, { headers })
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (predRes.ok) setPrediction(await predRes.json());

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
          id: e.id + 100000, // avoid key collision with expenses
          title: e.source,
          date: e.date,
          amount: e.amount,
          type: "income",
          category: "Income"
        }));
      }
      // Sort merged by date desc
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(merged.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {displayName} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Here's your financial overview for this month.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          New Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard 
          title="Total Balance" 
          amount={`₹${summary.current_balance.toLocaleString()}`} 
          trend="2.5%" 
          isPositive={true} 
          icon={<Wallet size={20} />} 
        />
        <MetricCard 
          title="Today's Spending" 
          amount={`₹${summary.today_spending.toLocaleString()}`} 
          icon={<CreditCard size={20} />} 
        />
        <MetricCard 
          title="Monthly Spending" 
          amount={`₹${summary.month_spending.toLocaleString()}`} 
          trend="12%" 
          isPositive={false}
          icon={<TrendingUp size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 md:p-6 rounded-2xl flex items-center justify-between">
          <div className="mr-3">
            <h3 className="text-primary font-semibold mb-1 text-sm md:text-base">Financial Health Score</h3>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{health.summary}</p>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-primary shrink-0">
            {health.score !== null ? health.score : "–"}<span className="text-base md:text-lg text-muted-foreground">/100</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border p-4 md:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-foreground font-semibold mb-1 text-sm md:text-base">Projected Month-End</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Based on your current run-rate</p>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground shrink-0">₹{Math.round(prediction.predicted_spend).toLocaleString()}</div>
        </div>
      </div>

      <RecentTransactions transactions={transactions} />
      
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={() => {
          fetchData(); // Refresh data after adding transaction
        }}
      />
    </DashboardLayout>
  );
}
