import DashboardChart from '@/components/dashboard/chart';
import Overview from '@/components/dashboard/overview';
import RecentSales from '@/components/dashboard/recent';
import { CardWrapper } from '@/components/CardWrapper';

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <CardWrapper>
        <Overview />
      </CardWrapper>

      <CardWrapper>
        <DashboardChart />
      </CardWrapper>

      <CardWrapper className="lg:col-span-2">
        <RecentSales />
      </CardWrapper>
    </div>
  );
}
