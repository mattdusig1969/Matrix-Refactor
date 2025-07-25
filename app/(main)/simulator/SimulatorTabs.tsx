'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { simulatorTabs } from './tabs';

export default function SimulatorTabs({ id, surveyType }) {
  const pathname = usePathname();
  // Hide Modules and Ad Code if mode is Simulator
  const surveyTabs =
    surveyType === 'synthetic' || surveyType === 'simulator'
      ? simulatorTabs.filter(tab => tab.name !== 'Modules' && tab.name !== 'Ad Code')
      : simulatorTabs;

  return (
    <nav className="mb-6">
      <ul className="flex gap-2">
        {surveyTabs.map(tab => (
          <li key={tab.path}>
            <Link
              href={`/simulator/${id}/${tab.path}`}
              className={
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:bg-white/10 " +
                (pathname === `/simulator/${id}/${tab.path}` ? "bg-white/20 font-bold" : "")
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