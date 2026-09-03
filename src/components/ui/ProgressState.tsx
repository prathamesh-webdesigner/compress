import { Loader2 } from "lucide-react";

export function ProgressState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="card flex flex-col items-center gap-3 p-10 text-center">
      <Loader2 size={28} className="animate-spin text-[var(--color-brand)]" />
      <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
      <p className="text-xs text-[var(--color-text-subtle)]">This usually takes just a few seconds.</p>
    </div>
  );
}
