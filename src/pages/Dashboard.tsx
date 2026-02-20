import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, LogOut, Trash2, Shield, Target, TrendingUp, AlertTriangle } from "lucide-react";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface Task {
  id: string;
  content: string;
  quadrant: Quadrant;
  reasoning: string | null;
  is_completed: boolean;
  task_date: string;
}

const QUADRANT_CONFIG: Record<Quadrant, { label: string; icon: React.ElementType; bgClass: string; accentClass: string; borderClass: string }> = {
  strength: { label: "Strengths", icon: Shield, bgClass: "bg-strength", accentClass: "text-strength-accent", borderClass: "border-strength-accent/30" },
  weakness: { label: "Weaknesses", icon: Target, bgClass: "bg-weakness", accentClass: "text-weakness-accent", borderClass: "border-weakness-accent/30" },
  opportunity: { label: "Opportunities", icon: TrendingUp, bgClass: "bg-opportunity", accentClass: "text-opportunity-accent", borderClass: "border-opportunity-accent/30" },
  threat: { label: "Threats", icon: AlertTriangle, bgClass: "bg-threat", accentClass: "text-threat-accent", borderClass: "border-threat-accent/30" },
};

const todayStr = new Date().toISOString().split("T")[0];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("strength");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_date", todayStr)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const addTask = useMutation({
    mutationFn: async () => {
      if (!newTask.trim()) return;
      const { error } = await supabase.from("tasks").insert({
        content: newTask.trim(),
        quadrant: selectedQuadrant,
        user_id: user!.id,
        task_date: todayStr,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTask("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("tasks").update({ is_completed: completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasksByQuadrant = (q: Quadrant) => tasks.filter((t) => t.quadrant === q);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-display">SWOT Planner</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {completedTasks}/{totalTasks} done today
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Task input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask.mutate();
          }}
          className="flex gap-2"
        >
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What do you need to do today?"
            className="flex-1"
          />
          <Select value={selectedQuadrant} onValueChange={(v) => setSelectedQuadrant(v as Quadrant)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((q) => (
                <SelectItem key={q} value={q}>
                  {QUADRANT_CONFIG[q].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!newTask.trim() || addTask.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Four-quadrant grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((q) => {
              const config = QUADRANT_CONFIG[q];
              const Icon = config.icon;
              const qTasks = tasksByQuadrant(q);

              return (
                <div
                  key={q}
                  className={`rounded-xl border ${config.borderClass} ${config.bgClass} p-5 min-h-[200px]`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`h-5 w-5 ${config.accentClass}`} />
                    <h2 className={`font-display text-lg ${config.accentClass}`}>
                      {config.label}
                    </h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {qTasks.length} task{qTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {qTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No tasks yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {qTasks.map((task) => (
                        <li key={task.id} className="flex items-start gap-2 group">
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={(checked) =>
                              toggleTask.mutate({ id: task.id, completed: !!checked })
                            }
                            className="mt-0.5"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              task.is_completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {task.content}
                          </span>
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Balance indicator */}
        {totalTasks > 0 && (
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((q) => {
              const count = tasksByQuadrant(q).length;
              const pct = (count / totalTasks) * 100;
              return (
                <div
                  key={q}
                  className={`${QUADRANT_CONFIG[q].bgClass} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${QUADRANT_CONFIG[q].label}: ${count}`}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
