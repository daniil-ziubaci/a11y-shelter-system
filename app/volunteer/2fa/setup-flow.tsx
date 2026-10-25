"use client";

import { useState } from "react";
import { startEnrollment } from "@/app/volunteer/2fa/actions";
import { CodeForm } from "@/app/volunteer/2fa/code-form";

type Enrollment = { factorId: string; qrCode: string; secret: string };

export function SetupFlow() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError("");
    const result = await startEnrollment();
    if ("error" in result) {
      setError(result.error);
    } else {
      setEnrollment(result);
    }
    setLoading(false);
  }

  if (enrollment) {
    return (
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR приходит как data-URI, оптимизировать нечего */}
        <img
          src={`data:image/svg+xml;utf-8,${enrollment.qrCode}`}
          alt="QR-код для приложения-аутентификатора. Если отсканировать не получается, используйте ключ ниже."
          width={200}
          height={200}
        />

        <button
          type="button"
          aria-expanded={showSecret}
          onClick={() => setShowSecret(!showSecret)}
        >
          {showSecret ? "Скрыть ключ" : "Показать ключ"}
        </button>
        {showSecret && <p>Ключ для ввода вручную: {enrollment.secret}</p>}

        <CodeForm factorId={enrollment.factorId} />
      </div>
    );
  }

  return (
    <div>
      <p role="alert">{error}</p>
      <button type="button" onClick={handleStart} disabled={loading}>
        Начать настройку
      </button>
    </div>
  );
}
