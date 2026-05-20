import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { appointmentsStore, clientsStore, uid } from "@/lib/storage";
import { useClients } from "@/hooks/useStore";
import { useProfile } from "@/hooks/useProfile";
import { type Appointment, type Material, type ServiceItem, SERVICE_CATALOG_BY_AREA, AREAS, type AreaKey } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  initial?: Appointment;
  defaultDate?: string;
  onSaved?: () => void;
}

function initialServices(initial?: Appointment): ServiceItem[] {
  if (initial?.services && initial.services.length > 0) return initial.services;
  if (initial?.service) {
    // legacy single-service record
    return [{ name: initial.service, price: initial.price || 0 }];
  }
  return [];
}

export function AppointmentForm({ trigger, initial, defaultDate, onSaved }: Props) {
  const clients = useClients();
  const { profile } = useProfile();
  const activeAreas: AreaKey[] = (profile?.areas?.length ? profile.areas : ["manicure"]) as AreaKey[];
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initial?.time ?? "09:00");

  const [services, setServices] = useState<ServiceItem[]>(initialServices(initial));
  const [pickerValue, setPickerValue] = useState<string>("");
  const [customName, setCustomName] = useState("");

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
    setServices(initialServices(initial));
    setPickerValue("");
    setCustomName("");
    setMaterials(initial?.materials ?? []);
    setNotes(initial?.notes ?? "");
    setStatus(initial?.status ?? "scheduled");
  }, [open, initial, defaultDate]);

  const total = useMemo(
    () => services.reduce((s, x) => s + (Number(x.price) || 0), 0),
    [services],
  );

  const addFromCatalog = (value: string) => {
    // value format: "<area>::<name>"
    const [area, name] = value.split("::");
    const list = SERVICE_CATALOG_BY_AREA[area as AreaKey] ?? [];
    const found = list.find((s) => s.name === name);
    if (!found) return;
    setServices((cur) => [...cur, { name: found.name, price: found.price }]);
    setPickerValue("");
  };

  const addCustom = () => {
    const n = customName.trim();
    if (!n) return;
    setServices((cur) => [...cur, { name: n, price: 0 }]);
    setCustomName("");
  };

  const updateService = (idx: number, patch: Partial<ServiceItem>) => {
    setServices((cur) => cur.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeService = (idx: number) => {
    setServices((cur) => cur.filter((_, i) => i !== idx));
  };

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
    if (services.length === 0) return toast.error("Adicione ao menos um serviço");

    const cleanServices = services.map((s) => ({
      name: s.name.trim() || "Serviço",
      price: Number(s.price) || 0,
    }));
    const totalPrice = cleanServices.reduce((s, x) => s + x.price, 0);
    const serviceLabel = cleanServices.map((s) => s.name).join(" + ");

    const appt: Appointment = {
      id: initial?.id ?? uid(),
      clientId: finalClientId,
      clientName: finalClientName,
      date,
      time,
      service: serviceLabel,
      services: cleanServices,
      materials,
      price: totalPrice,
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

          <div className="space-y-3">
            <Label>Serviços</Label>

            <Select value={pickerValue} onValueChange={addFromCatalog}>
              <SelectTrigger><SelectValue placeholder="Adicionar serviço da lista" /></SelectTrigger>
              <SelectContent>
                {activeAreas.map((areaKey) => {
                  const area = AREAS.find((a) => a.key === areaKey);
                  const items = SERVICE_CATALOG_BY_AREA[areaKey] ?? [];
                  if (!area || items.length === 0) return null;
                  return (
                    <SelectGroup key={areaKey}>
                      <SelectLabel>{area.emoji} {area.label}</SelectLabel>
                      {items.map((s) => (
                        <SelectItem key={`${areaKey}::${s.name}`} value={`${areaKey}::${s.name}`}>
                          {s.name} · R$ {s.price.toFixed(2).replace(".", ",")}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                placeholder="Adicionar serviço personalizado"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
              />
              <Button type="button" variant="secondary" onClick={addCustom}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                {services.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-accent-soft/50 p-2">
                    <Input
                      className="flex-1 h-9 bg-background"
                      value={s.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                    <Input
                      className="w-24 h-9 bg-background"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={s.price === 0 ? "" : String(s.price)}
                      onChange={(e) =>
                        updateService(i, { price: Number(e.target.value.replace(",", ".")) || 0 })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="h-8 w-8 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition-smooth"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-2xl bg-gradient-soft p-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
                  <span className="font-display text-xl text-primary">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}
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

          {initial?.status === "completed" || initial?.status === "cancelled" ? (
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
          ) : null}

          <Button onClick={submit} className="w-full bg-gradient-primary shadow-elegant h-11 text-base">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
