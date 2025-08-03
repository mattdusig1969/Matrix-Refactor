// app/(main)/matrix/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function MatrixDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Matrix Sampling Project</h1>
      <p className="mb-4">Survey ID: <span className="font-mono">{id}</span></p>
      <div className="space-x-4">
        <Link href={`/matrix/${id}/general`} className="text-blue-600 underline">General</Link>
        <Link href={`/matrix/${id}/targeting`} className="text-blue-600 underline">Targeting</Link>
        <Link href={`/matrix/${id}/survey`} className="text-blue-600 underline">Survey</Link>
        <Link href={`/matrix/${id}/modules`} className="text-blue-600 underline">Modules</Link>
        <Link href={`/matrix/${id}/adcode`} className="text-blue-600 underline">Ad Code</Link>
      </div>
      <div className="mt-8">
        <p>Select a tab above to configure your matrix sampling project.</p>
      </div>
    </div>
  );
}
