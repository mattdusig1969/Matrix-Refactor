// app/page.tsx

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Chart from '../components/dashboard/chart';

export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Matrix</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simulator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Run simulations of survey modules in real time.
            </p>
            <Link
              href="/simulator"
              className="inline-block text-blue-600 hover:underline font-medium"
            >
              → Go to Simulator Dashboard
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matrix Sampling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Split surveys into modules, distribute and track progress.
            </p>
            <Link
              href="/matrix"
              className="inline-block text-blue-600 hover:underline font-medium"
            >
              → Go to Matrix Sampling
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Chart />
      </div>
    </div>
  );
}
