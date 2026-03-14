import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There is nothing here yet.',
  action,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    {action && (
      <Button className="mt-4" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);
