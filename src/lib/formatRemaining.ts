export function formatRemaining(remaining: number, unit: string): string {
  if (remaining > 0) {
    return `Нужно: ${remaining.toLocaleString("ru-RU")} ${unit}`;
  }
  if (remaining < 0) {
    return `Запас: ${Math.abs(remaining).toLocaleString("ru-RU")} ${unit}`;
  }
  return "Потребность закрыта";
}
