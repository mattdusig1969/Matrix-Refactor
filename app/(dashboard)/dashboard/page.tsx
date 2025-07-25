'use client';

import { useEffect, useState } from 'react';
import DashboardChart from '@/components/dashboard/chart';
import { CardWrapper } from '@/components/dashboard/card-wrapper'; // Assuming you have a CardWrapper component

export default function DashboardPage() {
  const [chartData, setChartData] = useState<{ created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/completions');
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setChartData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 grid gap-6 lg:grid-cols-3">
      <CardWrapper>
        {isLoading ? <p>Loading chart...</p> : <DashboardChart chartData={chartData} />}
      </CardWrapper>

      <CardWrapper className="lg:col-span-2">
        {/* Other dashboard content can go here */}
        <h3 className="font-semibold">Recent Activity</h3>
        <p className="text-sm text-gray-500">No recent activity to show.</p>
      </CardWrapper>
    </div>
  );
}
