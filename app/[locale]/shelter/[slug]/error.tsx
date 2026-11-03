"use client";

import { ErrorMessage } from "@/components/ErrorMessage";

export default function ShelterError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <ErrorMessage retry={unstable_retry} />;
}
