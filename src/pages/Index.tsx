import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Target, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container flex items-center justify-between h-16">
        <span className="text-lg font-display">SWOT Planner</span>
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-display leading-tight">
              Align your day<br />with your strategy.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Categorise daily tasks by Strengths, Weaknesses, Opportunities, and Threats — and build balance into every day.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 mt-4 rounded-full px-8">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-3 mt-16">
            {[
              { label: "Strengths", icon: Shield, color: "hsl(var(--strength))" },
              { label: "Weaknesses", icon: Target, color: "hsl(var(--weakness))" },
              { label: "Opportunities", icon: TrendingUp, color: "hsl(var(--opportunity))" },
              { label: "Threats", icon: AlertTriangle, color: "hsl(var(--threat))" },
            ].map(({ label, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl p-5 text-center h-[140px] w-full max-w-[160px] flex flex-col items-center justify-center"
                style={{
                  borderRadius: 12,
                  borderLeft: `4px solid ${color}`,
                  backgroundColor: `color-mix(in srgb, ${color} 5%, hsl(var(--card)))`,
                }}
              >
                <Icon className="h-6 w-6 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          SWOT Planner — Strategic daily planning
        </div>
      </footer>
    </div>
  );
};

export default Index;
