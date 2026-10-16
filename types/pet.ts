export type Pet = {
  name: string;
  species: "собака" | "кошка";
  sex: "самец" | "самка";
  ageInMonths: number;
  isAgeApproximate: boolean;
  weight: number; // кг, может быть дробным (0.8)
  diet: string;
  description: string;
  health: string;
  status: "ищет дом" | "в процессе" | "пристроен";
};
