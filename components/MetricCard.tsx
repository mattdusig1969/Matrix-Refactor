import React from 'react';

export default function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 shadow-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-black dark:text-white">{value}</p>
    </div>
  );
}
