export type Pet = {
  id: string;
  name: string;
  photo: {
    url: string;
    alt: string;
  };
  species: "собака" | "кошка";
  sex: "мальчик" | "девочка";
  ageInMonths: number;
  isAgeApproximate: boolean;
  weight: number; // кг, может быть дробным (0.8)
  diet: string;
  description: string;
  health: string;
  status: "ищет дом" | "в процессе" | "пристроен";
};
