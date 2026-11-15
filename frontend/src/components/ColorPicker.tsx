import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
            value.toLowerCase() === color.toLowerCase() ? "ring-2 ring-foreground" : "",
          )}
          style={{ background: color }}
        >
          {value.toLowerCase() === color.toLowerCase() ? <Check className="size-3.5 text-white" /> : null}
        </button>
      ))}
      <label className="relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Color personalizado"
        />
        <span className="pointer-events-none text-[10px] font-medium text-muted-foreground">+</span>
      </label>
    </div>
  );
}
