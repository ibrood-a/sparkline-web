import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = ({ className, ...props }) => {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md ring-1 ring-border px-3 py-2 bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition duration-300',
        className
      )}
      {...props}
    />
  );
};

export { Select };
