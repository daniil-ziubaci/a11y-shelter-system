import type { ReactNode } from "react";

export function AuthPage({
  title,
  shelterName,
  hasHeader = false,
  children,
}: {
  title: string;
  shelterName?: string | null;
  hasHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={`mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-8 ${hasHeader ? "pt-4" : "pt-10"}`}>
      {shelterName && (
        <p className="text-center font-medium text-(--muted) wrap-break-word">
          {shelterName}
        </p>
      )}
      <h1 className="text-center text-3xl font-bold wrap-break-word">
        {title}
      </h1>
      {children}
    </main>
  );
}
