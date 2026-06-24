import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassVariants = cva('rounded-xl', {
  variants: {
    variant: {
      panel: 'glass-panel milled-border',
      card: 'glass-card',
      nested: 'glass-nested',
    },
    interactive: {
      true: 'glass-interactive',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'panel',
    interactive: false,
  },
});

export function GlassPanel({
  className,
  children,
  as: Tag = 'div',
  variant,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof glassVariants> & {
    as?: 'div' | 'section' | 'article';
  }) {
  return (
    <Tag className={cn(glassVariants({ variant, interactive }), className)} {...props}>
      {children}
    </Tag>
  );
}
