import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useProfessionals, type Professional } from "@/hooks/useProfessionals";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Plus, Pencil, Trash2, UserRound, Users } from "lucide-react";
import { motion } from "framer-motion";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = fromForm(form);
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    setSaving(false);
    if (ok) setOpen(false);
  };

  const handleDelete = async (p: Professional) => {
    if (!confirm(`Remover ${p.name} da equipe?`)) return;
    await remove(p.id);
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="rounded-xl bg-gradient-primary shadow-soft">
                <Plus className="h-4 w-4 mr-1" /> Nova profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar profissional" : "Nova profissional"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-gradient-primary">
                    {saving ? "Salvando…" : editing ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                <div className="flex items-start gap-3">
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
                      {p.user_id && <Badge variant="outline">Dona</Badge>}
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
                    {p.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isCompanyAdmin && !p.user_id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(p)}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
};

export default Equipe;
