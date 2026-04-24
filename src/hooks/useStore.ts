import { useEffect, useState } from "react";
import { appointmentsStore, clientsStore } from "@/lib/storage";
import type { Appointment, Client } from "@/lib/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>(() => clientsStore.list());
  useEffect(() => {
    const refresh = () => setClients(clientsStore.list());
    window.addEventListener("manicure:update", refresh);
    return () => window.removeEventListener("manicure:update", refresh);
  }, []);
  return clients;
}

export function useAppointments() {
  const [appts, setAppts] = useState<Appointment[]>(() => appointmentsStore.list());
  useEffect(() => {
    const refresh = () => setAppts(appointmentsStore.list());
    window.addEventListener("manicure:update", refresh);
    return () => window.removeEventListener("manicure:update", refresh);
  }, []);
  return appts;
}
