"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { hintClass, labelClass } from "@/lib/formClasses";
import { resizePhoto } from "@/lib/resizeImage";

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
  const { pending } = useFormStatus();
  const [preparing, setPreparing] = useState(false);

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

  if (preparing) {
    status = "Готовим фото…";
  } else if (pending && preview) {
    status = "Отправляем фото…";
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
      <p role="status" className="text-sm font-medium wrap-anywhere">
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
        className="peer sr-only"
        onChange={async (event) => {
          const input = event.target;
          const original = input.files?.[0];
          if (!original) {
            setPreview(null);
            return;
          }
          setPreparing(true);
          input.setCustomValidity("Подождите, фото ещё готовится.");
          const file = await resizePhoto(original).catch(() => original);
          const transfer = new DataTransfer();
          transfer.items.add(file);
          input.files = transfer.files;
          input.setCustomValidity("");
          setPreview({
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
          });
          setPreparing(false);
        }}
      />
      <label
        htmlFor={id}
        className="flex h-10 cursor-pointer items-center justify-center self-start rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus)"
      >
        {preview || currentUrl ? "Заменить фото" : "Выбрать фото"}
      </label>
      <p id={`${id}-hint`} className={hintClass}>
        {hint}
      </p>
    </div>
  );
}
