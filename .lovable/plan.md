# Plano: Belle Nails PWA Offline-First

Transformar a aplicação em um PWA mobile-first com persistência local em IndexedDB e arquitetura preparada para sincronização futura — **sem tocar em Supabase/backend agora**.

> Observação importante: o projeto hoje já usa Supabase em vários pontos (`src/lib/storage.ts`, `useCompany`, edge functions, auth, etc.). Como você pediu para **não implementar Supabase agora**, vou tratar a camada Supabase existente como "adapter remoto desativado" e introduzir uma camada local autoritativa por cima. Nada será removido — apenas desviado para a base local. Se quiser que eu *remova* o código Supabase já existente, me avise; por padrão, vou apenas isolá-lo.

---

## 1. PWA (manifest + service worker + instalação)

- Adicionar `vite-plugin-pwa` com `registerType: "autoUpdate"` e `generateSW` (Workbox).
- Atualizar `public/manifest.webmanifest`: já existe parcialmente — completar com `id`, `categories`, `screenshots`, `shortcuts` (Agenda, Clientes, Novo Atendimento) e ícones 192/384/512 + maskable.
- Gerar ícones PWA (192, 384, 512, maskable, apple-touch 180) a partir do favicon atual via `imagegen` quando necessário.
- `index.html`: já tem theme-color, apple-mobile-web-app-*; adicionar splash links iOS e `apple-touch-startup-image` mínimos.
- **Service Worker** com estratégias:
  - HTML/navegação → `NetworkFirst` (exclui `/~oauth`, `/b/:slug` continua online-first).
  - Assets hashed (`/assets/*`) → `CacheFirst`.
  - Imagens (`/favicon.png`, ícones, screenshots) → `StaleWhileRevalidate`.
- **Registro guardado** em `src/pwa/registerSW.ts`: nunca registra em dev, iframe, hosts `*.lovableproject.com`, `*.lovable.app` de preview, ou com `?sw=off`. Em contextos negados, faz `unregister()` de `/sw.js`.
- Banner "Nova versão disponível — Atualizar" usando o evento `onNeedRefresh` do `virtual:pwa-register`.
- Prompt de instalação custom (`beforeinstallprompt`) num componente `InstallAppPrompt`, com instruções específicas para iOS Safari (Compartilhar → Adicionar à Tela de Início).

## 2. Camada de dados local (IndexedDB)

Nova pasta `src/data/` desacoplada da UI:

```text
src/data/
├── db.ts                  # Dexie database + schema
├── types.ts               # SyncableRecord<T>, SyncStatus
├── repositories/
│   ├── baseRepository.ts  # CRUD genérico + metadados de sync
│   ├── clientsRepo.ts
│   ├── appointmentsRepo.ts
│   ├── servicesRepo.ts
│   ├── professionalsRepo.ts
│   ├── settingsRepo.ts
│   └── outboxRepo.ts      # fila de mutações pendentes
└── sync/
    ├── syncEngine.ts      # interface SyncAdapter + orquestrador
    ├── adapters/
    │   └── nullAdapter.ts # adapter no-op usado agora
    └── conflict.ts        # estratégia last-write-wins + marca 'conflict'
```

- Biblioteca: **Dexie** (wrapper IndexedDB enxuto, escalável, ótimo TS).
- Cada registro implementa:
  ```ts
  interface SyncableRecord {
    id: string;            // uuid v4
    createdAt: string;     // ISO
    updatedAt: string;     // ISO
    deletedAt?: string;    // soft delete
    version: number;       // incrementa a cada update local
    syncStatus: 'pending' | 'synced' | 'conflict';
    remoteId?: string;     // reservado p/ futuro backend
  }
  ```
- `baseRepository` expõe `list/get/create/update/remove/upsert` — sempre grava `syncStatus='pending'` e enfileira a operação na `outbox`.
- `SyncEngine` lê a outbox e delega a um `SyncAdapter`. Hoje usamos `NullAdapter` (não faz nada, registros ficam `pending`). Quando ligarmos backend, basta plugar um `SupabaseAdapter` ou `RestAdapter`.
- Hooks React (`useClients`, `useAppointments`, `useServices`, etc.) consomem os repositórios via `useLiveQuery` do Dexie → UI reativa sem polling.
- **Migração leve**: na primeira carga, se houver dados em `localStorage` legados (`manicure_clients_v1`, `manicure_appointments_v1`), importa para IndexedDB e marca como `pending`.

