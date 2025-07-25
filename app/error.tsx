'use client';
export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-8 text-red-600">
      <h2>App Error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}