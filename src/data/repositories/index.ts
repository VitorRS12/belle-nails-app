import { db } from "../db";
import type {
  AppointmentRecord,
  ClientRecord,
  ProfessionalRecord,
  ServiceRecord,
  SettingRecord,
} from "../types";
import { BaseRepository } from "./baseRepository";

export const clientsRepo = new BaseRepository<ClientRecord>(db.clients, "clients");
export const appointmentsRepo = new BaseRepository<AppointmentRecord>(db.appointments, "appointments");
export const servicesRepo = new BaseRepository<ServiceRecord>(db.services, "services");
export const professionalsRepo = new BaseRepository<ProfessionalRecord>(db.professionals, "professionals");
export const settingsRepo = new BaseRepository<SettingRecord>(db.settings, "settings");
