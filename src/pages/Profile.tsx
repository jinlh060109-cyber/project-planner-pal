import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Camera, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SwotEditModal from "@/components/SwotEditModal";
import SubSwotEditModal, { type SubSwot } from "@/components/SubSwotEditModal";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface ProfileData {
  display_name: string | null;
  role_situation: string | null;
  north_star: string | null;
  avatar_url: string | null;
}

const QUADRANT_CONFIG: Record<
  Quadrant,
  { letter: string; label: string; borderColor: string; bgTint: string; dotColor: string }
> = {
  strength: {
    letter: "S",
    label: "Strengths",
    borderColor: "border-l-[hsl(var(--strength))]",
    bgTint: "bg-[hsl(142,71%,45%,0.05)]",
    dotColor: "bg-[hsl(var(--strength))]",
  },
  weakness: {
    letter: "W",
    label: "Weaknesses",
    borderColor: "border-l-[hsl(var(--weakness))]",
    bgTint: "bg-[hsl(38,92%,50%,0.05)]",
    dotColor: "bg-[hsl(var(--weakness))]",
  },
  opportunity: {
    letter: "O",
    label: "Opportunities",
    borderColor: "border-l-[hsl(var(--opportunity))]",
    bgTint: "bg-[hsl(217,91%,60%,0.05)]",
    dotColor: "bg-[hsl(var(--opportunity))]",
  },
  threat: {
    letter: "T",
    label: "Threats",
    borderColor: "border-l-[hsl(var(--threat))]",
    bgTint: "bg-[hsl(0,84%,60%,0.05)]",
    dotColor: "bg-[hsl(var(--threat))]",
  },
};

