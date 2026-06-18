## Transformação em Plataforma SaaS Multi-Tenant de Agendamentos

Este é um projeto de grande porte que reescreve a fundação do app. Proponho dividir em **fases incrementais** para manter o sistema atual funcionando enquanto evoluímos. Cada fase entrega valor e pode ser validada antes da próxima.

---

### Estado atual (resumo)

- App single-tenant: cada usuário Supabase é uma profissional autônoma
- Tabelas: `profiles`, `clients`, `appointments`, `custom_services` — todas escopadas por `user_id`
- Sem conceito de empresa, papéis, ou cliente final
- Auth: email/senha + Google (profissionais)

---

### Fase 1 — Fundação Multi-Tenant + Papéis (sem quebrar o app atual)

**Objetivo:** introduzir `companies` (empresas) e `user_roles` mantendo todas as profissionais atuais funcionando como "empresa individual".

**Backend (migração):**
- Criar enum `app_role`: `super_admin`, `company_admin`, `professional`, `customer`
- Criar tabela `companies` (nome, slug público, segmento, timezone, config)
- Criar tabela `company_members` (company_id, user_id, role dentro da empresa)
- Criar tabela `user_roles` (papéis globais — pattern de segurança recomendado)
- Função `has_role(user_id, role)` SECURITY DEFINER
- Função `get_user_company_id(user_id)` SECURITY DEFINER
- Adicionar `company_id` em `clients`, `appointments`, `custom_services`, `profiles`
- **Migração de dados:** para cada profile existente, criar uma `company` própria e popular `company_id` em todos os registros antigos
- Atualizar RLS: escopo passa de `user_id` para `company_id` (com `user_id` permanecendo para auditoria)
- GRANTs explícitos em todas as novas tabelas

**Frontend:**
- Hook `useCompany()` que devolve a empresa ativa do usuário logado
- Hook `useUserRole()` para checar permissões
- Atualizar todos os hooks de dados para filtrar por `company_id` (transparente para a UI)
- Tela de "Minha Empresa" em Configurações (nome, segmento, timezone)

**Critério de sucesso:** profissionais existentes continuam usando o app sem perceber mudança.

---

### Fase 2 — Profissionais dentro da Empresa

**Objetivo:** uma empresa pode ter múltiplas profissionais.

- Tabela `professionals` (company_id, user_id opcional, nome, foto, especialidades, ativo)
- Tabela `professional_schedules` (professional_id, dia_semana, hora_inicio, hora_fim)
- Tabela `professional_services` (relação N:N entre profissionais e serviços)
- Adicionar `professional_id` em `appointments`
- UI: tela "Equipe" no painel da empresa — convidar/cadastrar profissionais
- Sistema de convite por e-mail (edge function) com link único
- Filtro de agenda por profissional

---

### Fase 3 — Catálogo de Serviços padronizado

- Migrar `custom_services` para tabela `services` ligada a `company_id`
- Adicionar campos: descrição, categoria, **duração em minutos**, cor, status ativo/inativo
- Atualizar `AppointmentForm` para usar a nova estrutura
- Tela de gestão de serviços (CRUD completo)

---

### Fase 4 — Página Pública de Agendamento (Cliente Final)

**Objetivo:** clientes finais agendam pelo site sem login obrigatório inicialmente.

- Rota pública `/b/:companySlug` (página da empresa)
- Fluxo: escolher serviço → profissional → data → horário → dados de contato → confirmar
- Cálculo de horários disponíveis no servidor (edge function) respeitando duração + jornada + agendamentos existentes
- Auth opcional para clientes (email/senha + Google) — papel `customer`
- Tabela `customer_profiles` (separada de `professionals`, sem `company_id` — cliente pode agendar em várias empresas)
- Agendamento cria registro em `appointments` com status `pendente_confirmacao`

---

### Fase 5 — Notificações

- Edge function de envio de e-mail (confirmação, lembrete, cancelamento) via Resend
- Templates HTML responsivos
- Tabela `notification_log` para auditoria
- Estrutura preparada para WhatsApp (placeholder) e push (Capacitor) — implementação futura

---

### Fase 6 — Painel Super Admin

- Rota `/admin` protegida por `has_role(uid, 'super_admin')`
- Listagem de empresas, métricas globais, gestão de planos
- Tabela `subscription_plans` e `company_subscriptions` (estrutura, sem cobrança ainda)

---

### Fase 7 — Pagamentos e Assinaturas

- Integração Stripe (built-in Lovable) para cobrança recorrente das empresas
- Limites por plano aplicados via RLS/edge functions
- Opcional: pagamento do cliente final no momento do agendamento

---

### Detalhes técnicos transversais

- **Stack mantida:** React + Vite + TS + TanStack Query + Zustand + Tailwind + Framer Motion + shadcn/ui + Capacitor
- **Segurança:** papéis em tabela separada (nunca em `profiles`), funções `SECURITY DEFINER` para evitar recursão de RLS, `company_id` obrigatório em todo registro tenant-scoped
- **Estrutura de pastas:** evoluir para feature-based — `src/features/{auth,company,scheduling,billing,public-booking}/`
- **Compatibilidade mobile:** manter HashRouter para Capacitor, evitar APIs incompatíveis com WebView
- **Performance:** índices em `(company_id, date)`, `(professional_id, date)`, paginação em listagens

---

### O que sugiro começar agora

**Fase 1 completa** — é a fundação sem a qual nada mais funciona, e é totalmente invisível para as profissionais que já usam o app. Quando aprovada, executo a migração de banco, ajusto os hooks de dados e adiciono a tela de configurações da empresa.

Confirma que posso começar pela Fase 1? Se preferir um escopo inicial diferente (ex.: começar pela página pública de agendamento ainda single-tenant), me diz que eu reorganizo o plano.