# Fases 6 + 7 — Super Admin e Pagamentos

## Visão geral

Duas frentes independentes que serão entregues em sequência:

1. **Fase 6** — Painel `/admin` para o dono da plataforma (você) gerenciar empresas, planos e ver métricas.
2. **Fase 7** — Cobrança recorrente das empresas via Stripe (built-in do Lovable) com limites aplicados por plano.

A Fase 7 depende dos planos criados na Fase 6, então faremos nessa ordem.

---

## Fase 6 — Super Admin

### Backend (migração única)

- Promover o seu próprio usuário a `super_admin` (insert manual em `user_roles`).
- Nova tabela `subscription_plans`:
  - `name` (Free, Pro, Business…), `slug`, `description`
  - `price_cents`, `currency`, `interval` (`month` / `year`)
  - `max_professionals`, `max_appointments_per_month`, `max_services`
  - `features` (jsonb — flags como "email", "site público", "relatórios")
  - `active`, `sort_order`, `stripe_price_id` (preenchido na Fase 7)
- Nova tabela `company_subscriptions`:
  - `company_id`, `plan_id`, `status` (`trialing`, `active`, `past_due`, `canceled`)
  - `current_period_start`, `current_period_end`, `trial_ends_at`
  - `stripe_subscription_id`, `stripe_customer_id` (Fase 7)
- Função `get_company_plan(company_id)` (SECURITY DEFINER) devolve o plano vigente.
- Função `can_create_appointment(company_id)` checa contagem do mês vs `max_appointments_per_month`.
- RLS:
  - `subscription_plans` — leitura pública (planos aparecem na landing); escrita só super_admin.
  - `company_subscriptions` — empresa vê a sua; super_admin vê todas.

### Frontend `/admin`

- Rota protegida por `has_role(uid, 'super_admin')` (redireciona se não for).
- Layout próprio (sem o sidebar de profissional).
- Telas:
  - **Visão geral**: total de empresas, ativas, MRR estimado, agendamentos do mês, gráfico de crescimento (últimos 30 dias).
  - **Empresas**: tabela paginada (nome, plano, status, profissionais, agendamentos no mês, criado em). Ações: ver detalhes, mudar plano manualmente, suspender.
  - **Planos**: CRUD dos `subscription_plans` (criar, editar limites e preço, ativar/desativar).
- Hooks via TanStack Query: `useAdminMetrics`, `useAdminCompanies`, `usePlans`.
- Componentes em `src/features/admin/`.

### Aplicação de limites (frontend + servidor)

- Hook `useCompanyPlan()` exposto no app da empresa — mostra plano atual, uso (X/Y profissionais, X/Y agendamentos), aviso quando passa de 80%.
- Servidor: a edge function `public-create-booking` chama `can_create_appointment` antes de gravar; se exceder, devolve 402.
- Bloqueios visuais quando limite atingido (CTA "Fazer upgrade").

---

## Fase 7 — Pagamentos (Stripe built-in)

### Pré-checagem

Roda `recommend_payment_provider` (SaaS digital → Stripe built-in é o caminho indicado). Eu te explico o que vai acontecer e você confirma antes de habilitar.

### Habilitação

- `enable_stripe_payments` — provisiona ambiente de teste sem você precisar criar conta Stripe.
- Tax handling: `managed_payments` (Stripe cuida de compliance fiscal global para SaaS digital, +3,5% por transação) — pode ser desligado depois.

### Produtos no Stripe

- Para cada plano em `subscription_plans` (exceto Free), criar produto + price recorrente via `batch_create_product`. Salvar `stripe_price_id` na tabela.

### Checkout + Webhook

- Edge function `create-checkout-session`:
  - Recebe `planId`, identifica `companyId` do usuário logado.
  - Cria/recupera `stripe_customer_id`, abre sessão de checkout, devolve `url`.
- Edge function `stripe-webhook` (verify_jwt = false, valida assinatura):
  - Eventos `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/failed`.
  - Atualiza `company_subscriptions` (status, períodos, IDs Stripe).
- Página `/planos` no painel da empresa — lista planos ativos, destaca o atual, botão "Assinar/Trocar" abre o checkout.
- Página `/sucesso` e `/cancelado` para retorno do Stripe.
- Portal do cliente Stripe (gerenciar cartão / cancelar) — botão "Gerenciar assinatura" em Configurações.

### Trial e Free

- Plano Free não tem assinatura Stripe — vira default ao criar empresa (a função `handle_new_user` ganha o `INSERT` em `company_subscriptions` com plano Free).
- Trial opcional de 14 dias em planos pagos via `trial_period_days` no Stripe.

---

## Arquitetura / pastas

```text
src/features/
├── admin/
│   ├── pages/AdminDashboard, AdminCompanies, AdminPlans
│   ├── components/ (cards, tabelas)
│   ├── hooks/useAdminMetrics, useAdminCompanies
│   └── services/adminService
└── billing/
    ├── pages/Planos, Sucesso, Cancelado
    ├── components/PlanCard, UsageMeter
    ├── hooks/useCompanyPlan, useCheckout
    └── services/billingService

supabase/functions/
├── create-checkout-session/
├── create-billing-portal-session/
└── stripe-webhook/
```

---

## Entregas em ordem (passos executáveis)

1. Migração Fase 6 + tabela de planos + funções + RLS + seed (Free, Pro, Business).
2. Layout/rotas `/admin` + telas Visão geral, Empresas, Planos.
3. Hook `useCompanyPlan` + medidor de uso em `Configurações` + bloqueio em `public-create-booking`.
4. `recommend_payment_provider` → confirmação → `enable_stripe_payments`.
5. Criar produtos Stripe a partir dos planos.
6. Edge functions `create-checkout-session`, `stripe-webhook`, `create-billing-portal-session`.
7. Página `/planos` + `/sucesso` + `/cancelado` + botão "Gerenciar assinatura".
8. Testes end-to-end no modo teste do Stripe.

---

## Perguntas rápidas antes de começar

1. **Planos iniciais** — sugiro **Free** (1 profissional, 30 agendamentos/mês), **Pro** (até 5 profissionais, ilimitado, R$ 49/mês) e **Business** (ilimitado, R$ 99/mês). Aprovo isso ou prefere outros valores/limites?
2. **Seu e-mail de super_admin** — confirma que é o e-mail logado atualmente (`pedrohenriquedasilva0405@gmail.com` ou outro)?
3. **Trial** — começa com 14 dias grátis nos planos pagos, ou já cobra na ativação?

Posso ajustar o plano com base nas suas respostas e seguir direto para a execução.
