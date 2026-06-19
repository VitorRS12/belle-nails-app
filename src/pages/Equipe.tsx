import { useEffect, useState } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useProfessionals, type Professional } from "@/hooks/useProfessionals";
import {
  useProfessionalSchedules,
  WEEKDAYS,
} from "@/hooks/useProfessionalSchedules";
import { useProfessionalServices } from "@/hooks/useProfessionalServices";
import { useCustomServices } from "@/hooks/useCustomServices";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  UserRound,
  Users,
  Mail,
  X,
  Send,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface FormState {
  name: string;
  bio: string;
  specialties: string;
  active: boolean;
}

const emptyForm: FormState = { name: "", bio: "", specialties: "", active: true };

function toForm(p: Professional): FormState {
  return {
    name: p.name,
    bio: p.bio ?? "",
    specialties: p.specialties.join(", "),
    active: p.active,
  };
}

function fromForm(f: FormState) {
  return {
    name: f.name.trim(),
    bio: f.bio.trim() || null,
    specialties: f.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    active: f.active,
  };
}

const Equipe = () => {
  const { company } = useCompany();
  const { professionals, loading, create, update, remove } = useProfessionals();
  const { isCompanyAdmin } = useUserRoles();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Professional) => {
    setEditing(p);
    setForm(toForm(p));
    setOpen(true);
  };

  const handleSaveDetails = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = fromForm(form);
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    setSaving(false);
    if (ok && !editing) setOpen(false);
  };

  const handleDelete = async (p: Professional) => {
    if (!confirm(`Remover ${p.name} da equipe?`)) return;
    const ok = await remove(p.id);
    if (ok) setOpen(false);
  };

  return (
    <AppLayout subtitle="Empresa" title="Equipe">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {professionals.length}{" "}
              {professionals.length === 1 ? "profissional" : "profissionais"}
            </span>
          </div>
          {isCompanyAdmin && (
            <Button
              onClick={openCreate}
              className="rounded-xl bg-gradient-primary shadow-soft"
            >
              <Plus className="h-4 w-4 mr-1" /> Nova profissional
            </Button>
          )}
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : professionals.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Nenhuma profissional cadastrada"
            description="Cadastre as profissionais da sua empresa para começar a agendar para cada uma."
          />
        ) : (
          <ul className="grid gap-3">
            {professionals.map((p, idx) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="flex items-start gap-3 w-full text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground inline-flex items-center justify-center shrink-0">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg truncate">{p.name}</h3>
                      {!p.active && <Badge variant="secondary">Inativa</Badge>}
                      {!p.user_id && p.email && (
                        <Badge variant="outline" className="gap-1">
                          <Mail className="h-3 w-3" /> Convite pendente
                        </Badge>
                      )}
                    </div>
                    {p.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.specialties.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Sheet for create/edit */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editing ? `Editar ${editing.name}` : "Nova profissional"}
            </SheetTitle>
          </SheetHeader>

          {editing ? (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="jornada">Jornada</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4 mt-4">
                <ProfessionalDetailsForm
                  form={form}
                  setForm={setForm}
                  saving={saving}
                  onSave={handleSaveDetails}
                  onDelete={
                    isCompanyAdmin && !editing.user_id
                      ? () => handleDelete(editing)
                      : undefined
                  }
                />
                {!editing.user_id && isCompanyAdmin && (
                  <InviteSection professional={editing} />
                )}
              </TabsContent>

              <TabsContent value="jornada" className="mt-4">
                <SchedulesSection professional={editing} companyId={company?.id} />
              </TabsContent>

              <TabsContent value="servicos" className="mt-4">
                <ServicesSection professional={editing} companyId={company?.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="mt-4 space-y-4">
              <ProfessionalDetailsForm
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={handleSaveDetails}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default Equipe;

// ----------------- subcomponents -----------------

function ProfessionalDetailsForm({
  form,
  setForm,
  saving,
  onSave,
  onDelete,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  saving: boolean;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
        <Input
          id="specialties"
          placeholder="Manicure, Pedicure, Alongamento"
          value={form.specialties}
          onChange={(e) => setForm({ ...form, specialties: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Ativa</p>
          <p className="text-xs text-muted-foreground">
            Profissionais inativas não recebem novos agendamentos.
          </p>
        </div>
        <Switch
          checked={form.active}
          onCheckedChange={(v) => setForm({ ...form, active: v })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving} className="bg-gradient-primary flex-1">
          {saving ? "Salvando…" : "Salvar"}
        </Button>
        {onDelete && (
          <Button variant="outline" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SchedulesSection({
  professional,
  companyId,
}: {
  professional: Professional;
  companyId?: string;
}) {
  const { schedules, loading, add, remove } = useProfessionalSchedules(professional.id);
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!companyId) return;
    if (end <= start) {
      toast.error("Hora final deve ser maior que a inicial");
      return;
    }
    setSaving(true);
    await add(companyId, Number(weekday), `${start}:00`, `${end}:00`);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-border bg-accent-soft/30 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Adicionar bloco de atendimento
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Dia</Label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((label, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Início</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 w-[100px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-9 w-[100px]"
            />
          </div>
          <Button size="icon" onClick={handleAdd} disabled={saving} className="h-9 w-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma jornada definida.
        </p>
      ) : (
        <ul className="space-y-2">
          {schedules.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-medium">
                  {WEEKDAYS[s.weekday]}
                </Badge>
                <span className="text-sm tabular-nums">
                  {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(s.id)}
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ServicesSection({
  professional,
  companyId,
}: {
  professional: Professional;
  companyId?: string;
}) {
  const { services } = useCustomServices();
  const { linkedServiceIds, toggle } = useProfessionalServices(professional.id);

  if (services.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        description="Cadastre serviços personalizados no formulário de atendimento para poder vinculá-los a cada profissional."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Selecione os serviços oferecidos por {professional.name}.
      </p>
      <ul className="space-y-2">
        {services.map((s) => {
          const checked = linkedServiceIds.has(s.id);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {s.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={() => companyId && toggle(companyId, s.id, checked)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InviteSection({ professional }: { professional: Professional }) {
  const [email, setEmail] = useState(professional.email ?? "");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setEmail(professional.email ?? "");
  }, [professional.email]);

  const send = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) {
      toast.error("Informe o e-mail");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("invite-professional", {
      body: { professionalId: professional.id, email: clean },
    });
    setSending(false);
    if (error || (data && (data as { error?: string }).error)) {
      toast.error(
        (data as { error?: string })?.error ??
          error?.message ??
          "Não foi possível enviar o convite"
      );
      return;
    }
    toast.success("Convite enviado por e-mail ✨");
  };

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="h-4 w-4" /> Convidar para acessar o sistema
        </Label>
        <p className="text-xs text-muted-foreground">
          A profissional receberá um e-mail para criar sua conta e será vinculada
          automaticamente à sua empresa.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={send} disabled={sending} className="bg-gradient-primary">
            <Send className="h-4 w-4 mr-1" />
            {sending ? "Enviando…" : "Convidar"}
          </Button>
        </div>
      </div>
    </>
  );
}
