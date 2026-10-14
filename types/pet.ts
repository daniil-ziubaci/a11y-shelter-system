export type Pet = {
  name: string;
  sex: "самец" | "самка";
  ageInMonths: number;
  weight: number;
  diet: string;
  description: string;
  health: string;
  status: "ищет дом" | "в процессе" | "пристроен";
};
