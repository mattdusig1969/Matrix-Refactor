import { SidebarNav } from '@/components/layouts/sidebar-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <aside className="w-60 border-r bg-muted/20 p-4">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xl font-bold">Matrix Sampling</span>
          <ThemeToggle />
        </div>
        <SidebarNav />
      </aside>
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  );
}
