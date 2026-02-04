export function ProviderColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-flex h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
      aria-label="Provider color"
    />
  );
}
