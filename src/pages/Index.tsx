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
              <Button size="lg" className="gap-2 mt-4">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {[
              { label: "Strengths", icon: Shield, bg: "bg-strength", text: "text-strength-accent" },
              { label: "Weaknesses", icon: Target, bg: "bg-weakness", text: "text-weakness-accent" },
              { label: "Opportunities", icon: TrendingUp, bg: "bg-opportunity", text: "text-opportunity-accent" },
              { label: "Threats", icon: AlertTriangle, bg: "bg-threat", text: "text-threat-accent" },
            ].map(({ label, icon: Icon, bg, text }) => (
              <div key={label} className={`${bg} rounded-xl p-5 text-center`}>
                <Icon className={`h-6 w-6 mx-auto mb-2 ${text}`} />
                <span className="text-sm font-medium">{label}</span>
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
