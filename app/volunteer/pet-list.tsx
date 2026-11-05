import { createClient } from "@/lib/supabase/server";
import { setPetStatus } from "@/app/volunteer/actions";
import {
  PET_STATUS_TREATMENT,
  PET_STATUSES,
  PUBLIC_PET_STATUSES,
} from "@/lib/petStatuses";
import Link from "next/link";
import { isTreatmentStale } from "@/lib/treatmentReview";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { formatAge } from "@/lib/formatAge";
import { monthsSince } from "@/lib/monthsSince";
import { PET_SIZE_LABELS } from "@/lib/petSizes";
import { parsePage, VOLUNTEER_PAGE_SIZE } from "@/lib/parsePage";
import { parseVolunteerSort } from "@/lib/parseVolunteerSort";
import {
  parseVolunteerStatus,
  VOLUNTEER_STATUS_FILTERS,
} from "@/lib/parseVolunteerStatus";
import {
  isPetStatusStale,
  PET_STATUS_REVIEW_DAYS,
} from "@/lib/petStatusReview";

export async function PetList({
  shelterId,
  params,
}: {
  shelterId: string;
  params: {
    treatment?: string;
    q?: string;
    species?: string;
    status?: string;
    sort?: string;
    page?: string;
  };
}) {
  const supabase = await createClient();

  const search = params.q?.trim() ?? "";
  const statusFilter = parseVolunteerStatus(params.status);
  const sort = parseVolunteerSort(params.sort);
  const statuses = statusFilter
    ? [...VOLUNTEER_STATUS_FILTERS[statusFilter]]
    : [...PUBLIC_PET_STATUSES];

  const buildQuery = (head: boolean) => {
    let query = supabase
      .from("pets")
      .select(
        "id, name, status, status_changed_at, needs_treatment_since, photo_url, birth_date, is_age_approximate, sex, species, size",
        { count: "exact", head },
      )
      .eq("shelter_id", shelterId)
      .in("status", statuses);
    if (search) {
      const pattern = search.replace(/[\\%_]/g, "\\$&");
      query = query.ilike("name_search", `%${pattern}%`);
    }
    if (params.species === "dog") {
      query = query.eq("species", "собака");
    }
    if (params.species === "cat") {
      query = query.eq("species", "кошка");
    }

    if (params.treatment === "1") {
      query = query.not("needs_treatment_since", "is", null);
    }

    return query;
  };

  const { count, error: countError } = await buildQuery(true);
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / VOLUNTEER_PAGE_SIZE));
  const page = Math.min(parsePage(params.page), lastPage);
  const from = (page - 1) * VOLUNTEER_PAGE_SIZE;

  const base = buildQuery(false);
  const sorted =
    sort === "new"
      ? base.order("created_at", { ascending: false })
      : sort === "stale"
        ? base.order("status_changed_at", { ascending: true, nullsFirst: true })
        : base;
  const { data: pets, error } = await sorted
    .order("name")
    .order("id")
    .range(from, from + VOLUNTEER_PAGE_SIZE - 1);

  if (error || countError || !pets) {
    return <p role="alert">Не удалось загрузить список животных.</p>;
  }

  const tAge = await getTranslations({ locale: "ru", namespace: "Age" });

  const current = {
    q: search || undefined,
    species:
      params.species === "dog" || params.species === "cat"
        ? params.species
        : undefined,
    status: statusFilter,
    treatment: params.treatment === "1" ? "1" : undefined,
    sort,
  };

  const buildHref = (next: {
    q?: string;
    species?: string;
    status?: string;
    sort?: string;
    treatment?: string;
    page?: number;
  }) => {
    const query = new URLSearchParams();
    if (next.q) query.set("q", next.q);
    if (next.species) query.set("species", next.species);
    if (next.status) query.set("status", next.status);
    if (next.sort && next.sort !== "name") query.set("sort", next.sort);
    if (next.treatment) query.set("treatment", next.treatment);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const text = query.toString();
    return text ? `/volunteer?${text}` : "/volunteer";
  };

  const pill =
    "inline-flex min-h-11 items-center rounded-full border border-(--border-strong) bg-(--surface) px-4 aria-[current=true]:bg-(--accent) aria-[current=true]:text-white";

  const statusLabels = {
    looking: "Ищут дом",
    pending: "В процессе",
    treatment: "Лечение: пока нельзя забрать",
    archive: "Архив",
  };
  const selected = [
    current.species === "dog"
      ? "Собаки"
      : current.species === "cat"
        ? "Кошки"
        : null,
    current.status ? statusLabels[current.status] : null,
    current.treatment ? "Срочно нужна помощь с лечением" : null,
  ].filter(Boolean);
  const filtersSummary = selected.length
    ? `Фильтры: ${selected.join(", ")}`
    : "Фильтры: вид, статус, лечение";

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-[0_2px_10px_rgba(90,50,20,0.22)] sm:mx-auto sm:w-[calc(50%-0.5rem)]">
      <form
        action="/volunteer"
        method="get"
        role="search"
        className="flex flex-col gap-2"
      >
        <label htmlFor="pet-search" className="font-medium">
          Найти по имени
        </label>
        <div className="flex gap-2">
          <input
            id="pet-search"
            type="search"
            name="q"
            defaultValue={search}
            enterKeyHint="search"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-base"
          />
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium"
          >
            Показать
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pet-sort" className="font-medium">
            Порядок
          </label>
          <div className="relative min-w-0 flex-1">
