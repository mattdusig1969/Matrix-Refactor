'use client';

import { useEffect, useState } from 'react';

type RecentItem = {
  id: string;
  created_at: string;
  survey_title: string;
  module_title: string;
  age: string | null;
  gender: string | null;
};

export default function Recent() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/dashboard/recent');
      const data = await res.json();
      setItems(data);
    }

    load();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">
        Recent Completions
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-gray-600 dark:text-gray-300 border-b pb-2 last:border-none">
            <div className="font-medium text-black dark:text-white">
              {item.module_title} – {item.survey_title}
            </div>
            <div className="text-xs">
              {item.age} / {item.gender} • {new Date(item.created_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
