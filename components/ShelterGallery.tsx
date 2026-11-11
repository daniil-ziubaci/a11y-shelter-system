"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export type GalleryPhoto = {
  id: string;
  src: string;
  thumbSrc: string;
  alt: string;
};

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function ShelterGallery({ photos }: { photos: GalleryPhoto[] }) {
  const t = useTranslations("Gallery");
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const listRef = useRef<HTMLUListElement>(null);
  const touchStartX = useRef<number | null>(null);
  const total = photos.length;
  const current = photos[index];

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[index] as HTMLElement | undefined;
    if (!list || !item) {
      return;
    }
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.clientWidth) / 2,
      behavior: scrollBehavior(),
    });
  }, [index]);

  if (!current) {
    return null;
  }

  const step = (delta: number) =>
    setIndex((value) => (value + delta + total) % total);

  const scrollStrip = (direction: number) => {
    const list = listRef.current;
    if (list) {
      list.scrollBy({
        left: direction * list.clientWidth * 0.8,
        behavior: scrollBehavior(),
      });
    }
  };

  const updateEdges = () => {
    const list = listRef.current;
    if (list) {
      setEdges({
        start: list.scrollLeft <= 1,
        end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
      });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) {
      return;
    }
    const delta = event.changedTouches[0].clientX - start;
    if (Math.abs(delta) > 40) {
      step(delta < 0 ? 1 : -1);
    }
  };

  const arrowClass =
    "absolute top-1/2 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-900 transition-colors duration-200 hover:bg-neutral-900 hover:text-white motion-reduce:transition-none";

  const stripButtonClass =
    "inline-flex size-8 shrink-0 cursor-pointer [&_svg]:size-4 items-center justify-center rounded-full border border-neutral-900 text-neutral-900 transition-colors duration-200 hover:bg-neutral-900 hover:text-white disabled:cursor-default disabled:border-neutral-300 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-300 motion-reduce:transition-none";

  const icon = (path: string) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );

  return (
    <section aria-label={t("region")} className="flex flex-col gap-3">
      <div
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-4/3 touch-pan-y overflow-hidden rounded-2xl border-[1.2px] border-(--border-strong) bg-neutral-900 shadow-md sm:aspect-video"
      >
        <Image
          src={current.src}
          alt=""
          aria-hidden="true"
          fill
          sizes="768px"
          unoptimized
          className="scale-125 object-cover blur-2xl brightness-50"
        />
        <Image
          src={current.src}
          alt={current.alt}
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          loading="eager"
          unoptimized
          className="object-contain"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t("previous")}
              className={`${arrowClass} left-3`}
            >
              {icon("M19 12H5M12 5l-7 7 7 7")}
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t("next")}
              className={`${arrowClass} right-3`}
            >
              {icon("M5 12h14M12 5l7 7-7 7")}
            </button>
          </>
        )}
        <p
          aria-live="polite"
          className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-sm text-white"
        >
          <span aria-hidden="true">
            {index + 1} / {total}
          </span>
          <span className="sr-only">
            {t("counter", { current: index + 1, total })}
          </span>
        </p>
      </div>
      {total > 1 && (
        <div className="flex items-center gap-3">
          <ul
            ref={listRef}
            onScroll={updateEdges}
            className="relative flex min-w-0 flex-1 gap-3 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((photo, i) => (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t("show", { number: i + 1, total })}
                  aria-current={i === index}
                  className={`relative block size-22 cursor-pointer overflow-hidden rounded-lg border-2 transition-opacity duration-200 motion-reduce:transition-none ${
                    i === index
                      ? "border-[#D2691E]"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.thumbSrc}
                    alt=""
                    fill
                    sizes="88px"
                    unoptimized
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
          {total > 7 && (
            <div className="hidden shrink-0 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollStrip(-1)}
                disabled={edges.start}
                aria-label={t("thumbsPrevious")}
                className={stripButtonClass}
              >
                {icon("M19 12H5M12 5l-7 7 7 7")}
              </button>
              <button
                type="button"
                onClick={() => scrollStrip(1)}
                disabled={edges.end}
                aria-label={t("thumbsNext")}
                className={stripButtonClass}
              >
                {icon("M5 12h14M12 5l7 7-7 7")}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
