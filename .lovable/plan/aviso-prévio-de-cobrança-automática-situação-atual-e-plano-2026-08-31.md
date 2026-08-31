# Aviso prévio de cobrança automática — situação atual e plano

## Resposta curta

**Não existe hoje.** O app não envia nenhum e-mail avisando que a cobrança automática vai acontecer.

O que existe hoje:
- 6 templates de e-mail, todos de agendamento (confirmação, novo agendamento, confirmado, cancelado x2, lembrete). Nenhum de cobrança/assinatura.
- Aviso de fim do teste apenas **dentro do app** (faixa no topo, `TrialBanner`) — some se a pessoa não abrir o sistema.
- O webhook de pagamento apenas grava status e datas (`trial_ends_at`, `current_period_end`); não dispara e-mail.

Isso é um risco: exigências de assinatura (e o próprio Paddle) esperam aviso antes da cobrança recorrente, e sem isso aumenta a chance de contestação/estorno.

---

## Plano — criar o aviso prévio por e-mail

### 1. Novos templates (mesma identidade Cherry Blossom já usada)
- `billing-trial-ending` — "Seu teste termina em X dias; depois disso a cobrança de R$ Y começa automaticamente."
- `billing-renewal-upcoming` — "Sua assinatura renova em X dias no valor de R$ Y."
- `billing-payment-failed` — cobrança recusada, com link para atualizar pagamento.

Cada e-mail traz: plano, valor, data exata da cobrança, como cancelar antes, link para `/planos`.

### 2. Quando disparar
- Fim do teste: **7 dias antes** e **1 dia antes** de `trial_ends_at`.
- Renovação mensal: **3 dias antes** de `current_period_end`.
- Falha de pagamento: imediatamente, ao receber o evento do provedor.

### 3. Mecânica
- Nova função `send-billing-notices`, executada por cron **1x por dia** (07:00 America/Bahia).
- Consulta `company_subscriptions` + `subscription_plans`, calcula quem entra em cada janela, envia via a infraestrutura de e-mail já existente (`send-transactional-email`, domínio verificado).
- Controle anti-duplicidade: coluna de marcação por tipo de aviso (ex.: `trial_notice_7d_sent_at`, `trial_notice_1d_sent_at`, `renewal_notice_sent_at`) — cada aviso sai uma única vez por ciclo, reiniciando quando o período muda.
- Destinatário: e-mail da dona da empresa (owner). Chave de idempotência por assinatura + tipo + data do ciclo.

### 4. Falha de pagamento
- Tratar o evento de transação recusada no `payments-webhook` e enfileirar `billing-payment-failed`.

### 5. Verificação
- Rodar a função manualmente com datas de teste e conferir `email_send_log` (dedup por `message_id`) com status `sent`.

---

## Detalhes técnicos

- Migração: colunas de marcação em `company_subscriptions` + agendamento `pg_cron` diário chamando a função via `pg_net`.
- Templates React Email em `supabase/functions/_shared/transactional-email-templates/`, registrados em `registry.ts`.
- Textos em PT-BR (e EN se você quiser paridade com o i18n atual — digo se quer os dois idiomas).
- Sem chave externa: usa a infraestrutura Lovable Emails já ativa em `notify.bellenailsapp.com`.
