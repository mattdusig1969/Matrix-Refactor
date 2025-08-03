// app/(main)/simulator/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SimulatorDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simulator Detail</h1>
      <p className="mb-4">Survey ID: <span className="font-mono">{id}</span></p>
      <div className="space-x-4">
        <Link href={`/simulator/${id}/general`} className="text-blue-600 underline">General</Link>
        <Link href={`/simulator/${id}/confidence`} className="text-blue-600 underline">Confidence</Link>
        <Link href={`/simulator/${id}/reporting`} className="text-blue-600 underline">Reporting</Link>
        <Link href={`/simulator/${id}/targeting`} className="text-blue-600 underline">Targeting</Link>
        <Link href={`/simulator/${id}/survey`} className="text-blue-600 underline">Survey</Link>
      </div>
      <div className="mt-8">
        <p>Select a tab above to view details for this survey.</p>
      </div>
    </div>
  );
}
