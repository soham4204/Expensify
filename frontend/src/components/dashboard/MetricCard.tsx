import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  amount: string;
  trend?: string;
  isPositive?: boolean;
  icon: ReactNode;
}

export function MetricCard({ title, amount, trend, isPositive, icon }: MetricCardProps) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
          {icon}
        </div>
      </div>
      <div className="mb-1">
        <span className="text-3xl font-bold text-foreground">{amount}</span>
      </div>
      {trend && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {isPositive ? "+" : ""}{trend}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
