import { useState, useRef } from "react";
import { X, FileText, Upload, Sparkles } from "lucide-react";

export function ImportStatementModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/ai/import-statement`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to parse statement");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-semibold mb-2 text-foreground">Import Statement</h2>
        <p className="text-sm text-muted-foreground mb-6">Upload a CSV or PDF bank statement. Gemini AI will extract and categorize all transactions.</p>
        
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-2xl bg-muted/30">
          <input 
            type="file" 
            accept=".csv,application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          {loading ? (
            <div className="flex flex-col items-center text-primary">
              <Sparkles size={32} className="animate-pulse mb-3" />
              <span className="font-medium text-sm">Analyzing statement with Gemini...</span>
              <span className="text-xs text-muted-foreground mt-1">This may take up to a minute.</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center px-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-medium text-sm mb-1">Select File</h3>
              <p className="text-xs text-muted-foreground mb-4">Supports .CSV and .PDF</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors"
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
