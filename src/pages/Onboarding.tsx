import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roleSituation, setRoleSituation] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const roleValid = roleSituation.trim().length > 0;

  const handleSubmit = async () => {
    setAttempted(true);
    if (!roleValid || !user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        role_situation: roleSituation.trim(),
        north_star: northStar.trim() || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    navigate("/onboarding/step2");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[520px] rounded-lg border bg-card shadow-sm md:rounded-xl">
        <div className="px-6 py-10 md:px-10">
          {/* Header row */}
          <div className="mb-8 flex items-center justify-between">
            <ArrowLeft className="h-5 w-5 text-muted-foreground/40" />
            <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs font-medium">
              Step 1 of 2
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Let's build your strategic profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This takes 3 minutes. The more honest you are, the smarter your classifications will be.
          </p>

          {/* Fields */}
          <div className="mt-8 space-y-5">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                What's your current role or life situation?
              </Label>
              <div className="relative">
                <Input
                  id="role"
                  value={roleSituation}
                  onChange={(e) => setRoleSituation(e.target.value)}
                  placeholder="e.g. Business Student, Software Engineer"
                  className={`pr-10 transition-colors duration-200 focus-visible:ring-[#6366F1] ${
                    attempted && !roleValid
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {roleValid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="h-4 w-4 text-[#6366F1]" />
                  </div>
                )}
              </div>
              {attempted && !roleValid && (
                <p className="text-xs text-destructive">
                  This field helps the AI classify accurately
                </p>
              )}
            </div>

            {/* North Star */}
            <div className="space-y-2">
              <Label htmlFor="northstar" className="text-sm font-medium text-foreground">
                What's your north star right now?{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="northstar"
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Launch a profitable tech product before I graduate"
                  className="pr-10 transition-colors duration-200 focus-visible:ring-[#6366F1]"
                />
                {northStar.trim().length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="h-4 w-4 text-[#6366F1]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#6366F1] text-white hover:bg-[#5558E6] md:w-auto"
            >
              {saving ? "Saving..." : "Continue"}
              {!saving && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
