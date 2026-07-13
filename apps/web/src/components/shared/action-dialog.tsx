'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export function ActionDialog({
  children,
  description,
  footer,
  onOpenChange,
  open,
  title,
  trigger,
}: {
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog {...(onOpenChange ? { onOpenChange } : {})} {...(open !== undefined ? { open } : {})}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
