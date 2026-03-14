import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Loader2, Check } from "lucide-react";
import BalanceIndicator from "@/components/BalanceIndicator";
import TaskMoveMenu from "@/components/TaskMoveMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface Task {
  id: string;
  content: string;
  quadrant: Quadrant;
  reasoning: string | null;
  priority: string;
  is_completed: boolean;
  created_at: string;
}

const QUADRANT_CONFIG: Record<
  Quadrant,
  {
    letter: string;
    label: string;
    borderColor: string;
    bgTint: string;
    emptyText: string;
    accentHsl: string;
    checkColor: string;
  }
> = {
  strength: {
    letter: "S",
    label: "Strengths",
    borderColor: "border-l-[hsl(var(--strength))]",
    bgTint: "bg-[hsl(142,71%,45%,0.05)]",
    emptyText: "Add a task that builds your strengths",
    accentHsl: "142 71% 45%",
    checkColor: "bg-[hsl(var(--strength))]",
  },
  weakness: {
    letter: "W",
    label: "Weaknesses",
    borderColor: "border-l-[hsl(var(--weakness))]",
    bgTint: "bg-[hsl(38,92%,50%,0.05)]",
    emptyText: "Add a task that closes a gap",
    accentHsl: "38 92% 50%",
    checkColor: "bg-[hsl(var(--weakness))]",
  },
  opportunity: {
    letter: "O",
    label: "Opportunities",
    borderColor: "border-l-[hsl(var(--opportunity))]",
    bgTint: "bg-[hsl(217,91%,60%,0.05)]",
    emptyText: "Add a task that captures an opportunity",
    accentHsl: "217 91% 60%",
    checkColor: "bg-[hsl(var(--opportunity))]",
  },
  threat: {
    letter: "T",
    label: "Threats",
    borderColor: "border-l-[hsl(var(--threat))]",
    bgTint: "bg-[hsl(0,84%,60%,0.05)]",
    emptyText: "Add a task that protects your position",
    accentHsl: "0 84% 60%",
    checkColor: "bg-[hsl(var(--threat))]",
  },
};

const DOT_COLORS: Record<Quadrant, string> = {
  strength: "bg-[hsl(var(--strength))]",
  weakness: "bg-[hsl(var(--weakness))]",
  opportunity: "bg-[hsl(var(--opportunity))]",
  threat: "bg-[hsl(var(--threat))]",
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High: { bg: "bg-[hsl(0,84%,60%,0.15)]", text: "text-[hsl(0,84%,60%)]" },
  Medium: { bg: "bg-[hsl(38,92%,50%,0.15)]", text: "text-[hsl(38,92%,50%)]" },
  Low: { bg: "bg-[hsl(142,71%,45%,0.15)]", text: "text-[hsl(142,71%,45%)]" },
};

