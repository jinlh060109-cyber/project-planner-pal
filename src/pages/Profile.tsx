import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

const QUADRANT_CONFIG: Record<
  Quadrant,
  { letter: string; label: string; color: string; placeholder: string }
> = {
  strength: {
    letter: "S",
    label: "Strengths",
    color: "hsl(var(--strength))",
    placeholder: "e.g. Strong analytical thinking",
  },
  weakness: {
    letter: "W",
    label: "Weaknesses",
    color: "hsl(var(--weakness))",
    placeholder: "e.g. Limited public speaking experience",
  },
  opportunity: {
    letter: "O",
    label: "Opportunities",
    color: "hsl(var(--opportunity))",
    placeholder: "e.g. Growing demand for AI skills",
  },
  threat: {
    letter: "T",
    label: "Threats",
    color: "hsl(var(--threat))",
    placeholder: "e.g. Competitive job market in tech",
  },
};

const QUADRANT_ORDER: Quadrant[] = [
  "strength",
  "weakness",
  "opportunity",
  "threat",
];

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  role_situation: string | null;
  north_star: string | null;
}

interface SwotItems {
  strength: string[];
  weakness: string[];
  opportunity: string[];
  threat: string[];
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: null,
    avatar_url: null,
    role_situation: null,
    north_star: null,
  });

  const [swotItems, setSwotItems] = useState<SwotItems>({
    strength: ["", ""],
    weakness: ["", ""],
    opportunity: ["", ""],
    threat: ["", ""],
  });

  // Snapshot for dirty detection
  const [savedProfile, setSavedProfile] = useState<ProfileData>(profile);
  const [savedSwot, setSavedSwot] = useState<SwotItems>(swotItems);

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(profile) !== JSON.stringify(savedProfile) ||
      JSON.stringify(swotItems) !== JSON.stringify(savedSwot)
    );
  }, [profile, savedProfile, swotItems, savedSwot]);

  // Fetch profile + swot items
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      const [profileRes, swotRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url, role_situation, north_star")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("swot_items")
          .select("quadrant, content, sort_order")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
      ]);

      if (profileRes.data) {
        const p = {
          display_name: profileRes.data.display_name,
          avatar_url: profileRes.data.avatar_url,
          role_situation: profileRes.data.role_situation,
          north_star: profileRes.data.north_star,
        };
        setProfile(p);
        setSavedProfile(p);
      }

      if (swotRes.data) {
        const items: SwotItems = {
          strength: [],
          weakness: [],
          opportunity: [],
          threat: [],
        };
        swotRes.data.forEach((item) => {
          const q = item.quadrant as Quadrant;
          if (q in items) items[q].push(item.content);
        });
        // Ensure at least 2 slots
        for (const q of QUADRANT_ORDER) {
          while (items[q].length < 2) items[q].push("");
        }
        setSwotItems(items);
        setSavedSwot(items);
      }

      setIsLoading(false);
    };
    load();
  }, [user]);

  const userInitial = useMemo(() => {
    const name = profile.display_name || user?.email || "?";
    return name.charAt(0).toUpperCase();
  }, [profile.display_name, user?.email]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed — please try again",
        variant: "destructive",
      });
      setIsUploadingAvatar(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Bust cache
    const url = `${publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("user_id", user.id);

    setProfile((prev) => ({ ...prev, avatar_url: url }));
    setSavedProfile((prev) => ({ ...prev, avatar_url: url }));
    setIsUploadingAvatar(false);
  };

  const handleSwotChange = (q: Quadrant, index: number, value: string) => {
    setSwotItems((prev) => {
      const arr = [...prev[q]];
      arr[index] = value;
      return { ...prev, [q]: arr };
    });
  };

  const handleAddSwotItem = (q: Quadrant) => {
    setSwotItems((prev) => {
      if (prev[q].length >= 4) return prev;
      return { ...prev, [q]: [...prev[q], ""] };
    });
  };

  const handleSave = async () => {
    if (!user || isSaving) return;
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role_situation: profile.role_situation,
          north_star: profile.north_star,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Delete existing swot items and re-insert
      await supabase.from("swot_items").delete().eq("user_id", user.id);

      const swotRows: {
        user_id: string;
        quadrant: string;
        content: string;
        sort_order: number;
      }[] = [];
      for (const q of QUADRANT_ORDER) {
        swotItems[q].forEach((content, i) => {
          if (content.trim()) {
            swotRows.push({
              user_id: user.id,
              quadrant: q,
              content: content.trim(),
              sort_order: i,
            });
          }
        });
      }

      if (swotRows.length > 0) {
        const { error: swotError } = await supabase
          .from("swot_items")
          .insert(swotRows);
        if (swotError) throw swotError;
      }

      setSavedProfile({ ...profile });
      setSavedSwot(JSON.parse(JSON.stringify(swotItems)));

      toast({ title: "Profile updated", duration: 3000 });
    } catch (e: any) {
      console.error("Save error:", e);
      toast({
        title: "Couldn't save — please try again",
        variant: "destructive",
        duration: Infinity,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses =
    "bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-0 transition-colors duration-200";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-display font-bold text-foreground">
          Profile
        </h1>
        <div className="w-[140px]" /> {/* Spacer for centering */}
      </header>

      <div className="max-w-[680px] mx-auto px-4 py-8 space-y-10">
        {/* SECTION 1 — Identity Header */}
        <section className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {isLoading ? (
              <Skeleton className="w-20 h-20 rounded-full" />
            ) : isUploadingAvatar ? (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
              </div>
            ) : profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[32px] font-bold text-primary-foreground leading-none">
                  {userInitial}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] text-muted-foreground hover:underline transition-colors"
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          {/* Name */}
          {isLoading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <h2 className="text-2xl font-bold text-foreground text-center">
              {profile.display_name || user?.email || "User"}
            </h2>
          )}

          {/* Role / Life Situation */}
          {isLoading ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : (
            <Input
              value={profile.role_situation || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  role_situation: e.target.value,
                }))
              }
              placeholder="e.g. Business student + aspiring AI builder"
              className={cn(inputClasses, "text-center max-w-sm")}
            />
          )}
        </section>

        {/* North Star Objective */}
        <section>
          <label className="text-[13px] text-muted-foreground uppercase tracking-widest font-semibold mb-2 block">
            North Star Objective
          </label>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <textarea
              rows={3}
              value={profile.north_star || ""}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  north_star: e.target.value,
                }))
              }
              placeholder="e.g. Launch a profitable AI product before I graduate"
              className={cn(
                "flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                inputClasses,
                "focus-visible:ring-primary"
              )}
            />
          )}
        </section>

        {/* SECTION 2 — Strategic Profile */}
        <section className="space-y-6">
          {QUADRANT_ORDER.map((q) => {
            const config = QUADRANT_CONFIG[q];
            const items = swotItems[q];
            return (
              <div key={q} className="space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    {config.letter} — {config.label}
                  </span>
                </div>

                {/* Inputs */}
                {isLoading
                  ? [0, 1].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  : items.map((value, i) => (
                      <Input
                        key={i}
                        value={value}
                        onChange={(e) =>
                          handleSwotChange(q, i, e.target.value)
                        }
                        placeholder={config.placeholder}
                        className={cn(inputClasses)}
                        style={
                          {
                            "--tw-ring-color": config.color,
                          } as React.CSSProperties
                        }
                      />
                    ))}

                {/* Add another */}
                {!isLoading && items.length < 4 && (
                  <button
                    onClick={() => handleAddSwotItem(q)}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    + Add another
                  </button>
                )}
              </div>
            );
          })}
        </section>

        {/* SECTION 3 — Save + Coming Soon */}
        <section className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={cn(
                "rounded-full px-8",
                isDirty &&
                  !isSaving &&
                  "ring-2 ring-primary/40 animate-pulse"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>

          {/* Coming Soon card */}
          <div className="border border-dashed border-border rounded-xl p-6 space-y-2">
            <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
              Coming soon
            </span>
            <h3 className="text-muted-foreground font-display font-bold">
              AI Profile Summary
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Get an AI-generated strategic overview of your profile and a
              personalised master prompt.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
