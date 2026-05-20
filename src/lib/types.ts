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
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string; // ISO datetime
  extraValue?: number;
  extraReason?: string;
}

export const SERVICE_CATALOG: { name: string; price: number }[] = [
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
];
