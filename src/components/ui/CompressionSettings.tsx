import { SizeUnit } from "@/types/tool";

export function CompressionSettings({
  value,
  unit,
  onValueChange,
  onUnitChange,
  disabled,
  error,
}: {
  value: number;
  unit: SizeUnit;
  onValueChange: (v: number) => void;
  onUnitChange: (u: SizeUnit) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]" htmlFor="target-size-input">
        Target size
      </label>
      <div className="flex gap-2">
        <input
          id="target-size-input"
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text)] focus-ring outline-none disabled:opacity-60 sm:w-32"
          aria-describedby={error ? "target-size-error" : undefined}
        />
        <select
          value={unit}
          disabled={disabled}
          onChange={(e) => onUnitChange(e.target.value as SizeUnit)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] focus-ring outline-none disabled:opacity-60"
          aria-label="Target size unit"
        >
          <option value="KB">KB</option>
          <option value="MB">MB</option>
        </select>
      </div>
      {error && (
        <p id="target-size-error" className="mt-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
