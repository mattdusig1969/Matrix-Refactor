'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';

export default function Overview() {
  const [stats, setStats] = useState({
    surveys: 0,
    modules: 0,
    responses: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch('/api/dashboard/overview');
      const data = await res.json();
      setStats(data);
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard label="Surveys" value={stats.surveys} />
      <MetricCard label="Modules" value={stats.modules} />
      <MetricCard label="Responses" value={stats.responses} />
    </div>
  );
}
