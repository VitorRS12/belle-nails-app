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

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  date: string; // ISO date "yyyy-MM-dd"
  time: string; // "HH:mm"
  service: string;
  materials: Material[];
  price: number;
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
];
