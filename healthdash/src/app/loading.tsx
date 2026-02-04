export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading workspace...
      </div>
    </div>
  );
}
