import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, to = "/panel" }: { compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
        <GraduationCap className="size-5" />
      </span>
      {!compact ? (
        <span className="text-lg font-semibold tracking-tight">
          Meta<span className="text-gradient">Uni</span>
        </span>
      ) : null}
    </Link>
  );
}
