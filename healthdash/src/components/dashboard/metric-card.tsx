import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  trend,
  helper,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  trend?: string;
  helper?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border ${
        highlight ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border/60"
      }`}
    >
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{title}</span>
          {icon}
        </div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {trend ? <div className="text-xs text-primary">{trend}</div> : null}
        {helper ? (
          <p className="text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
