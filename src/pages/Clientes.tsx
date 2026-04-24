import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppointments, useClients } from "@/hooks/useStore";
import { clientsStore, uid } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/lib/types";

function ClientForm({ initial, trigger }: { initial?: Client; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const save = () => {
    if (!name.trim()) return toast.error("Informe o nome");
    clientsStore.save({
      id: initial?.id ?? uid(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    toast.success("Salvo!");
    setOpen(false);
    if (!initial) {
      setName(""); setPhone(""); setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" className="h-11 w-11 rounded-full bg-gradient-primary shadow-elegant">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar cliente" : "Nova cliente"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label>Observações</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={save} className="w-full bg-gradient-primary h-11 shadow-elegant">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Clientes = () => {
  const clients = useClients();
  const appts = useAppointments();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const enriched = clients.map((c) => {
      const cAppts = appts.filter((a) => a.clientId === c.id);
      const total = cAppts.filter((a) => a.status === "completed").reduce((s, a) => s + a.price, 0);
      return { ...c, count: cAppts.length, total };
    });
    return enriched
      .filter((c) => (q.trim() ? c.name.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, appts, q]);

  const remove = (id: string) => {
    if (!confirm("Remover esta cliente?")) return;
    clientsStore.remove(id);
    toast.success("Removida");
  };

  return (
    <AppLayout subtitle="Cadastro" title="Clientes" action={<ClientForm />}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 rounded-full"
          placeholder="Buscar cliente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-card/60 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma cliente cadastrada.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <ClientForm
              key={c.id}
              initial={c}
              trigger={
                <button className="w-full text-left rounded-2xl bg-card border border-border/60 p-4 shadow-soft hover:shadow-elegant transition-smooth animate-scale-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display text-lg shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-tight truncate">{c.name}</h3>
                        {c.phone && (
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                          <Sparkles className="h-3 w-3" /> {c.count} atendimento{c.count !== 1 ? "s" : ""} · R$ {c.total.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                      className="h-7 w-7 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              }
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Clientes;
