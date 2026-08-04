"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem("auth_token");
    const storedEmail = localStorage.getItem("auth_email");
    if (storedToken) {
      setToken(storedToken);
      setUserEmail(storedEmail);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Redirect if no token and not on login/register page
    if (!isLoading) {
      const isAuthPage = pathname === "/login" || pathname === "/register";
      if (!token && !isAuthPage) {
        router.push("/login");
      } else if (token && isAuthPage) {
        router.push("/");
      }
    }
  }, [token, isLoading, pathname, router]);

  const login = async (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    // Fetch user email from /auth/me
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("auth_email", user.email);
        setUserEmail(user.email);
      }
    } catch {
      // Non-critical — email is cosmetic
    }
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    setToken(null);
    setUserEmail(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, userEmail, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
