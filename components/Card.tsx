import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PanelCard({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        {eyebrow ? (
          <CardDescription className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
            {eyebrow}
          </CardDescription>
        ) : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** @deprecated Use PanelCard instead */
export function CardLegacy({
  title,
  eyebrow,
  children,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PanelCard title={title} eyebrow={eyebrow} className={className}>
      {children}
    </PanelCard>
  );
}

export { PanelCard as Card };
