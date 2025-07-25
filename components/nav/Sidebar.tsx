import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart,
  FlaskConical,
  ListChecks,
  Users,
} from "lucide-react";

const navItems = [
  {
    section: "Simulator",
    items: [
      { href: "/simulator/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/simulator/clients", icon: ListChecks, label: "Clients" },
      { href: "/simulator/surveys", icon: BarChart, label: "Surveys" },
    ],
  },
  {
    section: "Matrix",
    items: [
      { href: "/matrix/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/matrix/modules", icon: FlaskConical, label: "Modules" },
      { href: "/matrix/assign", icon: ListChecks, label: "Assign Modules" },
    ],
  },
  {
    section: "Admin",
    items: [
      { href: "/admin/users", icon: Users, label: "User Management" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-background border-r shadow-sm flex flex-col">
      <div className="text-2xl font-bold p-4">Matrix Sampling</div>
      <nav className="flex-1 overflow-y-auto px-2">
        {navItems.map(({ section, items }) => (
          <div key={section} className="mb-6">
            <div className="text-muted-foreground text-xs font-semibold px-2 mb-1">
              {section}
            </div>
            {items.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm hover:bg-muted transition",
                  pathname?.startsWith(href) ? "bg-muted font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
