"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  // Show a full-screen spinner while auth state is being resolved to prevent flicker
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Sparkles size={36} className="animate-pulse text-primary" />
          <p className="text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Button - hidden on mobile (bottom nav has chat link) */}
      <Link 
        href="/chat"
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <Sparkles size={24} />
      </Link>
    </div>
  );
}
