import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export function TransactionModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: () => void }) {
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAiSubmit = async () => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${API_URL}/ai/parse-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText })
      });
      if (res.ok) {
        onSubmit();
        onClose();
        setAiText("");
      } else {
        console.error("Failed to parse transaction");
      }
    } catch (e) {
      console.error(e);
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
        
        <h2 className="text-xl font-semibold mb-6 text-foreground">Add Transaction</h2>
        
        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl">
          <button 
            onClick={() => setMode("ai")}
            className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${mode === "ai" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles size={16} className={mode === "ai" ? "text-primary" : ""} /> AI Magic
          </button>
          <button 
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Manual
          </button>
        </div>

        {mode === "ai" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Just type what you spent</label>
              <textarea 
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. Paid 450 for coffee at Starbucks yesterday using HDFC" 
                className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground focus:border-primary outline-none transition-colors resize-none"
              />
            </div>
            <button 
              onClick={handleAiSubmit}
              disabled={loading || !aiText}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Thinking..." : <><Sparkles size={18} /> Add automatically</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
              <input type="number" placeholder="₹0.00" className="w-full h-12 bg-background border border-border rounded-xl px-4 text-foreground focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Merchant / Source</label>
              <input type="text" placeholder="e.g. Starbucks" className="w-full h-12 bg-background border border-border rounded-xl px-4 text-foreground focus:border-primary outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                <input type="date" className="w-full h-12 bg-background border border-border rounded-xl px-4 text-foreground focus:border-primary outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Account</label>
                <select className="w-full h-12 bg-background border border-border rounded-xl px-4 text-foreground focus:border-primary outline-none transition-colors">
                  <option>HDFC Bank</option>
                  <option>Cash</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => { onSubmit(); onClose(); }}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl mt-4 hover:bg-primary/90 transition-colors"
            >
              Save Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
