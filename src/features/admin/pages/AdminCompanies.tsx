import { useState } from "react";
import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { useAdminCompanies, useChangeCompanyPlan } from "@/features/admin/hooks/useAdminCompanies";
import { usePlans } from "@/features/admin/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusVariant: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  trialing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  past_due: "bg-destructive/15 text-destructive",
  canceled: "bg-muted text-muted-foreground",
  incomplete: "bg-muted text-muted-foreground",
};

const AdminCompanies = () => {
  const { data: companies, isLoading } = useAdminCompanies();
  const { data: plans } = usePlans();
  const changePlan = useChangeCompanyPlan();
  const [editing, setEditing] = useState<{ companyId: string; planId: string } | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    try {
      await changePlan.mutateAsync(editing);
      toast.success("Plano atualizado");
      setEditing(null);
    } catch {
      toast.error("Não foi possível atualizar");
    }
  };

  return (
    <AdminLayout title="Empresas" subtitle="Todas as empresas cadastradas na plataforma">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : !companies || companies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhuma empresa cadastrada ainda.
        </p>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            <span>Empresa</span>
            <span>Plano</span>
            <span>Status</span>
            <span className="text-right">Profissionais</span>
            <span className="text-right">Agend./mês</span>
            <span></span>
          </div>
          <ul className="divide-y divide-border/60">
            {companies.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-3 items-center px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    /b/{c.slug} · criada{" "}
                    {format(parseISO(c.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-sm">{c.plan_name ?? "—"}</span>
                <span>
                  {c.status ? (
                    <Badge className={statusVariant[c.status] ?? "bg-muted"} variant="secondary">
                      {c.status}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="text-sm tabular-nums md:text-right">
                  {c.professional_count}
                </span>
                <span className="text-sm tabular-nums md:text-right">
                  {c.appointments_this_month}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditing({ companyId: c.id, planId: c.plan_id ?? "" })
                  }
                >
                  Mudar plano
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar plano</DialogTitle>
            <DialogDescription>
              A mudança é aplicada imediatamente. Use com cautela — em produção, prefira que
              a empresa troque o plano pelo Stripe.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={editing?.planId ?? ""}
            onValueChange={(v) =>
              setEditing((prev) => (prev ? { ...prev, planId: v } : prev))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o plano" />
            </SelectTrigger>
            <SelectContent>
              {(plans ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} —{" "}
                  {(p.price_cents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: p.currency,
                  })}
                  /mês
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSave}
            disabled={!editing?.planId || changePlan.isPending}
            className="bg-gradient-primary"
          >
            Salvar
          </Button>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCompanies;
