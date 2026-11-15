import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}

function Progress({ className, value = 0, indicatorClassName, indicatorStyle, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-500 ease-out", indicatorClassName)}
        style={{ width: `${clamped}%`, ...indicatorStyle }}
      />
    </div>
  );
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />;
}

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-border", className)} {...props} />;
}

export { Progress, Skeleton, Separator };
