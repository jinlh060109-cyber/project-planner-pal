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
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp, Target, AlertTriangle } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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
        toast({ title: "Welcome back!", duration: 3000 });
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
        toast({ title: "Check your email to confirm your account!", duration: 5000 });
      }
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
        <h1 className="text-5xl xl:text-6xl font-display leading-tight mb-6">
          Align your day<br />with your strategy.
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-md">
          Categorise daily tasks by Strengths, Weaknesses, Opportunities, and Threats — and build balance into every day.
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {[
            { label: "Strengths", icon: Shield, color: "142,71%,45%", },
            { label: "Weaknesses", icon: Target, color: "38,92%,50%", },
            { label: "Opportunities", icon: TrendingUp, color: "217,91%,60%", },
            { label: "Threats", icon: AlertTriangle, color: "0,84%,60%", },
          ].map(({ label, icon: Icon, color }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-card"
              style={{
                background: `linear-gradient(hsla(${color}, 0.05), hsla(${color}, 0.05)), hsl(230,14%,12%)`,
                borderLeft: `4px solid hsl(${color})`,
                borderRadius: 12,
              }}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
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
              {isLogin ? "Sign in to your Quadra" : "Create your Quadra account"}
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
              <Button
                type="button"
                className="w-full bg-[hsl(239,84%,67%)] text-white hover:bg-[hsl(239,84%,63%)]"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast({ title: error.message, variant: "destructive" });
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="flex w-full items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <Button type="submit" variant="outline" className="w-full border-foreground text-foreground bg-transparent hover:bg-foreground/10" disabled={submitting}>
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
