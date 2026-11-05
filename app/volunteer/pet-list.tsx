import { createClient } from "@/lib/supabase/server";
import { setPetStatus } from "@/app/volunteer/actions";
import {
  PET_STATUS_LABELS,
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
    "inline-flex min-h-11 items-center rounded-full border px-4 aria-[current=true]:bg-(--accent) aria-[current=true]:text-white";

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
    : "Фильтры";

  return (
    <>
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
            className="h-12 min-w-0 flex-1 rounded border px-3 text-base"
          />
          <button
            type="submit"
            className="h-12 cursor-pointer rounded border px-4 font-medium"
          >
            Показать
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pet-sort" className="font-medium">
            Порядок
          </label>
          <select
            id="pet-sort"
            name="sort"
            defaultValue={sort}
            className="h-12 min-w-0 flex-1 rounded border px-3 text-base"
          >
            <option value="name">По имени</option>
            <option value="new">Новые сверху</option>
            <option value="stale">Давно не проверяли</option>
          </select>
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
      <details className="rounded border">
        <summary className="flex min-h-12 cursor-pointer items-center px-3 font-medium">
          {filtersSummary}
        </summary>
        <nav aria-label="Фильтры" className="flex flex-col gap-3 p-3">
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

        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
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
      <p role="status">
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
          <li key={pet.id} className="flex flex-col gap-3 rounded border p-4">
            <div className="flex gap-4">
              <Image
                src={pet.photo_url}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded object-cover"
              />
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{pet.name}</h2>
                <p>
                  {pet.sex},{" "}
                  {formatAge(
                    monthsSince(pet.birth_date),
                    pet.is_age_approximate,
                    tAge,
                  )}
                  {pet.size
                    ? `, размер: ${PET_SIZE_LABELS[pet.size] ?? pet.size}`
                    : ""}
                </p>
                <Link
                  href={`/volunteer/pets/${pet.id}/edit`}
                  aria-label={`Редактировать: ${pet.name}`}
                  className="underline inline-block py-2"
                >
                  Редактировать
                </Link>
              </div>
            </div>
            <form action={setPetStatus} className="flex flex-col gap-2">
              <input type="hidden" name="petId" value={pet.id} />
              <label htmlFor={`status-${pet.id}`} className="font-medium">
                Статус
              </label>
              <select
                id={`status-${pet.id}`}
                name="status"
                defaultValue={pet.status}
                aria-label={`Статус: ${pet.name}`}
                className="h-12 w-full rounded border px-3 text-base"
              >
                {PET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === PET_STATUS_TREATMENT
                      ? "лечение"
                      : (PET_STATUS_LABELS[s] ?? s)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                aria-label={`Сохранить статус: ${pet.name}`}
                className="h-12 cursor-pointer self-start rounded border px-4 font-medium"
              >
                Сохранить статус
              </button>
            </form>
            {isPetStatusStale(pet.status, pet.status_changed_at) && (
              <p className="text-(--pending) font-medium">
                Проверьте, актуален ли статус : текущему статусу больше{" "}
                {PET_STATUS_REVIEW_DAYS} дней.
              </p>
            )}
            {(pet.status === PET_STATUS_TREATMENT ||
              pet.needs_treatment_since) && (
              <div className="flex flex-col gap-1 border-t pt-3">
                {pet.status === PET_STATUS_TREATMENT && (
                  <p className="font-medium">Лечение: пока нельзя забрать.</p>
                )}
                {pet.needs_treatment_since && (
                  <p className="font-medium">
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
                    <p className="font-medium text-(--pending)">
                      Проверьте, актуально ли: отметка стоит давно.
                    </p>
                  )}
                <Link
                  href={`/volunteer/pets/${pet.id}/edit`}
                  aria-label={`Изменить в анкете: ${pet.name}`}
                  className="inline-block py-3 underline"
                >
                  Изменить в анкете
                </Link>
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
