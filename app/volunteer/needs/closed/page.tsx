import { NeedSectionPage } from "@/app/volunteer/needs/need-section-page";

export const metadata = {
  title: "План закупок: закрытые",
  robots: { index: false },
};

export default async function VolunteerNeedsClosedPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  return (
    <NeedSectionPage
      kind="closed"
      heading={
        showArchived
          ? "План закупок: убранные"
          : "План закупок: закрытые"
      }
      emptyText={
        showArchived ? "Убранных позиций нет." : "Закрытых позиций нет."
      }
      archived={showArchived}
    />
  );
}
