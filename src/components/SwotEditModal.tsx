import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface SwotEditModalProps {
  quadrant: Quadrant;
  userId: string;
  items: string[];
  onClose: () => void;
  onSaved: (quadrant: Quadrant, items: string[]) => void;
}

const QUADRANT_META: Record<Quadrant, { letter: string; label: string; accentVar: string }> = {
  strength: { letter: "S", label: "Strengths", accentVar: "--strength" },
  weakness: { letter: "W", label: "Weaknesses", accentVar: "--weakness" },
  opportunity: { letter: "O", label: "Opportunities", accentVar: "--opportunity" },
  threat: { letter: "T", label: "Threats", accentVar: "--threat" },
};

const MAX_ITEMS = 4;

const SwotEditModal = ({ quadrant, userId, items: initialItems, onClose, onSaved }: SwotEditModalProps) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<string[]>(initialItems.length > 0 ? [...initialItems] : [""]);
  const [isSaving, setIsSaving] = useState(false);
  const meta = QUADRANT_META[quadrant];

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const updateRow = (idx: number, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? val : r)));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    if (rows.length < MAX_ITEMS) setRows((prev) => [...prev, ""]);
  };

  const handleSave = async () => {
    const cleaned = rows.map((r) => r.trim()).filter(Boolean);
    setIsSaving(true);

    // Delete existing items for this quadrant
    const { error: delError } = await supabase
      .from("swot_items")
      .delete()
      .eq("user_id", userId)
      .eq("quadrant", quadrant);

    if (delError) {
      setIsSaving(false);
      toast({ title: "Couldn't save — try again", variant: "destructive", duration: Infinity });
      return;
    }

    // Insert new items
    if (cleaned.length > 0) {
      const inserts = cleaned.map((content, i) => ({
        user_id: userId,
        quadrant,
        content,
        sort_order: i,
      }));
      const { error: insError } = await supabase.from("swot_items").insert(inserts);
      if (insError) {
        setIsSaving(false);
        toast({ title: "Couldn't save — try again", variant: "destructive", duration: Infinity });
        return;
      }
    }

    setIsSaving(false);
    onSaved(quadrant, cleaned);
    toast({ title: `${meta.label} updated`, duration: 3000 });
    onClose();
  };

  const accentColor = `hsl(var(${meta.accentVar}))`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-[480px] rounded-2xl border border-border bg-card p-8 shadow-2xl"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
                {meta.letter} — {meta.label}
              </span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-3 mb-4">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={row}
                  onChange={(e) => updateRow(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary transition-colors duration-200"
                  style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
                />
                <button
                  onClick={() => removeRow(idx)}
                  className="shrink-0 text-destructive/60 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add item */}
          {rows.length < MAX_ITEMS && (
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
              style={{ "--hover-color": accentColor } as React.CSSProperties}
            >
              <Plus className="h-3.5 w-3.5" />
              Add item
            </button>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg text-primary-foreground"
              style={{ backgroundColor: accentColor }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SwotEditModal;
