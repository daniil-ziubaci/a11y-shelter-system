import { NeedSectionPage } from "@/app/volunteer/needs/need-section-page";

export const metadata = {
  title: "План закупок: запас",
  robots: { index: false },
};

export default function VolunteerNeedsStockPage() {
  return (
    <NeedSectionPage
      kind="stock"
      heading="План закупок: запас"
      emptyText="Запаса нет."
    />
  );
}
