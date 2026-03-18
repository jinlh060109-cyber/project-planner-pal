import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface StrategicFoundationProps {
  swotItems: Record<Quadrant, string[]>;
  isLoading: boolean;
  onEditQuadrant: (q: Quadrant) => void;
}

const QUADRANT_CONFIG: Record<
  Quadrant,
  { letter: string; label: string; borderColor: string; bgTint: string; dotColor: string }
> = {
  strength: {
    letter: "S",
    label: "Strengths",
    borderColor: "border-l-[hsl(var(--strength))]",
    bgTint: "bg-[hsl(142,71%,45%,0.05)]",
    dotColor: "bg-[hsl(var(--strength))]",
  },
  weakness: {
    letter: "W",
    label: "Weaknesses",
    borderColor: "border-l-[hsl(var(--weakness))]",
    bgTint: "bg-[hsl(38,92%,50%,0.05)]",
    dotColor: "bg-[hsl(var(--weakness))]",
  },
  opportunity: {
    letter: "O",
    label: "Opportunities",
    borderColor: "border-l-[hsl(var(--opportunity))]",
    bgTint: "bg-[hsl(217,91%,60%,0.05)]",
    dotColor: "bg-[hsl(var(--opportunity))]",
  },
  threat: {
    letter: "T",
    label: "Threats",
    borderColor: "border-l-[hsl(var(--threat))]",
    bgTint: "bg-[hsl(0,84%,60%,0.05)]",
    dotColor: "bg-[hsl(var(--threat))]",
  },
};

const QUADRANTS: Quadrant[] = ["strength", "weakness", "opportunity", "threat"];

const DOT_COLORS: Record<Quadrant, string> = {
  strength: "bg-[hsl(var(--strength))]",
  weakness: "bg-[hsl(var(--weakness))]",
  opportunity: "bg-[hsl(var(--opportunity))]",
  threat: "bg-[hsl(var(--threat))]",
};

const StrategicFoundation = ({ swotItems, isLoading, onEditQuadrant }: StrategicFoundationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
      </section>
    );
  }

  return (
    <section className="mb-10">
      {/* Header — clickable to toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-start justify-between mb-4 text-left group"
      >
        <div>
          <h2 className="text-sm font-semibold tracking-[0.08em] uppercase text-foreground">
            Strategic Foundation
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your macro-level identity. Updates slowly — review quarterly.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <span className="text-xs text-muted-foreground hidden sm:inline">Your life strategy</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence mode="wait" initial={false}>
        {!isOpen ? (
          /* Collapsed — summary row */
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-5">
              {QUADRANTS.map((q) => (
                <div key={q} className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", DOT_COLORS[q])} />
                  <span className="text-[13px] text-muted-foreground font-mono">
                    {swotItems[q].length}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Expanded — SWOT grid */
          <motion.div
            key="grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-[11px] text-muted-foreground text-center mb-4">
              These define who you are at a macro level — your natural advantages, areas to improve, external conditions, and risks.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUADRANTS.map((q) => {
                const config = QUADRANT_CONFIG[q];
                const items = swotItems[q];
                const isEmpty = items.length === 0;

                return (
                  <motion.button
                    key={q}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onEditQuadrant(q)}
                    className={cn(
                      "text-left rounded-xl border-l-4 p-5 transition-shadow duration-200 hover:shadow-lg",
                      config.borderColor,
                      config.bgTint,
                      isEmpty ? "border border-dashed border-border" : "border border-border bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                          {config.letter} — {config.label}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted-foreground truncate">
                      {isEmpty ? (
                        <span className="italic">No items yet</span>
                      ) : (
                        items[0]
                      )}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-2 text-right">Edit →</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default StrategicFoundation;
