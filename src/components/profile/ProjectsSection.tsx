import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProjectsSection = () => {
  return (
    <section className="mb-10">
      {/* Visual separator */}
      <div className="border-t border-border my-8" />

      {/* Section header */}
      <h2 className="text-sm font-semibold tracking-[0.08em] uppercase text-foreground mb-1">
        Projects
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Track initiatives and map them to your skills and strategy.
      </p>

      {/* Empty state */}
      <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center text-center">
        <FolderPlus className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Create your first project
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-5">
          Group related tasks under a project to track progress separately.
        </p>
        <Button className="rounded-full">
          New Project
        </Button>
      </div>
    </section>
  );
};

export default ProjectsSection;
