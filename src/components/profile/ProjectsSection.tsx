import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

      {/* Coming soon placeholder */}
      <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center text-center">
        <FolderKanban className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <Badge variant="secondary" className="text-[10px] mb-2">
          Coming soon
        </Badge>
        <h3 className="text-sm font-semibold text-muted-foreground mb-1">
          Project Tracking
        </h3>
        <p className="text-[13px] text-muted-foreground max-w-xs">
          Link projects to skill profiles and objectives. Track progress and let AI prioritise your tasks across projects.
        </p>
      </div>
    </section>
  );
};

export default ProjectsSection;
