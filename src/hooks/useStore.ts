import { useLiveQuery } from "dexie-react-hooks";
import { appointmentsRepo, clientsRepo } from "@/data";
import type { Appointment, Client } from "@/lib/types";
import type { AppointmentRecord, ClientRecord } from "@/data/types";

/**
 * Reactive hooks backed by IndexedDB via Dexie's useLiveQuery.
 * Any write through the repositories (or `clientsStore`/`appointmentsStore`,
 * which delegate to the repositories) automatically refreshes consumers.
 */

function toClient(r: ClientRecord): Client {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

function toAppt(r: AppointmentRecord): Appointment {
  return {
    id: r.id,
    clientId: r.clientId,
    clientName: r.clientName,
    date: r.date,
    time: r.time,
    service: r.service,
    services: r.services ?? [],
    materials: r.materials ?? [],
    price: r.price,
    notes: r.notes,
    status: r.status,
    completedAt: r.completedAt,
    extraValue: r.extraValue,
    extraReason: r.extraReason,
    professionalId: r.professionalId,
    createdAt: r.createdAt,
  };
}

export function useClients(): Client[] {
  return (
    useLiveQuery(async () => (await clientsRepo.list()).map(toClient), [], [] as Client[]) ?? []
  );
}

export function useAppointments(): Appointment[] {
  return (
    useLiveQuery(
      async () => (await appointmentsRepo.list()).map(toAppt),
      [],
      [] as Appointment[],
    ) ?? []
  );
}
