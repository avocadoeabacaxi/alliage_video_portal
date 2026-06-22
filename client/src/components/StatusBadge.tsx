import { STATUS_STYLES } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200",
        className,
      )}
    >
      {status}
    </span>
  );
}
