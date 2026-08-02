"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import ReactMarkdown from "react-markdown";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"charts" | "reports">("charts");
  const [spendingData, setSpendingData] = useState([]);
  const [cashflowData, setCashflowData] = useState([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);

  const COLORS = ['#C29DC2', '#D9B5DD', '#E4C4E2', '#EED3E6', '#A985B2'];

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchAnalytics() {
      try {
        const [spendingRes, cashflowRes, reportRes] = await Promise.all([
          fetch(`${API_URL}/analytics/spending-by-category`),
          fetch(`${API_URL}/analytics/cashflow`),
          fetch(`${API_URL}/ai/generate-report`)
        ]);

        if (spendingRes.ok) setSpendingData(await spendingRes.json());
        if (cashflowRes.ok) setCashflowData(await cashflowRes.json());
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setReport(reportData.markdown);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Visualize your financial trends and cash flow.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("charts")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === "charts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Charts
          </button>
          <button 
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === "reports" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Weekly Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading analytics...</div>
      ) : activeTab === "charts" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spending by Category */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Spending by Category (This Month)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Cashflow */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Cashflow (Last 6 Months)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4C4E2" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8B8392', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B8392', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#C29DC2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#EED3E6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <ReactMarkdown>{report || "No report available for this week."}</ReactMarkdown>
        </div>
      )}
    </DashboardLayout>
  );
}
