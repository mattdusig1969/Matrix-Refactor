import Sidebar from "@/components/nav/Sidebar";
import { cn } from "@/lib/utils";

export default function AppLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-screen bg-muted">
      <Sidebar />
      <main className={cn("flex-1 p-6 overflow-y-auto", className)}>
        {children}
      </main>
    </div>
  );
}
