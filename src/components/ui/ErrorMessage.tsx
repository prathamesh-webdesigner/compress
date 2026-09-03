import { AlertTriangle } from "lucide-react";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-[var(--color-danger-soft)] p-3.5 text-sm text-red-800"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
      <p>{message}</p>
    </div>
  );
}

export function WarningMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-[var(--color-warning-soft)] p-3.5 text-sm text-amber-900"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
      <p>{message}</p>
    </div>
  );
}
