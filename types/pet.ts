export type Pet = {
  name: string;
  sex: "самец" | "самка";
  ageInMonths: number;
  weight: number; // кг, может быть дробным (0.8)
  diet: string;
  description: string;
  health: string;
  status: "ищет дом" | "в процессе" | "пристроен";
};
