import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appointmentsStore, clientsStore, uid } from "@/lib/storage";
import { useClients } from "@/hooks/useStore";
import { type Appointment, type Material, SERVICE_CATALOG } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  initial?: Appointment;
  defaultDate?: string;
  onSaved?: () => void;
}

export function AppointmentForm({ trigger, initial, defaultDate, onSaved }: Props) {
  const clients = useClients();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initial?.time ?? "09:00");
  const [service, setService] = useState(initial?.service ?? "");
  const [price, setPrice] = useState<string>(initial ? String(initial.price) : "");
  const [materials, setMaterials] = useState<Material[]>(initial?.materials ?? []);
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<Appointment["status"]>(initial?.status ?? "scheduled");

  useEffect(() => {
    if (!open) return;
    setClientId(initial?.clientId ?? "");
    setDate(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
    setTime(initial?.time ?? "09:00");
    setService(initial?.service ?? "");
    setPrice(initial ? String(initial.price) : "");
    setMaterials(initial?.materials ?? []);
    setNotes(initial?.notes ?? "");
    setStatus(initial?.status ?? "scheduled");
  }, [open, initial, defaultDate]);

  const addMaterial = () => {
    if (!matName.trim()) return;
    setMaterials((m) => [...m, { name: matName.trim(), quantity: matQty.trim() || undefined }]);
    setMatName("");
    setMatQty("");
  };

  const submit = () => {
    let finalClientId = clientId;
    let finalClientName = clients.find((c) => c.id === clientId)?.name ?? "";

    if (!finalClientId && newClientName.trim()) {
      const c = { id: uid(), name: newClientName.trim(), createdAt: new Date().toISOString() };
      clientsStore.save(c);
      finalClientId = c.id;
      finalClientName = c.name;
    }

    if (!finalClientId) return toast.error("Selecione ou cadastre uma cliente");
    if (!service.trim()) return toast.error("Informe o serviço");

    const appt: Appointment = {
      id: initial?.id ?? uid(),
      clientId: finalClientId,
      clientName: finalClientName,
      date,
      time,
      service: service.trim(),
      materials,
      price: Number(price) || 0,
      notes: notes.trim() || undefined,
      status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    appointmentsStore.save(appt);
    toast.success(initial ? "Atualizado!" : "Salvo com carinho ✨");
    setOpen(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" className="h-11 w-11 rounded-full bg-gradient-primary shadow-elegant hover:opacity-90">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {initial ? "Editar atendimento" : "Novo atendimento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            {clients.length > 0 ? (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {!clientId && (
              <Input
                placeholder={clients.length ? "ou cadastrar nova" : "Nome da cliente"}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select
              value={SERVICE_CATALOG.find((s) => s.name === service) ? service : (service ? "__custom__" : "")}
              onValueChange={(v) => {
                if (v === "__custom__") {
                  setService("");
                  return;
                }
                setService(v);
                const found = SERVICE_CATALOG.find((s) => s.name === v);
                if (found) setPrice(String(found.price));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
              <SelectContent>
                {SERVICE_CATALOG.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name} · R$ {s.price.toFixed(2).replace(".", ",")}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Outro (personalizado)</SelectItem>
              </SelectContent>
            </Select>
            {!SERVICE_CATALOG.find((s) => s.name === service) && (
              <Input
                placeholder="Descreva o serviço"
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(",", "."))}
            />
          </div>

          <div className="space-y-2">
            <Label>Materiais utilizados</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome"
                value={matName}
                onChange={(e) => setMatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
              />
              <Input
                className="w-24"
                placeholder="Qtd"
                value={matQty}
                onChange={(e) => setMatQty(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {materials.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs text-foreground"
                  >
                    {m.name}{m.quantity ? ` · ${m.quantity}` : ""}
                    <button onClick={() => setMaterials((mm) => mm.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Detalhes, preferências..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Appointment["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={submit} className="w-full bg-gradient-primary shadow-elegant h-11 text-base">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
