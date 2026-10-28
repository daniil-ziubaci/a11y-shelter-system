import { NeedSectionPage } from "@/app/volunteer/needs/need-section-page";

export const metadata = {
  title: "План закупок: нужно купить",
  robots: { index: false },
};

export default function VolunteerNeedsOpenPage() {
  return (
    <NeedSectionPage
      kind="open"
      heading="План закупок: нужно купить"
      emptyText="Открытых нужд нет."
    />
  );
}