const QUADRANTS: Quadrant[] = ["strength", "weakness", "opportunity", "threat"];

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    display_name: null,
    role_situation: null,
    north_star: null,
    avatar_url: null,
  });
  const [initialProfile, setInitialProfile] = useState<ProfileData>(profile);

  const [role, setRole] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [swotItems, setSwotItems] = useState<Record<Quadrant, string[]>>({
    strength: [],
    weakness: [],
    opportunity: [],
    threat: [],
  });

  const [editingQuadrant, setEditingQuadrant] = useState<Quadrant | null>(null);

  // Sub-SWOT skill profiles
  const [subSwots, setSubSwots] = useState<SubSwot[]>([]);
  const [editingSubSwot, setEditingSubSwot] = useState<SubSwot | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch profile + swot items
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      const [profileRes, swotRes, subSwotRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("swot_items").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("sub_swots").select("*").eq("user_id", user.id).order("created_at"),
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setProfile({
          display_name: p.display_name,
          role_situation: p.role_situation,
          north_star: p.north_star,
          avatar_url: p.avatar_url,
        });
        setInitialProfile({
          display_name: p.display_name,
          role_situation: p.role_situation,
          north_star: p.north_star,
          avatar_url: p.avatar_url,
        });
        setRole(p.role_situation || "");
        setNorthStar(p.north_star || "");
        setAvatarUrl(p.avatar_url);
      }

      if (swotRes.data) {
        const grouped: Record<Quadrant, string[]> = {
          strength: [],
          weakness: [],
          opportunity: [],
          threat: [],
        };
        swotRes.data.forEach((item) => {
          const q = item.quadrant as Quadrant;
          if (q in grouped) grouped[q].push(item.content);
        });
        setSwotItems(grouped);
      }

      setIsLoading(false);
    };
    load();
  }, [user]);

  const isDirty = useMemo(() => {
    return role !== (initialProfile.role_situation || "") ||
           northStar !== (initialProfile.north_star || "");
  }, [role, northStar, initialProfile]);

  const handleSaveProfile = async () => {
    if (!user || !isDirty) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role_situation: role || null, north_star: northStar || null })
      .eq("user_id", user.id);

    setIsSaving(false);
    if (error) {
      toast({ title: "Couldn't save — try again", variant: "destructive", duration: Infinity });
    } else {
      setInitialProfile((prev) => ({ ...prev, role_situation: role, north_star: northStar }));
      toast({ title: "Profile saved", duration: 3000 });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
      toast({ title: "Please upload a JPG, PNG or WebP image", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upError) {
      setIsUploading(false);
      toast({ title: "Upload failed — try again", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);

    setAvatarUrl(publicUrl);
    setIsUploading(false);
    toast({ title: "Photo updated", duration: 3000 });
  };

  const handleSwotSaved = (quadrant: Quadrant, items: string[]) => {
    setSwotItems((prev) => ({ ...prev, [quadrant]: items }));
  };

  const initial = profile.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>
      </header>

      <div className="max-w-[680px] mx-auto px-4 py-8">
        {/* SECTION 1 — Identity */}
        <section className="flex flex-col items-center mb-10">
          {/* Avatar */}
          <div className="relative mb-2">
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-full" />
            ) : (
              <div className="relative h-20 w-20 rounded-full overflow-hidden">
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-full">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-[32px] font-bold">
                    {initial}
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] text-muted-foreground underline-offset-2 hover:underline transition-colors mb-4"
          >
            Change photo
          </button>

          {/* Name */}
          {isLoading ? (
            <Skeleton className="h-7 w-48 mb-3" />
          ) : (
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {profile.display_name || "Your Name"}
            </h1>
          )}

          {/* Role input */}
          {isLoading ? (
            <Skeleton className="h-10 w-full max-w-sm" />
          ) : (
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Business student + aspiring AI builder"
              className="text-center text-muted-foreground border-transparent focus-visible:border-primary bg-transparent transition-colors duration-200 max-w-sm"
            />
          )}
        </section>

        {/* North Star */}
        <section className="mb-10">
          <label className="block text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-2">
            North Star Objective
          </label>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <Textarea
              value={northStar}
              onChange={(e) => setNorthStar(e.target.value)}
              placeholder="e.g. Launch a profitable AI product before I graduate"
              rows={2}
              className="bg-card border-border text-foreground focus-visible:border-primary transition-colors duration-200 resize-none"
            />
          )}
        </section>

        {/* SECTION 2 — SWOT Cards */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-4">
            SWOT Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUADRANTS.map((q) => {
              const config = QUADRANT_CONFIG[q];
              const items = swotItems[q];
              const isEmpty = items.length === 0;

              return isLoading ? (
                <Skeleton key={q} className="h-28 rounded-xl" />
              ) : (
                <motion.button
                  key={q}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setEditingQuadrant(q)}
                  className={cn(
                    "text-left rounded-xl border-l-4 p-5 transition-shadow duration-200 hover:shadow-lg",
                    config.borderColor,
                    config.bgTint,
                    isEmpty ? "border border-dashed border-border" : "border border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                        {config.letter} — {config.label}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <p className="text-[13px] text-muted-foreground truncate">
                    {isEmpty ? (
                      <span className="italic">No items yet</span>
                    ) : (
                      items[0]
                    )}
                  </p>

                  <p className="text-[12px] text-muted-foreground mt-2 text-right">
                    Edit →
                  </p>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3 — Footer */}
        <section className="space-y-4">
          <div className="flex sm:justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={!isDirty || isSaving}
              className={cn(
                "rounded-full w-full sm:w-auto transition-all",
                isDirty && "ring-2 ring-primary/50 animate-pulse"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>

          {/* Coming soon placeholder */}
          <div className="border border-dashed border-border rounded-xl p-6">
            <Badge variant="secondary" className="text-[10px] mb-2">
              Coming soon
            </Badge>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              AI Profile Summary
            </h3>
            <p className="text-[13px] text-muted-foreground">
              AI-generated strategic overview and personalised master prompt.
            </p>
          </div>
        </section>
      </div>

      {/* SWOT Edit Modal */}
      {editingQuadrant && user && (
        <SwotEditModal
          quadrant={editingQuadrant}
          userId={user.id}
          items={swotItems[editingQuadrant]}
          onClose={() => setEditingQuadrant(null)}
          onSaved={handleSwotSaved}
        />
      )}
    </div>
  );
};

export default Profile;
