import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, TrendingUp, Target, AlertTriangle } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
        <h1 className="text-5xl xl:text-6xl font-display leading-tight mb-6">
          Plan with<br />clarity.
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-md">
          Align your daily tasks with your strengths, weaknesses, opportunities, and threats.
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="flex items-center gap-3 rounded-lg bg-strength p-3">
            <Shield className="h-5 w-5 text-strength-accent" />
            <span className="text-sm font-medium">Strengths</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-weakness p-3">
            <Target className="h-5 w-5 text-weakness-accent" />
            <span className="text-sm font-medium">Weaknesses</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-opportunity p-3">
            <TrendingUp className="h-5 w-5 text-opportunity-accent" />
            <span className="text-sm font-medium">Opportunities</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-threat p-3">
            <AlertTriangle className="h-5 w-5 text-threat-accent" />
            <span className="text-sm font-medium">Threats</span>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-sm lg:border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              {isLogin ? "Welcome back" : "Get started"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to your SWOT Planner" : "Create your SWOT Planner account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
              </Button>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
