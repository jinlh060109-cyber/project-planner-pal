import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MoreHorizontal, Pencil, Sparkles, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import TaskMoveMenu from "@/components/TaskMoveMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Task, Quadrant } from "./types";
import { QUADRANT_CONFIG, PRIORITY_STYLES, getTodayISO } from "./types";

interface TaskCardProps {
  task: Task;
  isCompleting: boolean;
  isMoving: boolean;
  onComplete: (id: string) => void;
  onMove: (id: string, quadrant: Quadrant) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: Task) => void;
}

const TaskCard = ({
  task,
  isCompleting,
  isMoving,
  onComplete,
  onMove,
  onDelete,
  onUpdate,
}: TaskCardProps) => {
  const { toast } = useToast();
  const config = QUADRANT_CONFIG[task.quadrant];
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.content);
  const [isSaving, setIsSaving] = useState(false);

  const [isReclassifying, setIsReclassifying] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleEdit = () => {
    setMenuOpen(false);
    setEditText(task.content);
    setIsEditing(true);
  };

  const handleSaveEdit = useCallback(async () => {
    const text = editText.trim();
    if (!text || text === task.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from("tasks")
      .update({ content: text })
      .eq("id", task.id);

    if (error) {
      toast({ title: "Couldn't save edit — try again", variant: "destructive" });
    } else {
      onUpdate({ ...task, content: text });
      setIsEditing(false);
    }
    setIsSaving(false);
  }, [editText, task, toast, onUpdate]);

  const handleReclassify = useCallback(async () => {
    setMenuOpen(false);
    setIsReclassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("classify-task", {
        body: { taskContent: task.content, taskDate: getTodayISO() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const reclassified = data.task as Task;

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          quadrant: reclassified.quadrant,
          reasoning: reclassified.reasoning,
          priority: reclassified.priority,
          matched_skill: reclassified.matched_skill || null,
          skill_reasoning: reclassified.skill_reasoning || null,
        })
        .eq("id", task.id);

      if (reclassified.id && reclassified.id !== task.id) {
        await supabase.from("tasks").delete().eq("id", reclassified.id);
      }

      if (updateError) throw new Error("Failed to update task");

      onUpdate({
        ...task,
        quadrant: reclassified.quadrant as Quadrant,
        reasoning: reclassified.reasoning,
        priority: reclassified.priority,
        matched_skill: (reclassified as any).matched_skill || null,
        skill_reasoning: (reclassified as any).skill_reasoning || null,
      });

      const newConfig = QUADRANT_CONFIG[reclassified.quadrant as Quadrant];
      toast({ title: `Re-classified → ${newConfig?.label}`, duration: 3000 });
    } catch (e: any) {
      toast({ title: "Re-classification failed", description: e.message, variant: "destructive" });
    } finally {
      setIsReclassifying(false);
    }
  }, [task, toast, onUpdate]);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      toast({ title: "Couldn't delete task — try again", variant: "destructive" });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    } else {
      // Trigger break animation, then remove from list
      setShowDeleteConfirm(false);
      setIsBreaking(true);
      setTimeout(() => onDelete(task.id), 500);
    }
  }, [task.id, toast, onDelete]);

  // Determine framer-motion animate values
  const getAnimateState = () => {
    if (isBreaking) {
      return {
        opacity: 0,
        scale: 0.6,
        rotateZ: (Math.random() > 0.5 ? 1 : -1) * 8,
        filter: "blur(4px)",
        y: 20,
      };
    }
    if (isCompleting) {
      return {
        opacity: 0.4,
        scale: 0.96,
        y: 0,
      };
    }
    return {
      opacity: isMoving ? 0.7 : 1,
      scale: 1,
      y: 0,
      rotateZ: 0,
      filter: "blur(0px)",
    };
  };

  return (
    <motion.div
      layout
      layoutId={task.id}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={getAnimateState()}
      exit={{ opacity: 0, scale: 0.85, y: -12, filter: "blur(2px)" }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: isBreaking ? 0.4 : 0.25, ease: "easeOut" },
        scale: { duration: isBreaking ? 0.4 : 0.25, ease: [0.25, 0.1, 0.25, 1] },
        rotateZ: { duration: 0.35, ease: "easeOut" },
        filter: { duration: 0.4, ease: "easeOut" },
        y: { duration: isBreaking ? 0.4 : 0.25, ease: [0.25, 0.1, 0.25, 1] },
      }}
      className={cn(
        "group relative rounded-xl border-l-4 bg-card p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-shadow",
        config.borderColor,
        isReclassifying && "animate-pulse"
      )}
    >
      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/95 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-foreground">Delete this task?</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="text-xs h-7 px-3"
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, delete"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="text-xs h-7 px-3 text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          disabled={isCompleting || isEditing}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
            isCompleting
              ? "border-transparent bg-[hsl(var(--strength))] scale-110"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          )}
        >
          <AnimatePresence>
            {isCompleting && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Check className="h-3 w-3 text-primary-foreground" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 200))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                maxLength={200}
                className="text-sm h-8 ring-1 ring-primary/30"
                autoFocus
                disabled={isSaving}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="text-xs h-6 px-2.5">
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={cn(
                "text-sm font-semibold text-foreground transition-all duration-300",
                isCompleting && "line-through text-muted-foreground"
              )}>
                {task.content}
              </p>
              {task.reasoning && (
                <p className={cn(
                  "mt-1 text-[13px] leading-snug",
                  task.reasoning === "Manually classified" || task.reasoning === "Manually added"
                    ? "text-muted-foreground italic"
                    : "text-muted-foreground"
                )}>
                  {task.reasoning}
                </p>
              )}
            </>
          )}
        </div>

        {/* Actions (right side) */}
        {!isEditing && (
          <>
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary",
                  menuOpen ? "opacity-100 bg-secondary" : "opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-100"
                )}
                aria-label="Task actions"
              >
                {isReclassifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-3.5 w-3.5" />
                )}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-xl animate-fade-in"
                  style={{ animationDuration: "150ms" }}
                >
                  <button
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleReclassify}
                    disabled={isReclassifying}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Re-classify
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>

            <TaskMoveMenu
              currentQuadrant={task.quadrant}
              onMove={(newQ) => onMove(task.id, newQ)}
              isMoving={isMoving}
            />

            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", priority.bg, priority.text)}>
              {task.priority}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
