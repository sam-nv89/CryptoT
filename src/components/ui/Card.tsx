import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx(
      "bg-bg-elevated/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
}
