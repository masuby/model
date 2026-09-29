/**
 * Card - a flat bordered box. Use sparingly (see docs/DESIGN_LANGUAGE.md): interactive panels, overlays,
 * or one highlighted element. Static content belongs on the page with rules, not in grids of cards.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border border-border bg-card text-card-foreground', className)} {...props} />;
}
