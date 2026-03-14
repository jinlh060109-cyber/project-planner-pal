import { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

const QUADRANT_OPTIONS: {
  key: Quadrant;
  letter: string;
  label: string;
  dotColor: string;
}[] = [
  { key: "strength", letter: "S", label: "Strengths", dotColor: "bg-[hsl(var(--strength))]" },
  { key: "weakness", letter: "W", label: "Weaknesses", dotColor: "bg-[hsl(var(--weakness))]" },
  { key: "opportunity", letter: "O", label: "Opportunities", dotColor: "bg-[hsl(var(--opportunity))]" },
  { key: "threat", letter: "T", label: "Threats", dotColor: "bg-[hsl(var(--threat))]" },
];

interface TaskMoveMenuProps {
  currentQuadrant: Quadrant;
  onMove: (newQuadrant: Quadrant) => void;
  isMoving: boolean;
}

const TaskMoveMenu = ({ currentQuadrant, onMove, isMoving }: TaskMoveMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={isMoving}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        aria-label="Move to different quadrant"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-[hsl(228,12%,17%)] bg-[hsl(228,18%,13%)] p-1 shadow-xl animate-fade-in"
          style={{ animationDuration: "150ms" }}
        >
          {QUADRANT_OPTIONS.map(({ key, letter, label, dotColor }) => {
            const isCurrent = key === currentQuadrant;
            return (
              <button
                key={key}
                disabled={isCurrent}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onMove(key);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isCurrent
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor, isCurrent && "opacity-40")} />
                <span>→ {letter} — {label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskMoveMenu;
