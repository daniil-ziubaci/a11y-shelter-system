"use client";

import { useState } from "react";
import { startEnrollment } from "@/app/volunteer/2fa/actions";
import { CodeForm } from "@/app/volunteer/2fa/code-form";
import {
  cardClass,
  errorClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/formClasses";

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
      <div className="flex flex-col gap-4">
        <div className={`${cardClass} items-center`}>
          <div className="w-fit rounded-xl border border-(--border) bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR приходит как data-URI, оптимизировать нечего */}
            <img
              src={enrollment.qrCode}
              alt="QR-код для приложения-аутентификатора. Если отсканировать не получается, используйте ключ ниже."
              width={200}
              height={200}
            />
          </div>

          <button
            type="button"
            aria-expanded={showSecret}
            onClick={() => setShowSecret(!showSecret)}
            className={secondaryButtonClass}
          >
            {showSecret ? "Скрыть ключ" : "Показать ключ"}
          </button>
          {showSecret && (
            <p className="w-full select-all rounded-lg bg-(--hover) px-3 py-2 font-mono break-all">
              Ключ для ввода вручную: {enrollment.secret}
            </p>
          )}
        </div>

        <CodeForm factorId={enrollment.factorId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p role="alert" className={errorClass}>
        {error}
      </p>
      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className={primaryButtonClass}
      >
        {loading ? "Готовим…" : "Начать настройку"}
      </button>
    </div>
  );
}
