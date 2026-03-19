import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Target, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const floatingCards = [
  {
    label: "Strengths",
    icon: Shield,
    color: "border-l-strength",
    tint: "bg-strength/5",
    position: "top-[12%] -left-[40px] -rotate-3",
    delay: "0s",
  },
  {
    label: "Weaknesses",
    icon: Target,
    color: "border-l-weakness",
    tint: "bg-weakness/5",
    position: "top-[8%] -right-[40px] rotate-2",
    delay: "1s",
  },
  {
    label: "Opportunities",
    icon: TrendingUp,
    color: "border-l-opportunity",
    tint: "bg-opportunity/5",
    position: "bottom-[18%] -left-[20px] rotate-2",
    delay: "2s",
  },
  {
    label: "Threats",
    icon: AlertTriangle,
    color: "border-l-threat",
    tint: "bg-threat/5",
    position: "bottom-[8%] -right-[30px] -rotate-2",
    delay: "3s",
  },
];

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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header className="w-full h-16 flex items-center justify-between px-6 border-b border-border">
        <span className="text-base font-semibold text-foreground">Quadra</span>
        <Link to="/auth">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg transition-colors duration-150 hover:bg-[hsl(0_0%_94%)]"
          >
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden hero-gradient">
        {/* Floating cards — desktop only */}
        <div className="hidden md:block">
          {floatingCards.map(({ label, icon: Icon, color, tint, position, delay }) => (
            <div
              key={label}
              className={`absolute ${position} w-[180px] bg-background border border-border rounded-2xl ${color} border-l-4 p-5 flex flex-col items-center gap-2 ${tint} z-10`}
              style={{
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                animation: `floatCard 4s ease-in-out infinite`,
                animationDelay: delay,
              }}
            >
              <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-20 flex flex-col items-center text-center px-6">
          <h1 className="!text-4xl md:!text-[56px] !leading-tight">
            <span className="font-semibold text-foreground">Align your day</span>
            <br />
            <span className="font-normal text-muted-foreground">with your strategy.</span>
          </h1>

          <p className="mt-6 text-base font-normal text-muted-foreground max-w-[520px]">
            Categorise daily tasks by Strengths, Weaknesses, Opportunities, and
            Threats — and build balance into every day.
          </p>

          <Link to="/auth" className="mt-8">
            <button className="inline-flex items-center gap-2 bg-foreground text-background font-semibold text-base px-8 py-3.5 rounded-lg transition-colors duration-150 hover:bg-[hsl(0_0%_20%)]">
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Mobile fallback: 2×2 grid */}
        <div className="md:hidden grid grid-cols-2 gap-4 mt-12 px-6 w-full max-w-sm">
          {floatingCards.map(({ label, icon: Icon, color, tint }) => (
            <div
              key={label}
              className={`bg-background border border-border rounded-2xl ${color} border-l-4 p-5 flex flex-col items-center gap-2 ${tint}`}
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
            >
              <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Below the fold */}
      <section className="py-20 px-6 flex flex-col items-center max-w-[800px] mx-auto">
        <div className="w-full aspect-video rounded-xl border border-border bg-muted flex items-center justify-center shadow-lg">
          <span className="text-muted-foreground text-sm">Dashboard preview</span>
        </div>
        <p className="mt-8 text-xl font-medium text-foreground text-center">
          Your strategy, visualized.
        </p>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border py-6">
        <p className="text-center text-[13px] text-muted-foreground">
          Quadra — Strategic daily planning
        </p>
      </footer>

      <style>{`
        .hero-gradient {
          background: radial-gradient(ellipse at center, hsl(0 0% 100%) 0%, hsl(0 0% 94%) 100%);
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default Index;
