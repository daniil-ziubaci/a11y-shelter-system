export function birthDateFromAge(
  years: number,
  months: number,
  today: Date = new Date(),
): string {
  const totalMonths = years * 12 + months;
  const target = new Date(
    today.getFullYear(),
    today.getMonth() - totalMonths,
    1,
  );
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  const day = Math.min(today.getDate(), lastDay);
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${target.getFullYear()}-${mm}-${dd}`;
}
