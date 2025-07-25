'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function DashboardChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/completions')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  console.log('Chart data:', data);


  const series = [
    {
      name: 'Completions',
      data: Array.isArray(data) ? data.map((item) => item.count) : [],
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      id: 'completions-line',
      type: 'line',
      toolbar: { show: false },
      animations: { enabled: true },
    },
    xaxis: {
      categories: data.map((item) => item.date),
    },
    stroke: {
      curve: 'smooth',
    },
    theme: {
      mode: 'light',
    },
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-md">
      <Chart options={options} series={series} type="line" height={300} />
    </div>
  );
}
