import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  className?: string;
}

export function StatCard({ label, value, hint, icon, accent, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      {accent ? (
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-15 blur-2xl"
          style={{ background: accent }}
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-none tracking-tight">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground/80 [&_svg]:size-5"
            style={accent ? { color: accent, background: `color-mix(in oklch, ${accent} 14%, transparent)` } : undefined}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
