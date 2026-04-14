import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-caregiver-peach text-text-brown",
  secondary: "bg-page-peach text-text-brown",
  success: "bg-child-green text-[#2d6f1e]",
  muted: "bg-[#e4dede] text-[#746a6a]",
  outline: "border border-[#d8c2af] bg-white text-text-brown",
};

export function Badge({ className = "", variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-black",
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    />
  );
}
