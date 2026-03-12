import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const OnboardingStep3 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState(["", ""]);
  const [threats, setThreats] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const updateOpportunity = (index: number, value: string) => {
    setOpportunities((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const updateThreat = (index: number, value: string) => {
    setThreats((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const handleSubmit = async () => {
    if (!user) return;

    const filledOpportunities = opportunities.filter((o) => o.trim().length > 0);
    const filledThreats = threats.filter((t) => t.trim().length > 0);

    setSaving(true);

    const swotItems = [
      ...filledOpportunities.map((content, i) => ({
        user_id: user.id,
        quadrant: "opportunity" as const,
        content: content.trim(),
        sort_order: i,
      })),
      ...filledThreats.map((content, i) => ({
        user_id: user.id,
        quadrant: "threat" as const,
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

    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    navigate("/dashboard");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const opportunityPlaceholders = [
    "e.g. AI tools are creating demand for people who can build with them",
    "e.g. My university network is full of potential early users",
  ];

  const threatPlaceholders = [
    "e.g. Job market is competitive for business graduates without technical skills",
    "e.g. Limited time between university and bar work",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[520px] rounded-lg border bg-card shadow-sm md:rounded-xl">
        <div className="px-6 py-10 md:px-10">
          {/* Header row */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding/step2")}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs font-medium"
            >
              Step 3 of 3
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            What's your playing field?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Opportunities are external conditions working in your favor. Threats
            are external risks to what you're building.
          </p>

          {/* Opportunities Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--opportunity))]" />
              <Label className="text-sm font-medium text-foreground">
                Your current opportunities
              </Label>
            </div>
            <div className="space-y-4">
              {opportunities.map((value, index) => (
                <Input
                  key={`opportunity-${index}`}
                  value={value}
                  onChange={(e) => updateOpportunity(index, e.target.value)}
                  placeholder={opportunityPlaceholders[index]}
                  className="transition-colors duration-200 focus-visible:ring-[hsl(var(--opportunity))]"
                />
              ))}
            </div>
          </div>

          <div className="my-8 h-px bg-border" />

          {/* Threats Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--threat))]" />
              <Label className="text-sm font-medium text-foreground">
                Your current threats
              </Label>
            </div>
            <div className="space-y-4">
              {threats.map((value, index) => (
                <Input
                  key={`threat-${index}`}
                  value={value}
                  onChange={(e) => updateThreat(index, e.target.value)}
                  onKeyDown={index === 1 ? handleKeyDown : undefined}
                  placeholder={threatPlaceholders[index]}
                  className="transition-colors duration-200 focus-visible:ring-[hsl(var(--threat))]"
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
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

export default OnboardingStep3;
