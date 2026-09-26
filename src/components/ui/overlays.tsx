/**
 * Overlay primitives used by the app shell (and pages): Tooltip, Dialog, Sheet (side drawer),
 * DropdownMenu, plus Skeleton and Kbd. Kept apart from the form controls in ./controls so the shell's
 * eager bundle does not carry Select, Slider, Tabs and friends.
 */
import { Check, X } from 'lucide-react';
import { Dialog as DialogPrimitive, DropdownMenu as DropdownPrimitive, Tooltip as TooltipPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------- Tooltip */
export const TooltipProvider = TooltipPrimitive.Provider;
export function Tooltip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  if (!content) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-[1300] max-w-xs rounded-lg bg-foreground px-2.5 py-1.5 text-xs leading-snug text-background shadow-lg data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ---------------------------------------------------------------- Dialog & Sheet */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay() {
  return <DialogPrimitive.Overlay className="fixed inset-0 z-[1400] bg-slate-950/50 data-[state=open]:animate-fade-in" />;
}

export function DialogContent({
  className,
  children,
  title,
  description,
  hideClose,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, 'title'> & { title: React.ReactNode; description?: React.ReactNode; hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-[1401] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-elevated shadow-[var(--shadow-lift)]',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <DialogPrimitive.Title className="font-display text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
          </div>
          {!hideClose && (
            <DialogPrimitive.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetContent({
  className,
  children,
  title,
  description,
  side = 'right',
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, 'title'> & { title: React.ReactNode; description?: React.ReactNode; side?: 'right' | 'left' | 'bottom' }) {
  const sideCls =
    side === 'right'
      ? 'inset-y-0 right-0 h-full w-[min(100vw,28rem)] border-l'
      : side === 'left'
        ? 'inset-y-0 left-0 h-full w-[min(100vw,22rem)] border-r'
        : 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border-t';
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content className={cn('fixed z-[1401] flex flex-col border-border bg-elevated shadow-[var(--shadow-lift)] data-[state=open]:animate-fade-in', sideCls, className)} {...props}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-display text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">{description}</DialogPrimitive.Description> : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ---------------------------------------------------------------- Dropdown menu */
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export function DropdownMenuContent({ className, align = 'end', ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={8}
        className={cn('z-[1300] min-w-44 rounded-md border border-border bg-elevated p-1 text-foreground shadow-[var(--shadow-lift)]', className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn('flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground', className)}
      {...props}
    />
  );
}
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label className={cn('px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground', className)} {...props} />;
}
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;
export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem
      className={cn('relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none select-none data-[highlighted]:bg-muted [&_svg]:size-4', className)}
      {...props}
    >
      {children}
      <DropdownPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-primary" />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.RadioItem>
  );
}
export function DropdownMenuSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-border" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-5 items-center rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground', className)}>{children}</kbd>;
}
