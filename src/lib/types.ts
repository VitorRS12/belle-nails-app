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
}
