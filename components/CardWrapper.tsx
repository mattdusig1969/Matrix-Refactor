import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function CardWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4 shadow-sm bg-white dark:bg-gray-900', className)}>
      {children}
    </div>
  );
}
