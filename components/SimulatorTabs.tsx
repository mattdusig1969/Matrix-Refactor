"use client";

import { useRouter, usePathname } from 'next/navigation';

const SimulatorTabs = ({ surveyId }: { surveyId: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'General', href: `/simulator/${surveyId}/general` },
    { name: 'Audience', href: `/simulator/${surveyId}/audience` },
    { name: 'Questions', href: `/simulator/${surveyId}/questions` },
    { name: 'Simulate', href: `/simulator/${surveyId}/simulate` },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <a
            key={tab.name}
            href={tab.href}
            onClick={(e) => {
              e.preventDefault();
              router.push(tab.href);
            }}
            className={
              pathname === tab.href
                ? 'border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            }
          >
            {tab.name}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default SimulatorTabs;