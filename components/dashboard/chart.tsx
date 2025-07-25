'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';

// Define the shape of the props the component expects
interface DashboardChartProps {
  chartData: { created_at: string }[];
}

export default function DashboardChart({ chartData }: DashboardChartProps) {
  // Process the raw data passed via props to group completions by day
  const processedData = (chartData || []).reduce((acc, completion) => {
    if (!completion.created_at) return acc;
    
    try {
      const day = format(startOfDay(parseISO(completion.created_at)), 'yyyy-MM-dd');
      
      if (!acc[day]) {
        acc[day] = { date: format(parseISO(day), 'MMM d'), completions: 0 };
      }
      acc[day].completions += 1;
    } catch (error) {
      console.error("Could not parse date:", completion.created_at, error);
    }
    
    return acc;
  }, {} as Record<string, { date: string; completions: number }>);

  const dataForChart = Object.values(processedData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!dataForChart || dataForChart.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg h-[300px] flex items-center justify-center">
        <p>No completion data available to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border shadow-md">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={dataForChart}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completions" fill="#8884d8" name="Survey Completions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
