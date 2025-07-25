// app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/auth/login-button';
import Chart from '@/components/dashboard/chart';

const font = Poppins({
  subsets: ['latin'],
  weight: ['600']
});

export default function Home() {
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
    <main className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800">
      <div className="space-y-6 text-center">
        <h1 className={cn('text-6xl font-semibold text-white drop-shadow-md', font.className)}>
          Matrix
        </h1>
        <p className="text-white text-lg">A simple survey platform</p>
        <div>
          <LoginButton>
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </LoginButton>
        </div>
        <div className="mt-10 w-full max-w-4xl p-4">
          {isLoading ? <p className="text-white">Loading chart...</p> : <Chart chartData={chartData} />}
        </div>
      </div>
    </main>
  );
}
