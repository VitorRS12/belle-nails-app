
## Objetivo

Manter o app rodando no Lovable Cloud e replicar **estrutura (schema)** + **dados** das tabelas para o seu projeto Supabase externo `db.tcjomtixglmuxkedyqfp.supabase.co`. Nada de código muda no app.

## Como vai funcionar

O processo tem duas partes independentes: schema (DDL) e dados (linhas). O schema eu gero automaticamente lendo o `information_schema` do Cloud e monto um único arquivo `.sql` pronto para rodar no seu Supabase. Os dados seguem o caminho oficial da Lovable (Cloud → Advanced settings → Export data), porque exportar dump completo pelo agente não é permitido — mas eu preparo um script de import para você.

```text
Lovable Cloud (origem)                 Supabase externo (destino)
┌───────────────────────┐              ┌───────────────────────┐
│ schema public.*       │──DDL.sql────▶│ CREATE TABLE, RLS,    │
│ (tabelas, policies,   │              │ policies, funções…    │
│ funções, triggers)    │              │                       │
│                       │              │                       │
│ dados                 │──export ZIP─▶│ COPY / \copy CSVs     │
│ (via Cloud UI)        │              │                       │
└───────────────────────┘              └───────────────────────┘
```

## Passo a passo

### 1. Gerar o `schema.sql` do Cloud (eu faço)
- Consultar `information_schema` e `pg_catalog` para reconstruir:
  - Tipos/ENUMs (`app_role`, etc)
  - `CREATE TABLE` de todas as tabelas em `public`
  - `GRANT`s para `anon` / `authenticated` / `service_role`
  - `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
  - `CREATE POLICY` de cada tabela
  - Funções (`has_role`, `handle_new_user`, `can_create_appointment`, `get_company_plan`, `is_company_member`, `get_user_company_id`, `set_updated_at`) com corpos exatos
  - Triggers (se houver — hoje não há)
- Entregar em `/mnt/documents/schema-export.sql`.
- Também gerar `/mnt/documents/README-import.md` com instruções de execução no seu Supabase (comando `psql` com os dados que você já forneceu).

### 2. Exportar os dados pelo Lovable Cloud (você faz)
No app da Lovable: **Cloud → Advanced settings → Export data**. A Lovable prepara o export e notifica quando estiver pronto. Isso gera um pacote com os dados de todas as tabelas.

### 3. Importar no Supabase externo (você faz, com o guia)
- Rodar `psql -h db.tcjomtixglmuxkedyqfp.supabase.co -U postgres -d postgres -f schema-export.sql` para criar a estrutura.
- Importar os dados do export do Cloud (o README que vou gerar cobre `\copy` por tabela, na ordem correta respeitando as foreign keys: `companies` → `profiles` → `professionals` → `services` → `clients` → `appointments` → demais).

### 4. Validação
Um bloco de queries prontas no README para conferir contagens (`SELECT count(*) FROM appointments;` etc) e comparar com o Cloud, garantindo que nada ficou de fora.

## O que NÃO vai nesse export

- Usuários de `auth.users`, sessões, provedores OAuth — schema `auth` é gerenciado pelo Supabase; se você quiser mesmos usuários no destino terá que reconvidá-los ou usar o import de auth do Supabase (posso adicionar orientação separada se quiser).
- Edge Functions, secrets, storage buckets — nada disso hoje precisa migrar porque o app continua no Cloud. Se um dia quiser realmente sair do Cloud, é outra conversa.
- `.env` e chaves de API — permanecem apontando para o Cloud.

## Detalhes técnicos

- Uso `psql` (acesso somente-leitura via env vars gerenciadas) para ler catálogos; nenhuma alteração no banco do Cloud.
- Todos os `CREATE TABLE` em `public` virão com `GRANT`s explícitos na mesma ordem exigida (create → grant → enable RLS → policies), então o schema roda limpo em um Supabase novo.
- Corpos de funções e policies são copiados literalmente das definições atuais listadas em `<db-functions>` do contexto do projeto.
- Se aparecer alguma extensão adicional (`pgcrypto`, `pg_cron`, etc), incluo os `CREATE EXTENSION IF NOT EXISTS` no topo.

## Entregáveis

- `/mnt/documents/schema-export.sql` — DDL completo pronto para rodar.
- `/mnt/documents/README-import.md` — guia de import passo a passo (comando de conexão, ordem de import, queries de verificação, notas sobre `auth.users`).