<select
            id="pet-sort"
            name="sort"
            defaultValue={sort}
            className="h-10 w-full appearance-none rounded-lg border border-(--border-strong) bg-(--surface) pl-3 pr-10 text-base"
          >
            <option value="name">По имени</option>
            <option value="new">Новые сверху</option>
            <option value="stale">Давно не проверяли</option>
          </select>
<span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--muted)">▾</span>
</div>
        </div>
        {current.species && (
          <input type="hidden" name="species" value={current.species} />
        )}

        {current.treatment && (
          <input type="hidden" name="treatment" value={current.treatment} />
        )}

        {current.status && (
          <input type="hidden" name="status" value={current.status} />
        )}
      </form>
      <details className="group border-t border-(--border) pt-1">
        <summary className="flex min-h-10 cursor-pointer items-center justify-between pr-3 font-medium">
          {filtersSummary}
          <span
            aria-hidden="true"
            className="text-(--muted) transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <nav aria-label="Фильтры" className="flex flex-col gap-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Вид</span>
            <Link
              href={buildHref({ ...current, species: undefined })}
              aria-current={current.species ? undefined : "true"}
              className={pill}
            >
              Все
            </Link>
            <Link
              href={buildHref({ ...current, species: "dog" })}
              aria-current={current.species === "dog" ? "true" : undefined}
              className={pill}
            >
              Собаки
            </Link>
            <Link
              href={buildHref({ ...current, species: "cat" })}
              aria-current={current.species === "cat" ? "true" : undefined}
              className={pill}
            >
              Кошки
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Статус</span>
            {[
              [undefined, "Активные"],
              ["looking", "Ищут дом"],
              ["pending", "В процессе"],
              ["archive", "Архив"],
            ].map(([key, label]) => (
              <Link
                key={label}
                href={buildHref({ ...current, status: key })}
                aria-current={current.status === key ? "true" : undefined}
                className={pill}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex flex-wrap items-center gap-2 pb-3">
          <span className="font-medium">Лечение</span>
          <Link
            href={buildHref({
              ...current,
              status: current.status === "treatment" ? undefined : "treatment",
            })}
            aria-current={current.status === "treatment" ? "true" : undefined}
            className={pill}
          >
            Лечение: пока нельзя забрать
          </Link>
          <Link
            href={buildHref({
              ...current,
              treatment: current.treatment ? undefined : "1",
            })}
            aria-current={current.treatment ? "true" : undefined}
            className={pill}
          >
            Срочно нужна помощь с лечением
          </Link>
        </div>
      </details>
      </div>
      <p role="status" className="sm:text-center">
        {total === 0
          ? search || current.species || current.status
            ? "Никого не нашли."
            : "Животных пока нет."
          : total > VOLUNTEER_PAGE_SIZE
            ? `Показаны ${from + 1}–${from + pets.length} из ${total}`
            : `Найдено животных: ${total}`}
      </p>
      {total === 0 && (search || current.species || current.status) && (
        <p>
          Попробуйте часть имени или другой фильтр.{" "}
          <Link href="/volunteer" className="inline-block py-2 underline">
            Сбросить поиск
          </Link>
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pets.map((pet) => (
          <li key={pet.id} className="flex flex-col gap-2 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-[0_2px_10px_rgba(90,50,20,0.22)]">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg bg-(--hover) sm:w-48">
                <Image
                  src={pet.photo_url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 192px, calc(100vw - 3rem)"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start gap-3">
                  <h2 className="shrink-0 whitespace-nowrap text-[1.625rem] font-bold leading-tight">
                    {pet.name}
                  </h2>
                  <Link
                    href={`/volunteer/pets/${pet.id}/edit`}
                    aria-label={`Редактировать: ${pet.name}`}
                    className="ml-auto flex h-10 min-w-0 items-center rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-[15px] font-medium"
                  >
                    <span className="truncate">Редактировать</span>
                  </Link>
                </div>
                <p>
                  {pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1)},{" "}
                  {formatAge(
                    monthsSince(pet.birth_date),
                    pet.is_age_approximate,
                    tAge,
                  )}
                  {pet.size
                    ? `, размер: ${PET_SIZE_LABELS[pet.size] ?? pet.size}`
                    : ""}
                </p>
<form action={setPetStatus} className="mt-auto flex gap-2">
              <input type="hidden" name="petId" value={pet.id} />
              <div className="relative min-w-0 flex-1">
<select
                name="status"
                defaultValue={pet.status}
                aria-label={`Статус: ${pet.name}`}
                className="h-10 w-full appearance-none rounded-lg border border-(--border-strong) bg-(--surface) pl-3 pr-10 text-base"
              >
                {PET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === PET_STATUS_TREATMENT ? "лечение" : s}
                  </option>
                ))}
              </select>
<span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--muted)">▾</span>
</div>
              <button
                type="submit"
                aria-label={`Сохранить статус: ${pet.name}`}
                className="h-10 cursor-pointer rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium"
              >
                Сохранить
              </button>
            </form>
              </div>
            </div>

            {isPetStatusStale(pet.status, pet.status_changed_at) && (
              <p className="rounded-lg bg-(--pending-soft) px-3 py-2 font-semibold text-(--pending)">
                Проверьте, актуален ли статус: ему больше{" "}
                {PET_STATUS_REVIEW_DAYS} дней.
              </p>
            )}
            {(pet.status === PET_STATUS_TREATMENT ||
              pet.needs_treatment_since) && (
              <div className="flex flex-col gap-0.5 border-t border-(--border) pt-2">
                {pet.status === PET_STATUS_TREATMENT && (
                  <p className="rounded-lg bg-(--danger-soft) px-3 py-1 font-medium text-(--danger)">Лечение: пока нельзя забрать.</p>
                )}
                {pet.needs_treatment_since && (
                  <p className="rounded-lg bg-(--danger-soft) px-3 py-1 font-medium text-(--danger)">
                    Срочно нужна помощь с лечением, с{" "}
                    {new Date(pet.needs_treatment_since).toLocaleDateString(
                      "ru-RU",
                      { day: "numeric", month: "long" },
                    )}
                    .
                  </p>
                )}
                {pet.needs_treatment_since &&
                  isTreatmentStale(pet.needs_treatment_since) && (
                    <p className="rounded-lg bg-(--pending-soft) px-3 py-2 font-semibold text-(--pending)">
                      Проверьте, актуально ли: отметка стоит давно.
                    </p>
                  )}
                
              </div>
            )}
          </li>
        ))}
      </ul>
      {lastPage > 1 && (
        <nav
          aria-label="Страницы списка"
          className="flex items-center justify-between gap-2"
        >
          {page > 1 ? (
            <Link
              href={buildHref({ ...current, page: page - 1 })}
              className={pill}
            >
              Назад
            </Link>
          ) : (
            <span />
          )}
          <span aria-current="page">
            Страница {page} из {lastPage}
          </span>
          {page < lastPage ? (
            <Link
              href={buildHref({ ...current, page: page + 1 })}
              className={pill}
            >
              Далее
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