const today = new Date();
const formattedDate = today.toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [taskInput, setTaskInput] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

  // Fetch tasks on mount
  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load tasks:", error);
        toast({
          title: "Couldn't load your tasks — please refresh",
          variant: "destructive",
          duration: Infinity,
        });
      } else if (data) {
        setTasks(data as Task[]);
      }
      setIsLoading(false);
    };
    fetchTasks();
  }, [user, toast]);

  const handleAddTask = useCallback(async () => {
    const text = taskInput.trim();
    if (!text || isClassifying) return;

    setTaskInput("");
    setIsClassifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("classify-task", {
        body: { taskContent: text },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const newTask = data.task as Task;
      setTasks((prev) => [newTask, ...prev]);

      const config = QUADRANT_CONFIG[newTask.quadrant as Quadrant];
      toast({
        title: `Classified → ${config?.label || newTask.quadrant}`,
        duration: 3000,
      });
    } catch (e: any) {
      console.error("Classification error:", e);
      toast({
        title: "Classification failed — please try again",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsClassifying(false);
    }
  }, [taskInput, isClassifying, toast]);

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      setCompletingIds((prev) => new Set(prev).add(taskId));

      await supabase
        .from("tasks")
        .update({ is_completed: true })
        .eq("id", taskId);

      // Wait for fade animation
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 800);
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleMoveTask = useCallback(
    async (taskId: string, newQuadrant: Quadrant) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.quadrant === newQuadrant) return;

      const originalQuadrant = task.quadrant;
      const originalReasoning = task.reasoning;

      // Optimistic update
      setMovingIds((prev) => new Set(prev).add(taskId));
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, quadrant: newQuadrant, reasoning: "Manually classified" }
            : t
        )
      );

      const { error } = await supabase
        .from("tasks")
        .update({ quadrant: newQuadrant, reasoning: "Manually classified" })
        .eq("id", taskId);

      setMovingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      if (error) {
        // Revert
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, quadrant: originalQuadrant as Quadrant, reasoning: originalReasoning }
              : t
          )
        );
        toast({
          title: "Couldn't move task — try again",
          variant: "destructive",
        });
      } else {
        const config = QUADRANT_CONFIG[newQuadrant];
        toast({ title: `Moved to ${config.label}`, duration: 3000 });
      }
    },
    [tasks, toast]
  );

  const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const tasksByQuadrant = (q: Quadrant) =>
    tasks
      .filter((t) => t.quadrant === q)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-display font-bold text-foreground">
          Today's Strategy
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {formattedDate}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Quadrant grid */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-auto">
        {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((q) => {
          const config = QUADRANT_CONFIG[q];
          const qTasks = tasksByQuadrant(q);
          return (
            <div
              key={q}
              className={`rounded-xl border border-border border-l-4 ${config.borderColor} ${config.bgTint} p-6 flex flex-col min-h-[200px] md:min-h-0`}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${DOT_COLORS[q]}`} />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  {config.letter} — {config.label}
                </span>
              </div>

              {/* Task cards, loading, or empty state */}
              {isLoading ? (
                <div className="flex-1 flex flex-col gap-2">
                  {[0, 1].map((i) => (
                    <div key={i} className={cn("rounded-xl border-l-4 bg-card p-4", config.borderColor)}>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : qTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    {config.emptyText}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2 overflow-auto">
                  <AnimatePresence mode="popLayout">
                  {qTasks.map((task) => {
                    const isCompleting = completingIds.has(task.id);
                    const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;
                    const isMoving = movingIds.has(task.id);
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        layoutId={task.id}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{
                          opacity: isMoving ? 0.7 : isCompleting ? 0.5 : 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        transition={{
                          layout: { type: "spring", stiffness: 350, damping: 30 },
                          opacity: { duration: 0.25, ease: "easeOut" },
                          scale: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
                          y: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
                        }}
                        className={cn(
                          "group relative rounded-xl border-l-4 bg-card p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5",
                          config.borderColor,
                          isCompleting && "line-through"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={isCompleting}
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 transition-colors",
                              isCompleting && config.checkColor + " border-transparent"
                            )}
                          >
                            {isCompleting && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </button>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-semibold text-foreground",
                                isCompleting && "line-through"
                              )}
                            >
                              {task.content}
                            </p>
                            {task.reasoning && (
                              <p className={cn(
                                "mt-1 text-[13px] leading-snug",
                                task.reasoning === "Manually classified"
                                  ? "text-muted-foreground italic"
                                  : "text-muted-foreground"
                              )}>
                                {task.reasoning}
                              </p>
                            )}
                          </div>

                          {/* Move menu */}
                          <TaskMoveMenu
                            currentQuadrant={task.quadrant}
                            onMove={(newQ) => handleMoveTask(task.id, newQ)}
                            isMoving={isMoving}
                          />

                          {/* Priority badge */}
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                              priority.bg,
                              priority.text
                            )}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Balance indicator */}
      <BalanceIndicator tasks={tasks} />

      {/* Bottom input bar */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you need to do today?"
              className="pr-20 transition-colors duration-200 focus-visible:ring-primary"
              disabled={isClassifying}
            />
            <Badge
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 font-mono text-muted-foreground pointer-events-none"
            >
              ⌘ Enter
            </Badge>
          </div>
          <Button
            onClick={handleAddTask}
            disabled={!taskInput.trim() || isClassifying}
            className="shrink-0"
          >
            {isClassifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Task
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
