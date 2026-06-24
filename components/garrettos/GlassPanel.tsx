import { cn } from '@/lib/utils';

export function GlassPanel({
  className,
  children,
  as: Tag = 'div',
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag className={cn('glass-panel rounded-2xl md:rounded-3xl', className)} {...props}>
      {children}
    </Tag>
  );
}
