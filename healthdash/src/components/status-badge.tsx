import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "bg-secondary text-secondary-foreground",
  CONFIRMED: "bg-primary/15 text-primary",
  CHECKED_IN: "bg-primary/20 text-primary",
  IN_PROGRESS: "bg-accent text-accent-foreground",
  COMPLETED: "bg-primary/15 text-primary",
  NO_SHOW: "bg-destructive/15 text-destructive",
  CANCELED: "bg-destructive/15 text-destructive",
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-secondary text-secondary-foreground",
  PENDING: "bg-accent text-accent-foreground",
  APPROVED: "bg-primary/15 text-primary",
  PAID: "bg-primary/15 text-primary",
  DENIED: "bg-destructive/15 text-destructive",
  APPEALED: "bg-accent text-accent-foreground",
  RESUBMITTED: "bg-accent text-accent-foreground",
  OPEN: "bg-secondary text-secondary-foreground",
  PARTIALLY_PAID: "bg-accent text-accent-foreground",
  VOID: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full border-0 px-2 py-0.5 text-[11px]",
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
