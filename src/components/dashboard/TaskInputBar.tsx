import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task, Quadrant } from "./types";
import { QUADRANT_CONFIG, getTodayISO } from "./types";

const QUADRANT_PILLS: { key: Quadrant; letter: string; color: string }[] = [
  { key: "strength", letter: "S", color: "hsl(var(--strength))" },
  { key: "weakness", letter: "W", color: "hsl(var(--weakness))" },
  { key: "opportunity", letter: "O", color: "hsl(var(--opportunity))" },
  { key: "threat", letter: "T", color: "hsl(var(--threat))" },
];

interface TaskInputBarProps {
  onTaskAdded: (task: Task) => void;
  selectedDate?: Date;
}

const toLocalISO = (d: Date) => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};

const TaskInputBar = ({ onTaskAdded, selectedDate }: TaskInputBarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [taskInput, setTaskInput] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
  const [manualReasoning, setManualReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchToManual = useCallback((showToast = false) => {
    setIsManualMode(true);
    if (showToast) {
      toast({
        title: "AI classification unavailable. You can add this task manually.",
        duration: 5000,
      });
    }
  }, [toast]);

  const handleAIAdd = useCallback(async () => {
    const text = taskInput.trim();
    if (!text || isClassifying) return;

    setIsClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-task", {
        body: { taskContent: text, taskDate: selectedDate ? toLocalISO(selectedDate) : getTodayISO() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const newTask = data.task as Task;
      onTaskAdded(newTask);
      setTaskInput("");
      const config = QUADRANT_CONFIG[newTask.quadrant as Quadrant];
      toast({ title: `Classified → ${config?.label || newTask.quadrant}`, duration: 3000 });
    } catch (e: any) {
      console.error("Classification error:", e);
      // Auto-fallback to manual mode
      switchToManual(true);
    } finally {
      setIsClassifying(false);
    }
  }, [taskInput, isClassifying, toast, onTaskAdded, switchToManual]);

  const handleManualAdd = useCallback(async () => {
    const text = taskInput.trim();
    if (!text || !selectedQuadrant || !user || isSubmitting) return;

    setIsSubmitting(true);
    const reasoning = manualReasoning.trim() || "Manually added";

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        content: text,
        quadrant: selectedQuadrant,
        reasoning,
        priority: "Medium",
        is_completed: false,
        task_date: selectedDate ? toLocalISO(selectedDate) : getTodayISO(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to add task — try again", variant: "destructive" });
    } else if (data) {
      onTaskAdded({ ...data, matched_skill: null, skill_reasoning: null } as Task);
      setTaskInput("");
      setManualReasoning("");
      setSelectedQuadrant(null);
      const config = QUADRANT_CONFIG[selectedQuadrant];
      toast({ title: `Added to ${config.label}`, duration: 3000 });
    }
    setIsSubmitting(false);
  }, [taskInput, selectedQuadrant, manualReasoning, user, isSubmitting, toast, onTaskAdded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isManualMode) {
        handleManualAdd();
      } else {
        handleAIAdd();
      }
    }
  };

  const isAddDisabled = isManualMode
    ? !taskInput.trim() || !selectedQuadrant || isSubmitting
    : !taskInput.trim() || isClassifying;

  return (
    <div className="border-t border-border px-4 py-3 shrink-0">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Input row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              placeholder="What do you need to do today?"
              maxLength={200}
              className="pr-20 transition-colors duration-200 focus-visible:ring-primary"
              disabled={isClassifying || isSubmitting}
            />
            {!isManualMode && (
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 font-mono text-muted-foreground pointer-events-none"
              >
                ⌘ Enter
              </Badge>
            )}
          </div>
          <Button
            onClick={isManualMode ? handleManualAdd : handleAIAdd}
            disabled={isAddDisabled}
            className="shrink-0"
          >
            {isClassifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Classifying...
              </>
            ) : isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isManualMode ? "Add Task" : "Add Task"}
              </>
            )}
          </Button>
        </div>

        {/* Manual mode toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setIsManualMode((v) => !v);
              setSelectedQuadrant(null);
              setManualReasoning("");
            }}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {isManualMode ? (
              <>
                <Sparkles className="h-3 w-3" />
                Switch to AI classification
              </>
            ) : (
              "Add manually without AI"
            )}
          </button>
        </div>

        {/* Manual mode controls */}
        <AnimatePresence>
          {isManualMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                {/* Quadrant pills */}
                <div className="flex gap-2">
                  {QUADRANT_PILLS.map(({ key, letter, color }) => {
                    const isSelected = selectedQuadrant === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedQuadrant(key)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
                          isSelected
                            ? "border-transparent text-primary-foreground shadow-sm"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                        )}
                        style={isSelected ? { backgroundColor: color } : undefined}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", !isSelected && "opacity-60")}
                          style={{ backgroundColor: isSelected ? "currentColor" : color }}
                        />
                        {letter} — {QUADRANT_CONFIG[key].label}
                      </button>
                    );
                  })}
                </div>

                {/* Optional reasoning */}
                <Textarea
                  value={manualReasoning}
                  onChange={(e) => setManualReasoning(e.target.value.slice(0, 200))}
                  placeholder="Why does this belong here? (optional)"
                  maxLength={200}
                  className="min-h-[60px] text-sm resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskInputBar;
