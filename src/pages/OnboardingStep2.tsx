import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const OnboardingStep2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [strengths, setStrengths] = useState(["", ""]);
  const [weaknesses, setWeaknesses] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const updateStrength = (index: number, value: string) => {
    setStrengths((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const updateWeakness = (index: number, value: string) => {
    setWeaknesses((prev) => prev.map((w, i) => (i === index ? value : w)));
  };

  const handleSubmit = async () => {
    if (!user) return;

    const filledStrengths = strengths.filter((s) => s.trim().length > 0);
    const filledWeaknesses = weaknesses.filter((w) => w.trim().length > 0);

    setSaving(true);

    // Insert SWOT items
    const swotItems = [
      ...filledStrengths.map((content, i) => ({
        user_id: user.id,
        quadrant: "strength" as const,
        content: content.trim(),
        sort_order: i,
      })),
      ...filledWeaknesses.map((content, i) => ({
        user_id: user.id,
        quadrant: "weakness" as const,
        content: content.trim(),
        sort_order: i,
      })),
    ];

    if (swotItems.length > 0) {
      const { error: swotError } = await supabase
        .from("swot_items")
        .insert(swotItems);

      if (swotError) {
        toast({
          title: "Error saving items",
          description: swotError.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    // Mark onboarding as completed
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);

    if (profileError) {
      toast({
        title: "Error completing onboarding",
        description: profileError.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    navigate("/dashboard");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const strengthPlaceholders = [
    "e.g. I'm disciplined about consistency",
    "e.g. I understand how businesses operate",
  ];

  const weaknessPlaceholders = [
    "e.g. I avoid difficult conversations",
    "e.g. I overthink before taking action",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[520px] rounded-lg border bg-card shadow-sm md:rounded-xl">
        <div className="px-6 py-10 md:px-10">
          {/* Header row */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding")}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs font-medium"
            >
              Step 2 of 2
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            What are you working with?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Be specific. 'Good communicator' is less useful than 'I can pitch
            ideas clearly under pressure.'
          </p>

          {/* Strengths Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[hsl(142,71%,45%)]" />
              <Label className="text-sm font-medium text-foreground">
                Your current strengths
              </Label>
            </div>
            <div className="space-y-4">
              {strengths.map((value, index) => (
                <Input
                  key={`strength-${index}`}
                  value={value}
                  onChange={(e) => updateStrength(index, e.target.value)}
                  placeholder={strengthPlaceholders[index]}
                  className="transition-colors duration-200 focus-visible:ring-[hsl(142,71%,45%)]"
                />
              ))}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Weaknesses Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[hsl(38,92%,50%)]" />
              <Label className="text-sm font-medium text-foreground">
                Your current weaknesses
              </Label>
            </div>
            <div className="space-y-4">
              {weaknesses.map((value, index) => (
                <Input
                  key={`weakness-${index}`}
                  value={value}
                  onChange={(e) => updateWeakness(index, e.target.value)}
                  onKeyDown={index === 1 ? handleKeyDown : undefined}
                  placeholder={weaknessPlaceholders[index]}
                  className="transition-colors duration-200 focus-visible:ring-[hsl(38,92%,50%)]"
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#6366F1] text-white hover:bg-[#5558E6] md:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Creating your profile...
                </>
              ) : (
                <>
                  Build my profile
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep2;
