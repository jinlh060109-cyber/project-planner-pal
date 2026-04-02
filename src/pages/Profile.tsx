import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SwotEditModal from "@/components/SwotEditModal";
import SubSwotEditModal, { type SubSwot } from "@/components/SubSwotEditModal";
import StrategicFoundation from "@/components/profile/StrategicFoundation";
import SkillProfiles from "@/components/profile/SkillProfiles";
import ProjectsSection from "@/components/profile/ProjectsSection";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";

interface ProfileData {
  display_name: string | null;
  role_situation: string | null;
  north_star: string | null;
  avatar_url: string | null;
}

const THEME_OPTIONS: { value: "light" | "dark"; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  return (
    <section className="mb-10">
      <div className="border-t border-border my-8" />
      <h2 className="text-sm font-semibold tracking-[0.08em] uppercase text-foreground mb-1">
        Appearance
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Choose how the app looks.
      </p>
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <span className="text-sm font-medium text-foreground">Theme</span>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                theme === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

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

      if (subSwotRes.data) {
        setSubSwots(subSwotRes.data as SubSwot[]);
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
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be under 2 MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    // Delete previous avatar if it exists
    if (avatarUrl) {
      try {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([decodeURIComponent(oldPath)]);
        }
      } catch {
        // Non-critical — continue with upload
      }
    }

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

  const handleSubSwotSaved = (item: SubSwot) => {
    setSubSwots((prev) => {
      const idx = prev.findIndex((s) => s.id === item.id);
      if (idx >= 0) return prev.map((s) => (s.id === item.id ? item : s));
      return [...prev, item];
    });
  };

  const handleDeleteSubSwot = async (id: string) => {
    const { error } = await supabase.from("sub_swots").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete — try again", variant: "destructive" });
      return;
    }
    setSubSwots((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
    toast({ title: "Skill profile deleted", duration: 3000 });
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

        {/* SECTION 3 — Strategic Foundation (Accordion) */}
        <StrategicFoundation
          swotItems={swotItems}
          isLoading={isLoading}
          onEditQuadrant={(q) => setEditingQuadrant(q)}
        />

        {/* SECTION 4 — Skill Profiles */}
        <SkillProfiles
          subSwots={subSwots}
          isLoading={isLoading}
          deletingId={deletingId}
          onEdit={(s) => setEditingSubSwot(s)}
          onAddNew={() => setEditingSubSwot("new")}
          onDeleteRequest={(id) => setDeletingId(id)}
          onDeleteConfirm={handleDeleteSubSwot}
          onDeleteCancel={() => setDeletingId(null)}
        />

        {/* SECTION 5 — Projects */}
        <ProjectsSection />

        {/* SECTION 6 — Appearance */}
        <AppearanceSection />

        {/* SECTION 6 — Footer */}
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

      {/* Sub-SWOT Edit Modal */}
      {editingSubSwot && user && (
        <SubSwotEditModal
          subSwot={editingSubSwot === "new" ? null : editingSubSwot}
          userId={user.id}
          onClose={() => setEditingSubSwot(null)}
          onSaved={handleSubSwotSaved}
        />
      )}
    </div>
  );
};

export default Profile;
