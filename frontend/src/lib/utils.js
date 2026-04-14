// Lightweight class combiner used by UI components.
// We keep it simple here so we can use shadcn-style component patterns
// without adding extra utility dependencies.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
