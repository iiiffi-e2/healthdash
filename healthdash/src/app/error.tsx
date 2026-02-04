"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Please refresh the page or try again."}
      </p>
      <button
        className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
