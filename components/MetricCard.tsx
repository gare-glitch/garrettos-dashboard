import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({
  title,
  eyebrow,
  value,
  description,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  value?: string | number;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        {eyebrow ? <CardDescription className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">{eyebrow}</CardDescription> : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {value !== undefined ? (
          <div className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{value}</div>
        ) : null}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}
