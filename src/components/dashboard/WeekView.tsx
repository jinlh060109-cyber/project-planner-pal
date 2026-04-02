import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Task, Quadrant } from "./types";
import { QUADRANT_CONFIG, DOT_COLORS } from "./types";

interface WeekViewProps {
  tasks: Task[];
  isLoading: boolean;
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  onGoToDay: (date: Date) => void;
}

const BORDER_COLORS: Record<Quadrant, string> = {
  strength: "border-l-[hsl(var(--strength))]",
  weakness: "border-l-[hsl(var(--weakness))]",
  opportunity: "border-l-[hsl(var(--opportunity))]",
  threat: "border-l-[hsl(var(--threat))]",
};

const WeekView = ({ tasks, isLoading, weekStart, onWeekChange, onGoToDay }: WeekViewProps) => {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    days.forEach((d) => map.set(format(d, "yyyy-MM-dd"), []));
    tasks.forEach((t) => {
      const key = (t as any).task_date as string;
      if (map.has(key)) map.get(key)!.push(t);
    });
    return map;
  }, [tasks, days]);

  // Completion stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const quadrantCounts = useMemo(() => {
    const counts: Record<Quadrant, number> = { strength: 0, weakness: 0, opportunity: 0, threat: 0 };
    tasks.forEach((t) => {
      if (t.quadrant in counts) counts[t.quadrant as Quadrant]++;
    });
    return counts;
  }, [tasks]);

  const prevWeek = () => onWeekChange(addDays(weekStart, -7));
  const nextWeek = () => onWeekChange(addDays(weekStart, 7));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Summary row */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-7 w-7 text-muted-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            {format(weekStart, "MMM d")} — {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7 text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {completedTasks} of {totalTasks} completed
        </span>
        {/* Stacked bar */}
        {totalTasks > 0 && (
          <div className="h-2 w-32 rounded-full overflow-hidden flex">
            {(["strength", "weakness", "opportunity", "threat"] as Quadrant[]).map((q) => {
              const pct = (quadrantCounts[q] / totalTasks) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={q}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `hsl(var(--${q}))`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="grid grid-cols-7 min-w-[700px] h-full">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) || [];
            const completed = dayTasks.filter((t) => t.is_completed).length;
            const today = isToday(day);

            return (
              <div
                key={key}
                className={cn(
                  "border-r border-border last:border-r-0 flex flex-col min-h-[300px]",
                  today && "bg-[hsl(var(--primary)/0.03)]"
                )}
              >
                {/* Column header */}
                <div
                  className={cn(
                    "px-2 py-2 text-center border-b border-border shrink-0",
                    today && "border-t-2 border-t-[hsl(var(--primary))]"
                  )}
                >
                  <div className={cn("text-xs font-medium", today ? "text-foreground" : "text-muted-foreground")}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn("text-lg font-semibold", today ? "text-foreground" : "text-muted-foreground/70")}>
                    {format(day, "d")}
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </>
                  ) : dayTasks.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center h-full">
                      <p className="text-[11px] text-muted-foreground italic">No tasks</p>
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <Popover key={task.id}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full text-left rounded-lg border-l-[3px] bg-card px-2 py-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                              BORDER_COLORS[task.quadrant as Quadrant] || "border-l-border",
                              task.is_completed && "opacity-50"
                            )}
                          >
                            <p className={cn("text-[11px] font-medium text-foreground truncate", task.is_completed && "line-through")}>
                              {task.content}
                            </p>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 space-y-2" side="right" align="start">
                          <p className="text-sm font-semibold text-foreground">{task.content}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", DOT_COLORS[task.quadrant as Quadrant])} />
                            <span className="text-xs text-muted-foreground">
                              {QUADRANT_CONFIG[task.quadrant as Quadrant]?.label}
                            </span>
                            <span className="text-xs text-muted-foreground">· {task.priority}</span>
                          </div>
                          {task.reasoning && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{task.reasoning}</p>
                          )}
                          <button
                            onClick={() => onGoToDay(day)}
                            className="text-xs font-medium text-foreground hover:underline"
                          >
                            Go to day →
                          </button>
                        </PopoverContent>
                      </Popover>
                    ))
                  )}
                </div>

                {/* Footer */}
                {!isLoading && dayTasks.length > 0 && (
                  <div className="px-2 py-1.5 border-t border-border shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {completed}/{dayTasks.length} done
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
