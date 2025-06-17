import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon,
  className,
  isLoading = false,
}: AnalyticsCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface AnalyticsChartCardProps extends Omit<AnalyticsCardProps, 'value'> {
  children: ReactNode;
  className?: string;
}

export function AnalyticsChartCard({
  title,
  children,
  className,
  icon,
}: AnalyticsChartCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="h-[300px] p-6">{children}</CardContent>
    </Card>
  );
}
