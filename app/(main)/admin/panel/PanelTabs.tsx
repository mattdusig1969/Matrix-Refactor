'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { panelTabs } from './tabs';

export default function PanelTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-6">
      <ul className="flex gap-2">
        {panelTabs.map(tab => (
          <li key={tab.path}>
            <Link
              href={`/admin/panel/${tab.path}`}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:bg-white/10 " +
                (pathname === `/admin/panel/${tab.path}` ? "bg-white/20 font-bold" : "")
              }
            >
              {tab.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
