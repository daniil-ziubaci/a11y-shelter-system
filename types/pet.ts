import { PET_STATUSES } from "@/lib/petStatuses";

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
  status: (typeof PET_STATUSES)[number];
  needsTreatmentSince: string | null;
};
