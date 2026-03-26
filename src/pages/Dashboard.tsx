import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import BalanceIndicator from "@/components/BalanceIndicator";
import TaskCard from "@/components/dashboard/TaskCard";
import TaskInputBar from "@/components/dashboard/TaskInputBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Task, Quadrant } from "@/components/dashboard/types";
import {
  QUADRANT_CONFIG,
  DOT_COLORS,
  PRIORITY_ORDER,
  getTodayISO,
} from "@/components/dashboard/types";

const getFormattedDate = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const todayISO = getTodayISO();
  const formattedDate = getFormattedDate();

  const { data: profileData } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const avatarUrl = profileData?.avatar_url ?? null;
  const displayName = profileData?.display_name ?? null;

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
        .eq("task_date", todayISO)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load tasks:", error);
        toast({ title: "Couldn't load your tasks — please refresh", variant: "destructive", duration: 10000 });
      } else if (data) {
        setTasks(data.map((d) => ({ ...d, matched_skill: (d as any).matched_skill ?? null, skill_reasoning: (d as any).skill_reasoning ?? null })) as Task[]);
      }
      setIsLoading(false);
    };
    fetchTasks();
  }, [user, toast, todayISO]);

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      setCompletingIds((prev) => new Set(prev).add(taskId));
      const { error } = await supabase.from("tasks").update({ is_completed: true }).eq("id", taskId);
      if (error) {
        setCompletingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
        toast({ title: "Couldn't complete task — try again", variant: "destructive" });
        return;
      }
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCompletingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
      }, 800);
    },
    [toast]
  );

  const handleMoveTask = useCallback(
    async (taskId: string, newQuadrant: Quadrant) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.quadrant === newQuadrant) return;
      const orig = { quadrant: task.quadrant, reasoning: task.reasoning };

      setMovingIds((prev) => new Set(prev).add(taskId));
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, quadrant: newQuadrant, reasoning: "Manually classified" } : t)));

      const { error } = await supabase.from("tasks").update({ quadrant: newQuadrant, reasoning: "Manually classified" }).eq("id", taskId);
      setMovingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });

      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, quadrant: orig.quadrant as Quadrant, reasoning: orig.reasoning } : t)));
        toast({ title: "Couldn't move task — try again", variant: "destructive" });
      } else {
        toast({ title: `Moved to ${QUADRANT_CONFIG[newQuadrant].label}`, duration: 3000 });
      }
    },
    [tasks, toast]
  );

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleUpdateTask = useCallback((updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleTaskAdded = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const tasksByQuadrant = (q: Quadrant) =>
    tasks
      .filter((t) => t.quadrant === q)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-display font-bold text-foreground">Today's Strategy</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{formattedDate}</span>
          <button
            onClick={() => navigate("/profile")}
            className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-2 ring-transparent hover:ring-primary/50 transition-all"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold">
                {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
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
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${DOT_COLORS[q]}`} />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  {config.letter} — {config.label}
                </span>
              </div>

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
                  <p className="text-sm text-muted-foreground italic">{config.emptyText}</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2 overflow-auto">
                  <AnimatePresence mode="popLayout">
                    {qTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isCompleting={completingIds.has(task.id)}
                        isMoving={movingIds.has(task.id)}
                        onComplete={handleCompleteTask}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                        onUpdate={handleUpdateTask}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <BalanceIndicator tasks={tasks} />
      <TaskInputBar onTaskAdded={handleTaskAdded} />
    </div>
  );
};

export default Dashboard;
