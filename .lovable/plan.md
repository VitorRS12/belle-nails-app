# Plano: Bellenails Multi-profissional + Dashboard Web

## Visão geral

Hoje o app guarda tudo no `localStorage` do celular (1 dispositivo = 1 conjunto de dados). Para ter **dashboard no navegador** e **várias profissionais**, cada uma com seus dados, precisamos mover os dados para a nuvem (Lovable Cloud) com login.

A essência atual (agenda no celular, fluxo simples, visual rosa/dourado) será preservada — só ganha login na entrada e sincronização automática.

---

## Fase 1 — Fundação: Autenticação + Banco na nuvem

### O que muda para você
- Ao abrir o app (celular ou web), pede **login com Google** (ou e-mail/senha).
- Depois disso, tudo funciona igual — mas os dados ficam salvos na nuvem da sua conta.
- Você pode acessar o mesmo conjunto de dados pelo celular **e** pelo navegador.

### O que faço tecnicamente
1. Criar tabelas no Lovable Cloud:
   - `profiles` — dados da profissional (nome, áreas de atuação)
   - `clients` — clientes (com `user_id`)
   - `appointments` — agendamentos (com `user_id`, `services[]`, `materials[]`)
   - `services_custom` — serviços personalizados criados pela profissional
2. RLS (Row Level Security): cada profissional só vê os próprios dados.
3. Tela de **Login / Cadastro** com Google + e-mail.
4. Migrar `src/lib/storage.ts` de `localStorage` para Supabase client.
5. Manter o backup Google Drive como opção extra (não mais obrigatório).

---

## Fase 2 — Multi-perfil de profissões

### O que muda para você
- No primeiro acesso (ou em Configurações), você marca suas áreas: **Manicure, Cabelo, Cílios, Sobrancelhas, Estética**.
- Ao criar um atendimento, o catálogo mostra os serviços agrupados por categoria das áreas que você marcou.
- Você pode adicionar/remover áreas a qualquer momento.

### Catálogos (só nomes, você define o preço)
- **Manicure/Pedicure** (já existe): pé, mão, gel, postiça, spa, francesinha, decoração…
- **Cabelo**: corte feminino, corte masculino, escova, hidratação, coloração, mechas, luzes, progressiva, botox, reconstrução, penteado, finalização…
- **Cílios**: fio a fio clássico, volume russo, volume brasileiro, híbrido, manutenção, remoção, lash lifting, tintura…
- **Sobrancelhas**: design com pinça, design com cera, design com henna, micropigmentação, brow lamination, tintura…
- **Estética facial** (opcional): limpeza de pele, peeling, massagem facial…

### O que faço tecnicamente
- Adicionar campo `areas[]` no `profiles`.
- Reorganizar `SERVICE_CATALOG` em `SERVICE_CATALOG_BY_AREA` (objeto com categorias).
- No `AppointmentForm`, agrupar o cat selector por categoria (collapsible).
- Filtrar pelas áreas ativas da profissional.

---

## Fase 3 — Dashboard Web

### O que muda para você
- Acesso por `bellenailsorigin.lovable.app` (ou domínio próprio) pelo navegador do PC.
- Mesmo login Google → vê os mesmos dados do celular.
- **Layout responsivo dedicado** para tela grande (não é só o app esticado):
  - Sidebar com navegação (Visão geral, Agenda, Clientes, Atendimentos, Relatórios)
  - Cards de KPIs (receita do mês, agendamentos da semana, ticket médio, top serviços)
  - Gráficos: receita por mês, serviços mais vendidos, distribuição por área
  - Tabela de atendimentos com filtros avançados (data, cliente, serviço, status)
  - Calendário visual estilo Google Calendar

### O que faço tecnicamente
- Detectar viewport: `<lg` mostra o layout mobile atual; `≥lg` mostra `DashboardLayout` novo.
- Componentes novos: `Sidebar`, `KpiCard`, `RevenueChart` (Recharts), `ServicesChart`, `AppointmentsTable`, `WeekCalendar`.
- Mesmas rotas, layouts diferentes — sem duplicar lógica.

---

## Detalhes técnicos

### Stack
- **Auth**: Lovable Cloud + Google OAuth gerenciado (sem credenciais próprias)
- **DB**: Supabase Postgres com RLS por `user_id`
- **Frontend**: continua React + Vite + Tailwind
- **Gráficos**: Recharts (já disponível em `components/ui/chart.tsx`)

### Migração de dados existentes
Quando você fizer o primeiro login, ofereço importar os dados que já estão no `localStorage` do celular para a nuvem. Nada se perde.

### Compatibilidade APK
- Capacitor continua funcionando — só precisa regerar o APK uma vez para incluir a tela de login.
- Após login, sessão persiste no celular.

---

## Ordem de execução

1. **Fase 1** (fundação) — sem ela nada funciona. ~1 iteração grande.
2. **Fase 3** (dashboard web) — sua prioridade declarada. ~1 iteração média.
3. **Fase 2** (multi-perfil) — adicionada depois sem quebrar nada. ~1 iteração média.

---

## Confirmações antes de começar

- [ ] OK migrar para Lovable Cloud agora (perde-se nada — importo do localStorage)?
- [ ] OK login Google + e-mail/senha como métodos padrão?
- [ ] Sigo com **Fase 1** já nesta resposta após aprovação?
