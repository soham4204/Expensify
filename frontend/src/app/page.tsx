"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions, Transaction } from "@/components/dashboard/RecentTransactions";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { Wallet, TrendingUp, CreditCard, Plus } from "lucide-react";

export default function Home() {
  const [summary, setSummary] = useState({ current_balance: 0, today_spending: 0, month_spending: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchData() {
      try {
        const [summaryRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/summary`),
          fetch(`${API_URL}/expenses/?limit=5`)
        ]);

        if (summaryRes.ok) {
          setSummary(await summaryRes.json());
        }
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          setTransactions(expensesData.map((e: any) => ({
            id: e.id,
            title: e.merchant,
            date: e.date,
            amount: e.amount,
            type: "expense",
            category: "General" // Will link to categories later
          })));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Soham</h1>
          <p className="text-muted-foreground mt-1">Here's your financial overview for this month.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <RecentTransactions transactions={transactions} />
      
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={() => {
          // Placeholder for refreshing data
          console.log("Transaction saved");
        }}
      />
    </DashboardLayout>
  );
}
