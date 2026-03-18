import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SubSwot } from "@/components/SubSwotEditModal";

interface SkillProfilesProps {
  subSwots: SubSwot[];
  isLoading: boolean;
  deletingId: string | null;
  onEdit: (s: SubSwot) => void;
  onAddNew: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

const SkillProfiles = ({
  subSwots,
  isLoading,
  deletingId,
  onEdit,
  onAddNew,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: SkillProfilesProps) => {
  return (
    <section className="mb-10">
      {/* Visual separator */}
      <div className="border-t border-border my-8" />

      {/* Section header */}
      <h2 className="text-sm font-semibold tracking-[0.08em] uppercase text-foreground mb-1">
        Skill Profiles
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Active arenas you are competing in. Tasks are matched here automatically — update regularly.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : (
        <>
          {subSwots.length === 0 && (
            <p className="text-[13px] text-muted-foreground italic mb-4">
              No skill profiles yet — add one below
            </p>
          )}

          <div className="flex flex-col gap-3 mb-4">
            {subSwots.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => {
                  if (deletingId !== s.id) onEdit(s);
                }}
              >
                {deletingId === s.id ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">Delete this skill?</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs rounded-lg"
                        onClick={(e) => { e.stopPropagation(); onDeleteConfirm(s.id); }}
                      >
                        Yes, delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-lg"
                        onClick={(e) => { e.stopPropagation(); onDeleteCancel(); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-foreground">{s.name}</p>
                      {s.description && (
                        <p className="text-[13px] text-muted-foreground truncate">{s.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-[12px] text-muted-foreground">Edit →</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteRequest(s.id); }}
                        className="text-destructive/60 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Add new skill button */}
          <button
            onClick={onAddNew}
            className="w-full h-12 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[13px]">Add skill profile</span>
          </button>
        </>
      )}
    </section>
  );
};

export default SkillProfiles;
