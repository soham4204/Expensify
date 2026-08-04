"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi! I'm your AI Financial Assistant. Ask me about your spending, budgets, or how to save money.", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: "user" }]);
    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now(), text: data.reply, sender: "ai" }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I'm having trouble connecting right now.", sender: "ai" }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, something went wrong.", sender: "ai" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Your personal financial advisor, powered by Gemini.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col h-[calc(100vh-220px)] md:h-[600px]">
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 md:gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>
                {msg.sender === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl ${
                msg.sender === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted text-foreground rounded-tl-none border border-border"
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="max-w-[70%] p-4 rounded-2xl bg-muted text-foreground rounded-tl-none border border-border flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card rounded-b-2xl">
          <div className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:border-primary transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your spending..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none p-2 text-sm text-foreground placeholder:text-muted-foreground"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important financial information.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
