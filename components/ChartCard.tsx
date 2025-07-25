"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartCardProps {
  title: string;
  series: ApexAxisChartSeries;
  options: ApexOptions;
  height?: number;
}

export default function ChartCard({ title, series, options, height = 240 }: ChartCardProps) {
  return (
    <div className="p-4 border rounded-2xl shadow-sm bg-white dark:bg-black">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <Chart type="line" series={series} options={options} height={height} />
    </div>
  );
}
