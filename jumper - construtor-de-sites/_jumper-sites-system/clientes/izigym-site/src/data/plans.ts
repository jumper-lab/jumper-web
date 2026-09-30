export interface GymPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  promotionalMonths?: number;
  features: string[];
  checkoutUrl: string;
}

export const SISTEMA_PACTO_CHECKOUT_URL =
  "https://vendas.online.sistemapacto.com.br/planos?un=1&k=6e2660773cc378e250e6a8731d6830e5";

export const plans: GymPlan[] = [
  {
    id: 5,
    name: "Izi One",
    description: "Plano essencial para treinar na unidade de matrícula.",
    price: 157,
    features: [
      "Musculação",
      "Cardio",
      "Aulas coletivas",
      "Sem permanência mínima",
    ],
    checkoutUrl: SISTEMA_PACTO_CHECKOUT_URL,
  },
  {
    id: 6,
    name: "Izi Prime",
    description: "Plano completo com benefícios exclusivos IZI Prime.",
    price: 167,
    promotionalPrice: 27,
    promotionalMonths: 1,
    features: [
      "Acesso a qualquer unidade",
      "Izi Cycle",
      "Bioimpedância",
      "Izi Relax",
      "5 convidados por mês",
    ],
    checkoutUrl: SISTEMA_PACTO_CHECKOUT_URL,
  },
];
