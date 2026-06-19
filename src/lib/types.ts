export interface Client {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Material {
  name: string;
  quantity?: string;
}

export interface ServiceItem {
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // ISO date "yyyy-MM-dd"
  time: string; // "HH:mm"
  service: string; // concatenated names for display / search
  services?: ServiceItem[]; // detailed breakdown
  materials: Material[];
  price: number; // total (sum of services)
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "pendente_confirmacao";
  createdAt: string;
  completedAt?: string; // ISO datetime
  extraValue?: number;
  extraReason?: string;
  professionalId?: string;
}

// ---------- Multi-profile areas ----------
export type AreaKey = "manicure" | "cabelo" | "cilios" | "sobrancelhas" | "estetica";

export const AREAS: { key: AreaKey; label: string; emoji: string }[] = [
  { key: "manicure", label: "Manicure", emoji: "💅" },
  { key: "cabelo", label: "Cabelo", emoji: "💇‍♀️" },
  { key: "cilios", label: "Cílios", emoji: "👁️" },
  { key: "sobrancelhas", label: "Sobrancelhas", emoji: "✨" },
  { key: "estetica", label: "Estética", emoji: "🌸" },
];

export const SERVICE_CATALOG_BY_AREA: Record<AreaKey, { name: string; price: number }[]> = {
  manicure: [
    { name: "Pé e mão", price: 40 },
    { name: "Pé", price: 22 },
    { name: "Mão", price: 22 },
    { name: "Pintar pé", price: 10 },
    { name: "Pintar mão", price: 10 },
    { name: "Pintar ambos", price: 20 },
    { name: "Postiça normal", price: 30 },
    { name: "Postiça em gel", price: 80 },
    { name: "Manutenção postiça", price: 50 },
    { name: "Banho de gel", price: 60 },
    { name: "Alongamento em fibra", price: 90 },
    { name: "Esmaltação em gel", price: 40 },
    { name: "Remoção", price: 20 },
    { name: "Spa dos pés", price: 35 },
    { name: "Spa das mãos", price: 30 },
    { name: "Francesinha", price: 15 },
    { name: "Decoração (por unha)", price: 5 },
  ],
  cabelo: [
    { name: "Corte feminino", price: 60 },
    { name: "Corte masculino", price: 40 },
    { name: "Escova", price: 50 },
    { name: "Hidratação", price: 70 },
    { name: "Cronograma capilar", price: 120 },
    { name: "Coloração raiz", price: 100 },
    { name: "Coloração completa", price: 180 },
    { name: "Mechas / luzes", price: 250 },
    { name: "Progressiva", price: 200 },
    { name: "Botox capilar", price: 150 },
    { name: "Penteado", price: 80 },
  ],
  cilios: [
    { name: "Aplicação fio a fio", price: 150 },
    { name: "Volume russo", price: 200 },
    { name: "Volume brasileiro", price: 180 },
    { name: "Mega volume", price: 250 },
    { name: "Manutenção", price: 80 },
    { name: "Remoção", price: 30 },
    { name: "Lash lifting", price: 120 },
  ],
  sobrancelhas: [
    { name: "Design", price: 30 },
    { name: "Design com henna", price: 50 },
    { name: "Brow lamination", price: 90 },
    { name: "Micropigmentação fio a fio", price: 350 },
    { name: "Tintura", price: 25 },
  ],
  estetica: [
    { name: "Limpeza de pele", price: 100 },
    { name: "Peeling", price: 130 },
    { name: "Drenagem linfática", price: 90 },
    { name: "Massagem relaxante", price: 100 },
    { name: "Depilação buço", price: 15 },
    { name: "Depilação axila", price: 25 },
    { name: "Depilação perna inteira", price: 60 },
  ],
};

// Legacy flat catalog kept for compatibility (manicure default)
export const SERVICE_CATALOG = SERVICE_CATALOG_BY_AREA.manicure;
