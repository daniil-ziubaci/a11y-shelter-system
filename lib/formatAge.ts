function plural(n: number, one: string, few: string, many: string): string {
  const lastTwoDigits = n % 100;
  const lastDigit = n % 10;
  if (lastTwoDigits > 10 && lastTwoDigits < 15) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  } else if (lastDigit === 2 || lastDigit === 3 || lastDigit === 4) {
    return few;
  }
  return many;
}

function buildAge(months: number, isApproximate: boolean): string {
  if (months < 12) {
    return `${months} ${plural(months, "месяц", "месяца", "месяцев")}`;
  }
  const fullYears = Math.floor(months / 12);
  const additionalMonths = months % 12;
  if (!isApproximate) {
    if (additionalMonths === 0) {
      return `${fullYears} ${plural(fullYears, "год", "года", "лет")}`;
    }
    return `${fullYears} ${plural(fullYears, "год", "года", "лет")} и ${additionalMonths} ${plural(additionalMonths, "месяц", "месяца", "месяцев")}`;
  }
  if (months < 24) {
    if (additionalMonths === 0) {
      return "1 год";
    }
    return `1 год и ${additionalMonths} ${plural(additionalMonths, "месяц", "месяца", "месяцев")}`;
  }
  return `${fullYears} ${plural(fullYears, "год", "года", "лет")}`;
}

export function formatAge(months: number, isApproximate: boolean): string {
  const text = buildAge(months, isApproximate);
  if (isApproximate) {
    return `≈${text}`;
  }
  return text;
}
