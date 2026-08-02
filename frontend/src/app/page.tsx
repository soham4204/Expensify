"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine the API URL (use local FastAPI backend in development)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    async function fetchCategories() {
      try {
        const response = await fetch(`${API_URL}/categories/`);
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-zinc-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          AI Expense Tracker
        </h1>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          
          {loading && <p className="text-zinc-400 animate-pulse">Loading categories...</p>}
          
          {error && <p className="text-red-500">Error: {error}</p>}
          
          {!loading && !error && categories.length === 0 && (
            <p className="text-zinc-500">No categories found. Start by adding one in the backend.</p>
          )}

          {!loading && !error && categories.length > 0 && (
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id} className="p-3 bg-zinc-800 rounded-lg flex justify-between items-center transition-colors hover:bg-zinc-700">
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && <span className="text-zinc-400 text-xs">{cat.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
