import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import FloatingElements from "@/components/landing/FloatingElements";

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
        <span className="text-base font-semibold text-foreground font-mono">Quadra</span>
        <Link to="/auth">
          <Button variant="outline" size="sm" className="rounded-lg">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden hero-gradient">
        {/* Floating decorative elements */}
        <FloatingElements />

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
      </section>

      <style>{`
        .hero-gradient {
          background: radial-gradient(ellipse at center, hsl(0 0% 100%) 0%, hsl(0 0% 96%) 100%);
        }
        @keyframes floatElementIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Index;
