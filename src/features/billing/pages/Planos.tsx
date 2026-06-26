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

const formatPrice = (cents: number, currency: string) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency });

const limitText = (n: number | null, suffix: string) =>
  n === null || n === undefined ? `${suffix} ilimitados` : `Até ${n} ${suffix}`;

const Planos = () => {
  const { company } = useCompany();
  const { user } = useAuth();
  const { data: plans, isLoading } = usePlans({ onlyActive: true });
  const { data: current } = useCompanyPlan(company?.id);
  const { openCheckout } = usePaddleCheckout();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentPlanId = current?.plan?.plan_id;

  const handleSubscribe = async (
    planId: string,
    priceId: string | null,
  ) => {
    if (!company) return;
    if (!priceId) {
      toast.error("Este plano ainda não está disponível para assinatura.");
      return;
    }
    setLoadingId(planId);
    try {
      await openCheckout({
        priceId,
        customerEmail: user?.email,
        customData: { companyId: company.id, userId: user?.id ?? "" },
      });
    } catch (e) {
      toast.error("Não foi possível abrir o checkout. Tente novamente.");
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <AppLayout title="Planos" subtitle="Escolha o plano ideal para o seu salão">
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
            const isFree = p.price_cents === 0;
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
                        Atual
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
                    /{p.interval === "month" ? "mês" : "ano"}
                  </span>
                </p>

                <ul className="text-sm space-y-1.5 flex-1">
                  <Feature text={limitText(p.max_professionals, "profissionais")} />
                  <Feature text={limitText(p.max_appointments_per_month, "agendamentos/mês")} />
                  <Feature text={limitText(p.max_services, "serviços")} />
                  {(p.features as Record<string, boolean>)?.public_booking && (
                    <Feature text="Página pública de agendamento" />
                  )}
                  {(p.features as Record<string, boolean>)?.email_notifications && (
                    <Feature text="Notificações por e-mail" />
                  )}
                  {(p.features as Record<string, boolean>)?.reports && (
                    <Feature text="Relatórios avançados" />
                  )}
                  {(p.features as Record<string, boolean>)?.branding_removal && (
                    <Feature text="Sem marca Lovable" />
                  )}
                </ul>

                <Button
                  disabled={isCurrent || loadingId === p.id}
                  onClick={() => handleSubscribe(p.id, (p as any).paddle_price_id ?? null, isFree)}
                  className={
                    isCurrent
                      ? ""
                      : "bg-gradient-primary shadow-elegant"
                  }
                  variant={isCurrent ? "outline" : "default"}
                >
                  {isCurrent ? (
                    "Plano atual"
                  ) : loadingId === p.id ? (
                    "Abrindo checkout…"
                  ) : isFree ? (
                    "Plano padrão"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" /> Assinar
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
  const unlimited = text.toLowerCase().includes("ilimitad");
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
