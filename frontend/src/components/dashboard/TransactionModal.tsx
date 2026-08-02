import { useState, useRef } from "react";
import { X, Sparkles, Upload, Camera } from "lucide-react";

export function TransactionModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: () => void }) {
  const [mode, setMode] = useState<"manual" | "ai" | "receipt">("ai");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/ai/scan-receipt`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        onSubmit();
        onClose();
      }
    } catch (err) {
      console.error(err);
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
            className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-colors ${mode === "ai" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles size={14} className={mode === "ai" ? "text-primary" : ""} /> Text
          </button>
          <button 
            onClick={() => setMode("receipt")}
            className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-colors ${mode === "receipt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Camera size={14} className={mode === "receipt" ? "text-primary" : ""} /> Scan
          </button>
          <button 
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors ${mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Manual
          </button>
        </div>

        {mode === "ai" && (
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
        )}
        
        {mode === "receipt" && (
          <div className="space-y-4 flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-2xl bg-muted/30">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            {loading ? (
              <div className="flex flex-col items-center text-primary">
                <Sparkles size={32} className="animate-pulse mb-3" />
                <span className="font-medium text-sm">Extracting details...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center px-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                  <Upload size={20} />
                </div>
                <h3 className="font-medium text-sm mb-1">Upload Receipt</h3>
                <p className="text-xs text-muted-foreground mb-4">Gemini Vision will automatically extract the merchant, amount, and date.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  Choose Image
                </button>
              </div>
            )}
          </div>
        )}
        
        {mode === "manual" && (
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
