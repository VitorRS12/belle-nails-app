import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useServices, type Service, type ServiceInput } from "@/hooks/useServices";
import { Plus, Pencil, Trash2, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface FormState {
  name: string;
  description: string;
  category: string;
  duration: string;
  price: string;
  color: string;
  active: boolean;
}

const empty: FormState = {
  name: "",
  description: "",
  category: "",
  duration: "60",
  price: "0",
  color: "",
  active: true,
};

function toForm(s: Service): FormState {
  return {
    name: s.name,
    description: s.description ?? "",
    category: s.category ?? "",
    duration: String(s.duration_minutes),
    price: String(s.price),
    color: s.color ?? "",
    active: s.active,
  };
}

function fromForm(f: FormState): ServiceInput {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    category: f.category.trim() || null,
    duration_minutes: Math.max(5, Math.min(600, Number(f.duration) || 60)),
    price: Math.max(0, Number(f.price.replace(",", ".")) || 0),
    color: f.color.trim() || null,
    active: f.active,
  };
}

const Servicos = () => {
  const { t } = useTranslation("app");
  const { services, loading, create, update, remove } = useServices();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm(toForm(s));
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const ok = editing
      ? await update(editing.id, fromForm(form))
      : await create(fromForm(form));
    setSaving(false);
    if (ok) setOpen(false);
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(t("services.removeConfirm", { name: editing.name }))) return;
    const ok = await remove(editing.id);
    if (ok) setOpen(false);
  };

  return (
    <AppLayout subtitle={t("services.subtitle")} title={t("services.title")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("services.count", { count: services.length })}
          </p>
          <Button onClick={openCreate} className="rounded-xl bg-gradient-primary shadow-soft">
            <Plus className="h-4 w-4 mr-1" /> {t("services.new")}
          </Button>
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title={t("services.empty.title")}
            description={t("services.empty.description")}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((s, idx) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="w-full flex items-start gap-3 text-left rounded-2xl border border-border/60 bg-card p-4 shadow-soft hover:bg-accent-soft/30 transition-smooth"
                >
                  <span
                    className="h-10 w-10 rounded-xl shrink-0"
                    style={{ background: s.color || "hsl(var(--primary) / 0.15)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg truncate">{s.name}</h3>
                      {!s.active && <Badge variant="secondary">{t("services.inactive")}</Badge>}
                      {s.category && <Badge variant="outline">{s.category}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t("services.minutes", { count: s.duration_minutes })}
                      </span>
                      <span className="font-medium text-primary">
                        R$ {s.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? t("services.form.editTitle") : t("services.form.newTitle")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">{t("services.form.name")}</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-dur">{t("services.form.duration")}</Label>
                <Input
                  id="s-dur"
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-price">{t("services.form.price")}</Label>
                <Input
                  id="s-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-cat">{t("services.form.category")}</Label>
                <Input
                  id="s-cat"
                  placeholder={t("services.form.categoryPlaceholder")}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-color">{t("services.form.color")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="s-color"
                    type="color"
                    value={form.color || "#ec4899"}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-10 w-14 p-1"
                  />
                  {form.color && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, color: "" })}
                    >
                      {t("services.form.clear")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">{t("services.form.description")}</Label>
              <Textarea
                id="s-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">{t("services.form.active")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("services.form.activeHint")}
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving} className="bg-gradient-primary flex-1">
                {saving ? t("services.form.saving") : editing ? t("services.form.save") : t("services.form.create")}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Servicos;
