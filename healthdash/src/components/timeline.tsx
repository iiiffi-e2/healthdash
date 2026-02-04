type TimelineItem = {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
        No timeline events yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
            {index < items.length - 1 ? (
              <div className="h-full w-px bg-border/60" />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
