import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Target, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>);

  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container flex items-center justify-between h-16">
        <span className="text-lg font-display font-mono">Quadra</span>
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

          <div className="flex justify-center gap-3 mt-16">
            {[
            { label: "Strengths", icon: Shield, borderColor: "border-l-[hsl(142,71%,45%)]", tint: "bg-[hsl(142,71%,45%,0.05)]" },
            { label: "Weaknesses", icon: Target, borderColor: "border-l-[hsl(38,92%,50%)]", tint: "bg-[hsl(38,92%,50%,0.05)]" },
            { label: "Opportunities", icon: TrendingUp, borderColor: "border-l-[hsl(217,91%,60%)]", tint: "bg-[hsl(217,91%,60%,0.05)]" },
            { label: "Threats", icon: AlertTriangle, borderColor: "border-l-[hsl(0,84%,60%)]", tint: "bg-[hsl(0,84%,60%,0.05)]" }].
            map(({ label, icon: Icon, borderColor, tint }) =>
            <div
              key={label}
              className={`${tint} ${borderColor} border-l-4 rounded-xl p-5 text-center h-[140px] w-full max-w-[160px] flex flex-col items-center justify-center`}>
              
                <Icon className="h-6 w-6 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground font-serif">
          Quadra — Strategic daily planning
        </div>
      </footer>
    </div>);

};

export default Index;