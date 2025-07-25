import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"; // Remove "ghost" and "link"
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function ShadButton({ variant = "default", size = "md", children, className, ...props }: ShadButtonProps) {
  return (
    <Button
      variant={variant}
      size={size === "md" ? "default" : size} // Map "md" to "default"
      className={cn("rounded-md", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
