# Belle Nails

PWA mobile-first com persistência local em IndexedDB.

## Arquitetura local-first

- `src/data/db.ts` — Dexie database versionada (`clients`, `appointments`, `services`, `professionals`, `settings`, `outbox`).
- `src/data/repositories/*` — CRUD genérico (`BaseRepository`) que marca cada mutação como `syncStatus: 'pending'` e enfileira na `outbox`.
- `src/data/sync/syncEngine.ts` — orquestrador com a interface `SyncAdapter`. Hoje usa `NullAdapter` (não envia nada).
- `src/lib/storage.ts` — fachada síncrona usada pelas páginas. Delega persistência aos repositórios.
- `src/hooks/useStore.ts` — `useClients` / `useAppointments` reativos via `useLiveQuery`.

### Plugando um backend no futuro

Implemente um `SyncAdapter` e registre-o no boot:

```ts
import { syncEngine, type SyncAdapter } from "@/data";

const MyAdapter: SyncAdapter = {
  name: "my-backend",
  async push(entry) {
    // POST / PATCH / DELETE conforme entry.operation
    return { status: "synced", remoteId: "..." };
  },
  async pull(since) {
    // hidratar repositórios com dados remotos (use `upsertMany(records, true)`)
  },
};

syncEngine.setAdapter(MyAdapter);
window.addEventListener("online", () => void syncEngine.flush());
```

Nenhuma página precisa ser alterada — repositórios e UI já lidam com offline, conflitos e fila pendente.

## PWA

- `vite-plugin-pwa` com `generateSW` (NetworkFirst para HTML, CacheFirst para assets hashados).
- Registro guardado em `src/pwa/registerSW.ts` (no-op em dev / preview Lovable / iframe).
- Banner de instalação custom em `InstallAppPrompt` com instruções específicas para iOS Safari.

## Modo convidado

Usuários podem usar a aplicação 100% offline sem login: a `ProtectedRoute` aceita sessão Supabase **ou** a flag local `bn:guest`.
