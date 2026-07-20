/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout
    siteName={siteName}
    siteUrl={siteUrl}
    preview={`Confirme a alteração do seu email no ${siteName}`}
    eyebrow="Alteração de email"
    heading="Confirmar novo email"
    intro={
      <>
        Você pediu para atualizar o email da sua conta no {siteName}
        {recipient ? <> para <strong>{recipient}</strong></> : null}. Confirme abaixo para concluir a troca.
      </>
    }
    ctaLabel="Confirmar novo email"
    ctaUrl={confirmationUrl}
    secondaryNote={
      <>
        Se você não fez esta solicitação, ignore este email — nada será alterado na sua conta.
      </>
    }
  />
)

export default EmailChangeEmail
