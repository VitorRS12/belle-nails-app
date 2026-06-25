# Teste de e-mail Resend

Como o Resend já está conectado e a função `send-notification-email` está implantada, não há código novo a escrever. O plano é apenas executar um teste real.

## O que será feito

1. Chamar a edge function `send-notification-email` com o template `booking_confirmation_customer` (mesmo template enviado ao cliente quando um agendamento público é criado).
2. Destinatário: `vitoredelson345@gmail.com`.
3. Remetente: `Bellenails <onboarding@resend.dev>` (sandbox do Resend — domínio próprio fica para depois, conforme combinado).
4. Dados fictícios coerentes (cliente "Vitor", serviço "Manicure", profissional "Evelyn", data/hora de amanhã).
5. Conferir resposta da função e verificar o registro em `notification_log` para confirmar `status = sent` e o `provider_id` retornado pelo Resend.

## Pontos técnicos

- A função exige autenticação (JWT do usuário logado ou `SUPABASE_SERVICE_ROLE_KEY`). O teste vai usar a sessão do preview (Authorization injetado automaticamente).
- Em caso de falha, vou inspecionar logs da função e o erro do gateway Resend (ex.: 403 se o destinatário não for o e-mail dono da conta sandbox — nesse caso explicarei a restrição do modo sandbox do Resend).
- Sem alterações de arquivos. Sem migrations. Sem deploy.

## Resultado esperado

- E-mail "Recebemos seu agendamento — Belle Nails" chega na caixa de entrada de `vitoredelson345@gmail.com`.
- Linha nova em `notification_log` com `template = booking_confirmation_customer` e `status = sent`.
