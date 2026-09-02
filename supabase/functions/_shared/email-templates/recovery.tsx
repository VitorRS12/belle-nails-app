/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout
    siteName={siteName}
    preview={`Redefinir sua senha no ${siteName}`}
    eyebrow="Recuperação de acesso"
    heading="Vamos criar uma nova senha"
    intro={
      <>
        Recebemos um pedido para redefinir sua senha no {siteName}. Clique no botão abaixo para escolher uma nova. O link é válido por tempo limitado.
      </>
    }
    ctaLabel="Redefinir minha senha"
    ctaUrl={confirmationUrl}
    secondaryNote={
      <>
        Se você não pediu para trocar sua senha, ignore este email — sua conta continua segura.
      </>
    }
  />
)

export default RecoveryEmail
