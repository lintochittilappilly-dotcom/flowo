import { useNavigate } from "react-router-dom";
import { Building, Plus } from "lucide-react";

const NoBrandsState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[20px] border border-border bg-card shadow-lg">
        <div className="h-1 w-full gradient-bg" />
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 font-heading text-xl font-bold text-foreground">
            Create your first brand to get started
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Flowo organizes all your content by brand. Create your first brand to start generating and scheduling posts.
          </p>
          <button
            onClick={() => navigate("/brands")}
            className="mt-6 flex items-center gap-2 rounded-[var(--radius-sm)] gradient-bg px-8 py-3 font-heading text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Create First Brand
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoBrandsState;
