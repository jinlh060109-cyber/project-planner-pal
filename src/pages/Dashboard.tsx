import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Loader2 } from "lucide-react";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

const QUADRANT_CONFIG: Record<Quadrant, { letter: string; label: string; borderColor: string; bgTint: string; emptyText: string }> = {
  strength: { letter: "S", label: "Strengths", borderColor: "border-l-[hsl(142,71%,45%)]", bgTint: "bg-[hsl(142,71%,45%,0.05)]", emptyText: "Add a task that builds your strengths" },
  weakness: { letter: "W", label: "Weaknesses", borderColor: "border-l-[hsl(38,92%,50%)]", bgTint: "bg-[hsl(38,92%,50%,0.05)]", emptyText: "Add a task that closes a gap" },
  opportunity: { letter: "O", label: "Opportunities", borderColor: "border-l-[hsl(217,91%,60%)]", bgTint: "bg-[hsl(217,91%,60%,0.05)]", emptyText: "Add a task that captures an opportunity" },
  threat: { letter: "T", label: "Threats", borderColor: "border-l-[hsl(0,84%,60%)]", bgTint: "bg-[hsl(0,84%,60%,0.05)]", emptyText: "Add a task that protects your position" },
};

const DOT_COLORS: Record<Quadrant, string> = {
  strength: "bg-[hsl(142,71%,45%)]",
  weakness: "bg-[hsl(38,92%,50%)]",
  opportunity: "bg-[hsl(217,91%,60%)]",
  threat: "bg-[hsl(0,84%,60%)]",
};

const today = new Date();
const formattedDate = today.toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const Dashboard = () => {
  const { signOut } = useAuth();
  const [taskInput, setTaskInput] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    // Will be wired to AI classification in next step
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleAddTask();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-display font-bold text-foreground">Today's Strategy</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{formattedDate}</span>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Quadrant grid */}
      <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((q) => {
          const config = QUADRANT_CONFIG[q];
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

              {/* Empty state */}
              <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  {config.emptyText}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom input bar */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you need to do today?"
              className="pr-20 transition-colors duration-200 focus-visible:ring-[hsl(239,84%,67%)]"
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
