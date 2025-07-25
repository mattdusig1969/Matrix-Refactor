'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Simulator', href: '/simulator' },
  { name: 'Matrix', href: '/matrix' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
