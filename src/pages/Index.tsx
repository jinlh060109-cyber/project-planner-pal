import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CARDS = [
  {
    label: "Strengths",
    count: 3,
    dotColor: "bg-strength",
    borderColor: "border-l-strength",
    tint: "rgba(34,197,94,0.04)",
    checkColor: "hsl(var(--strength))",
    // top-left, tight orbit
    position: "top-[12%] left-[calc(50%-340px)] -rotate-[4deg] z-10",
    delay: "0s",
    tasks: [
      { text: "Lead team standup", done: false },
      { text: "Client pitch deck", done: true },
      { text: "Mentor new hire", done: false },
    ],
    warning: null,
  },
  {
    label: "Weaknesses",
    count: 2,
    dotColor: "bg-weakness",
    borderColor: "border-l-weakness",
    tint: "rgba(245,158,11,0.04)",
    checkColor: "hsl(var(--weakness))",
    // top-right, tight orbit
    position: "top-[12%] left-[calc(50%+120px)] rotate-[3deg] z-20",
    delay: "1.2s",
    tasks: [
      { text: "Practice public speaking", done: false },
      { text: "Review financial reports", done: false },
    ],
    warning: null,
  },
  {
    label: "Opportunities",
    count: 2,
    dotColor: "bg-opportunity",
    borderColor: "border-l-opportunity",
    tint: "rgba(59,130,246,0.04)",
    checkColor: "hsl(var(--opportunity))",
    // bottom-left, tight orbit
    position: "bottom-[12%] left-[calc(50%-340px)] rotate-[3deg] z-30",
    delay: "2.4s",
    tasks: [
      { text: "Apply to AI conference", done: true },
      { text: "Network with VCs at demo day", done: false },
    ],
    warning: null,
  },
  {
    label: "Threats",
    count: 1,
    dotColor: "bg-threat",
    borderColor: "border-l-threat",
    tint: "rgba(239,68,68,0.04)",
    checkColor: "hsl(var(--threat))",
    // bottom-right, tight orbit
    position: "bottom-[12%] left-[calc(50%+120px)] -rotate-[3deg] z-40",
    delay: "3.6s",
    tasks: [{ text: "Deadline: tax filing", done: false }],
    warning: "⚠ Due in 3 days",
  },
];

const TaskRow = ({
  text,
  done,
  checkColor,
}: {
  text: string;
  done: boolean;
  checkColor: string;
}) => (
  <div className="flex items-center gap-2 py-[3px]">
    <div
      className="w-[14px] h-[14px] rounded-full border shrink-0 flex items-center justify-center"
      style={{
        borderColor: done ? checkColor : "hsl(var(--border))",
        backgroundColor: done ? checkColor : "transparent",
      }}
    >
      {done && <Check className="w-[8px] h-[8px] text-white" strokeWidth={3} />}
    </div>
    <span
      className={`text-[12px] leading-tight ${
        done ? "text-muted-foreground line-through" : "text-foreground"
      }`}
    >
      {text}
    </span>
  </div>
);

const MockCard = ({
  label,
  count,
  dotColor,
  borderColor,
  tint,
  checkColor,
  tasks,
  warning,
}: (typeof CARDS)[number]) => (
  <div
    className="w-[220px] rounded-2xl border border-border p-4 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200"
    style={{ backgroundColor: tint, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
  >
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="ml-auto text-[11px] font-medium text-foreground bg-secondary rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
    <div className="flex flex-col">
      {tasks.map((t, i) => (
        <TaskRow key={i} text={t.text} done={t.done} checkColor={checkColor} />
      ))}
    </div>
    {warning && <p className="text-[11px] mt-2 text-threat">{warning}</p>}
  </div>
);

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <header className="w-full h-16 flex items-center justify-between px-6 shrink-0 relative z-50">
        <span className="text-base font-semibold text-foreground">Quadra</span>
        <Link to="/auth">
          <Button variant="outline" size="sm" className="rounded-lg">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero — fills remaining viewport */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden hero-gradient">
        {/* Desktop floating cards — tight orbit */}
        <div className="hidden lg:block">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className={`absolute ${card.position}`}
              style={{
                animation: "floatCard 5s ease-in-out infinite",
                animationDelay: card.delay,
              }}
            >
              <MockCard {...card} />
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-[45] flex flex-col items-center text-center px-6">
          <h1 className="!text-4xl lg:!text-[56px] !leading-tight">
            <span className="font-semibold text-foreground">Align your day</span>
            <br />
            <span className="font-normal text-muted-foreground">with your strategy.</span>
          </h1>

          <p className="mt-6 text-base font-normal text-muted-foreground max-w-[520px]">
            Your to-do list has no strategy. This one does.
          </p>

          <Link to="/auth" className="mt-8">
            <button className="inline-flex items-center gap-2 bg-foreground text-background font-semibold text-base px-8 py-3.5 rounded-lg transition-colors duration-150 hover:bg-[hsl(0_0%_20%)]">
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Mobile 2×2 grid */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mt-12 px-6 w-full max-w-md">
          {CARDS.map((card) => (
            <div key={card.label} className="w-full">
              <MockCard {...card} />
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .hero-gradient {
          background: radial-gradient(ellipse at center, hsl(0 0% 100%) 0%, hsl(0 0% 96%) 100%);
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Index;
