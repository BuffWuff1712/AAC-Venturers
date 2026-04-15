import { cn } from "@/lib/utils";

const variantClasses = {
  default:
    "bg-child-green text-text-brown shadow-[0_5px_0_#92c45e] hover:bg-[#b9e67a] active:translate-y-[5px] active:shadow-none",
  peach:
    "bg-caregiver-peach text-text-brown shadow-[0_5px_0_#e6b181] hover:bg-[#ffc891] active:translate-y-[5px] active:shadow-none",
  outline:
    "border-2 border-[#edd7c4] bg-white text-text-brown shadow-[0_4px_0_#e5e7eb] hover:translate-y-[4px] hover:shadow-none",
};

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-lg font-black transition-all",
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    />
  );
}
