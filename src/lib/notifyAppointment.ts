import { supabase } from "@/integrations/supabase/client";

type Kind = "confirmed" | "cancelled";

const TEMPLATE: Record<Kind, "booking_confirmed_customer" | "booking_cancelled_customer"> = {
  confirmed: "booking_confirmed_customer",
  cancelled: "booking_cancelled_customer",
};

/**
 * Fetches appointment + company data and triggers the customer email.
 * Silent failure (best effort) — never blocks the UI flow.
 */
export async function notifyAppointmentStatus(appointmentId: string, kind: Kind) {
  try {
    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, company_id, customer_email, client_name, date, time, service")
      .eq("id", appointmentId)
      .maybeSingle();

    if (error || !appt?.customer_email) return;

    let companyName = "";
    if (appt.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", appt.company_id)
        .maybeSingle();
      companyName = company?.name ?? "";
    }

    await supabase.functions.invoke("send-notification-email", {
      body: {
        template: TEMPLATE[kind],
        to: appt.customer_email,
        companyId: appt.company_id,
        appointmentId: appt.id,
        data: {
          clientName: appt.client_name ?? "",
          companyName,
          service: appt.service ?? "",
          date: appt.date,
          time: appt.time,
        },
      },
    });
  } catch (e) {
    console.error("notifyAppointmentStatus failed", e);
  }
}
