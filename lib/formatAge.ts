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
