"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { hintClass, labelClass } from "@/lib/formClasses";

type Preview = { url: string; name: string; size: number };

export function PhotoField({
  id,
  name,
  label,
  hint,
  currentUrl,
  required,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  currentUrl?: string | null;
  required?: boolean;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) {
      return;
    }
    const clear = () => setPreview(null);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);

  const shownUrl = preview?.url ?? currentUrl ?? null;
  const megabytes = preview
    ? (preview.size / 1024 / 1024).toLocaleString("ru-RU", {
        maximumFractionDigits: 1,
      })
    : "";

  let status = "Фото не выбрано.";
  if (preview) {
    status = `Выбрано: ${preview.name}, ${megabytes} МБ. После сохранения это фото заменит текущее.`;
  } else if (currentUrl) {
    status = "Сейчас загружено это фото.";
  }

  return (
    <div className="flex flex-col gap-2">
      <p className={labelClass}>{label}</p>
      {shownUrl && (
        <div className="relative aspect-4/3 w-40 overflow-hidden rounded-lg border border-(--border) bg-(--hover)">
          <Image
            src={shownUrl}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      )}
      <p role="status" className="text-sm font-medium">
        {status}
      </p>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required}
        aria-describedby={`${id}-hint`}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(
            file
              ? {
                  url: URL.createObjectURL(file),
                  name: file.name,
                  size: file.size,
                }
              : null,
          );
        }}
      />
      <label
        htmlFor={id}
        className="flex h-10 cursor-pointer items-center justify-center self-start rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium has-[:focus-visible]:outline-2 focus-within:outline-2"
      >
        {preview || currentUrl ? "Заменить фото" : "Выбрать фото"}
      </label>
      <p id={`${id}-hint`} className={hintClass}>
        {hint}
      </p>
    </div>
  );
}
