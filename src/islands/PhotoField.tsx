import { useEffect, useRef, useState } from "react";
import { hintClass, labelClass } from "@/lib/formClasses";
import { preparePhotos } from "@/lib/resizeImage";

type Preview = { url: string; name: string; size: number };

export function PhotoField({
  id,
  name,
  label,
  hint,
  currentUrl,
  required,
  copies = false,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  currentUrl?: string | null;
  required?: boolean;
  copies?: boolean;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = () => setSending(true);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  const shownUrl = preview?.url ?? currentUrl ?? null;
  const megabytes = preview ? (preview.size / 1024 / 1024).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) : "";

  let status = "Фото не выбрано.";
  if (preview) {
    status = `Выбрано: ${preview.name}, ${megabytes} МБ. После сохранения это фото заменит текущее.`;
  } else if (currentUrl) {
    status = "Сейчас загружено это фото.";
  }
  if (failed) {
    status = "Не удалось подготовить фото. Попробуйте другой снимок в формате JPEG, PNG или WebP.";
  }
  if (preparing) {
    status = "Готовим фото…";
  } else if (sending && preview) {
    status = "Отправляем фото…";
  }

  async function onChange(input: HTMLInputElement) {
    const original = input.files?.[0];
    if (!original) {
      setPreview(null);
      setFailed(false);
      return;
    }
    setPreparing(true);
    setFailed(false);
    input.setCustomValidity("Подождите, фото ещё готовится.");
    const prepared = await preparePhotos(original, copies).catch(() => null);
    input.setCustomValidity("");
    setPreparing(false);
    if (!prepared) {
      input.value = "";
      setFiles(cardRef.current, null);
      setFiles(previewRef.current, null);
      setPreview(null);
      setFailed(true);
      return;
    }
    setFiles(input, prepared.full);
    setFiles(cardRef.current, prepared.card);
    setFiles(previewRef.current, prepared.preview);
    setPreview({ url: URL.createObjectURL(prepared.full), name: prepared.full.name, size: prepared.full.size });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className={labelClass}>{label}</p>
      {shownUrl && (
        <div className="relative aspect-4/3 w-40 overflow-hidden rounded-lg border border-(--border) bg-(--hover)">
          <img src={shownUrl} alt="" className="absolute inset-0 size-full object-cover" />
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
        onChange={(event) => void onChange(event.target)}
      />
      {copies && (
        <>
          <input ref={cardRef} name={`${name}Card`} type="file" hidden />
          <input ref={previewRef} name={`${name}Preview`} type="file" hidden />
        </>
      )}
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

function setFiles(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  if (!file) {
    input.value = "";
    return;
  }
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
