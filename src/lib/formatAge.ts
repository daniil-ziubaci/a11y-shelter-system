type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function buildAge(
  months: number,
  isApproximate: boolean,
  t: Translate,
): string {
  if (months < 12) {
    return t("months", { count: months });
  }
  const fullYears = Math.floor(months / 12);
  const additionalMonths = months % 12;
  if (!isApproximate) {
    if (additionalMonths === 0) {
      return t("years", { count: fullYears });
    }
    return t("yearsAndMonths", {
      years: t("years", { count: fullYears }),
      months: t("months", { count: additionalMonths }),
    });
  }
  if (months < 24) {
    if (additionalMonths === 0) {
      return t("years", { count: 1 });
    }
    return t("yearsAndMonths", {
      years: t("years", { count: 1 }),
      months: t("months", { count: additionalMonths }),
    });
  }
  return t("years", { count: fullYears });
}

export function formatAge(
  months: number,
  isApproximate: boolean,
  t: Translate,
): string {
  const text = buildAge(months, isApproximate, t);
  if (isApproximate) {
    return `≈${text}`;
  }
  return text;
}
