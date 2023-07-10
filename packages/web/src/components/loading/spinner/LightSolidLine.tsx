export function LightSolidLine({ size }: { size: "sm" | "md" | "lg" }) {
  switch (size) {
    case "sm":
      return (
        <div className="w-4 h-4 border border-solid rounded-full border-slate-200 animate-spin border-t-transparent" />
      );
    case "md":
      return (
        <div className="w-8 h-8 border border-solid rounded-full border-slate-200 animate-spin border-t-transparent" />
      );
    case "lg":
      return (
        <div className="w-16 h-16 border border-solid rounded-full border-slate-200 animate-spin border-t-transparent" />
      );
    default:
      return null;
  }
}
