import { AppLayout } from "@/components/AppLayout";
import { usePlans } from "@/features/admin/hooks/usePlans";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyPlan } from "@/features/billing/hooks/useCompanyPlan";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Check, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const formatPrice = (cents: number, currency: string) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency });

const Planos = () => {
  const { t } = useTranslation("billing");
  const { company } = useCompany();
  const { user } = useAuth();
  const { data: plans, isLoading } = usePlans({ onlyActive: true });
  const { data: current } = useCompanyPlan(company?.id);
  const { openCheckout } = usePaddleCheckout();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentPlanId = current?.plan?.plan_id;

  const limitText = (n: number | null, suffix: string) =>
    n === null || n === undefined
      ? t("planos.unlimitedSuffix", { suffix })
      : t("planos.upToSuffix", { n, suffix });

  const handleSubscribe = async (
    planId: string,
    priceId: string | null,
  ) => {
    if (!company) return;
    if (!priceId) {
      toast.error(t("planos.unavailable"));
      return;
    }
    setLoadingId(planId);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { companyId: company.id },
      });
      if (error || !data?.sessionId) {
        toast.error(t("planos.checkoutStartError"));
        return;
      }
      await openCheckout({
        priceId,
        customerEmail: user?.email,
        customData: { sessionId: data.sessionId },
      });
    } catch (e) {
      toast.error(t("planos.checkoutOpenError"));
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppLayout title={t("planos.title")} subtitle={t("planos.subtitle")}>
      <PaymentTestModeBanner />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(plans ?? []).map((p) => {
            const isCurrent = p.id === currentPlanId;

            return (
              <article
                key={p.id}
                className={`rounded-2xl border p-5 shadow-soft flex flex-col gap-3 ${
                  isCurrent
                    ? "border-primary bg-gradient-soft"
                    : "border-border/60 bg-card"
                }`}
              >
                <header className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary text-primary-foreground px-2 py-0.5">
                        {t("planos.current")}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  )}
                </header>

                <p className="font-display text-3xl">
                  {formatPrice(p.price_cents, p.currency)}
                  <span className="text-xs text-muted-foreground font-normal">
                    {p.interval === "month" ? t("planos.perMonth") : t("planos.perYear")}
                  </span>
                </p>

                <ul className="text-sm space-y-1.5 flex-1">
                  <Feature text={limitText(p.max_professionals, t("planos.professionals"))} />
                  <Feature text={limitText(p.max_appointments_per_month, t("planos.appointmentsPerMonth"))} />
                  <Feature text={limitText(p.max_services, t("planos.services"))} />
                  {(p.features as Record<string, boolean>)?.public_booking && (
                    <Feature text={t("planos.publicBookingPage")} />
                  )}
                  {(p.features as Record<string, boolean>)?.email_notifications && (
                    <Feature text={t("planos.emailNotifications")} />
                  )}
                  {(p.features as Record<string, boolean>)?.reports && (
                    <Feature text={t("planos.advancedReports")} />
                  )}
                  {(p.features as Record<string, boolean>)?.branding_removal && (
                    <Feature text={t("planos.noLovableBranding")} />
                  )}
                </ul>

                <Button
                  disabled={isCurrent || loadingId === p.id}
                  onClick={() => handleSubscribe(p.id, (p as any).paddle_price_id ?? null)}
                  className={
                    isCurrent
                      ? ""
                      : "bg-gradient-primary shadow-elegant"
                  }
                  variant={isCurrent ? "outline" : "default"}
                >
                  {isCurrent ? (
                    t("planos.currentPlan")
                  ) : loadingId === p.id ? (
                    t("planos.openingCheckout")
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" /> {t("planos.subscribe")}
                    </>
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

function Feature({ text }: { text: string }) {
  const unlimited = text.toLowerCase().includes("ilimitad") || text.toLowerCase().includes("unlimited");
  return (
    <li className="flex items-center gap-2">
      {unlimited ? (
        <InfinityIcon className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <Check className="h-4 w-4 text-primary shrink-0" />
      )}
      <span>{text}</span>
    </li>
  );
}

export default Planos;
