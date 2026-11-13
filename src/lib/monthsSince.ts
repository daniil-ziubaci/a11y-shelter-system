export function monthsSince(
  birthDate: string,
  today: Date = new Date(),
): number {
  const birth = new Date(birthDate);
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }
  return months;
}
