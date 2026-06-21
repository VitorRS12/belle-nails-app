import { useState } from "react";
import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { usePlans, useUpsertPlan, useDeletePlan, type SubscriptionPlan } from "@/features/admin/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";

const empty = {
  slug: "",
  name: "",
  description: "",
  price_cents: 0,
  currency: "BRL",
  interval: "month",
  max_professionals: null as number | null,
  max_appointments_per_month: null as number | null,
  max_services: null as number | null,
  features: {},
  active: true,
  sort_order: 0,
};

const limitLabel = (n: number | null) =>
  n === null || n === undefined ? "Ilimitado" : String(n);

const AdminPlans = () => {
  const { data: plans, isLoading } = usePlans();
  const upsert = useUpsertPlan();
  const remove = useDeletePlan();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(empty);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: SubscriptionPlan) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description ?? "",
      price_cents: p.price_cents,
      currency: p.currency,
      interval: p.interval,
      max_professionals: p.max_professionals,
      max_appointments_per_month: p.max_appointments_per_month,
      max_services: p.max_services,
      features: p.features ?? {},
      active: p.active,
      sort_order: p.sort_order,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.name) {
      toast.error("Slug e nome são obrigatórios");
      return;
    }
    try {
      await upsert.mutateAsync(editing ? { id: editing.id, ...form } : form);
      toast.success("Plano salvo");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (p: SubscriptionPlan) => {
    if (!confirm(`Excluir o plano "${p.name}"?`)) return;
    try {
      await remove.mutateAsync(p.id);
      toast.success("Plano excluído");
    } catch {
      toast.error("Não foi possível excluir (talvez existam assinaturas vinculadas).");
    }
  };

  return (
    <AdminLayout title="Planos" subtitle="Catálogo de planos da plataforma">
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-1" /> Novo plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
              <DialogDescription>
                Limites em branco significam "ilimitado".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="pro"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Pro"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(form.price_cents / 100).toString()}
                    onChange={(e) =>
                      setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Moeda</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Intervalo</Label>
                  <Input
                    value={form.interval}
                    onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberOrUnlimited
                  label="Máx. profissionais"
                  value={form.max_professionals}
                  onChange={(v) => setForm({ ...form, max_professionals: v })}
                />
                <NumberOrUnlimited
                  label="Máx. agend./mês"
                  value={form.max_appointments_per_month}
                  onChange={(v) => setForm({ ...form, max_appointments_per_month: v })}
                />
                <NumberOrUnlimited
                  label="Máx. serviços"
                  value={form.max_services}
                  onChange={(v) => setForm({ ...form, max_services: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="space-y-1">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                  <Label className="text-sm">Ativo</Label>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={upsert.isPending}
                className="w-full bg-gradient-primary"
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(plans ?? []).map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-lg">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="font-display text-2xl">
                {(p.price_cents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: p.currency,
                })}
                <span className="text-xs text-muted-foreground font-normal">/{p.interval}</span>
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>Profissionais: {limitLabel(p.max_professionals)}</li>
                <li>Agendamentos/mês: {limitLabel(p.max_appointments_per_month)}</li>
                <li>Serviços: {limitLabel(p.max_services)}</li>
                {p.stripe_price_id && (
                  <li className="truncate">Stripe price: {p.stripe_price_id}</li>
                )}
              </ul>
              <div className="flex gap-1 mt-auto pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(p)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
};

function NumberOrUnlimited({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const unlimited = value === null || value === undefined;
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          disabled={unlimited}
          value={unlimited ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          placeholder="∞"
        />
        <button
          type="button"
          onClick={() => onChange(unlimited ? 0 : null)}
          className={`h-9 w-9 rounded-md inline-flex items-center justify-center border ${
            unlimited
              ? "bg-primary/10 text-primary border-primary/40"
              : "bg-card border-border/60 text-muted-foreground"
          }`}
          aria-label="Ilimitado"
        >
          <InfinityIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AdminPlans;
