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
import { useTranslation } from "react-i18next";

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

const AdminPlans = () => {
  const { t } = useTranslation("admin");
  const { data: plans, isLoading } = usePlans();
  const upsert = useUpsertPlan();
  const remove = useDeletePlan();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(empty);

  const limitLabel = (n: number | null) =>
    n === null || n === undefined ? t("plans.unlimited") : String(n);

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
      toast.error(t("plans.slugRequired"));
      return;
    }
    try {
      await upsert.mutateAsync(editing ? { id: editing.id, ...form } : form);
      toast.success(t("plans.saved"));
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (p: SubscriptionPlan) => {
    if (!confirm(t("plans.deleteConfirm", { name: p.name }))) return;
    try {
      await remove.mutateAsync(p.id);
      toast.success(t("plans.deleted"));
    } catch {
      toast.error(t("plans.deleteError"));
    }
  };

  return (
    <AdminLayout title={t("plans.title")} subtitle={t("plans.subtitle")}>
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-1" /> {t("plans.newPlan")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t("plans.editPlan") : t("plans.newPlan")}</DialogTitle>
              <DialogDescription>
                {t("plans.limitsHint")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t("plans.fields.slug")}</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="pro"
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("plans.fields.name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Pro"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t("plans.fields.description")}</Label>
                <Textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>{t("plans.fields.price")}</Label>
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
                  <Label>{t("plans.fields.currency")}</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("plans.fields.interval")}</Label>
                  <Input
                    value={form.interval}
                    onChange={(e) => setForm({ ...form, interval: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <NumberOrUnlimited
                  label={t("plans.fields.maxProfessionals")}
                  value={form.max_professionals}
                  onChange={(v) => setForm({ ...form, max_professionals: v })}
                  unlimitedAria={t("plans.fields.unlimitedAria")}
                />
                <NumberOrUnlimited
                  label={t("plans.fields.maxAppointmentsPerMonth")}
                  value={form.max_appointments_per_month}
                  onChange={(v) => setForm({ ...form, max_appointments_per_month: v })}
                  unlimitedAria={t("plans.fields.unlimitedAria")}
                />
                <NumberOrUnlimited
                  label={t("plans.fields.maxServices")}
                  value={form.max_services}
                  onChange={(v) => setForm({ ...form, max_services: v })}
                  unlimitedAria={t("plans.fields.unlimitedAria")}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="space-y-1">
                  <Label>{t("plans.fields.order")}</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                  <Label className="text-sm">{t("plans.fields.active")}</Label>
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
                {t("plans.save")}
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
                  {p.active ? t("plans.active") : t("plans.inactive")}
                </span>
              </div>
              <p className="font-display text-2xl">
                {(p.price_cents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: p.currency,
                })}
                <span className="text-xs text-muted-foreground font-normal">{t("plans.perInterval", { interval: p.interval })}</span>
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>{t("plans.professionals", { value: limitLabel(p.max_professionals) })}</li>
                <li>{t("plans.appointmentsPerMonth", { value: limitLabel(p.max_appointments_per_month) })}</li>
                <li>{t("plans.services", { value: limitLabel(p.max_services) })}</li>
                {p.stripe_price_id && (
                  <li className="truncate">{t("plans.stripePrice", { id: p.stripe_price_id })}</li>
                )}
              </ul>
              <div className="flex gap-1 mt-auto pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3 w-3 mr-1" /> {t("plans.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(p)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                  aria-label={t("plans.deleteAria")}
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
  unlimitedAria,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unlimitedAria: string;
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
          aria-label={unlimitedAria}
        >
          <InfinityIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AdminPlans;
