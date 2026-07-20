
# Plano — Migração para Lovable Emails (Opção A)

Este plano roda em 3 momentos: **antes**, **assim que o domínio estiver comprado**, e **depois da verificação DNS**.

---

## Fase 0 — O que você faz (pré-requisito)

1. Comprar um domínio (ex.: `bellenails.com.br`) em qualquer registrador — ou usar Project Settings → Domains → Buy new domain.
2. Me avisar o domínio final. A partir daí eu executo tudo abaixo.

Nada do plano começa antes disso — Lovable Emails exige um domínio real que você controla.

---

## Fase 1 — Conectar domínio ao site
(Isso é o site em si, separado do e-mail, mas faço junto para economizar propagação DNS.)

1. Conectar o domínio no projeto (Project Settings → Domains).
2. Você adiciona no registrador os registros que a interface mostrar (A `@` e `www` → `185.158.133.1`, TXT `_lovable`).
3. Aguardar SSL ficar ativo.

---

## Fase 2 — Configurar Lovable Emails (o coração da mudança)

1. Abrir o diálogo de setup de e-mail (`presentation-open-email-setup`), que provisiona um subdomínio delegado (ex.: `notify.bellenails.com.br`) com NS apontando para servidores do Lovable.
2. Você adiciona **os registros NS que o painel mostrar** no seu registrador (a plataforma cuida sozinha de SPF/DKIM/MX depois disso).
3. Rodar `email_domain--setup_email_infra` para criar a infraestrutura no banco:
   - Filas pgmq (`auth_emails`, `transactional_emails`)
   - Tabelas `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`
   - Cron `process-email-queue` (executa a cada 5s quando há fila)
   - RPCs `enqueue_email`, `read_email_batch`, etc.

---

## Fase 3 — E-mails de autenticação (convites de profissionais)

1. Rodar `email_domain--scaffold_auth_email_templates` → cria `auth-email-hook` + 6 templates React Email (signup, invite, recovery, magic-link, email-change, reauthentication).
2. Estilizar os templates com a identidade Cherry Blossom já usada no app (cores do `index.css`, fontes Cormorant + Karla, logo Belle Nails no topo).
3. Traduzir todo o texto para PT-BR.
4. Deploy do `auth-email-hook`.
5. Resultado: quando você usar o botão "Convidar profissional" em Equipe/Configurações, o convite sai com a sua marca e do seu domínio — resolve o problema atual de profissionais não recebendo convite.

---

## Fase 4 — E-mails transacionais (confirmação de agendamento, cancelamento, lembrete)

1. Rodar `email_domain--scaffold_transactional_email` → cria função `send-transactional-email` + templates de exemplo + função de unsubscribe + suppression webhook.
2. Converter os 6 templates HTML atuais do `send-notification-email` para componentes React Email no diretório `_shared/transactional-email-templates/`:
   - `booking-confirmation-customer`
   - `booking-new-company`
   - `booking-confirmed-customer`
   - `booking-cancelled-customer`
   - `booking-cancelled-company`
   - `booking-reminder-customer`
3. Registrar todos em `registry.ts`.
4. Trocar as chamadas atuais para o novo endpoint:
   - `src/lib/notifyAppointment.ts` — invoca `send-transactional-email` com `templateName` + `idempotencyKey`.
   - `supabase/functions/public-create-booking/index.ts` — idem para confirmação e aviso à empresa.
   - `supabase/functions/public-cancel-booking/index.ts` — idem para cancelamento.
   - `supabase/functions/send-reminders/index.ts` — idem para lembrete 24h.
5. Deploy de todas as functions afetadas.
6. Criar página `/descadastrar` que consome o token de unsubscribe (exigido pelo Lovable Emails).

---

## Fase 5 — Limpeza do Resend

1. Deletar `supabase/functions/send-notification-email` (não é mais usado).
2. Remover o connector Resend da lista de conexões (via Connectors).
3. Manter `notification_log` como está — o Lovable Emails tem seu próprio `email_send_log`, mas o `notification_log` já registra por agendamento e é útil para o histórico exibido em `/notificacoes`. Adapto a origem dos dados dessa página para o `email_send_log` também, unificando o painel.

---

## Fase 6 — Verificação final

1. Testar convite de profissional → confirmar chegada.
2. Fazer um agendamento em `/b/:slug` → confirmar recebimento pelo cliente e pela profissional.
3. Cancelar agendamento pelo link do e-mail → confirmar chegada dos dois avisos.
4. Verificar `email_send_log` (dedup por `message_id`) para ter certeza de que status = `sent`.

---

## Detalhes técnicos

- **Sem chaves externas**: Lovable Emails usa `LOVABLE_API_KEY` (já provisionada). Não pede Resend, SendGrid, nem SMTP.
- **Retry automático**: a fila reprocessa falhas 5xx com backoff; 429 respeita `Retry-After`; falhas persistentes vão para DLQ e ficam logadas.
- **Anti-duplicação**: cada envio usa `idempotencyKey` (ex.: `booking-confirm-<appointment_id>`), então retry não duplica e-mail.
- **Unsubscribe**: obrigatório em transacional; a rota é criada automaticamente e adiciono a página no app.
- **Auth hook**: substitui o fluxo padrão do Supabase, então os convites de profissional (`inviteUserByEmail` em `invite-professional`) automaticamente passam a usar os templates novos, sem precisar mudar a função.
- **DNS**: apenas registros **NS** no seu registrador (para o subdomínio delegado). Não precisa mexer em SPF/DKIM manualmente — Lovable gerencia dentro do subdomínio.

---

## Escopo fora do plano

- Sincronização de dados (já resolvida em turnos anteriores).
- Aprovação do Paddle (independente).
- Domínios extras (`www` etc.) além do principal — trato só se você pedir.

---

## Ordem de execução dependente de você

```text
[VOCÊ] Comprar domínio
      ↓
[VOCÊ] Adicionar registros A/TXT (site) e NS (e-mails) no registrador
      ↓
[EU]   Fases 2 → 6 automáticas (posso rodar todas em sequência)
```

Assim que o domínio estiver comprado, é só me avisar aqui com o nome dele e eu executo tudo.
