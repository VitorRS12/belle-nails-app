# Atualização de Regras de Negócio e Interface

Plano dividido em 8 frentes. Antes de implementar, preciso confirmar algumas decisões importantes que alteram o esforço e o resultado.

## Pontos que precisam de confirmação

1. **App híbrido offline (PWA + IndexedDB) vs SaaS online**
   A iteração anterior tornou o app **offline-first com IndexedDB e modo convidado** (sem Supabase). Este pedido agora fala em "sincronização online", "SaaS", e-mails automáticos, configurações da proprietária no banco. Isso **conflita** com a arquitetura atual. Preciso saber:
   - **(a)** Voltar a tratar o Supabase/Lovable Cloud como fonte primária (mantendo PWA/cache como camada secundária), OU
   - **(b)** Manter offline-first e adicionar essas regras apenas no caminho online quando houver sessão.
   Recomendo **(a)** — só assim faz sentido ter e-mails automáticos para profissional/proprietária e configuração de intervalo persistida.

2. **E-mails transacionais**
   Hoje existe `send-notification-email` (templates `booking_confirmed_customer`, etc.) mas a infraestrutura Lovable Emails completa (queue + templates React Email) não está configurada. Posso provisionar:
   - Domínio de e-mail Lovable + infraestrutura de fila
   - 3 novos templates: cliente, profissional, proprietária
   - Hook automático no momento de criar e ao aceitar agendamento
   Confirma que posso configurar o domínio de e-mail (vai abrir o diálogo)?

3. **Importação de dados do celular** — não localizei essa tela/configuração no código. Pode me indicar onde está ou confirmar que é a importação do `localStorage` legado feita no `main.tsx`?

## 1. E-mail obrigatório no agendamento
- `AppointmentForm.tsx` e `PublicBooking.tsx`: adicionar campo email com validação Zod (`z.string().email()`).
- Botão "Confirmar" desabilitado enquanto inválido.
- Mensagem amigável em pt-BR.
- Migration: tornar `appointments.customer_email NOT NULL` (após backfill com placeholder ou exigir somente em novos).

## 2. Notificações automáticas
- Provisionar Lovable Emails (domínio + infra de fila).
- Criar 3 templates React Email:
  - `booking-customer.tsx` — para cliente
  - `booking-professional.tsx` — para profissional
  - `booking-owner.tsx` — para proprietária
- Edge function `send-notification-email` passa a disparar os 3 e-mails ao criar/aceitar agendamento, registrando em `notification_log`.
- Disparo a partir de `AppointmentForm` (criação) e da ação "aceitar" (mudar status para `scheduled`).

## 3. Remover "Segmento da empresa"
- Migration: `ALTER TABLE companies DROP COLUMN segment`.
- Remover de `useCompany.ts`, `CompanySettingsCard.tsx`, telas admin, tipos, edge functions.

## 4. Área única (Manicure, Cílios, Sobrancelhas)
- `AreaKey` reduz para `"manicure" | "cilios" | "sobrancelhas"`.
- `profiles.areas` (jsonb array) → `profiles.area` (text single value). Migration de conversão pegando o primeiro item.
- Remover catálogos de `cabelo` e `estetica` em `SERVICE_CATALOG_BY_AREA`.
- `AreaSwitcher`/`useProfile`/`ActiveAreaContext`: select único.
- Limpar referências aos removidos.

## 5. Intervalo configurável da agenda
- Nova coluna `companies.appointment_interval_minutes INT DEFAULT 30`.
- UI em Configurações: select com presets (10/15/20/30/45/60) + input "personalizado".
- `Agenda.tsx` / geração de slots passa a usar esse valor.
- Validação: 5 ≤ valor ≤ 240; impedir conflito de horários (já existe lógica básica — revisar).

## 6. Remover importação de celular
- Remover migração legada em `src/main.tsx` (e tela/botão correspondentes se você indicar onde estão).
- Limpar referências.

## 7. Atualizar Landing Page (`src/pages/Landing.tsx`)
- Reescrever hero, seções e CTAs com foco nos novos diferenciais (agendamento inteligente, e-mails automáticos, agenda configurável, 3 segmentos).
- Manter linha visual elegante atual; reforçar hierarquia, CTAs, microinterações e mobile.
- Atualizar screenshots/labels.

## 8. Revisão final
- Remover código morto (catálogos cabelo/estetica, segment, hooks PWA offline se decidirmos voltar para online).
- Atualizar tipos em `src/lib/types.ts` e `src/integrations/supabase/types.ts` (auto-gerado pelas migrations).
- Atualizar README e textos pt-BR.
- Smoke test responsivo dos fluxos de agendamento.

---

**Por favor responda os 3 pontos do topo** para eu começar pela ordem correta (sem isso, e-mails e configurações online não podem ser implementados de forma consistente).
