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
  size: string | null;
  diet: string;
  description: string;
  health: string;
  status: "ищет дом" | "в процессе" | "пристроен" | "снят с учёта";
};
