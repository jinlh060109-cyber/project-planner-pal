export type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

export interface Task {
  id: string;
  content: string;
  quadrant: Quadrant;
  reasoning: string | null;
  priority: string;
  matched_skill: string | null;
  skill_reasoning: string | null;
  is_completed: boolean;
  created_at: string;
}

export const QUADRANT_CONFIG: Record<
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

export const DOT_COLORS: Record<Quadrant, string> = {
  strength: "bg-[hsl(var(--strength))]",
  weakness: "bg-[hsl(var(--weakness))]",
  opportunity: "bg-[hsl(var(--opportunity))]",
  threat: "bg-[hsl(var(--threat))]",
};

export const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  High: { bg: "bg-[hsl(0,84%,60%,0.15)]", text: "text-[hsl(0,84%,60%)]" },
  Medium: { bg: "bg-[hsl(38,92%,50%,0.15)]", text: "text-[hsl(38,92%,50%)]" },
  Low: { bg: "bg-[hsl(142,71%,45%,0.15)]", text: "text-[hsl(142,71%,45%)]" },
};

export const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export const getTodayISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
};
