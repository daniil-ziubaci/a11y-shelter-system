import type { ReactNode } from "react";

export function SelectWrap({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--muted)"
      >
        ▾
      </span>
    </div>
  );
}
