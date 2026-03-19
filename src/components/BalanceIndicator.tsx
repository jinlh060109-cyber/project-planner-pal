import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface BalanceIndicatorProps {
  tasks: {quadrant: string;}[];
}

const SEGMENTS: {key: Quadrant;letter: string;label: string;color: string;}[] = [
{ key: "strength", letter: "S", label: "Strengths", color: "hsl(var(--strength))" },
{ key: "weakness", letter: "W", label: "Weaknesses", color: "hsl(var(--weakness))" },
{ key: "opportunity", letter: "O", label: "Opportunities", color: "hsl(var(--opportunity))" },
{ key: "threat", letter: "T", label: "Threats", color: "hsl(var(--threat))" }];


const BalanceIndicator = ({ tasks }: BalanceIndicatorProps) => {
  const counts = useMemo(() => {
    const map: Record<Quadrant, number> = { strength: 0, weakness: 0, opportunity: 0, threat: 0 };
    tasks.forEach((t) => {
      if (t.quadrant in map) map[t.quadrant as Quadrant]++;
    });
    return map;
  }, [tasks]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const isEmpty = total === 0;

  const dominantKey = useMemo(() => {
    if (total === 0) return null;
    const max = Math.max(...Object.values(counts));
    if (max / total <= 0.6) return null;
    return (Object.keys(counts) as Quadrant[]).find((k) => counts[k] === max) ?? null;
  }, [counts, total]);

  return (
    <div className="px-4 py-3 shrink-0">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <span className="text-[13px] text-muted-foreground mb-2 block">
          Today's Balance
        </span>

        {isEmpty ?
        <>
            <div className="h-2 w-full rounded-[999px] bg-slate-200" />
            <p className="text-[13px] text-muted-foreground text-center mt-2 italic">
              Add tasks to see your balance
            </p>
          </> :

        <>
            {/* Bar */}
            <div className="h-3 w-full rounded-[999px] overflow-hidden flex items-stretch">
              {SEGMENTS.map(({ key, letter, color }) => {
              const pct = counts[key] / total * 100;
              if (pct === 0) return null;
              const wide = pct >= 15; // ~40px at typical widths
              const isDominant = dominantKey === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "relative transition-all duration-[600ms] ease-in-out first:rounded-l-[999px] last:rounded-r-[999px]",
                    isDominant && "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                  )}
                  style={{ width: `${pct}%`, backgroundColor: color }}>
                  
                    {wide &&
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-primary-foreground leading-none">
                        {letter}
                      </span>
                  }
                  </div>);

            })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {SEGMENTS.map(({ key, letter, label, color }) =>
            <div key={key} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }} />
              
                  <span>
                    {letter} — {label} ({counts[key]})
                  </span>
                </div>
            )}
            </div>
          </>
        }
      </div>
    </div>);

};

export default BalanceIndicator;