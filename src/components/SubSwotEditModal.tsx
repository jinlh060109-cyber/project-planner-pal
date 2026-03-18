import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

export interface SubSwot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  strength: string[];
  weakness: string[];
  opportunity: string[];
  threat: string[];
  created_at: string;
}

interface SubSwotEditModalProps {
  subSwot: SubSwot | null; // null = create new
  userId: string;
  onClose: () => void;
  onSaved: (item: SubSwot) => void;
}

const QUADRANT_META: Record<Quadrant, { letter: string; label: string; cssVar: string; placeholders: string[] }> = {
  strength: { letter: "S", label: "Strengths", cssVar: "--strength", placeholders: ["e.g. Clear storytelling ability", "e.g. Confident body language", "e.g. Strong vocal projection"] },
  weakness: { letter: "W", label: "Weaknesses", cssVar: "--weakness", placeholders: ["e.g. Nervous with large audiences", "e.g. Tend to rush through slides", "e.g. Struggle with Q&A sessions"] },
  opportunity: { letter: "O", label: "Opportunities", cssVar: "--opportunity", placeholders: ["e.g. Join a local Toastmasters club", "e.g. Volunteer for team presentations", "e.g. Record and review practice runs"] },
  threat: { letter: "T", label: "Threats", cssVar: "--threat", placeholders: ["e.g. Avoiding practice due to anxiety", "e.g. Negative feedback loops", "e.g. Comparing myself to expert speakers"] },
};

const QUADRANTS: Quadrant[] = ["strength", "weakness", "opportunity", "threat"];
const MAX_ITEMS_PER_QUADRANT = 3;

const SubSwotEditModal = ({ subSwot, userId, onClose, onSaved }: SubSwotEditModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(subSwot?.name || "");
  const [description, setDescription] = useState(subSwot?.description || "");
  const [quadrantItems, setQuadrantItems] = useState<Record<Quadrant, string[]>>({
    strength: subSwot?.strength?.length ? [...subSwot.strength] : [""],
    weakness: subSwot?.weakness?.length ? [...subSwot.weakness] : [""],
    opportunity: subSwot?.opportunity?.length ? [...subSwot.opportunity] : [""],
    threat: subSwot?.threat?.length ? [...subSwot.threat] : [""],
  });
  const [openQuadrants, setOpenQuadrants] = useState<Record<Quadrant, boolean>>({
    strength: true,
    weakness: true,
    opportunity: true,
    threat: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const updateItem = (q: Quadrant, idx: number, val: string) => {
    setQuadrantItems((prev) => ({
      ...prev,
      [q]: prev[q].map((item, i) => (i === idx ? val : item)),
    }));
  };

  const removeItem = (q: Quadrant, idx: number) => {
    setQuadrantItems((prev) => ({
      ...prev,
      [q]: prev[q].filter((_, i) => i !== idx),
    }));
  };

  const addItem = (q: Quadrant) => {
    if (quadrantItems[q].length < MAX_ITEMS_PER_QUADRANT) {
      setQuadrantItems((prev) => ({ ...prev, [q]: [...prev[q], ""] }));
    }
  };

  const toggleQuadrant = (q: Quadrant) => {
    setOpenQuadrants((prev) => ({ ...prev, [q]: !prev[q] }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Skill name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    const cleaned: Record<Quadrant, string[]> = {
      strength: quadrantItems.strength.map((s) => s.trim()).filter(Boolean),
      weakness: quadrantItems.weakness.map((s) => s.trim()).filter(Boolean),
      opportunity: quadrantItems.opportunity.map((s) => s.trim()).filter(Boolean),
      threat: quadrantItems.threat.map((s) => s.trim()).filter(Boolean),
    };

    const payload = {
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      strength: cleaned.strength,
      weakness: cleaned.weakness,
      opportunity: cleaned.opportunity,
      threat: cleaned.threat,
    };

    let result;
    if (subSwot) {
      result = await supabase
        .from("sub_swots")
        .update(payload)
        .eq("id", subSwot.id)
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("sub_swots")
        .insert(payload)
        .select()
        .single();
    }

    setIsSaving(false);

    if (result.error) {
      toast({ title: "Couldn't save — try again", variant: "destructive", duration: Infinity });
      return;
    }

    onSaved(result.data as SubSwot);
    toast({ title: "Skill profile saved", duration: 3000 });
    onClose();
  };

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
          className="relative w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-8 shadow-2xl"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
              {subSwot ? "Edit Skill" : "New Skill Profile"}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Part 1 — Identity */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Skill name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Public Speaking"
                className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. My ability to communicate ideas clearly under pressure"
                rows={2}
                className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary transition-colors duration-200 resize-none"
              />
            </div>
          </div>

          {/* Part 2 — Mini SWOT fields */}
          <div className="space-y-4 mb-6">
            {QUADRANTS.map((q) => {
              const meta = QUADRANT_META[q];
              const accentColor = `hsl(var(${meta.cssVar}))`;
              const items = quadrantItems[q];

              return (
                <Collapsible
                  key={q}
                  open={openQuadrants[q]}
                  onOpenChange={() => toggleQuadrant(q)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                    <span className="text-[13px] font-semibold tracking-widest uppercase text-muted-foreground">
                      {meta.letter} — {meta.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform duration-200",
                        openQuadrants[q] && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateItem(q, idx, e.target.value)}
                          placeholder={`Item ${idx + 1}`}
                          className="bg-background border-border focus-visible:ring-0 focus-visible:border-primary transition-colors duration-200"
                        />
                        <button
                          onClick={() => removeItem(q, idx)}
                          className="shrink-0 text-destructive/60 hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {items.length < MAX_ITEMS_PER_QUADRANT && (
                      <button
                        onClick={() => addItem(q)}
                        className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add item
                      </button>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {/* Part 3 — Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save skill"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubSwotEditModal;
