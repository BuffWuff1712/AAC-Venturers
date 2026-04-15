import { cn } from "@/lib/utils";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border-b-8 border-[#efefef] bg-white shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={cn("text-2xl font-black text-text-brown", className)} {...props} />;
}

export function CardDescription({ className = "", ...props }) {
  return <p className={cn("text-base font-medium text-text-brown/85", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
