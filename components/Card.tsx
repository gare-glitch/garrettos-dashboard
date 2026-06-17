import type { ReactNode } from 'react';

export function Card({ title, eyebrow, children, className = '' }: { title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return <section className={`glass-card ${className}`}>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2>{title}</h2>{children}</section>;
}
