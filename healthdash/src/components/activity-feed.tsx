type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tag?: string;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-border/60 bg-card/60 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.tag ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                {item.tag}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {item.timestamp}
          </p>
        </div>
      ))}
    </div>
  );
}
