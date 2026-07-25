import { cn } from "@/lib/utils";

type Chip = { key: string; label: string; count?: number };

type Props = {
  chips: Chip[];
  value: string;
  onChange: (key: string) => void;
};

export function FilterChips({ chips, value, onChange }: Props) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <button
            key={chip.key}
            onClick={() => onChange(chip.key)}
            className={cn("rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors")}
            style={
              active
                ? { backgroundColor: "var(--navy-700)", color: "#fff" }
                : { backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }
            }
          >
            {chip.label}
            {chip.count != null && <span className="mr-1.5 opacity-70">{chip.count}</span>}
          </button>
        );
      })}
    </div>
  );
}