## 3. Isolamento do Supabase atual

- `src/lib/storage.ts`, `useCompany`, hooks de profissionais/serviços, Auth etc. **permanecem no repo** mas deixam de ser a fonte primária. Onde a UI lê dados de negócio, passa a usar os novos hooks IndexedDB.
- Páginas afetadas: `Clientes`, `Agenda`, `Atendimentos`, `Servicos`, `Equipe`, `Configuracoes`, `Dashboard`, `Relatorio`, `MinhaJornada`, `Index`.
- `Auth.tsx` e rotas protegidas: como não vamos mexer no backend, mantemos o fluxo atual; para uso 100% offline adiciono **modo convidado local** (`localStorage` flag `bn:guest=true`) que permite acessar o app sem login. `ProtectedRoute` aceita usuário Supabase **ou** convidado local. Posso desativar o login completamente se preferir — diga e eu retiro.
- Edge functions e features de billing/admin **não são tocadas** (continuam exigindo internet quando acessadas).

## 4. Indicadores de status & UX offline

- `src/hooks/useNetworkStatus.ts` (online/offline + `navigator.connection`).
- `src/hooks/useSyncStatus.ts` (conta itens `pending` / `conflict` da outbox via `useLiveQuery`).
- Componentes:
  - `OfflineBadge` no header (chip: "Offline", "Online", "Sincronizando…").
  - `PendingChangesPill` ("3 alterações pendentes").
  - Toasts: "Salvo localmente", "Sincronização concluída", "Sem conexão — alterações salvas no dispositivo".
- Integração em `AppLayout`.

## 5. UX mobile premium

- Revisar `AppLayout`, `BottomNav`, `AppointmentCard`, formulários:
  - Alvos de toque mínimos 44×44.
  - `safe-area-inset` (top/bottom) para iOS notch + home indicator.
  - Tipografia fluida com `clamp()` para títulos.
  - Microinterações com Framer Motion já disponível (`PageTransition` já existe; vou adicionar feedback em botões primários e cards).
  - Pull-to-refresh **desativado** dentro do app instalado (overscroll-behavior contain).
  - Skeletons em listas que hoje mostram tela vazia.
- Tudo dentro da paleta atual (rosa/champagne Belle Nails) — sem repintar o design system.

## 6. Arquitetura preparada para crescimento

- `SyncAdapter` é a única interface a implementar quando o backend chegar.
- Repositórios não conhecem React nem Supabase — testáveis isoladamente.
- Pasta `src/data/` segue padrão repository + outbox, fácil trocar Dexie por outra storage no futuro.
- Tipos exportados em `src/data/types.ts` consumidos pela UI via barrel `src/data/index.ts`.

## 7. Detalhes técnicos

- Dependências novas: `dexie`, `dexie-react-hooks`, `vite-plugin-pwa`, `workbox-window` (peer).
- `vite.config.ts`: adicionar plugin PWA com manifest inline + `injectRegister: null` + `devOptions.enabled: false`.
- `src/main.tsx`: importar `registerSW` (wrapper guardado).
- Testes mínimos: `src/data/repositories/__tests__/clientsRepo.test.ts` com `fake-indexeddb` (já há vitest configurado).
- SEO/index.html: manter `<title>` e meta atuais; adicionar `<link rel="apple-touch-icon" sizes="180x180">` se ícone for gerado.

## 8. Entregáveis

1. PWA instalável e atualizável (manifest + SW + prompt + ícones).
2. IndexedDB com repositórios + outbox + SyncEngine (NullAdapter).
3. Hooks reativos substituindo leitura Supabase nas páginas de negócio.
4. Indicadores online/offline/pending no layout.
5. Polimento mobile (safe-area, toques, microinterações).
6. Documentação curta em `README.md` explicando como plugar um `SyncAdapter` futuro.

## 9. Fora deste escopo (confirmar antes de fazer)

- Remover código Supabase já existente do repositório.
- Desligar Auth/Login e operar 100% como convidado.
- Push notifications (requer backend / FCM).
- Internacionalização e dark mode novos (mantém o atual).

Me confirme dois pontos e sigo direto para a implementação:

1. **Login Supabase**: mantenho como está (com fallback offline em modo convidado) ou desativo completamente por enquanto?
2. **Dados existentes no Supabase do usuário**: ignoro (começa base local vazia + migração de `localStorage`) ou faço um *seed* único puxando do Supabase na primeira vez que houver internet?