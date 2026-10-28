import { NeedSectionPage } from "@/app/volunteer/needs/need-section-page";

export const metadata = {
  title: "План закупок: закрытые",
  robots: { index: false },
};

export default function VolunteerNeedsClosedPage() {
  return (
    <NeedSectionPage
      kind="closed"
      heading="План закупок: закрытые"
      emptyText="Закрытых позиций нет."
    />
  );
}
