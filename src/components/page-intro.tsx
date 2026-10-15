import type { ReactNode } from 'react';
import { StepScene } from './landing/step-scene';

// Page heading with a diorama beside it (above it on a phone).
export function PageIntro({
  eyebrow,
  title,
  model,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  model: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[1fr_260px]">
      <div>
        <p className="label text-text-muted">{eyebrow}</p>
        <h1 className="mt-3 text-[36px] leading-[1.05] font-semibold sm:text-[44px]">{title}</h1>
        {children}
      </div>
      <StepScene model={model} className="h-[200px] max-sm:order-first sm:h-[220px]" />
    </div>
  );
}
